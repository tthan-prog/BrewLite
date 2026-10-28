import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module.js';
import { PaymentsController } from './payments.controller.js';
import { PaymentsService } from './payments.service.js';
import { PaymentIntentsController } from './payment-intents.controller.js';
import { PaymentIntentsService } from './payment-intents.service.js';

@Module({
  imports: [OrdersModule],
  controllers: [PaymentsController, PaymentIntentsController],
  providers: [PaymentsService, PaymentIntentsService],
})
export class PaymentsModule {}
