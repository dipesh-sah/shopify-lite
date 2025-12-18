
import { query, execute } from './db';
import { v4 as uuidv4 } from 'uuid';

export interface Segment {
  id: string;
  name: string;
  query: string; // Stored as JSON rule string similar to existing rules, or a custom query string
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function getSegments() {
  const rows = await query('SELECT * FROM customer_segments ORDER BY created_at DESC');
  return rows.map(mapSegmentFromDb);
}

export async function getSegmentById(id: string) {
  const rows = await query('SELECT * FROM customer_segments WHERE id = ?', [id]);
  if (rows.length === 0) return null;
  return mapSegmentFromDb(rows[0]);
}

export async function createSegment(data: Partial<Segment>) {
  const id = uuidv4();
  await execute(
    `INSERT INTO \`customer_segments\` (\`id\`, \`name\`, \`query\`, \`description\`, \`created_at\`, \`updated_at\`)
     VALUES (?, ?, ?, ?, NOW(), NOW())`,
    [id, data.name, data.query, data.description || null]
  );
  return id;
}

export async function updateSegment(id: string, data: Partial<Segment>) {
  const updates: string[] = [];
  const values: any[] = [];

  if (data.name) {
    updates.push('\`name\` = ?');
    values.push(data.name);
  }
  if (data.query) {
    updates.push('\`query\` = ?');
    values.push(data.query);
  }
  if (data.description !== undefined) {
    updates.push('\`description\` = ?');
    values.push(data.description);
  }

  if (updates.length > 0) {
    updates.push('\`updated_at\` = NOW()');
    values.push(id);
    await execute(`UPDATE \`customer_segments\` SET ${updates.join(', ')} WHERE \`id\` = ?`, values);
  }
}

export async function deleteSegment(id: string) {
  await execute('DELETE FROM \`customer_segments\` WHERE \`id\` = ?', [id]);
}

// Core Logic: Evaluate Segment
// This roughly translates our rules into a SQL WHERE clause for customers
export async function evaluateSegment(segmentId: string): Promise<any[]> {
  const segment = await getSegmentById(segmentId);
  if (!segment) return [];

  // Parse the stored query (assuming it's a JSON object from our RuleBuilder)
  let rulePayload;
  try {
    rulePayload = JSON.parse(segment.query);
  } catch (e) {
    console.error("Failed to parse segment query", e);
    return [];
  }

  // Build SQL WHERE clause from the rule tree
  // NOTE: This is a simplified translator. For production, use a robust query builder.
  const whereClause = buildWhereClause(rulePayload);

  if (!whereClause) return [];

  const sql = `
    SELECT * FROM customers 
    WHERE ${whereClause}
  `;

  return await query(sql);
}

function buildWhereClause(node: any): string {
  if (node.type === 'container') {
    if (!node.children || node.children.length === 0) return '1=1';

    const parts = node.children.map((child: any) => buildWhereClause(child));
    const operator = node.operator || 'AND';
    return `(${parts.join(` ${operator} `)})`;
  } else {
    // Basic mapping of fields to DB columns
    const fieldMap: Record<string, string> = {
      'orders_count': 'orders_count',
      'total_spent': 'total_spent',
      'last_order_date': 'last_order_date',
      'default_address.country_code': 'country_code', // Assuming we join or have this data
      'accepts_marketing': 'accepts_marketing'
    };

    const col = fieldMap[node.field] || node.field;
    const val = typeof node.value === 'string' ? `'${node.value}'` : node.value;

    // Map operators
    const opMap: Record<string, string> = {
      'equals': '=',
      'not_equals': '!=',
      'gt': '>',
      'gte': '>=',
      'lt': '<',
      'lte': '<=',
      'contains': 'LIKE'
    };

    const sqlOp = opMap[node.operator] || '=';

    // Special handling for dates (e.g., "-30d") could go here, 
    // but for now we assume simple values or Handle in UI to send actual dates

    if (sqlOp === 'LIKE') {
      return `${col} LIKE '%${node.value}%'`;
    }

    return `${col} ${sqlOp} ${val}`;
  }
}

function mapSegmentFromDb(row: any): Segment {
  return {
    id: row.id,
    name: row.name,
    query: row.query,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
