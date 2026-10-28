import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { AvailabilityDto, CartCheckDto, QuoteDto } from './availability.dto.js';
import { ProductsService } from './products.service.js';

@Controller()
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get('products')
  findAll() {
    return this.products.findAll();
  }

  @Get('products/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.products.findOne(id);
  }

  /** Còn đặt thêm được tối đa mấy ly (công khai, chỉ trả số ly). */
  @Post('products/availability')
  @HttpCode(200)
  availability(@Body() dto: AvailabilityDto) {
    return this.products.availability(dto);
  }

  /** Kiểm tra cả giỏ hàng theo nguyên liệu và giới hạn ly/dòng (công khai). */
  @Post('products/cart-check')
  @HttpCode(200)
  cartCheck(@Body() dto: CartCheckDto) {
    return this.products.cartCheck(dto);
  }

  /** Báo giá: tạm tính, giảm giá, tổng (công khai, không ghi dữ liệu). */
  @Post('products/quote')
  @HttpCode(200)
  quote(@Body() dto: QuoteDto) {
    return this.products.quote(dto);
  }

  @Get('toppings')
  toppings() {
    return this.products.listToppings();
  }
}
