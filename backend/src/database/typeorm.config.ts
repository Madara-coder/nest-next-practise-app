import { DataSourceOptions } from 'typeorm';
import { OrderItem } from '../orders/entities/order-item.entity.js';
import { Order } from '../orders/entities/order.entity.js';
import { Product } from '../products/entities/product.entity.js';
import { Tenant } from '../tenants/entities/tenant.entity.js';
import { User } from '../users/entities/user.entity.js';
import { WebhookEvent } from '../webhooks/entities/webhook-event.entity.js';

export const entities = [Tenant, User, Product, Order, OrderItem, WebhookEvent];

/**
 * Shared by the Nest app and the TypeORM CLI.
 * Schema changes are applied only through migrations (never `synchronize`).
 */
export function buildDataSourceOptions(url: string): DataSourceOptions {
  return {
    type: 'postgres',
    url,
    entities,
    // Built into PostgreSQL 13+, so no extension needs installing.
    uuidExtension: 'pgcrypto',
    migrations: [`${import.meta.dirname}/migrations/*.js`],
    // Each migration runs in its own transaction, so a single migration can opt out
    // (e.g. for CREATE INDEX CONCURRENTLY) with `transaction = false`.
    migrationsTransactionMode: 'each',
    synchronize: false,
  };
}
