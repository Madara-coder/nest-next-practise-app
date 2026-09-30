import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { ORDERS_QUEUE } from '../orders/orders.processor.js';
import { HealthController } from './health.controller.js';

@Module({
  imports: [TerminusModule, BullModule.registerQueue({ name: ORDERS_QUEUE })],
  controllers: [HealthController],
})
export class HealthModule {}
