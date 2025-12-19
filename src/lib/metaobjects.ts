
import { query, execute } from './db';
import { setMetafield, getMetafields, deleteMetafield, Metafield } from './metafields';
import { RowDataPacket } from 'mysql2';

export interface MetaobjectDefinition {
  id: number;
  type: string;
  name: string;
  field_definitions: any[]; // JSON array of definitions
}

export interface Metaobject {
  id: number;
  definition_id: number;
  type: string; // derived from definition
  handle: string;
  display_name: string;
  fields?: Record<string, any>;
}

// --------------------------------------------------------------------------
// Metaobject Definitions
// --------------------------------------------------------------------------

export async function defineMetaobject(type: string, name: string, fieldDefinitions: any[]) {
  const sql = `
    INSERT INTO metaobject_definitions (type, name, field_definitions)
    VALUES (?, ?, ?)
  `;
  const result = await execute(sql, [type, name, JSON.stringify(fieldDefinitions)]);
  return result.insertId;
}

export async function getMetaobjectDefinition(type: string): Promise<MetaobjectDefinition | null> {
  const rows = await query<MetaobjectDefinition & RowDataPacket>(`
    SELECT * FROM metaobject_definitions WHERE type = ?
  `, [type]);
  if (rows.length > 0) {
    const def = rows[0];
    if (typeof def.field_definitions === 'string') {
      try {
        def.field_definitions = JSON.parse(def.field_definitions);
      } catch (e) {
        def.field_definitions = [];
      }
    }
    return def;
  }
  return null;
}

export async function getMetaobjectDefinitions(): Promise<MetaobjectDefinition[]> {
  const rows = await query<MetaobjectDefinition & RowDataPacket>('SELECT * FROM metaobject_definitions');
  return rows.map(def => {
    if (typeof def.field_definitions === 'string') {
      try { def.field_definitions = JSON.parse(def.field_definitions); } catch { def.field_definitions = []; }
    }
    return def;
  });
}

export async function updateMetaobjectDefinition(id: number, data: Partial<MetaobjectDefinition>) {
  const fields: string[] = [];
  const params: any[] = [];

  if (data.name) { fields.push('name = ?'); params.push(data.name); }
  if (data.field_definitions) { fields.push('field_definitions = ?'); params.push(JSON.stringify(data.field_definitions)); }

  if (fields.length === 0) return;

  params.push(id);
  await execute(`UPDATE metaobject_definitions SET ${fields.join(', ')} WHERE id = ?`, params);
}

export async function deleteMetaobjectDefinition(id: number) {
  return execute('DELETE FROM metaobject_definitions WHERE id = ?', [id]);
}

// --------------------------------------------------------------------------
// Metaobject Instances
// --------------------------------------------------------------------------

export async function createMetaobject(type: string, handle: string, displayName: string, fields: Record<string, any>) {
  // 1. Get Definition
  const def = await getMetaobjectDefinition(type);
  if (!def) throw new Error(`Metaobject definition not found for type: ${type}`);

  // 2. Create Instance
  const result = await execute(`
    INSERT INTO metaobjects (definition_id, handle, display_name)
    VALUES (?, ?, ?)
  `, [def.id, handle, displayName]);

  const metaobjectId = result.insertId;

  // 3. Set Fields as Metafields
  // Iterate through fields in the payload
  for (const [key, value] of Object.entries(fields)) {
    // Find field def
    const fieldDef = (def.field_definitions as any[]).find((f: any) => f.key === key);
    if (!fieldDef) {
      console.warn(`Field ${key} not defined in metaobject type ${type}, skipping.`);
      continue;
    }

    // Set Metafield
    // owner_type = 'metaobject', owner_id = metaobjectId
    // namespace = 'custom' (or derived from type?) 
    // Usually metaobject fields are accessed directly by key. We can use namespace='fields'.
    await setMetafield(
      'metaobject',
      metaobjectId.toString(),
      'fields',
      key,
      value,
      fieldDef.type,
      undefined,
      'system' // changedBy
    );
  }

  return metaobjectId;
}

export async function getMetaobject(handle: string): Promise<Metaobject | null> {
  // Get instance
  const rows = await query<Metaobject & RowDataPacket>(`
    SELECT m.*, d.type as type_name
    FROM metaobjects m
    JOIN metaobject_definitions d ON m.definition_id = d.id
    WHERE m.handle = ?
  `, [handle]);

  if (rows.length === 0) return null;
  const mo = rows[0];

  // Get fields
  const metafields = await getMetafields('metaobject', mo.id.toString());
  const fields: Record<string, any> = {};

  metafields.forEach(mf => {
    // We assume namespace 'fields'
    if (mf.namespace === 'fields') {
      try {
        fields[mf.key] = JSON.parse(mf.value);
      } catch {
        fields[mf.key] = mf.value;
      }
    }
  });

  return {
    ...mo,
    type: mo.type || (mo as any).type_name, // join result
    fields
  };
}



export async function getMetaobjects(type?: string): Promise<Metaobject[]> {
  const sql = type ? `
    SELECT m.*, d.type as type_name
    FROM metaobjects m
    JOIN metaobject_definitions d ON m.definition_id = d.id
    WHERE d.type = ?
  ` : `
    SELECT m.*, d.type as type_name
    FROM metaobjects m
    JOIN metaobject_definitions d ON m.definition_id = d.id
  `;

  const params = type ? [type] : [];
  const rows = await query<Metaobject & RowDataPacket>(sql, params);

  // We optimize by NOT fetching all fields for the list view, just the main properties.
  return rows.map(r => ({
    ...r,
    fields: {} // Empty fields for list view to save perf
  }));
}

export async function deleteMetaobject(id: number) {
  // Delete metafields first (though cascade might handle it if we had FK to owner, but we don't have FK for generic owner)
  // We need to manually delete metafields or rely on app logic.
  // My metafields table doesn't have FK to metaobjects table (polymorphic).
  // content: owner_type='metaobject', owner_id=id.

  // Clean up metafields
  await execute(`DELETE FROM metafields WHERE owner_type = 'metaobject' AND owner_id = ?`, [id.toString()]);

  // Delete object
  return execute(`DELETE FROM metaobjects WHERE id = ?`, [id]);
}
