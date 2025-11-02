import { Inject, Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { DRIZZLE_CONNECTION, PG_POOL } from './constants/db.constants';
import * as schema from './schema';

@Injectable()
export class DBService implements OnModuleDestroy {
  private readonly logger = new Logger(DBService.name);

  constructor(
    @Inject(DRIZZLE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
    @Inject(PG_POOL)
    private readonly pool: Pool,
  ) {
    this.logger.log('✅ DrizzleService initialized successfully');
  }

  /**
   * Get the Drizzle database instance for queries
   * @returns NodePgDatabase instance with schema
   */
  getDb(): NodePgDatabase<typeof schema> {
    return this.db;
  }

  /**
   * Get the raw PostgreSQL pool for advanced queries
   * @returns Pool instance
   */
  getPool(): Pool {
    return this.pool;
  }

  /**
   * Execute a raw SQL query
   * @param query SQL query string
   * @param params Query parameters
   */
  async query(query: string, params?: any[]) {
    try {
      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      this.logger.error('Query execution failed', error);
      throw error;
    }
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.pool.query('SELECT NOW()');
      this.logger.log('✅ Database connection successful');
      return true;
    } catch (error) {
      this.logger.error('❌ Database connection failed', error);
      return false;
    }
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy() {
    this.logger.log('Closing database connection pool...');
    await this.pool.end();
    this.logger.log('✅ Database connection pool closed');
  }
}
