import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import {
  DataSource,
  EntityManager,
  FindOptionsWhere,
  In,
  IsNull,
  QueryFailedError,
  Repository,
} from 'typeorm';
import { Paginated } from '../common/dto/pagination-query.dto.js';
import { Role } from '../common/enums/role.enum.js';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface.js';
import {
  PAYMENT_GATEWAY,
  type PaymentGateway,
} from '../payments/payment-gateway.interface.js';
import { Product } from '../products/entities/product.entity.js';
import { CreateOrderDto, OrderItemDto } from './dto/create-order.dto.js';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto.js';
import { OrderItem } from './entities/order-item.entity.js';
import { OrderStatus } from './entities/order-status.enum.js';
import { Order } from './entities/order.entity.js';
import {
  ORDER_PAID_JOB,
  ORDERS_QUEUE,
  OrderPaidJob,
} from './orders.processor.js';

const CURRENCY = 'NPR';
const PG_UNIQUE_VIOLATION = '23505';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    private readonly dataSource: DataSource,
    @Inject(PAYMENT_GATEWAY)
    private readonly paymentGateway: PaymentGateway,
    @InjectQueue(ORDERS_QUEUE)
    private readonly ordersQueue: Queue<OrderPaidJob>,
  ) {}

  async create(
    user: JwtPayload,
    dto: CreateOrderDto,
    idempotencyKey?: string,
  ): Promise<Order> {
    if (idempotencyKey) {
      const existing = await this.ordersRepository.findOneBy({
        tenantId: user.tenantId,
        idempotencyKey,
      });
      if (existing) {
        return this.findOne(user, existing.id);
      }
    }

    try {
      const orderId = await this.dataSource.transaction((manager) =>
        this.reserveStockAndCreateOrder(manager, user, dto, idempotencyKey),
      );
      this.logger.log(`Order ${orderId} created by ${user.email}`);
      return this.findOne(user, orderId);
    } catch (error) {
      // Two identical requests raced past the check above: return the winner.
      if (idempotencyKey && this.isUniqueViolation(error)) {
        const existing = await this.ordersRepository.findOneByOrFail({
          tenantId: user.tenantId,
          idempotencyKey,
        });
        return this.findOne(user, existing.id);
      }
      throw error;
    }
  }

  async findAll(
    user: JwtPayload,
    { page, limit, status }: ListOrdersQueryDto,
  ): Promise<Paginated<Order>> {
    const [data, total] = await this.ordersRepository.findAndCount({
      where: { ...this.scope(user), ...(status && { status }) },
      relations: { buyer: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: { page, limit, total } };
  }

  async findOne(user: JwtPayload, id: string): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id, ...this.scope(user) },
      relations: { items: true, buyer: true },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async getStats(tenantId: string) {
    const rows = await this.ordersRepository
      .createQueryBuilder('o')
      .select('o.status', 'status')
      .addSelect('COUNT(*)::int', 'count')
      .addSelect('COALESCE(SUM(o.totalCents), 0)::int', 'totalCents')
      .where('o.tenantId = :tenantId', { tenantId })
      .groupBy('o.status')
      .getRawMany<{ status: OrderStatus; count: number; totalCents: number }>();

    const byStatus = Object.fromEntries(
      Object.values(OrderStatus).map((status) => [
        status,
        rows.find((row) => row.status === status)?.count ?? 0,
      ]),
    ) as Record<OrderStatus, number>;
    const revenueCents = rows
      .filter((row) =>
        [OrderStatus.Paid, OrderStatus.Fulfilled].includes(row.status),
      )
      .reduce((sum, row) => sum + row.totalCents, 0);

    return { byStatus, revenueCents, currency: CURRENCY };
  }

  /** Starts payment with the provider. Confirmation arrives later via webhook. */
  async pay(user: JwtPayload, id: string): Promise<Order> {
    const order = await this.findOne(user, id);
    if (order.status !== OrderStatus.PendingPayment) {
      throw new ConflictException(`Order is already ${order.status}`);
    }
    if (order.paymentId) {
      return order; // Payment already started; the webhook will confirm it.
    }

    const { paymentId } = await this.paymentGateway.createPayment({
      orderId: order.id,
      amountCents: order.totalCents,
      currency: CURRENCY,
    });
    await this.ordersRepository.update(
      { id: order.id, paymentId: IsNull() },
      { paymentId },
    );
    return this.findOne(user, id);
  }

  /**
   * Called by the payment webhook. Idempotent: the conditional UPDATE only
   * succeeds once, so duplicate webhooks never enqueue duplicate jobs.
   */
  async markAsPaid(orderId: string, paymentId: string): Promise<boolean> {
    const result = await this.ordersRepository.update(
      { id: orderId, paymentId, status: OrderStatus.PendingPayment },
      { status: OrderStatus.Paid, paidAt: new Date() },
    );

    if (!result.affected) {
      return false;
    }
    await this.ordersQueue.add(
      ORDER_PAID_JOB,
      { orderId },
      { jobId: `order-paid-${orderId}` },
    );
    this.logger.log(`Order ${orderId} marked as paid`);
    return true;
  }

  async fulfill(user: JwtPayload, id: string): Promise<Order> {
    await this.transition(user, id, OrderStatus.Paid, OrderStatus.Fulfilled);
    return this.findOne(user, id);
  }

  /** Cancels an unpaid order and returns its items to stock. */
  async cancel(user: JwtPayload, id: string): Promise<Order> {
    const order = await this.findOne(user, id);
    await this.dataSource.transaction(async (manager) => {
      await this.transition(
        user,
        id,
        OrderStatus.PendingPayment,
        OrderStatus.Cancelled,
        manager,
      );
      for (const item of order.items) {
        await manager.increment(
          Product,
          { id: item.productId },
          'stock',
          item.quantity,
        );
      }
    });
    return this.findOne(user, id);
  }

  private async reserveStockAndCreateOrder(
    manager: EntityManager,
    user: JwtPayload,
    dto: CreateOrderDto,
    idempotencyKey?: string,
  ): Promise<string> {
    const items = this.mergeDuplicateItems(dto.items);
    const productIds = items.map((item) => item.productId).sort();

    // Lock rows in a consistent order to avoid deadlocks between concurrent orders.
    const products = await manager.find(Product, {
      where: { id: In(productIds), tenantId: user.tenantId },
      order: { id: 'ASC' },
      lock: { mode: 'pessimistic_write' },
    });
    const productsById = new Map(products.map((p) => [p.id, p]));

    const orderItems: Partial<OrderItem>[] = [];
    for (const { productId, quantity } of items) {
      const product = productsById.get(productId);
      if (!product) {
        throw new NotFoundException(`Product ${productId} not found`);
      }
      if (product.stock < quantity) {
        throw new BadRequestException(
          `Only ${product.stock} unit(s) of "${product.name}" left in stock`,
        );
      }
      product.stock -= quantity;
      orderItems.push({
        productId,
        productName: product.name,
        quantity,
        unitPriceCents: product.priceCents,
      });
    }
    await manager.save(products);

    const order = await manager.save(
      manager.create(Order, {
        tenantId: user.tenantId,
        buyerId: user.sub,
        idempotencyKey: idempotencyKey ?? null,
        totalCents: this.calculateTotal(orderItems),
        items: orderItems,
      }),
    );
    return order.id;
  }

  private async transition(
    user: JwtPayload,
    id: string,
    from: OrderStatus,
    to: OrderStatus,
    manager: EntityManager = this.ordersRepository.manager,
  ): Promise<void> {
    const result = await manager.update(
      Order,
      { id, status: from, ...this.scope(user) },
      { status: to },
    );
    if (!result.affected) {
      await this.findOne(user, id); // 404 if it isn't visible to this user
      throw new ConflictException(`Only ${from} orders can become ${to}`);
    }
  }

  /** Buyers only see their own orders; admins and staff see the whole tenant. */
  private scope(user: JwtPayload): FindOptionsWhere<Order> {
    return user.role === Role.Buyer
      ? { tenantId: user.tenantId, buyerId: user.sub }
      : { tenantId: user.tenantId };
  }

  private mergeDuplicateItems(items: OrderItemDto[]): OrderItemDto[] {
    const quantities = new Map<string, number>();
    for (const { productId, quantity } of items) {
      quantities.set(productId, (quantities.get(productId) ?? 0) + quantity);
    }
    return [...quantities].map(([productId, quantity]) => ({
      productId,
      quantity,
    }));
  }

  private calculateTotal(items: Partial<OrderItem>[]): number {
    return items.reduce(
      (sum, item) => sum + item.unitPriceCents! * item.quantity!,
      0,
    );
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      error instanceof QueryFailedError &&
      (error.driverError as { code?: string }).code === PG_UNIQUE_VIOLATION
    );
  }
}
