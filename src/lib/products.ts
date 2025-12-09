import { query, execute } from './db';

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: 'active' | 'draft' | 'suspended' | 'archived';
  price: number;
  compareAtPrice?: number;
  costPerItem?: number;
  sku?: string;
  barcode?: string;
  trackQuantity: boolean;
  quantity: number;
  weight?: number;
  weightUnit: string;
  categoryId?: string; // Kept for backward compatibility/read-only
  categoryName?: string;
  collectionIds: string[]; // New
  vendor?: string;
  productType?: string;
  tags?: string[];
  images: ProductImage[];
  variants?: ProductVariant[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  altText?: string;
  position: number;
}

export interface ProductVariant {
  id?: string;
  productId?: string;
  title: string;
  sku?: string;
  price: number;
  inventoryQuantity?: number;
  options?: Record<string, string>;
}

export async function getProducts(options: {
  status?: string;
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
} = {}) {
  let sql = `
    SELECT p.*, c.name as category_name 
    FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id 
    WHERE 1=1
  `;
  const params: any[] = [];

  if (options.status) {
    sql += ' AND p.status = ?';
    params.push(options.status);
  }

  // TODO: Update filtering for multiple collections if needed. 
  // Currently filtering by legacy category_id or need JOIN product_collections
  if (options.category) {
    // For now, support filtering by main category_id OR check product_collections
    sql += ' AND (p.category_id = ? OR EXISTS (SELECT 1 FROM product_collections pc WHERE pc.product_id = p.id AND pc.collection_id = ?))';
    params.push(options.category, options.category);
  }

  if (options.search) {
    sql += ' AND (p.title LIKE ? OR p.sku LIKE ?)';
    params.push(`%${options.search}%`, `%${options.search}%`);
  }

  sql += ' ORDER BY p.created_at DESC';

  if (options.limit) {
    sql += ' LIMIT ?';
    params.push(options.limit);
  }

  if (options.offset) {
    sql += ' OFFSET ?';
    params.push(options.offset);
  }

  const rows = await query(sql, params);

  const products = await Promise.all(rows.map(async (row: any) => {
    const images = await getProductImages(row.id);
    // Note: getProducts (list) might not need full collection list for perf, 
    // but mapping expects it. We can lazy load or fetch.
    // For now, fetch collections for correctness.
    const collectionIds = await getProductCollectionIds(row.id);
    return mapProductFromDb(row, images, collectionIds);
  }));

  return products;
}

export async function getProduct(id: string) {
  const rows = await query(`
    SELECT p.*, c.name as category_name 
    FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id 
    WHERE p.id = ?
  `, [id]);
  if (rows.length === 0) return null;

  const images = await getProductImages(id);
  const collectionIds = await getProductCollectionIds(id);
  const product = mapProductFromDb(rows[0], images, collectionIds);

  // also fetch variants
  const variantRows = await query('SELECT * FROM product_variants WHERE product_id = ?', [id]);
  product.variants = variantRows.map((v: any) => ({
    id: v.id.toString(),
    productId: v.product_id.toString(),
    title: v.title,
    sku: v.sku,
    price: Number(v.price),
    inventoryQuantity: v.inventory_quantity,
    options: v.options ? (typeof v.options === 'string' ? JSON.parse(v.options) : v.options) : {}
  }));

  return product;
}

export async function createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'images' | 'categoryName'> & { images?: { url: string; altText?: string }[] }) {
  const tagsString = data.tags && data.tags.length > 0 ? data.tags.join(',') : null;

  // Use first collection as legacy category_id if provided
  const mainCategoryId = data.collectionIds && data.collectionIds.length > 0 ? data.collectionIds[0] : (data.categoryId || null);

  const params = [
    data.title,
    data.slug,
    data.description || null,
    data.status || 'draft',
    data.price ?? 0,
    data.compareAtPrice ?? null,
    data.costPerItem ?? null,
    data.sku || null,
    data.barcode || null,
    data.trackQuantity ? 1 : 0,
    data.quantity ?? 0,
    data.weight ?? null,
    data.weightUnit || 'kg',
    mainCategoryId, // Legacy column
    data.vendor || null,
    data.productType || null,
    tagsString
  ];

  const result = await execute(
    `INSERT INTO products (
      title, slug, description, status, price, compare_at_price, cost_per_item, 
      sku, barcode, track_quantity, quantity, weight, weight_unit, 
      category_id, vendor, product_type, tags, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    params
  );

  const productId = result.insertId;

  // Insert collections
  if (data.collectionIds && data.collectionIds.length > 0) {
    for (const colId of data.collectionIds) {
      await execute(
        'INSERT IGNORE INTO product_collections (product_id, collection_id) VALUES (?, ?)',
        [productId, colId]
      );
    }
  }

  if (data.images && data.images.length > 0) {
    for (let i = 0; i < data.images.length; i++) {
      const img = data.images[i];
      const imgParams = [productId, img.url, img.altText || null, i];
      await execute(
        'INSERT INTO product_images (product_id, url, alt_text, position) VALUES (?, ?, ?, ?)',
        imgParams
      );
    }
  }

  // Handle variants
  if (data.variants && data.variants.length > 0) {
    for (const v of data.variants) {
      const title = v.title || `${v.sku || 'Variant'}`;
      const variantParams = [
        productId,
        title,
        v.sku || null,
        v.price ?? 0,
        v.inventoryQuantity ?? 0,
        JSON.stringify(v.options || {})
      ];
      await execute(
        `INSERT INTO product_variants (product_id, title, sku, price, inventory_quantity, options, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        variantParams
      );
    }
  }

  return productId.toString();
}

export async function updateProduct(id: string, data: Partial<Product>) {
  const updates: string[] = [];
  const values: any[] = [];

  // Helper to add field update
  const addUpdate = (field: string, value: any) => {
    if (value !== undefined) {
      updates.push(`${field} = ?`);
      values.push(value);
    }
  };

  addUpdate('title', data.title);
  addUpdate('slug', data.slug);
  addUpdate('description', data.description);
  addUpdate('status', data.status);
  addUpdate('price', data.price);
  addUpdate('compare_at_price', data.compareAtPrice);
  addUpdate('cost_per_item', data.costPerItem);
  addUpdate('sku', data.sku);
  addUpdate('barcode', data.barcode);
  addUpdate('track_quantity', data.trackQuantity);
  addUpdate('quantity', data.quantity);
  addUpdate('weight', data.weight);
  addUpdate('weight_unit', data.weightUnit);

  // If collectionIds provided, update category_id as well (take first one)
  if (data.collectionIds && data.collectionIds.length > 0) {
    addUpdate('category_id', data.collectionIds[0]);
  } else if (data.categoryId !== undefined) {
    addUpdate('category_id', data.categoryId);
  }

  addUpdate('vendor', data.vendor);
  addUpdate('product_type', data.productType);

  if (data.tags !== undefined) {
    addUpdate('tags', data.tags ? data.tags.join(',') : null);
  }

  if (updates.length > 0) {
    updates.push('updated_at = NOW()');
    values.push(id);
    await execute(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, values);
  }

  // Handle Collections Update
  if (data.collectionIds) {
    // 1. Delete existing
    await execute('DELETE FROM product_collections WHERE product_id = ?', [id]);
    // 2. Insert new
    if (data.collectionIds.length > 0) {
      for (const colId of data.collectionIds) {
        await execute(
          'INSERT IGNORE INTO product_collections (product_id, collection_id) VALUES (?, ?)',
          [id, colId]
        );
      }
    }
  }

  // Handle images update (Delete all and re-insert)
  if (data.images) {
    await execute('DELETE FROM product_images WHERE product_id = ?', [id]);
    if (data.images.length > 0) {
      for (let i = 0; i < data.images.length; i++) {
        const img = data.images[i];
        await execute(
          'INSERT INTO product_images (product_id, url, alt_text, position) VALUES (?, ?, ?, ?)',
          [id, img.url, img.altText || null, i]
        );
      }
    }
  }

  // Handle variants update (Delete all and re-insert)
  if (data.variants) {
    await execute('DELETE FROM product_variants WHERE product_id = ?', [id]);
    if (data.variants.length > 0) {
      for (const v of data.variants) {
        const title = v.title || `${v.sku || 'Variant'}`;
        await execute(
          `INSERT INTO product_variants (product_id, title, sku, price, inventory_quantity, options, created_at, updated_at) 
                 VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [id, title, v.sku || null, v.price ?? 0, v.inventoryQuantity ?? 0, JSON.stringify(v.options || {})]
        );
      }
    }
  }
}

export async function updateVariantOnProduct(productId: string, variantId: string, data: Partial<ProductVariant>) {
  const updates: string[] = [];
  const values: any[] = [];

  const addUpdate = (field: string, value: any) => {
    if (value !== undefined) {
      updates.push(`${field} = ?`);
      values.push(value);
    }
  };

  addUpdate('sku', data.sku);
  addUpdate('price', data.price);
  addUpdate('inventory_quantity', data.inventoryQuantity);

  if (data.options) {
    addUpdate('options', JSON.stringify(data.options));
  }

  if (updates.length > 0) {
    updates.push('updated_at = NOW()');
    values.push(productId);
    values.push(variantId);
    await execute(`UPDATE product_variants SET ${updates.join(', ')} WHERE product_id = ? AND id = ?`, values);
  }
}

export async function deleteProduct(id: string) {
  await execute('DELETE FROM products WHERE id = ?', [id]);
}

async function getProductImages(productId: string | number) {
  const rows = await query('SELECT * FROM product_images WHERE product_id = ? ORDER BY position ASC', [productId]);
  return rows.map((row: any) => ({
    id: row.id.toString(),
    productId: row.product_id.toString(),
    url: row.url,
    altText: row.alt_text,
    position: row.position
  }));
}

async function getProductCollectionIds(productId: string | number): Promise<string[]> {
  const rows = await query('SELECT collection_id FROM product_collections WHERE product_id = ?', [productId]);
  return rows.map((r: any) => r.collection_id.toString());
}

function mapProductFromDb(row: any, images: ProductImage[], collectionIds: string[]): Product {
  return {
    id: row.id.toString(),
    title: row.title,
    slug: row.slug,
    description: row.description,
    status: row.status,
    price: Number(row.price),
    compareAtPrice: row.compare_at_price ? Number(row.compare_at_price) : undefined,
    costPerItem: row.cost_per_item ? Number(row.cost_per_item) : undefined,
    sku: row.sku,
    barcode: row.barcode,
    trackQuantity: Boolean(row.track_quantity),
    quantity: row.quantity,
    weight: row.weight ? Number(row.weight) : undefined,
    weightUnit: row.weight_unit,
    categoryId: row.category_id ? row.category_id.toString() : undefined,
    categoryName: row.category_name || undefined,
    collectionIds,
    vendor: row.vendor,
    productType: row.product_type,
    tags: row.tags ? row.tags.split(',') : [],
    images,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}


