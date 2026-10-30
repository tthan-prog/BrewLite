/** Quy tắc khuyến mãi dùng chung cho tạo đơn và báo giá (một nguồn duy nhất). */
export type PromoFailure = 'INVALID' | 'EXPIRED' | 'MIN_ORDER';

export interface PromotionLike {
  type: string;
  value: number;
  minOrder: number;
  expiresAt: Date | null;
}

export type PromoResult =
  | { ok: true; discount: number }
  | { ok: false; reason: PromoFailure };

export function evaluatePromotion(
  promotion: PromotionLike | null,
  subtotal: number,
  now: number = Date.now(),
): PromoResult {
  if (!promotion) return { ok: false, reason: 'INVALID' };
  if (promotion.expiresAt && promotion.expiresAt.getTime() < now) {
    return { ok: false, reason: 'EXPIRED' };
  }
  if (subtotal < promotion.minOrder) return { ok: false, reason: 'MIN_ORDER' };
  const raw =
    promotion.type === 'PERCENT'
      ? Math.floor((subtotal * promotion.value) / 100)
      : promotion.value;
  return { ok: true, discount: Math.min(subtotal, Math.max(0, raw)) };
}

/** Thông điệp hiển thị cho khách ở bước thanh toán. */
export function promoMessage(
  reason: PromoFailure,
  promotion: { minOrder: number } | null,
): string {
  if (reason === 'EXPIRED') return 'Mã khuyến mãi đã hết hạn.';
  if (reason === 'MIN_ORDER' && promotion) {
    return `Mã chỉ áp dụng cho đơn từ ${promotion.minOrder.toLocaleString('vi-VN')}đ.`;
  }
  return 'Mã khuyến mãi không hợp lệ.';
}
