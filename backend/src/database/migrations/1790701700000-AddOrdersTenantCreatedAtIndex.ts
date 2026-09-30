import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Speeds up "latest orders for a tenant" (the orders list page).
 *
 * Production-safe: CREATE INDEX CONCURRENTLY does not lock the table against
 * writes, so orders keep flowing while the index builds. It cannot run inside
 * a transaction, hence `transaction = false`. IF NOT EXISTS makes a retry after
 * a partial failure safe.
 */
export class AddOrdersTenantCreatedAtIndex1790701700000 implements MigrationInterface {
  name = 'AddOrdersTenantCreatedAtIndex1790701700000';
  transaction = false as const;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_orders_tenant_created_at" ON "orders" ("tenant_id", "created_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS "IDX_orders_tenant_created_at"`,
    );
  }
}
