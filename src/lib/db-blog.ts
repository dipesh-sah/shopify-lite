import { pool } from './db';

/**
 * Executes a query and returns all results
 */
export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const [results] = await pool.execute(sql, params);
  return results as T[];
}

/**
 * Executes a query and returns the first result or null
 */
export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const results = await query<T>(sql, params);
  return results.length > 0 ? results[0] : null;
}

/**
 * Executes a command (UPDATE, DELETE, etc.) and returns the result
 */
export async function execute(sql: string, params: any[] = []): Promise<any> {
  const [result] = await pool.execute(sql, params);
  return (result as any).affectedRows !== undefined ? (result as any).affectedRows : result;
}

/**
 * Executes an INSERT and returns the insertId
 */
export async function insert(sql: string, params: any[] = []): Promise<number> {
  const [result] = await pool.execute(sql, params);
  return (result as any).insertId;
}

/**
 * Handles database transactions
 */
export async function transaction<T>(
  callback: (connection: any) => Promise<T>
): Promise<T> {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Builds a SQL LIMIT/OFFSET clause for pagination
 */
export function buildPaginationClause(page: number, limit: number): { clause: string; params: number[] } {
  const offset = (page - 1) * limit;
  return {
    clause: 'LIMIT ? OFFSET ?',
    params: [limit, offset],
  };
}
