import mysql from 'mysql2/promise';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not defined');
}

// Parse DATABASE_URL or use individual env vars if you prefer
// Format: mysql://user:password@host:port/database
declare global {
  var mysqlPool: mysql.Pool | undefined;
}

// Parse DATABASE_URL manually to ensure compatibility
// Format: mysql://user:password@host:port/database
const dbUrl = process.env.DATABASE_URL;
const match = dbUrl.match(/mysql:\/\/([^:]+)(?::([^@]*))?@([^:]+)(?::(\d+))?\/([^?]+)/);

let connectionConfig: any = {
  waitForConnections: true,
  connectionLimit: 20,
  maxIdle: 20,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

if (match) {
  connectionConfig.user = match[1];
  connectionConfig.password = match[2] || '';
  connectionConfig.host = match[3];
  connectionConfig.port = match[4] ? parseInt(match[4]) : 3306;
  connectionConfig.database = match[5];
} else {
  // Fallback or just pass URI if regex fails (though unlikely for standard format)
  connectionConfig.uri = dbUrl;
}

export const pool = global.mysqlPool || mysql.createPool(connectionConfig);

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
