import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class IngredientsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.ingredient.findMany({ orderBy: { id: 'asc' } });
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
