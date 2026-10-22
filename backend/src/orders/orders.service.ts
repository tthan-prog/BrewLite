import { createHash } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';

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
        !item.size.trim()
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
          toppings: {
            toppingId: number;
            quantity: number;
            price: number;
          }[];
        }[] = [];

        for (const item of dto.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!product) {
            throw new NotFoundException(`Product ${item.productId} not found`);
          }
          const stockUpdate = await tx.product.updateMany({
  where: {
    id: item.productId,
    stock: {
      gte: item.quantity,
    },
  },
  data: {
    stock: {
      decrement: item.quantity,
    },
  },
});

if (stockUpdate.count !== 1) {
  throw new BadRequestException(
    `Insufficient stock for product ${item.productId}`,
  );
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

          subtotal += (product.price + toppingUnitTotal) * item.quantity;

          orderItems.push({
            productId: product.id,
            quantity: item.quantity,
            unitPrice: product.price,
            size: item.size.trim(),
            toppings,
          });
        }

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
                toppings: {
                  create: item.toppings,
                },
              })),
            },
          },
          include: orderInclude,
        });

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
}
