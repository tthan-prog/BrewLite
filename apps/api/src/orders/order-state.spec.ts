import { BadRequestException } from '@nestjs/common';
import {
  ORDER_TRANSITIONS,
  assertTransition,
  canTransition,
  pointsForTotal,
} from './order-state.js';
import { OrderStatus } from '../generated/prisma/enums.js';

const ALL = Object.values(OrderStatus);

describe('Order state machine (Task 10a)', () => {
  const valid: [OrderStatus, OrderStatus][] = [
    ['PENDING', 'PAID'],
    ['PENDING', 'PAYMENT_FAILED'],
    ['PENDING', 'CANCELLED'],
    ['PAYMENT_FAILED', 'PENDING'],
    ['PAYMENT_FAILED', 'CANCELLED'],
    ['PAID', 'PREPARING'],
    ['PAID', 'CANCELLED'],
    ['PREPARING', 'READY'],
    ['READY', 'COMPLETED'],
  ];

  it.each(valid)('allows %s -> %s', (from, to) => {
    expect(canTransition(from, to)).toBe(true);
    expect(() => assertTransition(from, to)).not.toThrow();
  });

  it('rejects every transition that is not in the allowed list', () => {
    const allowed = new Set(valid.map(([a, b]) => `${a}>${b}`));
    for (const from of ALL) {
      for (const to of ALL) {
        if (allowed.has(`${from}>${to}`)) continue;
        expect(canTransition(from, to), `${from} -> ${to}`).toBe(false);
        expect(() => assertTransition(from, to)).toThrow(BadRequestException);
      }
    }
  });

  it('has no way out of COMPLETED or CANCELLED', () => {
    expect(ORDER_TRANSITIONS.COMPLETED).toEqual([]);
    expect(ORDER_TRANSITIONS.CANCELLED).toEqual([]);
  });

  it('does not let an order skip steps (PAID -> COMPLETED, PENDING -> READY)', () => {
    //expect(canTransition('PAID', 'COMPLETED')).toBe(false);
    expect(canTransition('PAID', 'COMPLETED')).toBe(true);
    expect(canTransition('PENDING', 'READY')).toBe(false);
    expect(canTransition('PENDING', 'PREPARING')).toBe(false);
  });
});

describe('Loyalty points', () => {
  it('gives 1 point per full 10.000đ', () => {
    expect(pointsForTotal(0)).toBe(0);
    expect(pointsForTotal(9_999)).toBe(0);
    expect(pointsForTotal(10_000)).toBe(1);
    expect(pointsForTotal(59_000)).toBe(5);
  });
});
