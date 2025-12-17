
import { query, execute, pool } from './db';

export interface NumberRange {
  id: string;
  type: string;
  prefix: string;
  suffix: string;
  start_value: number;
  current_value: number;
  description: string;
  updated_at: Date;
}

/**
 * Generates the next unique number for a given entity type (e.g., 'order', 'product').
 * This updates the current_value in the database atomically.
 */
export async function generateNextNumber(type: string): Promise<string> {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // 1. Lock the row and get current state to ensure safety
    // Using FOR UPDATE to lock the row
    const [ranges] = await connection.query(
      `SELECT * FROM number_ranges WHERE type = ? FOR UPDATE`,
      [type]
    ) as any[];

    if (ranges.length === 0) {
      throw new Error(`Number range not found for type: ${type}`);
    }

    const range = ranges[0];
    const nextValue = range.current_value + 1;

    // 2. Update the current value
    await connection.execute(
      `UPDATE number_ranges SET current_value = ? WHERE id = ?`,
      [nextValue, range.id]
    );

    await connection.commit();

    // 3. Format the number
    // e.g. ORD-10001
    return `${range.prefix}${nextValue}${range.suffix}`;

  } catch (error) {
    await connection.rollback();
    console.error(`Failed to generate next number for ${type}:`, error);
    // Fallback: Use timestamp-random if critical failure (optional, but let's throw for now to maintain integrity)
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Get all number ranges for admin configuration
 */
export async function getNumberRanges(): Promise<NumberRange[]> {
  const rows = await query('SELECT * FROM number_ranges ORDER BY type ASC');
  return rows.map((r: any) => ({
    id: r.id,
    type: r.type,
    prefix: r.prefix || '',
    suffix: r.suffix || '',
    start_value: r.start_value,
    current_value: r.current_value,
    description: r.description,
    updated_at: r.updated_at
  }));
}

/**
 * Update number range configuration
 */
export async function updateNumberRange(id: string, data: Partial<NumberRange>) {
  const updates: string[] = [];
  const values: any[] = [];

  if (data.prefix !== undefined) {
    updates.push('prefix = ?');
    values.push(data.prefix);
  }
  if (data.suffix !== undefined) {
    updates.push('suffix = ?');
    values.push(data.suffix);
  }
  if (data.current_value !== undefined) {
    // Careful allowing manual update of current value
    updates.push('current_value = ?');
    values.push(data.current_value);
  }
  if (data.start_value !== undefined) {
    updates.push('start_value = ?');
    values.push(data.start_value);
  }

  if (updates.length === 0) return;

  values.push(id);
  await execute(`UPDATE number_ranges SET ${updates.join(', ')} WHERE id = ?`, values);
}

export async function previewNextNumber(type: string): Promise<string> {
  const ranges = await query<NumberRange>(
    'SELECT * FROM number_ranges WHERE type = ?',
    [type]
  );

  if (ranges.length === 0) {
    throw new Error(`Number range for type '${type}' not found`);
  }

  const range = ranges[0];
  const nextValue = range.current_value + 1;
  return `${range.prefix || ''}${nextValue}${range.suffix || ''}`;
}
