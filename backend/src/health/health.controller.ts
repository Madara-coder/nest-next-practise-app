import { InjectQueue } from '@nestjs/bullmq';
import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  HealthIndicatorService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';
import { Queue } from 'bullmq';
import { Public } from '../common/decorators/public.decorator.js';
import { ORDERS_QUEUE } from '../orders/orders.processor.js';

@ApiTags('health')
@Public()
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly healthIndicator: HealthIndicatorService,
    @InjectQueue(ORDERS_QUEUE) private readonly ordersQueue: Queue,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.checkRedis(),
    ]);
  }

  private async checkRedis() {
    const indicator = this.healthIndicator.check('redis');
    try {
      const counts = await Promise.race([
        this.ordersQueue.getJobCounts('waiting', 'active', 'failed'),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Redis timeout')), 2000),
        ),
      ]);
      return indicator.up({ ordersQueue: counts });
    } catch (error) {
      return indicator.down({ message: (error as Error).message });
    }
  }
}
