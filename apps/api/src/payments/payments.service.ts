import { createHash } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { OrdersService } from '../orders/orders.service.js';
import {
  LoyaltyType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '../generated/prisma/enums.js';
import type { CreatePaymentDto } from './dto.js';

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  );
}

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersService,
  ) {}

  /**
   * Thanh toán mô phỏng (Ví/Thẻ), idempotent theo (userId, Idempotency-Key):
   * gửi lại cùng khóa + cùng nội dung trả lại kết quả cũ, không thanh toán lần hai.
   */
  async pay(userId: number, dto: CreatePaymentDto, idempotencyKey?: string) {
    if (
      dto.method !== PaymentMethod.WALLET &&
      dto.method !== PaymentMethod.CARD
    ) {
      throw new BadRequestException(
        `Phương thức ${dto.method} thanh toán bằng mã QR: dùng POST /payments/intents`,
      );
    }
    const result = await this.payCore(userId, dto, idempotencyKey);
    return { ...result, ...(await this.pointsInfo(result.order.id, userId)) };
  }

  /** Điểm được cộng cho đơn này (0 nếu chưa thanh toán thành công) và số dư điểm hiện tại. */
  private async pointsInfo(orderId: number, userId: number) {
    const [earn, user] = await Promise.all([
      this.prisma.loyaltyTransaction.findUnique({
        where: { orderId_type: { orderId, type: LoyaltyType.EARN } },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { points: true },
      }),
    ]);
    return {
      pointsEarned: earn?.points ?? 0,
      pointsBalance: user?.points ?? 0,
    };
  }

  private async payCore(
    userId: number,
    dto: CreatePaymentDto,
    idempotencyKey?: string,
  ) {
    const key = idempotencyKey?.trim();
    if (!key) {
      throw new BadRequestException('Idempotency-Key header is required');
    }

    const requestHash = createHash('sha256')
      .update(
        JSON.stringify({
          orderId: dto.orderId,
          method: dto.method,
          simulate: dto.simulate ?? 'SUCCESS',
        }),
      )
      .digest('hex');

    const replay = async () => {
      const existing = await this.prisma.payment.findUnique({
        where: { userId_idempotencyKey: { userId, idempotencyKey: key } },
        include: { order: true },
      });
      if (!existing) return null;
      if (existing.requestHash !== requestHash) {
        throw new ConflictException(
          'Idempotency-Key was already used with a different request',
        );
      }
      return { payment: existing, order: existing.order, replayed: true };
    };

    const previous = await replay();
    if (previous) return previous;

    try {
      return await this.prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({ where: { id: dto.orderId } });
        // Không phải đơn của mình thì coi như không tồn tại.
        if (!order || order.userId !== userId) {
          throw new NotFoundException(`Order ${dto.orderId} not found`);
        }
        if (
          order.status !== OrderStatus.PENDING &&
          order.status !== OrderStatus.PAYMENT_FAILED
        ) {
          throw new BadRequestException(
            `Đơn đang ở trạng thái ${order.status}, không thể thanh toán`,
          );
        }

        // Thử lại sau khi thất bại: PAYMENT_FAILED → PENDING trước.
        if (order.status === OrderStatus.PAYMENT_FAILED) {
          await this.orders.changeStatus(tx, order.id, OrderStatus.PENDING);
        }

        const success = (dto.simulate ?? 'SUCCESS') === 'SUCCESS';
        const payment = await tx.payment.create({
          data: {
            orderId: order.id,
            userId,
            method: dto.method,
            status: success ? PaymentStatus.SUCCESS : PaymentStatus.FAILED,
            amount: order.total,
            idempotencyKey: key,
            requestHash,
          },
        });

        const updatedOrder = await this.orders.changeStatus(
          tx,
          order.id,
          success ? OrderStatus.PAID : OrderStatus.PAYMENT_FAILED,
        );
        return { payment, order: updatedOrder, replayed: false };
      });
    } catch (error: unknown) {
      if (!isUniqueConstraintError(error)) throw error;
      // Hai yêu cầu cùng khóa chạy song song: bên thua đọc lại kết quả của bên thắng.
      const again = await replay();
      if (again) return again;
      throw error;
    }
  }
}
