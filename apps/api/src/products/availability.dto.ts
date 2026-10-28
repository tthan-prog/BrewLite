import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  Max,
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
