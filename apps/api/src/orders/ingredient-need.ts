/**
 * Tính nhu cầu nguyên liệu của đơn. Dùng chung cho tạo đơn (trừ kho) và tra cứu "còn đặt được mấy ly".
 *
 * - Công thức món là lượng cho ly size S; size lớn hơn dùng nhiều hơn (làm tròn lên).
 * - Topping có công thức riêng, không đổi theo size, nhân với số phần topping và số ly.
 */
export const SIZE_RECIPE_PERCENT: Record<string, number> = {
  S: 100,
  M: 125,
  L: 150,
};

export function scaleForSize(baseQuantity: number, size: string): number {
  const percent = SIZE_RECIPE_PERCENT[size] ?? 100;
  return Math.ceil((baseQuantity * percent) / 100);
}

export interface RecipeLine {
  ingredientId: number;
  quantity: number;
}

/** Nguyên liệu cho MỘT ly: công thức món theo size + các topping đã chọn. */
export function perCupNeed(
  productRecipe: RecipeLine[],
  size: string,
  toppings: { quantity: number; recipe: RecipeLine[] }[],
): Map<number, number> {
  const need = new Map<number, number>();
  const add = (id: number, q: number) => need.set(id, (need.get(id) ?? 0) + q);
  for (const r of productRecipe)
    add(r.ingredientId, scaleForSize(r.quantity, size));
  for (const t of toppings) {
    for (const r of t.recipe) add(r.ingredientId, r.quantity * t.quantity);
  }
  return need;
}

export function addScaled(
  total: Map<number, number>,
  perCup: Map<number, number>,
  cups: number,
) {
  for (const [id, q] of perCup) total.set(id, (total.get(id) ?? 0) + q * cups);
}
