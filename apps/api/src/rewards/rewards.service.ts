import { randomBytes } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class RewardsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.reward.findMany({
      where: { active: true },
      orderBy: { pointsCost: 'asc' },
    });
  }

  /** Số điểm, lịch sử cộng/trừ điểm theo đơn và các quà đã đổi. */
  async me(userId: number) {
    const [user, history, redemptions] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { points: true },
      }),
      this.prisma.loyaltyTransaction.findMany({
        where: { userId },
        orderBy: { id: 'desc' },
        take: 50,
      }),
      this.prisma.redemption.findMany({
        where: { userId },
        orderBy: { id: 'desc' },
        include: { reward: { select: { name: true } } },
      }),
    ]);
    return {
      points: user.points,
      history,
      redemptions: redemptions.map((r) => ({
        id: r.id,
        code: r.code,
        rewardName: r.reward.name,
        pointsSpent: r.pointsSpent,
        createdAt: r.createdAt,
      })),
    };
  }

  /** Đổi quà: trừ điểm bằng UPDATE có điều kiện (points >= giá) nên không thể âm điểm. */
  async redeem(userId: number, rewardId: number) {
    const reward = await this.prisma.reward.findUnique({
      where: { id: rewardId },
    });
    if (!reward || !reward.active) {
      throw new NotFoundException(`Reward ${rewardId} not found`);
    }
    return this.prisma.$transaction(async (tx) => {
      const debit = await tx.user.updateMany({
        where: { id: userId, points: { gte: reward.pointsCost } },
        data: { points: { decrement: reward.pointsCost } },
      });
      if (debit.count !== 1) {
        throw new BadRequestException('Không đủ điểm để đổi quà này');
      }
      const redemption = await tx.redemption.create({
        data: {
          userId,
          rewardId: reward.id,
          pointsSpent: reward.pointsCost,
          code: `GIFT-${randomBytes(4).toString('hex').toUpperCase()}`,
        },
      });
      const user = await tx.user.findUniqueOrThrow({
        where: { id: userId },
        select: { points: true },
      });
      return {
        code: redemption.code,
        rewardName: reward.name,
        pointsSpent: reward.pointsCost,
        pointsBalance: user.points,
      };
    });
  }
}
