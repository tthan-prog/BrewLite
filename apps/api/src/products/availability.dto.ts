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

export class AvailToppingDto {
  @IsInt()
  @Min(1)
  toppingId!: number;

  @IsInt()
  @Min(1)
  @Max(20)
  quantity!: number;
}

export class AvailItemDto {
  @IsInt()
  @Min(1)
  productId!: number;

  @IsIn(['S', 'M', 'L'])
  size!: string;

  /** Mức đường (%); bỏ trống = 100%. */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  sugar?: number;

  /** Mức đá (%); bỏ trống = 100%. */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  ice?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => AvailToppingDto)
  toppings?: AvailToppingDto[];
}

export class CartLineDto extends AvailItemDto {
  @IsInt()
  @Min(1)
  @Max(1000)
  quantity!: number;
}

/** Hỏi: với giỏ hiện tại, còn đặt thêm được tối đa mấy ly `candidate`? */
export class AvailabilityDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CartLineDto)
  cart?: CartLineDto[];

  @ValidateNested()
  @Type(() => AvailItemDto)
  candidate!: AvailItemDto;
}

/** Kiểm tra cả giỏ hàng: mỗi dòng tối đa bao nhiêu ly. */
export class CartCheckDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CartLineDto)
  cart!: CartLineDto[];
}

/** Báo giá: tạm tính, giảm giá và tổng tiền (chưa tạo đơn, không trừ kho). */
export class QuoteDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CartLineDto)
  items!: CartLineDto[];

  @IsOptional()
  @IsString()
  @MaxLength(32)
  promoCode?: string;
}
