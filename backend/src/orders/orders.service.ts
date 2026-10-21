
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.order.findMany({
      include: {
        items: {
          include: {
            toppings: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async create(dto: CreateOrderDto) {
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

    return this.prisma.$transaction(async (tx) => {
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
        if (
          !Number.isInteger(item.productId) ||
          !Number.isInteger(item.quantity) ||
          item.quantity <= 0 ||
          !item.size?.trim()
        ) {
          throw new BadRequestException('Invalid order item');
        }

        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new NotFoundException(
            `Product ${item.productId} not found`,
          );
        }

        let toppingUnitTotal = 0;
        const toppings: {
          toppingId: number;
          quantity: number;
          price: number;
        }[] = [];

        for (const toppingInput of item.toppings ?? []) {
          if (
            !Number.isInteger(toppingInput.toppingId) ||
            !Number.isInteger(toppingInput.quantity) ||
            toppingInput.quantity <= 0
          ) {
            throw new BadRequestException('Invalid topping');
          }

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

        subtotal +=
          (product.price + toppingUnitTotal) * item.quantity;

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
          throw new BadRequestException(
            'Promotion code is invalid',
          );
        }

        if (
          promotion.expiresAt &&
          promotion.expiresAt.getTime() < Date.now()
        ) {
          throw new BadRequestException(
            'Promotion has expired',
          );
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

      return tx.order.create({
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
        include: {
          items: {
            include: {
              toppings: true,
            },
          },
        },
      });
    });
  }
}
