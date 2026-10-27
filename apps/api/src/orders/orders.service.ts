import { createHash } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import type { Prisma } from '../generated/prisma/client.js';
import { LoyaltyType, OrderStatus } from '../generated/prisma/enums.js';
import { assertTransition, pointsForTotal } from './order-state.js';

const STAFF_TARGETS: readonly OrderStatus[] = [
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.COMPLETED,
  OrderStatus.CANCELLED,
];

// Phụ thuộc size (đồng): S +0, M +5.000, L +10.000.
export const SIZE_SURCHARGE: Record<string, number> = {
  S: 0,
  M: 5000,
  L: 10000,
};

const orderInclude = {
  items: {
    include: {
      toppings: true,
    },
  },
} as const;

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  );
}

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.order.findMany({
      include: orderInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async create(dto: CreateOrderDto, idempotencyKey?: string) {
    const key = idempotencyKey?.trim();

    if (!key) {
      throw new BadRequestException('Idempotency-Key header is required');
    }

    if (
      !Number.isInteger(dto.userId) ||
      dto.userId <= 0 ||
      !Array.isArray(dto.items) ||
      dto.items.length === 0
    ) {
      throw new BadRequestException(
        'userId and at least one item are required',
      );
    }

    for (const item of dto.items) {
      if (
        !Number.isInteger(item.productId) ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0 ||
        typeof item.size !== 'string' ||
        !(item.size.trim() in SIZE_SURCHARGE)
      ) {
        throw new BadRequestException('Invalid order item');
      }

      if (item.toppings !== undefined && !Array.isArray(item.toppings)) {
        throw new BadRequestException('Invalid topping');
      }

      for (const topping of item.toppings ?? []) {
        if (
          !Number.isInteger(topping.toppingId) ||
          !Number.isInteger(topping.quantity) ||
          topping.quantity <= 0
        ) {
          throw new BadRequestException('Invalid topping');
        }
      }
    }

    // Chuẩn hóa payload để tính hash ổn định.
    const normalizedPayload = {
      userId: dto.userId,
      items: dto.items
        .map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          size: item.size.trim(),
          toppings: (item.toppings ?? [])
            .map((topping) => ({
              toppingId: topping.toppingId,
              quantity: topping.quantity,
            }))
            .sort(
              (a, b) => a.toppingId - b.toppingId || a.quantity - b.quantity,
            ),
        }))
        .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
      promoCode: dto.promoCode?.trim().toUpperCase() ?? null,
    };

    const requestHash = createHash('sha256')
      .update(JSON.stringify(normalizedPayload))
      .digest('hex');

    try {
      return await this.prisma.$transaction(async (tx) => {
        const existing = await tx.idempotencyRecord.findUnique({
          where: {
            userId_key: {
              userId: dto.userId,
              key,
            },
          },
          include: {
            order: {
              include: orderInclude,
            },
          },
        });

        if (existing) {
          if (existing.requestHash !== requestHash) {
            throw new ConflictException(
              'Idempotency-Key was already used with a different request',
            );
          }

          return existing.order;
        }

        const user = await tx.user.findUnique({
          where: { id: dto.userId },
          select: { id: true },
        });

        if (!user) {
          throw new NotFoundException('User not found');
        }

        let subtotal = 0;

        const orderItems: {
          productId: number;
          quantity: number;
          unitPrice: number;
          size: string;
          usesRecipe: boolean;
          toppings: {
            toppingId: number;
            quantity: number;
            price: number;
          }[];
        }[] = [];

        const ingredientNeed = new Map<number, number>();

        for (const item of dto.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            include: { recipe: true },
          });

          if (!product) {
            throw new NotFoundException(`Product ${item.productId} not found`);
          }

          const usesRecipe = product.recipe.length > 0;
          if (usesRecipe) {
            // Có công thức: cộng dồn nhu cầu nguyên liệu, trừ kho ở bước sau.
            for (const r of product.recipe) {
              ingredientNeed.set(
                r.ingredientId,
                (ingredientNeed.get(r.ingredientId) ?? 0) +
                  r.quantity * item.quantity,
              );
            }
          } else {
            // Sản phẩm chưa có công thức: dùng tồn kho theo sản phẩm (cách cũ).
            const stockUpdate = await tx.product.updateMany({
              where: { id: item.productId, stock: { gte: item.quantity } },
              data: { stock: { decrement: item.quantity } },
            });
            if (stockUpdate.count !== 1) {
              throw new BadRequestException(
                `Insufficient stock for product ${item.productId}`,
              );
            }
          }

          let toppingUnitTotal = 0;

          const toppings: {
            toppingId: number;
            quantity: number;
            price: number;
          }[] = [];

          for (const toppingInput of item.toppings ?? []) {
            const topping = await tx.topping.findUnique({
              where: { id: toppingInput.toppingId },
            });

            if (!topping) {
              throw new NotFoundException(
                `Topping ${toppingInput.toppingId} not found`,
              );
            }

            toppingUnitTotal += topping.price * toppingInput.quantity;

            toppings.push({
              toppingId: topping.id,
              quantity: toppingInput.quantity,
              price: topping.price,
            });
          }

          const sizeSurcharge = SIZE_SURCHARGE[item.size.trim()] ?? 0;
          const unitPrice = product.price + sizeSurcharge;
          subtotal += (unitPrice + toppingUnitTotal) * item.quantity;

          orderItems.push({
            productId: product.id,
            quantity: item.quantity,
            unitPrice,
            size: item.size.trim(),
            usesRecipe,
            toppings,
          });
        }

        await this.consumeIngredients(tx, ingredientNeed);

        let discount = 0;
        let promoCode: string | null = null;

        if (dto.promoCode?.trim()) {
          const code = dto.promoCode.trim().toUpperCase();

          const promotion = await tx.promotion.findUnique({
            where: { code },
          });

          if (!promotion) {
            throw new BadRequestException('Promotion code is invalid');
          }

          if (
            promotion.expiresAt &&
            promotion.expiresAt.getTime() < Date.now()
          ) {
            throw new BadRequestException('Promotion has expired');
          }

          if (subtotal < promotion.minOrder) {
            throw new BadRequestException(
              'Order does not meet promotion minimum',
            );
          }

          discount =
            promotion.type === 'PERCENT'
              ? Math.floor((subtotal * promotion.value) / 100)
              : promotion.value;

          discount = Math.min(subtotal, Math.max(0, discount));
          promoCode = promotion.code;

          await tx.promotion.update({
            where: { id: promotion.id },
            data: { usageCount: { increment: 1 } },
          });
        }

        const total = subtotal - discount;

        const order = await tx.order.create({
          data: {
            userId: user.id,
            subtotal,
            discount,
            total,
            promoCode,
            items: {
              create: orderItems.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                size: item.size,
                usesRecipe: item.usesRecipe,
                toppings: {
                  create: item.toppings,
                },
              })),
            },
          },
          include: orderInclude,
        });

        if (ingredientNeed.size > 0) {
          await tx.orderIngredientUse.createMany({
            data: [...ingredientNeed].map(([ingredientId, quantity]) => ({
              orderId: order.id,
              ingredientId,
              quantity,
            })),
          });
        }

        // Record và order cùng transaction: nếu key bị trùng,
        // transaction tạo order thua cuộc sẽ bị rollback.
        await tx.idempotencyRecord.create({
          data: {
            userId: user.id,
            key,
            requestHash,
            orderId: order.id,
          },
        });

        return order;
      });
    } catch (error: unknown) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }

      // Đọc record sau khi transaction cạnh tranh đã kết thúc.
      const existing = await this.prisma.idempotencyRecord.findUnique({
        where: {
          userId_key: {
            userId: dto.userId,
            key,
          },
        },
        include: {
          order: {
            include: orderInclude,
          },
        },
      });

      // Nếu lỗi unique không liên quan đến key này, giữ nguyên lỗi.
      if (!existing) {
        throw error;
      }

      if (existing.requestHash !== requestHash) {
        throw new ConflictException(
          'Idempotency-Key was already used with a different request',
        );
      }

      return existing.order;
    }
  }

  /**
   * Trừ nguyên liệu bằng UPDATE có điều kiện (stock >= cần) theo thứ tự id cố định,
   * nên hai đơn đồng thời không thể làm kho âm và không bị deadlock.
   */
  private async consumeIngredients(
    tx: Prisma.TransactionClient,
    need: Map<number, number>,
  ) {
    for (const [ingredientId, quantity] of [...need].sort(
      (a, b) => a[0] - b[0],
    )) {
      const res = await tx.ingredient.updateMany({
        where: { id: ingredientId, stock: { gte: quantity } },
        data: { stock: { decrement: quantity } },
      });
      if (res.count !== 1) {
        const ing = await tx.ingredient.findUnique({
          where: { id: ingredientId },
        });
        const unit = ing?.unit ?? '';
        throw new BadRequestException(
          `Không đủ nguyên liệu "${ing?.name ?? ingredientId}": cần ${quantity} ${unit}, còn ${ing?.stock ?? 0} ${unit}`,
        );
      }
    }
  }

  /** Đơn của người dùng hiện tại (Task 9). */
  findByUser(userId: number) {
    return this.prisma.order.findMany({
      where: { userId },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Chủ đơn hoặc STAFF mới xem được; người khác nhận 404 để không lộ sự tồn tại. */
  async findOneFor(id: number, user: { id: number; role: string }) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });
    if (!order || (user.role !== 'STAFF' && order.userId !== user.id)) {
      throw new NotFoundException(`Order ${id} not found`);
    }
    return order;
  }

  /** STAFF cập nhật trạng thái theo máy trạng thái (Task 10a). */
  updateStatus(id: number, to: OrderStatus) {
    // PAID / PAYMENT_FAILED / PENDING chỉ do luồng thanh toán đặt, không cho STAFF đặt tay.
    if (!STAFF_TARGETS.includes(to)) {
      throw new BadRequestException(
        `STAFF không được chuyển đơn sang ${to}; dùng POST /payments`,
      );
    }
    return this.prisma.$transaction((tx) => this.changeStatus(tx, id, to));
  }

  /**
   * Chuyển trạng thái trong một transaction đã mở.
   * - Chặn chuyển sai bằng assertTransition.
   * - Cập nhật có điều kiện theo trạng thái cũ để hai yêu cầu đồng thời không cùng thắng.
   * - PAID: cộng điểm thưởng; CANCELLED: hoàn kho (và trừ điểm nếu đã PAID).
   */
  async changeStatus(
    tx: Prisma.TransactionClient,
    id: number,
    to: OrderStatus,
  ) {
    const order = await tx.order.findUnique({
      where: { id },
      include: orderInclude,
    });
    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    assertTransition(order.status, to);

    const updated = await tx.order.updateMany({
      where: { id, status: order.status },
      data: { status: to },
    });
    if (updated.count !== 1) {
      throw new ConflictException('Order status was changed concurrently');
    }

    if (to === OrderStatus.PAID) {
      const points = pointsForTotal(order.total);
      if (points > 0) {
        await tx.user.update({
          where: { id: order.userId },
          data: { points: { increment: points } },
        });
        await tx.loyaltyTransaction.create({
          data: {
            userId: order.userId,
            orderId: order.id,
            type: LoyaltyType.EARN,
            points,
          },
        });
      }
    }

    if (to === OrderStatus.CANCELLED) {
      for (const item of order.items) {
        // Món dùng công thức được hoàn bằng nguyên liệu (bên dưới), không hoàn Product.stock.
        if (item.usesRecipe) continue;
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
      const uses = await tx.orderIngredientUse.findMany({
        where: { orderId: order.id },
        orderBy: { ingredientId: 'asc' },
      });
      for (const use of uses) {
        await tx.ingredient.update({
          where: { id: use.ingredientId },
          data: { stock: { increment: use.quantity } },
        });
      }
      if (order.status === OrderStatus.PAID) {
        const points = pointsForTotal(order.total);
        if (points > 0) {
          await tx.user.update({
            where: { id: order.userId },
            data: { points: { decrement: points } },
          });
          await tx.loyaltyTransaction.create({
            data: {
              userId: order.userId,
              orderId: order.id,
              type: LoyaltyType.REVERSAL,
              points: -points,
            },
          });
        }
      }
    }

    return tx.order.findUniqueOrThrow({
      where: { id },
      include: orderInclude,
    });
  }
}
