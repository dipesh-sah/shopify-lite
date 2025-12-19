
import { query, execute } from './db';
import { RowDataPacket } from 'mysql2';

// Types
export interface MetafieldDefinition {
  id: number;
  namespace: string;
  key: string;
  owner_type: string;
  type: string;
  name: string;
  description?: string;
  validation?: any;
  access?: any;
}

export interface Metafield {
  id: number;
  owner_type: string;
  owner_id: string;
  namespace: string;
  key: string;
  value: any;
  type: string;
  description?: string;
}

// Validation Logic
function validateValue(value: any, type: string, validation?: any): boolean {
  if (value === null || value === undefined) return false;

  // 1. Generic Validation (Min/Max/Regex)
  if (validation) {
    if (validation.regex) {
      try {
        const re = new RegExp(validation.regex);
        if (!re.test(String(value))) return false;
      } catch (e) { console.warn('Invalid regex in definition', validation.regex); }
    }

    // Numerical range check (applicable for numbers)
    if (['number_integer', 'number_decimal', 'money', 'weight', 'volume', 'dimension', 'rating'].includes(type)) {
      const num = Number(value);
      if (validation.min !== '' && validation.min !== undefined && num < Number(validation.min)) return false;
      if (validation.max !== '' && validation.max !== undefined && num > Number(validation.max)) return false;
    }

    // Length check for text? (Optional, if we added Min/Max Length)
  }

  // 2. Type-Specific Validation
  switch (type) {
    case 'number_integer':
      return Number.isInteger(Number(value));
    case 'number_decimal':
    case 'money':
    case 'rating':
    case 'weight':
    case 'volume':
    case 'dimension':
      return !isNaN(Number(value)); // Basic number check

    case 'boolean':
      return value === 'true' || value === 'false' || typeof value === 'boolean';

    case 'json':
      try {
        if (typeof value === 'object') return true;
        JSON.parse(value);
        return true;
      } catch {
        return false;
      }

    case 'list.single_line_text_field':
      if (!Array.isArray(value)) {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed);
        } catch { return false; }
      }
      return true;

    // References & Text (lenient defaults)
    case 'multi_line_text_field':
    case 'single_line_text_field':
    case 'rich_text_field':
    case 'email':
    case 'url':
    case 'color':
    case 'date':
    case 'date_time':
    case 'file_reference':
    case 'product_reference':
    case 'variant_reference':
    case 'collection_reference':
    case 'customer_reference':
    case 'order_reference':
    case 'page_reference':
    case 'metaobject_reference':
      return true;

    default:
      return true; // Unknown type, prefer lenient.
  }
}

// --------------------------------------------------------------------------
// Metafield Definitions
// --------------------------------------------------------------------------

export async function createMetafieldDefinition(def: Omit<MetafieldDefinition, 'id'>) {
  const sql = `
    INSERT INTO metafield_definitions 
    (namespace, \`key\`, owner_type, type, name, description, validation, access)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const result = await execute(sql, [
    def.namespace,
    def.key,
    def.owner_type,
    def.type,
    def.name,
    def.description || null,
    JSON.stringify(def.validation || {}),
    JSON.stringify(def.access || {})
  ]);
  return result.insertId;
}

export async function getMetafieldDefinition(namespace: string, key: string, ownerType: string): Promise<MetafieldDefinition | null> {
  const rows = await query<MetafieldDefinition & RowDataPacket>(`
    SELECT * FROM metafield_definitions 
    WHERE namespace = ? AND \`key\` = ? AND owner_type = ?
  `, [namespace, key, ownerType]);

  return rows.length > 0 ? rows[0] : null;
}

export async function getMetafieldDefinitions(ownerType?: string): Promise<MetafieldDefinition[]> {
  let sql = 'SELECT * FROM metafield_definitions';
  const params: any[] = [];
  if (ownerType) {
    sql += ' WHERE owner_type = ?';
    params.push(ownerType);
  }
  return query<MetafieldDefinition & RowDataPacket>(sql, params);
}

export async function updateMetafieldDefinition(id: number, data: Partial<MetafieldDefinition>) {
  const fields: string[] = [];
  const params: any[] = [];

  if (data.name) { fields.push('name = ?'); params.push(data.name); }
  if (data.description !== undefined) { fields.push('description = ?'); params.push(data.description); }
  if (data.validation) { fields.push('validation = ?'); params.push(JSON.stringify(data.validation)); }
  if (data.access) { fields.push('access = ?'); params.push(JSON.stringify(data.access)); }

  if (fields.length === 0) return;

  params.push(id);
  await execute(`UPDATE metafield_definitions SET ${fields.join(', ')} WHERE id = ?`, params);
}

export async function deleteMetafieldDefinition(id: number) {
  return execute('DELETE FROM metafield_definitions WHERE id = ?', [id]);
}

// --------------------------------------------------------------------------
// Metafields
// --------------------------------------------------------------------------

/**
 * Set a metafield. Creates if not exists, updates if exists.
 * Validates against definition if one exists for this owner_type.
 * Handles History.
 */
export async function setMetafield(
  ownerType: string,
  ownerId: string,
  namespace: string,
  key: string,
  value: any,
  valueType: string,
  description?: string,
  changedBy: string = 'system'
) {
  // 1. Check definition (optional, but good for validation)
  const def = await getMetafieldDefinition(namespace, key, ownerType);
  if (def) {
    if (def.type !== valueType) {
      // Allow compatible types? e.g. integer to decimal?
      // For now, strict.
      // throw new Error(`Type mismatch. Expected ${def.type}, got ${valueType}`);
    }
    if (!validateValue(value, def.type, def.validation)) {
      throw new Error(`Invalid value for type ${def.type}`);
    }
  }

  // 2. Serialize value
  let storedValue = value;
  if (typeof value === 'object') storedValue = JSON.stringify(value);

  // 3. Check existing
  const existing = await getMetafield(ownerType, ownerId, namespace, key);

  if (existing) {
    // Update
    if (existing.value === storedValue) return existing.id; // No change

    await execute(`
      UPDATE metafields 
      SET value = ?, type = ?, description = ?, updated_at = NOW()
      WHERE id = ?
        `, [storedValue, valueType, description || existing.description, existing.id]);

    // History
    await execute(`
      INSERT INTO metafield_history(metafield_id, previous_value, new_value, changed_by)
      VALUES(?, ?, ?, ?)
    `, [existing.id, existing.value, storedValue, changedBy]);

    return existing.id;
  } else {
    // Insert
    const result = await execute(`
      INSERT INTO metafields
        (owner_type, owner_id, namespace, \`key\`, value, type, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [ownerType, ownerId, namespace, key, storedValue, valueType, description || null]);

    // History (creation)
    await execute(`
      INSERT INTO metafield_history (metafield_id, previous_value, new_value, changed_by)
      VALUES (?, NULL, ?, ?)
    `, [result.insertId, storedValue, changedBy]);

    return result.insertId;
  }
}

export async function getMetafield(ownerType: string, ownerId: string, namespace: string, key: string): Promise<Metafield | null> {
  const rows = await query<Metafield & RowDataPacket>(`
    SELECT * FROM metafields 
    WHERE owner_type = ? AND owner_id = ? AND namespace = ? AND \`key\` = ?
  `, [ownerType, ownerId, namespace, key]);
  return rows.length > 0 ? rows[0] : null;
}

export async function getMetafields(ownerType: string, ownerId: string): Promise<Metafield[]> {
  return query<Metafield & RowDataPacket>(`
    SELECT * FROM metafields 
    WHERE owner_type = ? AND owner_id = ?
  `, [ownerType, ownerId]);
}

export async function deleteMetafield(id: number) {
  return execute(`DELETE FROM metafields WHERE id = ?`, [id]);
}
