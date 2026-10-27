import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { IsInt, Max, Min } from 'class-validator';
import { IngredientsService } from './ingredients.service.js';
import { JwtAuthGuard, Roles } from '../auth/jwt-auth.guard.js';

export class RestockDto {
  @IsInt()
  @Min(1)
  @Max(1_000_000)
  quantity!: number;
}

/** Kho nguyên liệu: chỉ STAFF xem và nhập thêm. */
@Controller('ingredients')
@UseGuards(JwtAuthGuard)
@Roles('STAFF')
export class IngredientsController {
  constructor(private readonly ingredients: IngredientsService) {}

  @Get()
  list() {
    return this.ingredients.list();
  }

  @Patch(':id/restock')
  restock(@Param('id', ParseIntPipe) id: number, @Body() dto: RestockDto) {
    return this.ingredients.restock(id, dto.quantity);
  }
}
