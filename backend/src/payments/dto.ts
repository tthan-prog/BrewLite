import { IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { PaymentMethod } from '../generated/prisma/enums.js';

export class CreatePaymentDto {
  @IsInt()
  @Min(1)
  orderId!: number;

  @IsIn(Object.values(PaymentMethod))
  method!: PaymentMethod;

  /**
   * Chỉ để demo/test (thanh toán là mô phỏng): 'FAIL' ép thanh toán thất bại.
   * Mặc định thành công.
   */
  @IsOptional()
  @IsIn(['SUCCESS', 'FAIL'])
  simulate?: 'SUCCESS' | 'FAIL';
}
