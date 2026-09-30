import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { MockPaymentGateway } from './mock-payment.gateway.js';
import { PAYMENT_GATEWAY } from './payment-gateway.interface.js';
import {
  PAYMENT_SIMULATOR_QUEUE,
  PaymentSimulatorProcessor,
} from './payment-simulator.processor.js';

@Module({
  imports: [BullModule.registerQueue({ name: PAYMENT_SIMULATOR_QUEUE })],
  providers: [
    // Swap `useClass` for a real provider (e.g. StripePaymentGateway) without touching callers.
    { provide: PAYMENT_GATEWAY, useClass: MockPaymentGateway },
    PaymentSimulatorProcessor,
  ],
  exports: [PAYMENT_GATEWAY],
})
export class PaymentsModule {}
