import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from './typeorm.config.js';

// Used by the TypeORM CLI (migration:generate / run / revert).
try {
  process.loadEnvFile();
} catch {
  // No .env file: rely on real environment variables (e.g. in Docker / CI).
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

export default new DataSource(buildDataSourceOptions(process.env.DATABASE_URL));
