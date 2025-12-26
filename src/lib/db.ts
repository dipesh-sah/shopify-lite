if (typeof window !== 'undefined') {
  throw new Error('This module can only be used on the server.');
}
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

function getPoolConfig() {
  const config: any = {
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  };

  const match = dbUrl.match(/mysql:\/\/([^:]+)(?::([^@]*))?@([^:]+)(?::(\d+))?\/([^?]+)/);
  if (match) {
    config.user = match[1];
    config.password = match[2] || '';
    config.host = match[3];
    config.port = match[4] ? parseInt(match[4]) : 3306;
    config.database = match[5];
  } else {
    config.uri = dbUrl;
  }
  return config;
}

const pool = global.mysqlPool || mysql.createPool(getPoolConfig());

if (process.env.NODE_ENV !== 'production') {
  global.mysqlPool = pool;
}

export { pool };

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  try {
    // Standard query
    const [results] = await pool.query(sql, params);
    return results as T[];
  } catch (error: any) {
    throw error;
  }
}

export async function execute(sql: string, params: any[] = []): Promise<any> {
  try {
    const [result] = await pool.execute(sql, params);
    return result;
  } catch (error: any) {
    console.error('[DB Execute Error]', {
      message: error.message,
      code: error.code,
      sql: sql.substring(0, 500),
      params: params.map(p => typeof p === 'string' && p.length > 100 ? p.substring(0, 100) + '...' : p)
    });
    throw error;
  }
}
