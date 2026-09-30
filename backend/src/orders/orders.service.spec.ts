import { getQueueToken } from '@nestjs/bullmq';
import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Role } from '../common/enums/role.enum.js';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface.js';
import { PAYMENT_GATEWAY } from '../payments/payment-gateway.interface.js';
import { OrderStatus } from './entities/order-status.enum.js';
import { Order } from './entities/order.entity.js';
import { ORDER_PAID_JOB, ORDERS_QUEUE } from './orders.processor.js';
import { OrdersService } from './orders.service.js';

const buyer: JwtPayload = {
  sub: 'buyer-1',
  tenantId: 'tenant-1',
  email: 'buyer@test',
  role: Role.Buyer,
};

describe('OrdersService', () => {
  let service: OrdersService;
  const ordersRepository = {
    findOneBy: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
  };
  const dataSource = { transaction: vi.fn() };
  const paymentGateway = { createPayment: vi.fn() };
  const ordersQueue = { add: vi.fn() };

  beforeEach(async () => {
    vi.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(Order), useValue: ordersRepository },
        { provide: DataSource, useValue: dataSource },
        { provide: PAYMENT_GATEWAY, useValue: paymentGateway },
        { provide: getQueueToken(ORDERS_QUEUE), useValue: ordersQueue },
      ],
    }).compile();
    service = moduleRef.get(OrdersService);
  });

  describe('create', () => {
    it('returns the existing order for a repeated idempotency key', async () => {
      const existing = { id: 'order-1', tenantId: buyer.tenantId };
      ordersRepository.findOneBy.mockResolvedValue(existing);
      ordersRepository.findOne.mockResolvedValue(existing);

      const order = await service.create(
        buyer,
        { items: [{ productId: 'p1', quantity: 1 }] },
        'key-1',
      );

      expect(order).toBe(existing);
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });
  });

  describe('pay', () => {
    it('refuses to pay an order that is not pending payment', async () => {
      ordersRepository.findOne.mockResolvedValue({
        id: 'order-1',
        status: OrderStatus.Paid,
      });

      await expect(service.pay(buyer, 'order-1')).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(paymentGateway.createPayment).not.toHaveBeenCalled();
    });

    it('starts a payment through the gateway for a pending order', async () => {
      const pending = {
        id: 'order-1',
        status: OrderStatus.PendingPayment,
        totalCents: 5000,
        paymentId: null,
      };
      ordersRepository.findOne.mockResolvedValue(pending);
      paymentGateway.createPayment.mockResolvedValue({ paymentId: 'pay_1' });

      await service.pay(buyer, 'order-1');

      expect(paymentGateway.createPayment).toHaveBeenCalledWith({
        orderId: 'order-1',
        amountCents: 5000,
        currency: 'NPR',
      });
      expect(ordersRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'order-1' }),
        { paymentId: 'pay_1' },
      );
    });
  });

  describe('markAsPaid', () => {
    it('enqueues the order-paid job when the order transitions', async () => {
      ordersRepository.update.mockResolvedValue({ affected: 1 });

      await expect(service.markAsPaid('order-1', 'pay_1')).resolves.toBe(true);
      expect(ordersQueue.add).toHaveBeenCalledWith(
        ORDER_PAID_JOB,
        { orderId: 'order-1' },
        { jobId: 'order-paid-order-1' },
      );
    });

    it('does nothing for a duplicate webhook', async () => {
      ordersRepository.update.mockResolvedValue({ affected: 0 });

      await expect(service.markAsPaid('order-1', 'pay_1')).resolves.toBe(false);
      expect(ordersQueue.add).not.toHaveBeenCalled();
    });
  });
});
