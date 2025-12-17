import { query, execute } from './db';

export interface CustomerSegment {
  id: string;
  name: string;
  queryString: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function getSegments() {
  const rows = await query('SELECT * FROM customer_segments ORDER BY created_at DESC');
  return rows.map((row: any) => ({
    id: row.id.toString(),
    name: row.name,
    queryString: row.query_string,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  }));
}

export async function createSegment(name: string, queryString: string) {
  const result = await execute(
    'INSERT INTO customer_segments (name, query_string, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
    [name, queryString]
  );
  return result.insertId.toString();
}

export async function deleteSegment(id: string) {
  await execute('DELETE FROM customer_segments WHERE id = ?', [id]);
}
