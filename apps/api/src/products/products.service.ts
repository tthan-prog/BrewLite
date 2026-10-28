import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  addScaled,
  perCupNeed,
  scaleForSize,
} from '../orders/ingredient-need.js';
import type { AvailabilityDto, AvailItemDto } from './availability.dto.js';

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
  const line = (r: (typeof recipe)[number], size: string) => ({
    ingredientId: r.ingredientId,
    name: r.ingredient.name,
    unit: r.ingredient.unit,
    quantity: scaleForSize(r.quantity, size),
  });
  return {
    ...rest,
    maxQuantity: available,
    available: available > 0,
    // Công thức cho ly size S (giữ tên cũ để tương thích) và theo từng size.
    recipe: recipe.map((r) => line(r, 'S')),
    recipeBySize: {
      S: recipe.map((r) => line(r, 'S')),
      M: recipe.map((r) => line(r, 'M')),
      L: recipe.map((r) => line(r, 'L')),
    },
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

  async listToppings() {
    const rows = await this.prisma.topping.findMany({
      orderBy: { id: 'asc' },
      include: {
        recipe: {
          include: { ingredient: true },
          orderBy: { ingredientId: 'asc' },
        },
      },
    });
    return rows.map(({ recipe, ...t }) => ({
      ...t,
      recipe: recipe.map((r) => ({
        ingredientId: r.ingredientId,
        name: r.ingredient.name,
        unit: r.ingredient.unit,
        quantity: r.quantity,
      })),
    }));
  }

  /**
   * Còn đặt thêm được tối đa mấy ly `candidate` khi giỏ đã có `cart`.
   * Chỉ trả SỐ LY (khách không thấy tồn kho nguyên liệu). Đây là con số tham khảo cho giao diện;
   * việc chặn thật nằm ở bước tạo đơn (UPDATE có điều kiện trong transaction).
   */
  async availability(dto: AvailabilityDto) {
    const lines = [...(dto.cart ?? []), { ...dto.candidate, quantity: 0 }];
    const productIds = [...new Set(lines.map((l) => l.productId))];
    const toppingIds = [
      ...new Set(
        lines.flatMap((l) => (l.toppings ?? []).map((t) => t.toppingId)),
      ),
    ];
    const [products, toppings, ingredients] = await Promise.all([
      this.prisma.product.findMany({
        where: { id: { in: productIds } },
        include: { recipe: true },
      }),
      this.prisma.topping.findMany({
        where: { id: { in: toppingIds } },
        include: { recipe: true },
      }),
      this.prisma.ingredient.findMany(),
    ]);
    const productById = new Map(products.map((p) => [p.id, p]));
    const toppingById = new Map(toppings.map((t) => [t.id, t]));
    for (const l of lines) {
      if (!productById.has(l.productId)) {
        throw new NotFoundException(`Product ${l.productId} not found`);
      }
      for (const t of l.toppings ?? []) {
        if (!toppingById.has(t.toppingId)) {
          throw new NotFoundException(`Topping ${t.toppingId} not found`);
        }
      }
    }

    const cupNeed = (l: AvailItemDto) => {
      const p = productById.get(l.productId)!;
      return perCupNeed(
        p.recipe,
        l.size,
        (l.toppings ?? []).map((t) => ({
          quantity: t.quantity,
          recipe: toppingById.get(t.toppingId)!.recipe,
        })),
      );
    };

    // Nguyên liệu giỏ hàng đã dùng, và số ly món-không-công-thức đã nằm trong giỏ.
    const used = new Map<number, number>();
    const legacyCups = new Map<number, number>();
    for (const l of dto.cart ?? []) {
      addScaled(used, cupNeed(l), l.quantity);
      if (productById.get(l.productId)!.recipe.length === 0) {
        legacyCups.set(
          l.productId,
          (legacyCups.get(l.productId) ?? 0) + l.quantity,
        );
      }
    }

    const cand = dto.candidate;
    const candProduct = productById.get(cand.productId)!;
    const per = cupNeed(cand);
    const stock = new Map(ingredients.map((i) => [i.id, i.stock]));
    let max = Number.MAX_SAFE_INTEGER;
    for (const [id, q] of per) {
      const left = (stock.get(id) ?? 0) - (used.get(id) ?? 0);
      max = Math.min(max, Math.floor(Math.max(0, left) / Math.max(1, q)));
    }
    if (candProduct.recipe.length === 0) {
      max = Math.min(
        max,
        Math.max(0, candProduct.stock - (legacyCups.get(candProduct.id) ?? 0)),
      );
    }
    if (max === Number.MAX_SAFE_INTEGER) max = 0;
    return { maxAdditional: Math.max(0, max) };
  }
}
