
import { query, execute } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { RulePayload } from './engine';

export interface Rule {
  id: string;
  name: string;
  description?: string;
  priority: number;
  payload: RulePayload;
  module_type: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export async function getRules(moduleType?: string): Promise<Rule[]> {
  let sql = `SELECT * FROM rules`;
  const params: any[] = [];

  if (moduleType) {
    sql += ` WHERE module_type = ?`;
    params.push(moduleType);
  }

  sql += ` ORDER BY priority DESC, created_at DESC`;

  const rows = await query<any[]>(sql, params);

  return rows.map(row => ({
    ...row,
    payload: typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload,
    is_active: Boolean(row.is_active)
  }));
}

export async function getRule(id: string): Promise<Rule | null> {
  const rows = await query<any[]>(`SELECT * FROM rules WHERE id = ?`, [id]);
  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    ...row,
    payload: typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload,
    is_active: Boolean(row.is_active)
  };
}

export async function createRule(data: {
  name: string;
  description?: string;
  priority?: number;
  payload: RulePayload;
  module_type?: string;
  is_active?: boolean;
}) {
  const id = uuidv4();
  await execute(
    `INSERT INTO rules (id, name, description, priority, payload, module_type, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      id,
      data.name,
      data.description || null,
      data.priority || 0,
      JSON.stringify(data.payload),
      data.module_type || 'general',
      data.is_active ?? true
    ]
  );
  return id;
}

export async function updateRule(id: string, data: {
  name?: string;
  description?: string;
  priority?: number;
  payload?: RulePayload;
  module_type?: string;
  is_active?: boolean;
}) {
  const updates: string[] = [];
  const params: any[] = [];

  if (data.name !== undefined) { updates.push('name = ?'); params.push(data.name); }
  if (data.description !== undefined) { updates.push('description = ?'); params.push(data.description); }
  if (data.priority !== undefined) { updates.push('priority = ?'); params.push(data.priority); }
  if (data.payload !== undefined) { updates.push('payload = ?'); params.push(JSON.stringify(data.payload)); }
  if (data.module_type !== undefined) { updates.push('module_type = ?'); params.push(data.module_type); }
  if (data.is_active !== undefined) { updates.push('is_active = ?'); params.push(data.is_active); }

  if (updates.length === 0) return;

  updates.push('updated_at = NOW()');
  params.push(id);

  await execute(
    `UPDATE rules SET ${updates.join(', ')} WHERE id = ?`,
    params
  );
}

export async function deleteRule(id: string) {
  await execute(`DELETE FROM rules WHERE id = ?`, [id]);
}
