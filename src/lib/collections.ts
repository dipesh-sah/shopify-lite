import { query, execute } from './db';

// Collection Types
export type CollectionType = 'manual' | 'smart';

export interface CollectionCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'in';
  value: any;
}

// Collection Operations
export async function createCollection(data: {
  name: string;
  description?: string;
  slug: string;
  type: CollectionType;
  productIds?: string[]; // For manual collections
  conditions?: CollectionCondition[]; // For smart collections
  image?: string;
  seoTitle?: string;
  seoDescription?: string;
  isActive?: boolean;
}) {
  const result = await execute(
    `INSERT INTO categories (name, description, slug, type, conditions, image_url, seo_title, seo_description, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      data.name,
      data.description || null,
      data.slug,
      data.type,
      data.conditions ? JSON.stringify(data.conditions) : null,
      data.image || null,
      data.seoTitle || null,
      data.seoDescription || null,
      data.isActive !== false ? 'active' : 'archived'
    ]
  );

  const collectionId = result.insertId;

  if (data.type === 'manual' && data.productIds && data.productIds.length > 0) {
    // Insert product associations
    // Note: productIds are strings in the interface but INT in DB. Assuming they can be parsed.
    // If productIds are UUIDs or other strings, schema needs adjustment. Assuming INT IDs for MySQL.
    for (const productId of data.productIds) {
      await execute(
        `INSERT IGNORE INTO product_categories (category_id, product_id) VALUES (?, ?)`,
        [collectionId, productId]
      );
    }
  }

  return collectionId.toString();
}

export async function getCollections() {
  const rows = await query('SELECT * FROM categories WHERE parent_id IS NULL ORDER BY created_at DESC');
  return rows.map(mapCollectionFromDb);
}

export async function getSubcategories(parentId: string) {
  const rows = await query('SELECT * FROM categories WHERE parent_id = ? ORDER BY created_at DESC', [parentId]);
  return rows.map(mapCollectionFromDb);
}

export async function getAllSubcategories() {
  const rows = await query('SELECT * FROM categories WHERE parent_id IS NOT NULL ORDER BY created_at DESC');
  return rows.map(mapCollectionFromDb);
}

export async function getActiveCollections() {
  const rows = await query("SELECT * FROM categories WHERE status = 'active' ORDER BY created_at DESC");
  return rows.map(mapCollectionFromDb);
}

export async function getCollection(id: string) {
  const rows = await query('SELECT * FROM categories WHERE id = ?', [id]);
  if (rows.length === 0) return null;
  return mapCollectionFromDb(rows[0]);
}

export async function getCollectionBySlug(slug: string) {
  const rows = await query('SELECT * FROM categories WHERE slug = ?', [slug]);
  if (rows.length === 0) return null;
  return mapCollectionFromDb(rows[0]);
}

export async function updateCollection(id: string, data: Partial<{
  name: string;
  description: string;
  slug: string;
  type: CollectionType;
  productIds: string[];
  conditions: CollectionCondition[];
  image: string;
  seoTitle: string;
  seoDescription: string;
  isActive: boolean;
}>) {
  const updates: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
  if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description); }
  if (data.slug !== undefined) { updates.push('slug = ?'); values.push(data.slug); }
  if (data.type !== undefined) { updates.push('type = ?'); values.push(data.type); }
  if (data.conditions !== undefined) { updates.push('conditions = ?'); values.push(JSON.stringify(data.conditions)); }
  if (data.image !== undefined) { updates.push('image_url = ?'); values.push(data.image); }
  if (data.seoTitle !== undefined) { updates.push('seo_title = ?'); values.push(data.seoTitle); }
  if (data.seoDescription !== undefined) { updates.push('seo_description = ?'); values.push(data.seoDescription); }
  if (data.isActive !== undefined) { updates.push('status = ?'); values.push(data.isActive ? 'active' : 'archived'); }

  if (updates.length > 0) {
    updates.push('updated_at = NOW()');
    values.push(id);
    await execute(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`, values);
  }

  if (data.productIds !== undefined && data.type === 'manual') {
    // Replace all associations
    await execute('DELETE FROM product_categories WHERE category_id = ?', [id]);
    for (const productId of data.productIds) {
      await execute(
        `INSERT IGNORE INTO product_categories (category_id, product_id) VALUES (?, ?)`,
        [id, productId]
      );
    }
  }
}

export async function deleteCollection(id: string) {
  await execute('DELETE FROM categories WHERE id = ?', [id]);
}

// Add/Remove products from manual collection
export async function addProductToCollection(collectionId: string, productId: string) {
  const collection = await getCollection(collectionId);
  if (!collection) throw new Error('Collection not found');
  if (collection.type !== 'manual') throw new Error('Can only add products to manual collections');

  await execute(
    `INSERT IGNORE INTO product_categories (category_id, product_id) VALUES (?, ?)`,
    [collectionId, productId]
  );
}

export async function removeProductFromCollection(collectionId: string, productId: string) {
  await execute(
    'DELETE FROM product_categories WHERE category_id = ? AND product_id = ?',
    [collectionId, productId]
  );
}

function mapCollectionFromDb(row: any) {
  return {
    id: row.id.toString(),
    name: row.name,
    description: row.description,
    slug: row.slug,
    type: row.type,
    conditions: row.conditions ? (typeof row.conditions === 'string' ? JSON.parse(row.conditions) : row.conditions) : [],
    image: row.image_url,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    isActive: row.status === 'active',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    categoryId: row.parent_id ? row.parent_id.toString() : undefined,
    // productIds would need a separate query if needed eagerly, but usually fetched separately or joined
    // For compatibility, we might return empty array or fetch if critical.
    // Leaving empty for now to avoid N+1 queries in list views.
    productIds: []
  };
}
