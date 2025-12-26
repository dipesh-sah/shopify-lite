import { query, execute } from './db';
import { serializeDate } from './utils';
import { updateSeoMetadata, createRedirect, SeoMetadata } from './seo';

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
  hideFromNav?: boolean;
  seo?: Partial<SeoMetadata>;
}) {
  const result = await execute(
    `INSERT INTO categories (name, description, slug, type, conditions, image_url, seo_title, seo_description, status, hide_from_nav, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      data.name,
      data.description || null,
      data.slug,
      data.type,
      data.conditions ? JSON.stringify(data.conditions) : null,
      data.image || null,
      data.seoTitle || null,
      data.seoDescription || null,
      data.isActive !== false ? 'active' : 'archived',
      data.hideFromNav || false
    ]
  );

  const collectionId = result.insertId.toString();

  if (data.type === 'manual' && data.productIds && data.productIds.length > 0) {
    // Batch Insert product associations
    const insertValues: any[] = [];
    const placeholders: string[] = [];

    for (const productId of data.productIds) {
      placeholders.push('(?, ?)');
      insertValues.push(collectionId, productId);
    }

    if (placeholders.length > 0) {
      await execute(
        `INSERT IGNORE INTO product_categories (category_id, product_id) VALUES ${placeholders.join(', ')}`,
        insertValues
      );
    }

    // Batch Update main category_id
    // Note: execute doesn't support 'WHERE id IN (?)' with array param correctly in generic pool.execute unless expanded
    // We need to manually expand placeholders for IN clause
    const inPlaceholders = data.productIds.map(() => '?').join(', ');
    const updateParams = [collectionId, ...data.productIds];

    await execute(
      `UPDATE products SET category_id = ? WHERE id IN (${inPlaceholders}) AND category_id IS NULL`,
      updateParams
    );
  }

  // Handle SEO
  if (data.seo) {
    await updateSeoMetadata('category', collectionId, data.seo);
  }

  return collectionId;
}

export async function getCollections(options: { search?: string; limit?: number; offset?: number } = {}) {
  let whereClause = 'WHERE c.parent_id IS NULL';
  const params: any[] = [];

  if (options.search) {
    whereClause += ' AND c.name LIKE ?';
    params.push(`%${options.search}%`);
  }

  // Get total count first (simplified query)
  const countResult = await query(
    `SELECT COUNT(*) as total FROM categories c ${whereClause}`,
    params
  );
  const totalCount = countResult[0]?.total || 0;

  let sql = `
    SELECT c.*, COUNT(pc.product_id) as product_count 
    FROM categories c 
    LEFT JOIN product_categories pc ON c.id = pc.category_id 
    ${whereClause}
    GROUP BY c.id 
    ORDER BY c.created_at DESC
  `;

  if (options.limit) {
    sql += ' LIMIT ?';
    params.push(options.limit);
  }

  if (options.offset) {
    sql += ' OFFSET ?';
    params.push(options.offset);
  }

  const rows = await query(sql, params);

  return {
    collections: rows.map((row: any) => ({
      ...mapCollectionFromDb(row),
      productsCount: row.product_count || 0
    })),
    totalCount
  };
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
  const rows = await query("SELECT * FROM categories WHERE status = 'active' AND hide_from_nav = 0 ORDER BY created_at DESC");
  return rows.map(mapCollectionFromDb);
}

export async function getCollection(id: string) {
  const rows = await query('SELECT * FROM categories WHERE id = ?', [id]);
  if (rows.length === 0) return null;

  const collection = mapCollectionFromDb(rows[0]);

  // Fetch associated product IDs
  const productRows = await query('SELECT product_id FROM product_categories WHERE category_id = ?', [id]);
  collection.productIds = productRows.map((r: any) => r.product_id.toString());

  return collection;
}

export async function getCollectionBySlug(slug: string, locale: string = 'en-GB') {
  const rows = await query(`
    SELECT c.*, 
           COALESCE(ct.name, c.name) as name,
           COALESCE(ct.description, c.description) as description,
           COALESCE(ct.meta_title, c.seo_title) as seo_title,
           COALESCE(ct.meta_description, c.seo_description) as seo_description
    FROM categories c
    LEFT JOIN category_translations ct ON c.id = ct.category_id AND ct.locale = ?
    WHERE ct.slug = ? OR c.slug = ?
  `, [locale, slug, slug]);

  if (rows.length === 0) return null;

  const collection = mapCollectionFromDb(rows[0]);

  // Fetch associated product IDs
  const productRows = await query('SELECT product_id FROM product_categories WHERE category_id = ?', [collection.id]);
  collection.productIds = productRows.map((r: any) => r.product_id.toString());

  return collection;
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
  hideFromNav: boolean;
  seo: Partial<SeoMetadata>;
}>) {
  // Check for slug change for redirects
  let oldSlug: string | null = null;
  if (data.slug) {
    const currentRows = await query('SELECT slug FROM categories WHERE id = ?', [id]);
    if (currentRows.length > 0) {
      oldSlug = currentRows[0].slug;
    }
  }

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
  if (data.hideFromNav !== undefined) { updates.push('hide_from_nav = ?'); values.push(data.hideFromNav); }

  if (updates.length > 0) {
    updates.push('updated_at = NOW()');
    values.push(id);
    await execute(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`, values);
  }

  // Create Redirect
  if (oldSlug && data.slug && oldSlug !== data.slug) {
    await createRedirect(`/collections/${oldSlug}`, `/collections/${data.slug}`);
  }

  if (data.productIds !== undefined && data.type === 'manual') {
    // Replace all associations
    await execute('DELETE FROM product_categories WHERE category_id = ?', [id]);

    if (data.productIds.length > 0) {
      // Batch Insert
      const insertValues: any[] = [];
      const placeholders: string[] = [];

      for (const productId of data.productIds) {
        placeholders.push('(?, ?)');
        insertValues.push(id, productId);
      }

      if (placeholders.length > 0) {
        await execute(
          `INSERT IGNORE INTO product_categories (category_id, product_id) VALUES ${placeholders.join(', ')}`,
          insertValues
        );
      }

      // Batch Update
      const inPlaceholders = data.productIds.map(() => '?').join(', ');
      const updateParams = [id, ...data.productIds];

      await execute(
        `UPDATE products SET category_id = ? WHERE id IN (${inPlaceholders})`,
        updateParams
      );
    }
  }

  // Handle SEO
  if (data.seo) {
    await updateSeoMetadata('category', id, data.seo);
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
  await execute('UPDATE products SET category_id = ? WHERE id = ?', [collectionId, productId]);
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
    hideFromNav: !!row.hide_from_nav,
    createdAt: serializeDate(row.created_at),
    updatedAt: serializeDate(row.updated_at),
    categoryId: row.parent_id ? row.parent_id.toString() : undefined,
    // productIds would need a separate query if needed eagerly, but usually fetched separately or joined
    // For compatibility, we might return empty array or fetch if critical.
    // Leaving empty for now to avoid N+1 queries in list views.
    productIds: [] as string[]
  };
}
