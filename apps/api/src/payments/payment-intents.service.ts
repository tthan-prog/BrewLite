import { createHash, randomBytes } from 'node:crypto';
import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  OrdersService,
  OutOfIngredientsException,
} from '../orders/orders.service.js';
import type { Prisma } from '../generated/prisma/client.js';
import {
  IntentStatus,
  LoyaltyType,
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
} from '../generated/prisma/enums.js';
import {
  momoConfigured,
  paymentConfig,
  vnpayConfigured,
} from './gateways/config.js';
import { buildVnpayUrl, verifyVnpay } from './gateways/vnpay.js';
import { momoCreateBody, verifyMomoIpn } from './gateways/momo.js';
import type { MomoIpn } from './gateways/momo.js';

export type IntentMode = 'SIMULATED' | 'SANDBOX';

@Injectable()
export class PaymentIntentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersService,
  ) {}

  /** Tài khoản TEST hiển thị để người dùng biết dùng gì khi quét QR (không có PIN). */
  listTestAccounts() {
    return this.prisma.paymentAccount.findMany({
      orderBy: [{ provider: 'asc' }, { id: 'asc' }],
      select: {
        provider: true,
        identifier: true,
        holderName: true,
        balance: true,
      },
    });
  }

  private modeFor(provider: PaymentProvider): IntentMode {
    const c = paymentConfig();
    if (provider === PaymentProvider.VNPAY && vnpayConfigured(c))
      return 'SANDBOX';
    if (provider === PaymentProvider.MOMO && momoConfigured(c))
      return 'SANDBOX';
    return 'SIMULATED';
  }

  /** Tạo phiên thanh toán QR cho đơn của chính người dùng. */
  async create(
    userId: number,
    orderId: number,
    provider: PaymentProvider,
    ip: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order || order.userId !== userId) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }
    if (
      order.status !== OrderStatus.PENDING &&
      order.status !== OrderStatus.PAYMENT_FAILED
    ) {
      throw new BadRequestException(
        `Đơn đang ở trạng thái ${order.status}, không thể thanh toán`,
      );
    }

    const cfg = paymentConfig();
    const mode = this.modeFor(provider);
    const token = randomBytes(16).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + cfg.ttlMinutes * 60_000);

    // Phiên cũ còn mở của cùng đơn không còn hiệu lực: chỉ một mã QR đang sống.
    await this.prisma.paymentIntent.updateMany({
      where: { orderId, status: IntentStatus.PENDING },
      data: { status: IntentStatus.EXPIRED },
    });

    let qrContent = `${cfg.webUrl}/pay/${token}`;
    let payUrl: string | null = null;

    if (mode === 'SANDBOX' && provider === PaymentProvider.VNPAY) {
      payUrl = buildVnpayUrl({
        baseUrl: cfg.vnpay.url,
        tmnCode: cfg.vnpay.tmnCode,
        secret: cfg.vnpay.secret,
        txnRef: token,
        amountVnd: order.total,
        returnUrl: `${cfg.apiUrl}/payments/vnpay/return`,
        ip,
        now,
        expiresAt,
      });
      qrContent = payUrl;
    } else if (mode === 'SANDBOX' && provider === PaymentProvider.MOMO) {
      const body = momoCreateBody({
        partnerCode: cfg.momo.partnerCode,
        accessKey: cfg.momo.accessKey,
        secretKey: cfg.momo.secretKey,
        requestId: token,
        orderId: token,
        amount: order.total,
        orderInfo: `Thanh toan don hang BrewLite #${order.id}`,
        redirectUrl: `${cfg.webUrl}/pay/${token}`,
        ipnUrl: `${cfg.apiUrl}/payments/momo/ipn`,
      });
      let json: { resultCode?: number; payUrl?: string; qrCodeUrl?: string };
      try {
        const res = await fetch(cfg.momo.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        json = (await res.json()) as typeof json;
      } catch {
        throw new BadGatewayException('Không kết nối được MoMo sandbox');
      }
      if (json.resultCode !== 0 || !(json.qrCodeUrl || json.payUrl)) {
        throw new BadGatewayException(
          `MoMo sandbox từ chối tạo giao dịch (resultCode=${json.resultCode})`,
        );
      }
      payUrl = json.payUrl ?? null;
      qrContent = json.qrCodeUrl || json.payUrl || qrContent;
    }

    await this.prisma.paymentIntent.create({
      data: {
        token,
        orderId,
        userId,
        provider,
        amount: order.total,
        mode,
        expiresAt,
      },
    });

    return {
      token,
      provider,
      mode,
      amount: order.total,
      expiresAt,
      qrContent,
      payUrl,
      statusUrl: `${cfg.webUrl}/pay/${token}`,
    };
  }

  /** Trạng thái phiên (công khai theo token ngẫu nhiên 128-bit): trang di động và máy tính cùng dùng. */
  async view(token: string) {
    let intent = await this.prisma.paymentIntent.findUnique({
      where: { token },
      include: {
        order: {
          include: { items: { include: { product: true } } },
        },
      },
    });
    if (!intent) throw new NotFoundException('Phiên thanh toán không tồn tại');

    if (
      intent.status === IntentStatus.PENDING &&
      intent.expiresAt.getTime() < Date.now()
    ) {
      await this.prisma.paymentIntent.updateMany({
        where: { id: intent.id, status: IntentStatus.PENDING },
        data: { status: IntentStatus.EXPIRED },
      });
      intent = { ...intent, status: IntentStatus.EXPIRED };
    }

    const loyalty =
      intent.status === IntentStatus.PAID
        ? await this.prisma.loyaltyTransaction.findUnique({
            where: {
              orderId_type: { orderId: intent.orderId, type: LoyaltyType.EARN },
            },
          })
        : null;
    const user =
      intent.status === IntentStatus.PAID
        ? await this.prisma.user.findUnique({
            where: { id: intent.userId },
            select: { points: true },
          })
        : null;

    return {
      token: intent.token,
      status: intent.status,
      provider: intent.provider,
      mode: intent.mode,
      amount: intent.amount,
      orderId: intent.orderId,
      expiresAt: intent.expiresAt,
      items: intent.order.items.map((i) => ({
        name: i.product.name,
        quantity: i.quantity,
        size: i.size,
      })),
      pointsEarned: loyalty?.points ?? 0,
      pointsBalance: user?.points ?? null,
    };
  }

  /**
   * Chốt thanh toán thành công trong một transaction đã mở: chiếm phiên PENDING → PAID bằng
   * UPDATE có điều kiện (gọi lặp/IPN lặp chỉ thắng một lần), ghi Payment, đơn → PAID (cộng điểm).
   * Trả về false nếu phiên đã được xử lý.
   */
  private async settle(
    tx: Prisma.TransactionClient,
    token: string,
    opts: { providerRef: string; accountId?: number; ignoreExpiry?: boolean },
  ): Promise<boolean> {
    const claimed = await tx.paymentIntent.updateMany({
      where: {
        token,
        status: IntentStatus.PENDING,
        ...(opts.ignoreExpiry ? {} : { expiresAt: { gt: new Date() } }),
      },
      data: {
        status: IntentStatus.PAID,
        paidAt: new Date(),
        providerRef: opts.providerRef || null,
        accountId: opts.accountId ?? null,
      },
    });
    if (claimed.count !== 1) return false;

    const intent = await tx.paymentIntent.findUniqueOrThrow({
      where: { token },
    });
    const order = await tx.order.findUniqueOrThrow({
      where: { id: intent.orderId },
    });
    if (order.status === OrderStatus.PAYMENT_FAILED) {
      await this.orders.changeStatus(tx, order.id, OrderStatus.PENDING);
    } else if (order.status !== OrderStatus.PENDING) {
      throw new ConflictException(
        `Đơn đang ở trạng thái ${order.status}, không thể thanh toán`,
      );
    }
    await tx.payment.create({
      data: {
        orderId: order.id,
        userId: intent.userId,
        method: intent.provider,
        status: PaymentStatus.SUCCESS,
        amount: intent.amount,
        idempotencyKey: `intent:${token}`,
        requestHash: createHash('sha256').update(token).digest('hex'),
        providerRef: opts.providerRef || null,
      },
    });
    await this.orders.changeStatus(tx, order.id, OrderStatus.PAID);
    return true;
  }

  /** Phiên thất bại vì hết nguyên liệu lúc chốt: phiên → FAILED, đơn PENDING → PAYMENT_FAILED. */
  private async failForStock(token: string) {
    await this.prisma.$transaction(async (tx) => {
      const intent = await tx.paymentIntent.findUnique({ where: { token } });
      if (!intent) return;
      await tx.paymentIntent.updateMany({
        where: { token, status: IntentStatus.PENDING },
        data: { status: IntentStatus.FAILED },
      });
      const order = await tx.order.findUnique({
        where: { id: intent.orderId },
      });
      if (order?.status === OrderStatus.PENDING) {
        await this.orders.changeStatus(
          tx,
          order.id,
          OrderStatus.PAYMENT_FAILED,
        );
      }
    });
  }

  /**
   * Callback từ cổng sandbox: tiền đã bị trừ ở cổng nên không thể "từ chối" như mô phỏng. Hết nguyên
   * liệu thì đơn thất bại và cần hoàn tiền thủ công qua cổng (chưa kiểm chứng với cổng thật).
   */
  private async settleOrFailForStock(
    token: string,
    opts: { providerRef: string; ignoreExpiry?: boolean },
  ) {
    try {
      await this.prisma.$transaction((tx) => this.settle(tx, token, opts));
    } catch (error) {
      if (!(error instanceof OutOfIngredientsException)) throw error;
      await this.failForStock(token);
    }
  }

  /** Mô phỏng: điện thoại quét QR, nhập tài khoản TEST + PIN rồi xác nhận. */
  async confirmSimulated(token: string, identifier: string, pin: string) {
    const intent = await this.prisma.paymentIntent.findUnique({
      where: { token },
    });
    if (!intent) throw new NotFoundException('Phiên thanh toán không tồn tại');
    if (intent.mode !== 'SIMULATED') {
      throw new BadRequestException(
        'Phiên này thanh toán qua cổng sandbox, không xác nhận thủ công',
      );
    }
    if (intent.status === IntentStatus.PAID) {
      return this.view(token); // gọi lặp: trả kết quả cũ, không trừ tiền lần hai
    }
    if (
      intent.status !== IntentStatus.PENDING ||
      intent.expiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException('Mã QR đã hết hạn hoặc không còn hiệu lực');
    }

    const account = await this.prisma.paymentAccount.findUnique({
      where: {
        provider_identifier: {
          provider: intent.provider,
          identifier: identifier.trim(),
        },
      },
    });
    // Không phân biệt "sai tài khoản" và "sai PIN" để không lộ tài khoản nào tồn tại.
    if (!account || !(await bcrypt.compare(pin, account.pinHash))) {
      throw new BadRequestException('Tài khoản hoặc mã PIN không đúng');
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        const debit = await tx.paymentAccount.updateMany({
          where: { id: account.id, balance: { gte: intent.amount } },
          data: { balance: { decrement: intent.amount } },
        });
        if (debit.count !== 1) {
          throw new BadRequestException('Số dư tài khoản test không đủ');
        }
        const ok = await this.settle(tx, token, {
          providerRef: `SIM-${account.provider}-${account.id}-${Date.now()}`,
          accountId: account.id,
        });
        if (!ok) {
          // Phiên vừa bị xử lý/hết hạn ở yêu cầu khác: hủy transaction để không trừ tiền.
          throw new ConflictException('Phiên thanh toán không còn hiệu lực');
        }
      });
    } catch (error) {
      if (error instanceof OutOfIngredientsException) {
        // Giao dịch đã hủy: chưa trừ tiền, chưa trừ kho.
        await this.failForStock(token);
        throw new BadRequestException(
          `${error.message}. Chưa trừ tiền; đơn chuyển sang thanh toán thất bại.`,
        );
      }
      throw error;
    }
    return this.view(token);
  }

  /** Callback VNPay (Return URL và IPN dùng chung). */
  async handleVnpay(query: Record<string, unknown>) {
    const cfg = paymentConfig();
    if (!vnpayConfigured(cfg))
      return { RspCode: '99', Message: 'Not configured' };
    const r = verifyVnpay(query, cfg.vnpay.secret);
    if (!r.valid)
      return { RspCode: '97', Message: 'Invalid signature', txnRef: r.txnRef };
    const intent = await this.prisma.paymentIntent.findUnique({
      where: { token: r.txnRef },
    });
    if (!intent)
      return { RspCode: '01', Message: 'Order not found', txnRef: r.txnRef };
    if (intent.amount !== r.amountVnd)
      return { RspCode: '04', Message: 'Invalid amount', txnRef: r.txnRef };
    if (intent.status !== IntentStatus.PENDING)
      return {
        RspCode: '02',
        Message: 'Order already confirmed',
        txnRef: r.txnRef,
      };

    if (r.success) {
      await this.settleOrFailForStock(r.txnRef, {
        providerRef: r.providerRef,
        ignoreExpiry: true, // tiền đã trừ ở cổng: không bỏ qua vì QR hết hạn
      });
    } else {
      await this.prisma.paymentIntent.updateMany({
        where: { token: r.txnRef, status: IntentStatus.PENDING },
        data: { status: IntentStatus.FAILED },
      });
    }
    return { RspCode: '00', Message: 'Confirm Success', txnRef: r.txnRef };
  }

  /** IPN MoMo. */
  async handleMomoIpn(body: MomoIpn) {
    const cfg = paymentConfig();
    if (!momoConfigured(cfg)) return false;
    const v = verifyMomoIpn(body, cfg.momo.accessKey, cfg.momo.secretKey);
    if (!v.valid || !body.orderId) return false;
    const intent = await this.prisma.paymentIntent.findUnique({
      where: { token: body.orderId },
    });
    if (!intent || intent.amount !== body.amount) return false;
    if (v.success) {
      await this.settleOrFailForStock(body.orderId as string, {
        providerRef: String(body.transId ?? ''),
        ignoreExpiry: true,
      });
    } else {
      await this.prisma.paymentIntent.updateMany({
        where: { token: body.orderId, status: IntentStatus.PENDING },
        data: { status: IntentStatus.FAILED },
      });
    }
    return true;
  }
}
