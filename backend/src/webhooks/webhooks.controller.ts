import {
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  type RawBodyRequest,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request } from 'express';
import { Public } from '../common/decorators/public.decorator.js';
import { SIGNATURE_HEADER } from '../payments/webhook-signature.js';
import { WebhooksService } from './webhooks.service.js';

@ApiExcludeController()
@Public()
@SkipThrottle()
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('payments')
  @HttpCode(HttpStatus.OK)
  handlePayment(
    @Req() req: RawBodyRequest<Request>,
    @Headers(SIGNATURE_HEADER) signature?: string,
  ) {
    return this.webhooksService.handlePaymentEvent(req.rawBody, signature);
  }
}
