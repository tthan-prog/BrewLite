import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { UpdateOrderStatusDto } from './dto/update-status.dto.js';
import { CurrentUser, JwtAuthGuard, Roles } from '../auth/jwt-auth.guard.js';
import type { AuthUser } from '../auth/auth.types.js';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /** Tất cả đơn: chỉ STAFF. */
  @Get()
  @Roles('STAFF')
  findAll() {
    return this.ordersService.findAll();
  }

  /** Lịch sử đơn của người dùng đăng nhập (Task 9). Phải khai báo trước ':id'. */
  @Get('me')
  findMine(@CurrentUser() user: AuthUser) {
    return this.ordersService.findByUser(user.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.ordersService.findOneFor(id, user);
  }

  /** Tạo đơn PENDING. userId luôn lấy từ JWT, không tin giá trị trong body. */
  @Post()
  create(
    @Body() dto: CreateOrderDto,
    @CurrentUser() user: AuthUser,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.ordersService.create({ ...dto, userId: user.id }, idempotencyKey);
  }

  /** STAFF chuyển PREPARING / READY / COMPLETED / CANCELLED (Task 10). */
  @Patch(':id/status')
  @Roles('STAFF')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto.status);
  }
}
