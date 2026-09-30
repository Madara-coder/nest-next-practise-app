import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  type Relation,
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity.js';
import { User } from '../../users/entities/user.entity.js';
import { OrderItem } from './order-item.entity.js';
import { OrderStatus } from './order-status.enum.js';

@Entity('orders')
@Index(['tenantId', 'idempotencyKey'], { unique: true })
// Created concurrently in its own migration (see AddOrdersTenantCreatedAtIndex).
@Index('IDX_orders_tenant_created_at', ['tenantId', 'createdAt'])
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Relation<Tenant>;

  @Index()
  @Column({ name: 'buyer_id', type: 'uuid' })
  buyerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'buyer_id' })
  buyer: Relation<User>;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    enumName: 'order_status',
    default: OrderStatus.PendingPayment,
  })
  status: OrderStatus;

  @Column({ name: 'total_cents', type: 'integer' })
  totalCents: number;

  /** Client-supplied key so retried "create order" requests never create duplicates. */
  @Column({ name: 'idempotency_key', type: 'varchar', nullable: true })
  idempotencyKey: string | null;

  @Column({ name: 'payment_id', type: 'varchar', nullable: true })
  paymentId: string | null;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt: Date | null;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: ['insert'] })
  items: Relation<OrderItem[]>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
