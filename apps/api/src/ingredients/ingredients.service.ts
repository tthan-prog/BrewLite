import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class IngredientsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Kho cho STAFF: tồn kho, các món/topping dùng nguyên liệu này (lượng cho ly size S / mỗi phần)
   * và số ly tối đa còn làm được nếu chỉ tính nguyên liệu này (cupsRemaining, null nếu chưa dùng).
   */
  async list() {
    const rows = await this.prisma.ingredient.findMany({
      orderBy: { id: 'asc' },
      include: {
        recipes: { include: { product: { select: { name: true } } } },
        toppingRecipes: { include: { topping: { select: { name: true } } } },
      },
    });
    return rows.map(({ recipes, toppingRecipes, ...i }) => {
      const maxPerCup = Math.max(0, ...recipes.map((r) => r.quantity));
      return {
        ...i,
        usedBy: [
          ...recipes.map((r) => ({
            kind: 'DRINK',
            name: r.product.name,
            perUnit: r.quantity,
          })),
          ...toppingRecipes.map((r) => ({
            kind: 'TOPPING',
            name: r.topping.name,
            perUnit: r.quantity,
          })),
        ],
        cupsRemaining: maxPerCup > 0 ? Math.floor(i.stock / maxPerCup) : null,
      };
    });
  }

  async restock(id: number, quantity: number) {
    const res = await this.prisma.ingredient.updateMany({
      where: { id },
      data: { stock: { increment: quantity } },
    });
    if (res.count !== 1)
      throw new NotFoundException(`Ingredient ${id} not found`);
    return this.prisma.ingredient.findUniqueOrThrow({ where: { id } });
  }
}
