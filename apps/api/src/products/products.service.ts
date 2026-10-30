import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  addScaled,
  perCupNeed,
  scaleForSize,
  toRecipeLines,
} from '../orders/ingredient-need.js';
import { SIZE_SURCHARGE } from '../orders/orders.service.js';
import { MAX_ITEM_QUANTITY } from '../orders/dto/create-order.dto.js';
import { evaluatePromotion, promoMessage } from '../orders/pricing.js';
import type {
  AvailabilityDto,
  AvailItemDto,
  CartCheckDto,
  CartLineDto,
  QuoteDto,
} from './availability.dto.js';

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

  /** Nạp công thức món/topping và tồn kho cho các dòng cần tính. */
  private async loadContext(lines: AvailItemDto[]) {
    const productIds = [...new Set(lines.map((l) => l.productId))];
    const toppingIds = [
      ...new Set(
        lines.flatMap((l) => (l.toppings ?? []).map((t) => t.toppingId)),
      ),
    ];
    const recipeInclude = { recipe: { include: { ingredient: true } } };
    const [products, toppings, ingredients] = await Promise.all([
      this.prisma.product.findMany({
        where: { id: { in: productIds } },
        include: recipeInclude,
      }),
      this.prisma.topping.findMany({
        where: { id: { in: toppingIds } },
        include: recipeInclude,
      }),
      this.prisma.ingredient.findMany({ orderBy: { id: 'asc' } }),
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
    const ingredientById = new Map(ingredients.map((i) => [i.id, i]));
    return { productById, toppingById, ingredientById };
  }

  private cupNeed(ctx: Awaited<ReturnType<ProductsService['loadContext']>>, l: AvailItemDto) {
    const p = ctx.productById.get(l.productId)!;
    return perCupNeed(
      toRecipeLines(p.recipe),
      l.size,
      (l.toppings ?? []).map((t) => ({
        quantity: t.quantity,
        recipe: toRecipeLines(ctx.toppingById.get(t.toppingId)!.recipe),
      })),
      l.sugar,
      l.ice,
    );
  }

  /** Còn làm thêm được tối đa mấy ly `cand` khi các dòng `cart` đã chiếm nguyên liệu. */
  private maxAdditional(
    ctx: Awaited<ReturnType<ProductsService['loadContext']>>,
    cart: CartLineDto[],
    cand: AvailItemDto,
  ): { max: number; per: Map<number, number> } {
    const used = new Map<number, number>();
    const legacyCups = new Map<number, number>();
    for (const l of cart) {
      addScaled(used, this.cupNeed(ctx, l), l.quantity);
      if (ctx.productById.get(l.productId)!.recipe.length === 0) {
        legacyCups.set(
          l.productId,
          (legacyCups.get(l.productId) ?? 0) + l.quantity,
        );
      }
    }
    const candProduct = ctx.productById.get(cand.productId)!;
    const per = this.cupNeed(ctx, cand);
    let max = Number.MAX_SAFE_INTEGER;
    for (const [id, q] of per) {
      const left = (ctx.ingredientById.get(id)?.stock ?? 0) - (used.get(id) ?? 0);
      max = Math.min(max, Math.floor(Math.max(0, left) / Math.max(1, q)));
    }
    if (candProduct.recipe.length === 0) {
      max = Math.min(
        max,
        Math.max(0, candProduct.stock - (legacyCups.get(candProduct.id) ?? 0)),
      );
    }
    if (max === Number.MAX_SAFE_INTEGER) max = 0;
    return { max: Math.max(0, max), per };
  }

  /**
   * Còn đặt thêm được tối đa mấy ly `candidate` khi giỏ đã có `cart`, kèm nguyên liệu mỗi ly
   * (đã tính size, topping, mức đường). Chỉ trả SỐ LY và định mức mỗi ly — khách không thấy
   * tồn kho. Việc chặn thật nằm ở bước tạo đơn (UPDATE có điều kiện trong transaction).
   */
  async availability(dto: AvailabilityDto) {
    const cart = dto.cart ?? [];
    const ctx = await this.loadContext([...cart, dto.candidate]);
    const { max, per } = this.maxAdditional(ctx, cart, dto.candidate);
    return {
      maxAdditional: max,
      perCup: [...per]
        .sort((a, b) => a[0] - b[0])
        .map(([id, quantity]) => ({
          name: ctx.ingredientById.get(id)?.name ?? String(id),
          unit: ctx.ingredientById.get(id)?.unit ?? '',
          quantity,
        })),
    };
  }

  /**
   * Kiểm tra cả giỏ hàng: với mỗi dòng, tối đa bao nhiêu ly (tính cả các dòng còn lại và giới hạn
   * MAX_ITEM_QUANTITY ly/dòng). ok = mọi dòng đều trong giới hạn.
   */
  async cartCheck(dto: CartCheckDto) {
    const ctx = await this.loadContext(dto.cart);
    const lines = dto.cart.map((line, index) => {
      const others = dto.cart.filter((_, i) => i !== index);
      const { max } = this.maxAdditional(ctx, others, line);
      const limit = Math.min(max, MAX_ITEM_QUANTITY);
      return { max: limit, ok: line.quantity <= limit };
    });
    return { ok: lines.every((l) => l.ok), lines };
  }

  /** Báo giá cho giỏ hàng + mã khuyến mãi (giống cách tính khi tạo đơn, nhưng không ghi gì). */
  async quote(dto: QuoteDto) {
    const ctx = await this.loadContext(dto.items);
    let subtotal = 0;
    for (const l of dto.items) {
      const p = ctx.productById.get(l.productId)!;
      const toppingTotal = (l.toppings ?? []).reduce(
        (sum, t) => sum + ctx.toppingById.get(t.toppingId)!.price * t.quantity,
        0,
      );
      subtotal += (p.price + (SIZE_SURCHARGE[l.size] ?? 0) + toppingTotal) * l.quantity;
    }
    let discount = 0;
    let promoError: string | null = null;
    let promoCode: string | null = null;
    const code = dto.promoCode?.trim().toUpperCase();
    if (code) {
      const promotion = await this.prisma.promotion.findUnique({ where: { code } });
      const result = evaluatePromotion(promotion, subtotal);
      if (result.ok) {
        discount = result.discount;
        promoCode = code;
      } else {
        promoError = promoMessage(result.reason, promotion);
      }
    }
    return { subtotal, discount, total: subtotal - discount, promoCode, promoError };
  }
}
