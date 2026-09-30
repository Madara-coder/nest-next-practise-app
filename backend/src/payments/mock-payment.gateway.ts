import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { randomBytes } from 'node:crypto';
import {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentGateway,
} from './payment-gateway.interface.js';
import {
  PAYMENT_SIMULATOR_QUEUE,
  SimulatedPaymentJob,
} from './payment-simulator.processor.js';

const SIMULATED_PROCESSING_DELAY_MS = 2000;

/**
 * Local stand-in for a real provider. Like Stripe, it confirms the payment
 * asynchronously by calling our webhook endpoint a moment later.
 */
@Injectable()
export class MockPaymentGateway implements PaymentGateway {
  private readonly logger = new Logger(MockPaymentGateway.name);

  constructor(
    @InjectQueue(PAYMENT_SIMULATOR_QUEUE)
    private readonly simulatorQueue: Queue<SimulatedPaymentJob>,
  ) {}

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const paymentId = `pay_${randomBytes(8).toString('hex')}`;
    await this.simulatorQueue.add(
      'payment-succeeded',
      { paymentId, ...input },
      { delay: SIMULATED_PROCESSING_DELAY_MS, jobId: paymentId },
    );
    this.logger.log(`Created payment ${paymentId} for order ${input.orderId}`);
    return { paymentId };
  }
}
