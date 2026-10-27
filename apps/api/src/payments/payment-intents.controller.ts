import {
  Body,
  Controller,
  Get,
  HttpCode,
  Ip,
  Param,
  Post,
  Query,
  Redirect,
  UseGuards,
} from '@nestjs/common';
import { IsIn, IsInt, IsString, Length, Min } from 'class-validator';
import { PaymentIntentsService } from './payment-intents.service.js';
import { CurrentUser, JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { AuthUser } from '../auth/auth.types.js';
import { PaymentProvider } from '../generated/prisma/enums.js';
import { paymentConfig } from './gateways/config.js';
import type { MomoIpn } from './gateways/momo.js';

export class CreateIntentDto {
  @IsInt()
  @Min(1)
  orderId!: number;

  @IsIn(Object.values(PaymentProvider))
  provider!: PaymentProvider;
}

export class ConfirmIntentDto {
  @IsString()
  @Length(3, 40)
  accountNumber!: string;

  @IsString()
  @Length(4, 12)
  pin!: string;
}

@Controller('payments')
export class PaymentIntentsController {
  constructor(private readonly intents: PaymentIntentsService) {}

  /** Danh sách tài khoản TEST (ngân hàng/MoMo/VNPay) để thử thanh toán. */
  @Get('test-accounts')
  testAccounts() {
    return this.intents.listTestAccounts();
  }

  @Post('intents')
  @UseGuards(JwtAuthGuard)
  create(
    @Body() dto: CreateIntentDto,
    @CurrentUser() user: AuthUser,
    @Ip() ip: string,
  ) {
    const clean = ip?.replace('::ffff:', '') || '127.0.0.1';
    return this.intents.create(user.id, dto.orderId, dto.provider, clean);
  }

  @Get('intents/:token')
  view(@Param('token') token: string) {
    return this.intents.view(token);
  }

  /** Điện thoại xác nhận sau khi quét QR (mô phỏng). Token trong URL là bằng chứng quyền. */
  @Post('intents/:token/confirm')
  @HttpCode(200)
  confirm(@Param('token') token: string, @Body() dto: ConfirmIntentDto) {
    return this.intents.confirmSimulated(token, dto.accountNumber, dto.pin);
  }

  @Get('vnpay/return')
  @Redirect()
  async vnpayReturn(@Query() query: Record<string, unknown>) {
    const r = await this.intents.handleVnpay(query);
    const web = paymentConfig().webUrl;
    return { url: r.txnRef ? `${web}/pay/${r.txnRef}` : web, statusCode: 302 };
  }

  @Get('vnpay/ipn')
  vnpayIpn(@Query() query: Record<string, unknown>) {
    return this.intents.handleVnpay(query).then(({ RspCode, Message }) => ({
      RspCode,
      Message,
    }));
  }

  @Post('momo/ipn')
  @HttpCode(204)
  async momoIpn(@Body() body: MomoIpn) {
    await this.intents.handleMomoIpn(body);
  }
}
