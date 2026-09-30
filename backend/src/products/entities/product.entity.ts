import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  type Relation,
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity.js';

@Entity('products')
@Index(['tenantId', 'sku'], { unique: true, where: '"deleted_at" IS NULL' })
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Relation<Tenant>;

  @Column()
  name: string;

  @Column()
  sku: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  /** Price stored in the smallest currency unit to avoid floating point errors. */
  @Column({ name: 'price_cents', type: 'integer' })
  priceCents: number;

  @Column({ type: 'integer', default: 0 })
  stock: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt: Date | null;
}
