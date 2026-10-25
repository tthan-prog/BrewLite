import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
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

  @Get('toppings')
  toppings() {
    return this.products.listToppings();
  }
}
