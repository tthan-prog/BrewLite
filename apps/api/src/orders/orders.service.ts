import { createHash } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import type { Prisma } from '../generated/prisma/client.js';
import {
  IntentStatus,
  LoyaltyType,
  OrderStatus,
} from '../generated/prisma/enums.js';
import { assertTransition, pointsForTotal } from './order-state.js';
import { addScaled, perCupNeed, toRecipeLines } from './ingredient-need.js';
import { evaluatePromotion } from './pricing.js';

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

/** Đơn chưa thanh toán quá thời hạn này (phút) sẽ tự hủy để nhả nguyên liệu. */
function unpaidTtlMinutes(): number {
  const n = Number(process.env.UNPAID_ORDER_TTL_MINUTES);
  return Number.isFinite(n) && n > 0 ? n : 15;
}

/** Hết nguyên liệu tại thời điểm chốt thanh toán (khác với kiểm tra lúc tạo đơn). */
export class OutOfIngredientsException extends BadRequestException {}

@Injectable()
export class OrdersService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrdersService.name);
  private sweeper?: NodeJS.Timeout;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    // Không chạy nền khi test (test gọi cancelStaleUnpaid trực tiếp).
    if (process.env.NODE_ENV === 'test') return;
    this.sweeper = setInterval(() => {
      this.cancelStaleUnpaid().catch((e: unknown) =>
        this.logger.warn(`Dọn đơn chưa thanh toán lỗi: ${String(e)}`),
      );
    }, 60_000);
    this.sweeper.unref();
  }

  onModuleDestroy() {
    if (this.sweeper) clearInterval(this.sweeper);
  }

  /**
   * Hủy các đơn PENDING / PAYMENT_FAILED quá hạn mà không còn mã QR nào đang chờ, để dọn đơn
   * bỏ dở và trả lượt dùng mã khuyến mãi (nguyên liệu không bị giữ khi chưa thanh toán). Trả về số đơn đã hủy.
   */
  async cancelStaleUnpaid(ttlMinutes: number = unpaidTtlMinutes()) {
    const now = new Date();
    const stale = await this.prisma.order.findMany({
      where: {
        status: { in: [OrderStatus.PENDING, OrderStatus.PAYMENT_FAILED] },
        createdAt: { lt: new Date(now.getTime() - ttlMinutes * 60_000) },
        NOT: {
          paymentIntents: {
            some: { status: IntentStatus.PENDING, expiresAt: { gt: now } },
          },
        },
      },
      select: { id: true },
    });
    let cancelled = 0;
    for (const { id } of stale) {
      try {
        await this.prisma.$transaction(async (tx) => {
          await tx.paymentIntent.updateMany({
            where: { orderId: id, status: IntentStatus.PENDING },
            data: { status: IntentStatus.EXPIRED },
          });
          await this.changeStatus(tx, id, OrderStatus.CANCELLED);
        });
        cancelled += 1;
      } catch {
        // Đơn vừa được thanh toán/đổi trạng thái ở yêu cầu khác: bỏ qua.
      }
    }
    return cancelled;
  }

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
          sugar: number | null;
          ice: number | null;
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
            include: { recipe: { include: { ingredient: true } } },
          });

          if (!product) {
            throw new NotFoundException(`Product ${item.productId} not found`);
          }

          // Món có công thức: nguyên liệu được cộng dồn và trừ ở bước sau (theo size + topping).
          const usesRecipe = product.recipe.length > 0;
          if (!usesRecipe) {
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
          const toppingRecipes: {
            quantity: number;
            recipe: { ingredientId: number; quantity: number }[];
          }[] = [];

          const toppings: {
            toppingId: number;
            quantity: number;
            price: number;
          }[] = [];

          for (const toppingInput of item.toppings ?? []) {
            const topping = await tx.topping.findUnique({
              where: { id: toppingInput.toppingId },
              include: { recipe: { include: { ingredient: true } } },
            });

            if (!topping) {
              throw new NotFoundException(
                `Topping ${toppingInput.toppingId} not found`,
              );
            }

            toppingUnitTotal += topping.price * toppingInput.quantity;
            toppingRecipes.push({
              quantity: toppingInput.quantity,
              recipe: toRecipeLines(topping.recipe),
            });

            toppings.push({
              toppingId: topping.id,
              quantity: toppingInput.quantity,
              price: topping.price,
            });
          }

          // Nguyên liệu cho cả dòng: (công thức món theo size + topping) × số ly.
          addScaled(
            ingredientNeed,
            perCupNeed(
              toRecipeLines(product.recipe),
              item.size.trim(),
              toppingRecipes,
              item.sugar,
              item.ice,
            ),
            item.quantity,
          );

          const sizeSurcharge = SIZE_SURCHARGE[item.size.trim()] ?? 0;
          const unitPrice = product.price + sizeSurcharge;
          subtotal += (unitPrice + toppingUnitTotal) * item.quantity;

          orderItems.push({
            productId: product.id,
            quantity: item.quantity,
            unitPrice,
            size: item.size.trim(),
            usesRecipe,
            sugar: item.sugar ?? null,
            ice: item.ice ?? null,
            toppings,
          });
        }

        // Chỉ KIỂM TRA đủ nguyên liệu; việc trừ kho xảy ra khi thanh toán thành công (changeStatus → PAID).
        await this.assertIngredientsAvailable(tx, ingredientNeed);

        let discount = 0;
        let promoCode: string | null = null;

        if (dto.promoCode?.trim()) {
          const code = dto.promoCode.trim().toUpperCase();

          const promotion = await tx.promotion.findUnique({
            where: { code },
          });

          const result = evaluatePromotion(promotion, subtotal);
          if (!result.ok) {
            throw new BadRequestException(
              result.reason === 'INVALID'
                ? 'Promotion code is invalid'
                : result.reason === 'EXPIRED'
                  ? 'Promotion has expired'
                  : 'Order does not meet promotion minimum',
            );
          }

          discount = result.discount;
          promoCode = code;

          await tx.promotion.update({
            where: { id: promotion!.id },
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
                sugar: item.sugar,
                ice: item.ice,
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

  /** Chỉ đọc: kho hiện tại có đủ cho đơn này không (không giữ chỗ, không trừ). */
  private async assertIngredientsAvailable(
    tx: Prisma.TransactionClient,
    need: Map<number, number>,
  ) {
    if (need.size === 0) return;
    const rows = await tx.ingredient.findMany({
      where: { id: { in: [...need.keys()] } },
    });
    for (const ing of rows) {
      const q = need.get(ing.id) ?? 0;
      if (ing.stock < q) {
        throw new BadRequestException(
          `Không đủ nguyên liệu "${ing.name}": cần ${q} ${ing.unit}, còn ${ing.stock} ${ing.unit}`,
        );
      }
    }
  }

  /**
   * Trừ nguyên liệu khi đơn được thanh toán thành công, bằng UPDATE có điều kiện (stock >= cần)
   * theo thứ tự id cố định: hai đơn thanh toán đồng thời không làm kho âm và không deadlock.
   * Hết nguyên liệu → OutOfIngredientsException (transaction của người gọi bị hủy, không trừ tiền).
   */
  private async consumeOrderIngredients(
    tx: Prisma.TransactionClient,
    orderId: number,
  ) {
    const uses = await tx.orderIngredientUse.findMany({
      where: { orderId, consumed: false },
      orderBy: { ingredientId: 'asc' },
    });
    for (const use of uses) {
      const res = await tx.ingredient.updateMany({
        where: { id: use.ingredientId, stock: { gte: use.quantity } },
        data: { stock: { decrement: use.quantity } },
      });
      if (res.count !== 1) {
        const ing = await tx.ingredient.findUnique({
          where: { id: use.ingredientId },
        });
        const unit = ing?.unit ?? '';
        throw new OutOfIngredientsException(
          `Không đủ nguyên liệu "${ing?.name ?? use.ingredientId}": cần ${use.quantity} ${unit}, còn ${ing?.stock ?? 0} ${unit}`,
        );
      }
      await tx.orderIngredientUse.update({
        where: {
          orderId_ingredientId: { orderId, ingredientId: use.ingredientId },
        },
        data: { consumed: true },
      });
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
   * - PAID: trừ nguyên liệu (nếu hết → OutOfIngredientsException) và cộng điểm thưởng; CANCELLED: hoàn kho đã trừ (và trừ điểm nếu đã PAID).
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
      await this.consumeOrderIngredients(tx, id);
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
      // Chỉ hoàn nguyên liệu đã thật sự bị trừ (đơn từng thanh toán thành công).
      const uses = await tx.orderIngredientUse.findMany({
        where: { orderId: order.id, consumed: true },
        orderBy: { ingredientId: 'asc' },
      });
      for (const use of uses) {
        await tx.ingredient.update({
          where: { id: use.ingredientId },
          data: { stock: { increment: use.quantity } },
        });
        await tx.orderIngredientUse.update({
          where: {
            orderId_ingredientId: {
              orderId: order.id,
              ingredientId: use.ingredientId,
            },
          },
          data: { consumed: false },
        });
      }
      // Đơn hủy thì lượt dùng mã khuyến mãi không còn được tính.
      if (order.promoCode) {
        await tx.promotion.updateMany({
          where: { code: order.promoCode, usageCount: { gt: 0 } },
          data: { usageCount: { decrement: 1 } },
        });
      }
      if (order.status === OrderStatus.PAID) {
        // Hoàn tiền về tài khoản test đã dùng để trả (thanh toán QR mô phỏng).
        const paid = await tx.paymentIntent.findFirst({
          where: { orderId: order.id, status: IntentStatus.PAID },
        });
        if (paid?.accountId) {
          await tx.paymentAccount.update({
            where: { id: paid.accountId },
            data: { balance: { increment: paid.amount } },
          });
        }
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
