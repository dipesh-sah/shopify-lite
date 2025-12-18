
import { query, execute } from './db';

export interface Promotion {
  id: string;
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxUsages: number;
  currentUsages: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  ruleId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function getPromotions() {
  const rows = await query('SELECT * FROM promotions ORDER BY created_at DESC');
  return rows.map(mapPromotionFromDb);
}

export async function getPromotionByCode(code: string) {
  const rows = await query('SELECT * FROM promotions WHERE code = ?', [code]);
  if (rows.length === 0) return null;
  return mapPromotionFromDb(rows[0]);
}

export async function createPromotion(data: Partial<Promotion> = {}) {
  const params = [
    data.code,
    data.description || null,
    data.discountType || 'percentage',
    data.discountValue || 0,
    data.minOrderAmount || 0,
    data.maxUsages || 0,
    data.startDate,
    data.endDate,
    data.isActive ? 1 : 0,
    data.ruleId || null
  ];

  const result = await execute(
    `INSERT INTO promotions (
      code, description, discount_type, discount_value, min_order_amount, 
      max_usages, start_date, end_date, is_active, rule_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    params
  );

  return result.insertId.toString();
}

export async function updatePromotion(id: string, data: Partial<Promotion>) {
  const updates: string[] = [];
  const values: any[] = [];

  const addUpdate = (field: string, value: any) => {
    if (value !== undefined) {
      updates.push(`${field} = ?`);
      values.push(value);
    }
  };

  addUpdate('code', data.code);
  addUpdate('description', data.description);
  addUpdate('discount_type', data.discountType);
  addUpdate('discount_value', data.discountValue);
  addUpdate('min_order_amount', data.minOrderAmount);
  addUpdate('max_usages', data.maxUsages);
  addUpdate('start_date', data.startDate);
  addUpdate('end_date', data.endDate);
  addUpdate('rule_id', data.ruleId);

  if (data.isActive !== undefined) {
    addUpdate('is_active', data.isActive ? 1 : 0);
  }

  if (updates.length > 0) {
    updates.push('updated_at = NOW()');
    values.push(id);
    await execute(`UPDATE promotions SET ${updates.join(', ')} WHERE id = ?`, values);
  }
}

export async function deletePromotion(id: string) {
  await execute('DELETE FROM promotions WHERE id = ?', [id]);
}

function mapPromotionFromDb(row: any): Promotion {
  return {
    id: row.id.toString(),
    code: row.code,
    description: row.description,
    discountType: row.discount_type,
    discountValue: Number(row.discount_value),
    minOrderAmount: Number(row.min_order_amount),
    maxUsages: row.max_usages,
    currentUsages: row.current_usages,
    startDate: row.start_date,
    endDate: row.end_date,
    isActive: Boolean(row.is_active),
    ruleId: row.rule_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
