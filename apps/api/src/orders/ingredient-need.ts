/**
 * Tính nhu cầu nguyên liệu của đơn. Dùng chung cho tạo đơn (trừ kho) và tra cứu "còn đặt được mấy ly".
 *
 * - Công thức món là lượng cho ly size S; size lớn hơn dùng nhiều hơn (làm tròn lên).
 * - Nguyên liệu đánh dấu sugarScaled (đường) / iceScaled (đá viên) nhân theo mức đường / đá khách chọn: 100% = đúng công thức, 0% = không dùng.
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
  /** true: lượng dùng thay đổi theo mức đường khách chọn. */
  sugarScaled?: boolean;
  /** true: lượng dùng thay đổi theo mức đá khách chọn. */
  iceScaled?: boolean;
}

export const DEFAULT_SUGAR_PERCENT = 100;

export function scaleForSugar(quantity: number, sugarPercent: number): number {
  return Math.ceil((quantity * sugarPercent) / 100);
}

export const scaleForIce = scaleForSugar;

/** Chuyển dòng công thức đã load kèm nguyên liệu thành RecipeLine (mang cờ sugarScaled). */
export function toRecipeLines(
  rows: {
    ingredientId: number;
    quantity: number;
    ingredient?: { sugarScaled: boolean; iceScaled: boolean } | null;
  }[],
): RecipeLine[] {
  return rows.map((r) => ({
    ingredientId: r.ingredientId,
    quantity: r.quantity,
    sugarScaled: r.ingredient?.sugarScaled ?? false,
    iceScaled: r.ingredient?.iceScaled ?? false,
  }));
}

/** Nguyên liệu cho MỘT ly: công thức món theo size + các topping đã chọn. */
export function perCupNeed(
  productRecipe: RecipeLine[],
  size: string,
  toppings: { quantity: number; recipe: RecipeLine[] }[],
  sugarPercent: number = DEFAULT_SUGAR_PERCENT,
  icePercent: number = DEFAULT_SUGAR_PERCENT,
): Map<number, number> {
  const need = new Map<number, number>();
  const add = (id: number, q: number) => {
    if (q > 0) need.set(id, (need.get(id) ?? 0) + q);
  };
  for (const r of productRecipe) {
    const bySize = scaleForSize(r.quantity, size);
    const scaled = r.sugarScaled
      ? scaleForSugar(bySize, sugarPercent)
      : r.iceScaled
        ? scaleForIce(bySize, icePercent)
        : bySize;
    add(r.ingredientId, scaled);
  }
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
