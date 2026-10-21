export class CreateOrderDto {
  userId!: number;

  items!: {
    productId: number;
    quantity: number;
    size: string;
    toppings?: {
      toppingId: number;
      quantity: number;
    }[];
  }[];

  promoCode?: string;
}