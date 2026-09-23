import sql from 'mssql';
import { Database } from 'bun:sqlite';
import { env } from '../config/env';

export const isSqlServer = env.DB_DRIVER === 'sqlserver';

// SQLite fallback if DB_DRIVER=sqlite
export const sqliteDb = !isSqlServer
  ? new Database(env.DATABASE_URL.replace(/^file:/, '') || 'sqlite.db', { create: true })
  : null;

export const db = sqliteDb;

// SQL Server connection pool
let pool: sql.ConnectionPool | null = null;

export async function getPool(): Promise<sql.ConnectionPool> {
  if (pool && pool.connected) {
    return pool;
  }

  const config: sql.config = {
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    server: env.DB_SERVER,
    port: env.DB_PORT,
    database: env.DB_NAME,
    options: {
      encrypt: env.DB_ENCRYPT,
      trustServerCertificate: true, // Bypass TLS certificate validation for local / internal networks
      enableArithAbort: true,
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  };

  try {
    pool = await new sql.ConnectionPool(config).connect();
    console.log(`Terhubung ke SQL Server (${env.DB_SERVER}:${env.DB_PORT} / ${env.DB_NAME})`);
    return pool;
  } catch (err) {
    console.error('Gagal terhubung ke SQL Server:', err);
    throw err;
  }
}

export { sql };
