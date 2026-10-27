import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

const withRecipe = {
  recipe: {
    include: { ingredient: true },
    orderBy: { ingredientId: 'asc' },
  },
} as const;

type ProductWithRecipe = Awaited<
  ReturnType<ProductsService['loadAll']>
>[number];

/**
 * Số ly tối đa còn làm được: nhỏ nhất của floor(tồn nguyên liệu / lượng mỗi ly).
 * Món chưa có công thức dùng Product.stock.
 */
export function maxCups(product: {
  stock: number;
  recipe: { quantity: number; ingredient: { stock: number } }[];
}): number {
  if (product.recipe.length === 0) return Math.max(0, product.stock);
  return Math.max(
    0,
    Math.min(
      ...product.recipe.map((r) =>
        Math.floor(r.ingredient.stock / Math.max(1, r.quantity)),
      ),
    ),
  );
}

function present(p: ProductWithRecipe) {
  const { recipe, ...rest } = p;
  const available = maxCups(p);
  return {
    ...rest,
    maxQuantity: available,
    available: available > 0,
    recipe: recipe.map((r) => ({
      ingredientId: r.ingredientId,
      name: r.ingredient.name,
      unit: r.ingredient.unit,
      quantity: r.quantity,
    })),
  };
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  loadAll() {
    return this.prisma.product.findMany({
      orderBy: { id: 'asc' },
      include: withRecipe,
    });
  }

  async findAll() {
    return (await this.loadAll()).map(present);
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: withRecipe,
    });
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    return present(product);
  }

  listToppings() {
    return this.prisma.topping.findMany({ orderBy: { id: 'asc' } });
  }
}
