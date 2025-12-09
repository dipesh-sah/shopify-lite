
import { query, execute } from './db';

// Attribute Types
export interface AttributeGroup {
  id: string;
  name: string;
  options: string[];
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Attribute Operations

export async function createAttributeGroup(data: {
  name: string;
  options?: string[];
  description?: string;
}) {
  const result = await execute(
    `INSERT INTO attributes (name, options, description, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())`,
    [data.name, JSON.stringify(data.options || []), data.description || null]
  );
  return result.insertId.toString();
}

export async function getAttributeGroups(): Promise<AttributeGroup[]> {
  const rows = await query('SELECT * FROM attributes ORDER BY created_at DESC');
  return rows.map(mapAttributeFromDb);
}

export async function getAttributeGroup(id: string): Promise<AttributeGroup | null> {
  const rows = await query('SELECT * FROM attributes WHERE id = ?', [id]);
  if (rows.length === 0) return null;
  return mapAttributeFromDb(rows[0]);
}

export async function updateAttributeGroup(id: string, data: { name?: string; options?: string[]; description?: string }) {
  const updates: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
  if (data.options !== undefined) { updates.push('options = ?'); values.push(JSON.stringify(data.options)); }
  if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description); }

  if (updates.length > 0) {
    updates.push('updated_at = NOW()');
    values.push(id);
    await execute(`UPDATE attributes SET ${updates.join(', ')} WHERE id = ?`, values);
  }
}

export async function deleteAttributeGroup(id: string) {
  await execute('DELETE FROM attributes WHERE id = ?', [id]);
}

function mapAttributeFromDb(row: any): AttributeGroup {
  return {
    id: row.id.toString(),
    name: row.name,
    options: typeof row.options === 'string' ? JSON.parse(row.options) : row.options || [],
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
