import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import { randomBytes } from 'node:crypto';
import { SIGNATURE_HEADER, signPayload } from './webhook-signature.js';

export const PAYMENT_SIMULATOR_QUEUE = 'payment-simulator';

export interface SimulatedPaymentJob {
  paymentId: string;
  orderId: string;
  amountCents: number;
  currency: string;
}

/** Delivers a signed "payment.succeeded" webhook, retried by BullMQ on failure. */
@Processor(PAYMENT_SIMULATOR_QUEUE)
export class PaymentSimulatorProcessor extends WorkerHost {
  private readonly logger = new Logger(PaymentSimulatorProcessor.name);

  constructor(private readonly configService: ConfigService) {
    super();
  }

  async process(job: Job<SimulatedPaymentJob>): Promise<void> {
    const event = {
      // Stable event id: retries of this job re-send the *same* event.
      id: `evt_${job.data.paymentId}`,
      type: 'payment.succeeded',
      createdAt: new Date().toISOString(),
      data: job.data,
    };
    const body = JSON.stringify(event);
    const url = `http://localhost:${this.configService.get<number>('PORT')}/api/webhooks/payments`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        [SIGNATURE_HEADER]: signPayload(
          body,
          this.configService.getOrThrow<string>('WEBHOOK_SECRET'),
        ),
        'x-request-id': `whk_${randomBytes(6).toString('hex')}`,
      },
      body,
    });

    if (!response.ok) {
      // Throwing lets BullMQ retry with exponential backoff.
      throw new Error(`Webhook delivery failed with status ${response.status}`);
    }
    this.logger.log(
      `Delivered ${event.type} webhook for ${job.data.paymentId}`,
    );
  }
}
