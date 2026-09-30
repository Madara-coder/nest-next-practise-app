import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { In, LessThanOrEqual, Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity.js';
import { Order } from './entities/order.entity.js';

export const ORDERS_QUEUE = 'orders';
export const ORDER_PAID_JOB = 'order-paid';
const LOW_STOCK_THRESHOLD = 10;

export interface OrderPaidJob {
  orderId: string;
}

/** Post-payment side effects run in the background, outside the webhook request. */
@Processor(ORDERS_QUEUE)
export class OrdersProcessor extends WorkerHost {
  private readonly logger = new Logger(OrdersProcessor.name);

  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {
    super();
  }

  async process(job: Job<OrderPaidJob>): Promise<void> {
    switch (job.name) {
      case ORDER_PAID_JOB:
        return this.handleOrderPaid(job.data.orderId);
      default:
        throw new Error(`Unknown job: ${job.name}`);
    }
  }

  private async handleOrderPaid(orderId: string): Promise<void> {
    const order = await this.ordersRepository.findOneOrFail({
      where: { id: orderId },
      relations: { buyer: true, items: true },
    });

    // A real system would call an email provider here.
    this.logger.log(
      `Sent order confirmation for ${order.id} to ${order.buyer.email}`,
    );

    const lowStock = await this.productsRepository.findBy({
      id: In(order.items.map((item) => item.productId)),
      stock: LessThanOrEqual(LOW_STOCK_THRESHOLD),
    });
    for (const product of lowStock) {
      this.logger.warn(
        `Low stock: "${product.name}" (${product.sku}) has ${product.stock} left`,
      );
    }
  }
}
