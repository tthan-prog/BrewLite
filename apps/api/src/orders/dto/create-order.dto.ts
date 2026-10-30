import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export const ORDER_SIZES = ['S', 'M', 'L'] as const;

/** Tối đa số ly trên MỘT dòng đơn (giỏ hàng và API dùng chung giới hạn này). */
export const MAX_ITEM_QUANTITY = 50;

export class OrderToppingDto {
  @IsInt()
  @Min(1)
  toppingId!: number;

  @IsInt()
  @Min(1)
  @Max(20)
  quantity!: number;
}

export class OrderItemDto {
  @IsInt()
  @Min(1)
  productId!: number;

  @IsInt()
  @Min(1)
  @Max(MAX_ITEM_QUANTITY)
  quantity!: number;

  @IsIn(ORDER_SIZES)
  size!: string;

  /** Mức đường (%); bỏ trống = 100% (đúng công thức). */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  sugar?: number;

  /** Mức đá (%), chỉ để ghi nhận cho pha chế. */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  ice?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => OrderToppingDto)
  toppings?: OrderToppingDto[];
}

export class CreateOrderDto {
  /** Bị bỏ qua khi gọi qua HTTP: controller luôn lấy userId từ JWT. */
  @IsOptional()
  @IsInt()
  userId!: number;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @IsOptional()
  @IsString()
  @MaxLength(32)
  promoCode?: string;
}
