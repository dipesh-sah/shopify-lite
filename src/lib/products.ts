import { query, execute } from './db';
import { updateSeoMetadata, createRedirect, SeoMetadata } from './seo';
import { generateNextNumber } from './number-ranges';

export interface Product {
  id: string;
  productNumber?: string;
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
  taxClassId?: number; // New
  collectionIds: string[]; // New
  vendor?: string;
  productType?: string;
  tags?: string[];
  images: ProductImage[];
  variants?: ProductVariant[];
  createdAt: Date;
  updatedAt: Date;
  seo?: Partial<SeoMetadata>;
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
  images?: string[];
}

export async function getProducts(options: {
  status?: string;
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
  ids?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  tags?: string[];
  sortBy?: 'title' | 'price' | 'quantity' | 'status' | 'created_at' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
} = {}) {
  let baseSql = `
    FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id 
    WHERE 1=1
  `;
  const params: any[] = [];

  if (options.ids && options.ids.length > 0) {
    const placeholders = options.ids.map(() => '?').join(',');
    baseSql += ` AND p.id IN (${placeholders})`;
    params.push(...options.ids);
  }

  if (options.status) {
    baseSql += ' AND p.status = ?';
    params.push(options.status);
  }

  if (options.category) {
    baseSql += ' AND (p.category_id = ? OR EXISTS (SELECT 1 FROM product_categories pc WHERE pc.product_id = p.id AND pc.category_id = ?))';
    params.push(options.category, options.category);
  }

  if (options.minPrice !== undefined) {
    baseSql += ' AND p.price >= ?';
    params.push(options.minPrice);
  }

  if (options.maxPrice !== undefined) {
    baseSql += ' AND p.price <= ?';
    params.push(options.maxPrice);
  }

  if (options.inStock) {
    baseSql += ' AND (p.track_quantity = 0 OR p.quantity > 0)';
  }

  if (options.tags && options.tags.length > 0) {
    // Tags are CSV string in DB. Naive implementation using LIKE for each tag
    // Better would be normalization or JSON.
    const tagConditions = options.tags.map(() => 'p.tags LIKE ?').join(' OR ');
    baseSql += ` AND (${tagConditions})`;
    options.tags.forEach(tag => params.push(`%${tag}%`));
  }

  if (options.search) {
    // Try Full Text Search first, fallback to LIKE if needed or combine?
    // Using BOOLEAN MODE allows partial matches if configured or +word usage
    // For simplicity and robustness on small data, use combination or just MATCH.
    // NOTE: MATCH AGAINST requires existing index. We added it in Phase 2.
    // If search term is short (<3 chars) MySQL ft search might ignore it. Fallback to LIKE in that case?
    // Let's us MATCH for relevance OR LIKE for robustness on partial substrings.
    // Actually, user wants "optimized product search". MATCH is better for relevance.

    // We will use a hybrid approach or just MATCH if simple.
    // Let's use MATCH AGAINST matching closely implementation plan.
    // Also include SKU search.

    baseSql += ` AND (
        MATCH(p.title, p.description) AGAINST(? IN BOOLEAN MODE) 
        OR p.title LIKE ? 
        OR p.sku LIKE ?
    )`;
    params.push(`${options.search}*`, `%${options.search}%`, `%${options.search}%`);
  }

  // 1. Get Total Count
  const countSql = `SELECT COUNT(DISTINCT p.id) as total ${baseSql}`;
  const [countRows] = await query(countSql, params);
  const totalCount = countRows ? countRows.total : 0;


  // 2. Add Sort, Limit, Offset for the data query
  let dataSql = `SELECT p.*, c.name as category_name ${baseSql}`;

  const allowedSortCols = ['title', 'price', 'quantity', 'status', 'created_at', 'updated_at'];
  const sortBy = options.sortBy && allowedSortCols.includes(options.sortBy) ? options.sortBy : 'created_at';
  const sortOrder = options.sortOrder && ['asc', 'desc'].includes(options.sortOrder.toLowerCase()) ? options.sortOrder.toUpperCase() : 'DESC';

  if (sortBy === 'created_at' || sortBy === 'updated_at') {
    dataSql += ` ORDER BY p.${sortBy} ${sortOrder}`;
  } else {
    dataSql += ` ORDER BY p.${sortBy} ${sortOrder}, p.created_at DESC`;
  }

  const dataParams = [...params];

  if (options.limit) {
    dataSql += ' LIMIT ?';
    dataParams.push(options.limit);
  }

  if (options.offset) {
    dataSql += ' OFFSET ?';
    dataParams.push(options.offset);
  }

  try {
    const rows = await query(dataSql, dataParams);

    if (rows.length === 0) return { products: [], totalCount };

    // Batch fetch images and collections to avoid N+1 queries
    const productIds = rows.map((r: any) => r.id);
    const placeholders = productIds.map(() => '?').join(',');

    const [allImages, allCollectionCategories] = await Promise.all([
      query(`SELECT * FROM product_images WHERE product_id IN (${placeholders}) ORDER BY product_id, position ASC`, productIds),
      query(`SELECT pc.category_id, pc.product_id, c.name 
             FROM product_categories pc 
             JOIN categories c ON pc.category_id = c.id 
             WHERE pc.product_id IN (${placeholders})`, productIds)
    ]);

    // Group by product_id for fast lookup
    const imagesByProduct: Record<string, ProductImage[]> = {};
    allImages.forEach((img: any) => {
      if (!imagesByProduct[img.product_id]) imagesByProduct[img.product_id] = [];
      imagesByProduct[img.product_id].push({
        id: img.id.toString(),
        productId: img.product_id.toString(),
        url: img.url,
        altText: img.alt_text,
        position: img.position
      });
    });

    const collectionsByProduct: Record<string, string[]> = {};
    const collectionNamesByProduct: Record<string, string[]> = {};

    allCollectionCategories.forEach((cat: any) => {
      const pid = cat.product_id.toString();
      if (!collectionsByProduct[pid]) collectionsByProduct[pid] = [];
      if (!collectionNamesByProduct[pid]) collectionNamesByProduct[pid] = [];

      collectionsByProduct[pid].push(cat.category_id.toString());
      if (cat.name) collectionNamesByProduct[pid].push(cat.name);
    });

    const products = rows.map((row: any) => {
      const pId = row.id.toString();

      // Override category_name with all collection names if available
      if (collectionNamesByProduct[pId] && collectionNamesByProduct[pId].length > 0) {
        row.category_name = collectionNamesByProduct[pId].join(', ');
      }

      return mapProductFromDb(
        row,
        imagesByProduct[pId] || [],
        collectionsByProduct[pId] || []
      );
    });

    return { products, totalCount };
  } catch (err) {
    console.error("Error in getProducts:", err);
    throw err;
  }
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
    options: v.options ? (typeof v.options === 'string' ? JSON.parse(v.options) : v.options) : {},
    images: v.images ? (typeof v.images === 'string' ? JSON.parse(v.images) : v.images) : []
  }));

  // Fetch SEO
  // For now we don't eager load SEO in getProduct unless needed, but generally good for Admin Edit
  // It's fetched via separate hook typically, but can be added here if needed.
  // We'll leave it separate or update mapProductFromDb later if we join 'seo_metadata'.

  return product;
}

export async function createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'images' | 'categoryName'> & { images?: { url: string; altText?: string }[] }) {
  const tagsString = data.tags && data.tags.length > 0 ? data.tags.join(',') : null;

  // Use first collection as legacy category_id if provided
  const mainCategoryId = data.collectionIds && data.collectionIds.length > 0 ? data.collectionIds[0] : (data.categoryId || null);

  const productNumber = await generateNextNumber('product');

  const params = [
    data.title,
    data.slug,
    data.description || null,
    data.status || 'draft',
    data.price ?? 0,
    data.compareAtPrice ?? null,
    data.costPerItem ?? null,
    data.sku || productNumber, // Default SKU to Product Number
    data.barcode || null,
    data.trackQuantity ? 1 : 0,
    data.quantity ?? 0,
    data.weight ?? null,
    data.weightUnit || 'kg',
    mainCategoryId, // Legacy column
    data.vendor || null,
    data.productType || null,
    tagsString,
    productNumber,
    data.taxClassId || null // New
  ];

  const result = await execute(
    `INSERT INTO products (
      title, slug, description, status, price, compare_at_price, cost_per_item, 
      sku, barcode, track_quantity, quantity, weight, weight_unit, 
      category_id, vendor, product_type, tags, product_number, tax_class_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    params
  );

  const productId = result.insertId.toString();

  // Insert collections
  if (data.collectionIds && data.collectionIds.length > 0) {
    for (const colId of data.collectionIds) {
      await execute(
        'INSERT IGNORE INTO product_categories (product_id, category_id) VALUES (?, ?)',
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

  // Handle SEO
  if (data.seo) {
    await updateSeoMetadata('product', productId, data.seo);
  }

  return productId;
}

export async function updateProduct(id: string, data: Partial<Product>) {
  const updates: string[] = [];
  const values: any[] = [];

  // Check for slug change for redirects
  let oldSlug: string | null = null;
  if (data.slug) {
    const currentRows = await query('SELECT slug FROM products WHERE id = ?', [id]);
    if (currentRows.length > 0) {
      oldSlug = currentRows[0].slug;
    }
  }

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
  addUpdate('tax_class_id', data.taxClassId);

  if (data.tags !== undefined) {
    addUpdate('tags', data.tags ? data.tags.join(',') : null);
  }

  if (updates.length > 0) {
    updates.push('updated_at = NOW()');
    values.push(id);
    await execute(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, values);
  }

  // Create Redirect if slug changed
  if (oldSlug && data.slug && oldSlug !== data.slug) {
    await createRedirect(`/products/${oldSlug}`, `/products/${data.slug}`);
  }

  // Handle Collections Update
  if (data.collectionIds) {
    // 1. Delete existing
    await execute('DELETE FROM product_categories WHERE product_id = ?', [id]);
    // 2. Insert new
    if (data.collectionIds.length > 0) {
      for (const colId of data.collectionIds) {
        await execute(
          'INSERT IGNORE INTO product_categories (product_id, category_id) VALUES (?, ?)',
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
          `INSERT INTO product_variants (product_id, title, sku, price, inventory_quantity, options, images, created_at, updated_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [id, title, v.sku || null, v.price ?? 0, v.inventoryQuantity ?? 0, JSON.stringify(v.options || {}), JSON.stringify(v.images || [])]
        );
      }
    }
  }

  // Handle SEO
  if (data.seo) {
    await updateSeoMetadata('product', id, data.seo);
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

  if (data.images) {
    addUpdate('images', JSON.stringify(data.images));
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
  const rows = await query('SELECT category_id FROM product_categories WHERE product_id = ?', [productId]);
  return rows.map((r: any) => r.category_id.toString());
}

function mapProductFromDb(row: any, images: ProductImage[], collectionIds: string[]): Product {
  return {
    id: row.id.toString(),
    productNumber: row.product_number,
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
    taxClassId: row.tax_class_id || undefined,
    collectionIds,
    vendor: row.vendor,
    productType: row.product_type,
    tags: row.tags ? row.tags.split(',') : [],
    images,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
