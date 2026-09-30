import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrdersService } from '../orders/orders.service.js';
import { isValidSignature } from '../payments/webhook-signature.js';
import { WebhookEvent } from './entities/webhook-event.entity.js';

const PROVIDER = 'mock-payments';

interface PaymentEvent {
  id: string;
  type: string;
  data: { paymentId: string; orderId: string };
}

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @InjectRepository(WebhookEvent)
    private readonly eventsRepository: Repository<WebhookEvent>,
    private readonly ordersService: OrdersService,
    private readonly configService: ConfigService,
  ) {}

  async handlePaymentEvent(
    rawBody: Buffer | undefined,
    signature: string | undefined,
  ): Promise<{ received: true; duplicate?: true }> {
    const secret = this.configService.getOrThrow<string>('WEBHOOK_SECRET');
    if (!rawBody || !isValidSignature(rawBody, signature, secret)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const event = this.parse(rawBody);
    if (await this.eventsRepository.existsBy({ eventId: event.id })) {
      this.logger.log(`Skipping duplicate webhook ${event.id}`);
      return { received: true, duplicate: true };
    }

    switch (event.type) {
      case 'payment.succeeded':
        await this.ordersService.markAsPaid(
          event.data.orderId,
          event.data.paymentId,
        );
        break;
      default:
        this.logger.warn(`Ignoring unsupported webhook type ${event.type}`);
    }

    // Recorded after processing so a failure lets the provider retry.
    // Processing itself is idempotent, so a concurrent duplicate is harmless.
    await this.eventsRepository
      .createQueryBuilder()
      .insert()
      .values({
        provider: PROVIDER,
        eventId: event.id,
        type: event.type,
        payload: event,
      })
      .orIgnore()
      .execute();

    return { received: true };
  }

  private parse(rawBody: Buffer): PaymentEvent {
    try {
      const event = JSON.parse(rawBody.toString('utf8')) as PaymentEvent;
      if (!event.id || !event.type || !event.data?.orderId) {
        throw new Error('Missing fields');
      }
      return event;
    } catch {
      throw new BadRequestException('Malformed webhook payload');
    }
  }
}
