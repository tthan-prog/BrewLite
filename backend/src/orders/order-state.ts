import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from '../generated/prisma/enums.js';

/**
 * Máy trạng thái đơn hàng (nguồn duy nhất cho mọi chuyển trạng thái).
 *
 * PENDING        → PAID | PAYMENT_FAILED | CANCELLED
 * PAYMENT_FAILED → PENDING (thử thanh toán lại) | CANCELLED
 * PAID           → PREPARING | CANCELLED
 * PREPARING      → READY
 * READY          → COMPLETED
 * COMPLETED, CANCELLED: trạng thái cuối
 */
export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ['PAID', 'PAYMENT_FAILED', 'CANCELLED'],
  PAYMENT_FAILED: ['PENDING', 'CANCELLED'],
  PAID: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY'],
  READY: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}

export function assertTransition(from: OrderStatus, to: OrderStatus): void {
  if (!canTransition(from, to)) {
    throw new BadRequestException(
      `Không thể chuyển đơn từ ${from} sang ${to}`,
    );
  }
}

export const LOYALTY_VND_PER_POINT = 10_000;

export function pointsForTotal(total: number): number {
  return Math.floor(total / LOYALTY_VND_PER_POINT);
}
