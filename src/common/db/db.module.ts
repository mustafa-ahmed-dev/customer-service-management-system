import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';
import { Pool } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DBService } from './db.service';
import { DRIZZLE_CONNECTION, PG_POOL } from './constants/db.constants';
import * as schema from './schema';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: PG_POOL,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const pool = new Pool({
          host: configService.databaseConfig.host,
          port: configService.databaseConfig.port,
          user: configService.databaseConfig.user,
          password: configService.databaseConfig.password,
          database: configService.databaseConfig.name,
          // Optional: Connection pool settings
          max: 20, // Maximum number of clients in the pool
          idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
          connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
        });

        // Handle pool errors
        pool.on('error', (err) => {
          console.error('Unexpected error on idle client', err);
          process.exit(-1);
        });

        return pool;
      },
    },
    {
      provide: DRIZZLE_CONNECTION,
      inject: [PG_POOL],
      useFactory: (pool: Pool): NodePgDatabase<typeof schema> => {
        return drizzle(pool, { schema });
      },
    },
    DBService,
  ],
  exports: [DBService, DRIZZLE_CONNECTION, PG_POOL],
})
export class DBModule {}
