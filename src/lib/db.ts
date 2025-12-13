import mysql from 'mysql2/promise';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not defined');
}

// Parse DATABASE_URL or use individual env vars if you prefer
// Format: mysql://user:password@host:port/database
declare global {
  var mysqlPool: mysql.Pool | undefined;
}

export const pool = global.mysqlPool || mysql.createPool({
  uri: process.env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 20,
  maxIdle: 20,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

if (process.env.NODE_ENV !== 'production') {
  global.mysqlPool = pool;
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const [results] = await pool.execute(sql, params);
  return results as T[];
}

export async function execute(sql: string, params: any[] = []): Promise<any> {
  const [result] = await pool.execute(sql, params);
  return result;
}
