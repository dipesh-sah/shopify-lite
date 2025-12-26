import { query, execute } from './db';
import { serializeDate } from './utils';
import { RowDataPacket } from 'mysql2';

export interface Review {
  id: number;
  product_id: number;
  product_title?: string; // Joined field
  product_slug?: string;  // Joined field
  title: string;
  rating: number; // 1-5
  content: string;
  author_name: string;
  email: string;
  phone?: string;
  status: 'active' | 'inactive';
  is_verified: boolean;
  created_at: string | null;
  updated_at: string | null;
}

// ----------------------------------------------------------------------
// ----------------------------------------------------------------------
// CRUD
// ----------------------------------------------------------------------

export async function createReview(data: Omit<Review, 'id' | 'created_at' | 'updated_at' | 'product_title' | 'product_slug' | 'product_ids'>) {
  const sql = `
    INSERT INTO reviews 
    (product_id, title, rating, content, author_name, email, phone, status, is_verified, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
  `;
  const result = await execute(sql, [
    data.product_id,
    data.title,
    data.rating,
    data.content,
    data.author_name,
    data.email,
    data.phone || null,
    data.status || 'inactive',
    data.is_verified ? 1 : 0
  ]);

  const reviewId = result.insertId;

  // Sync to review_products
  await execute('INSERT INTO review_products (review_id, product_id) VALUES (?, ?)', [reviewId, data.product_id]);

  return reviewId;
}

export async function updateReview(id: number, data: Partial<Review> & { product_ids?: number[] }) {
  const fields: string[] = [];
  const params: any[] = [];

  const add = (k: string, v: any) => {
    if (v !== undefined) {
      fields.push(`${k} = ?`);
      params.push(v);
    }
  };

  add('title', data.title);
  add('rating', data.rating);
  add('content', data.content);
  add('status', data.status);
  add('is_verified', data.is_verified);
  add('author_name', data.author_name);
  add('email', data.email);
  add('phone', data.phone);

  // Update primary product_id if product_ids provided, use first one
  if (data.product_ids && data.product_ids.length > 0) {
    add('product_id', data.product_ids[0]);
  } else if (data.product_id) {
    add('product_id', data.product_id);
  }

  if (fields.length > 0) {
    params.push(id);
    await execute(`UPDATE reviews SET ${fields.join(', ')} WHERE id = ?`, params);
  }

  // Handle Multi-Product Sync
  if (data.product_ids) {
    // 1. Delete existing links
    await execute('DELETE FROM review_products WHERE review_id = ?', [id]);

    // 2. Insert new links
    if (data.product_ids.length > 0) {
      const valueStrings = data.product_ids.map(() => '(?, ?)').join(', ');
      const valueParams = data.product_ids.flatMap(pid => [id, pid]);
      await execute(`INSERT INTO review_products (review_id, product_id) VALUES ${valueStrings}`, valueParams);
    }
  } else if (data.product_id) {
    // If only product_id is updated (legacy/move), ensure it's in the link table
    // Actually, let's assume if specific product_ids aren't passed, we don't touch links unless it's a legacy move:
    // For "Move" feature (assignReviewToProductAction), it passes product_id. We should respect that.

    // Check if this review ONLY has one link? Hard to guess intent.
    // Better policy: If product_id changes and no product_ids passed, we treat it as a "Move" (Replace all with new one).
    await execute('DELETE FROM review_products WHERE review_id = ?', [id]);
    await execute('INSERT INTO review_products (review_id, product_id) VALUES (?, ?)', [id, data.product_id]);
  }
}

export async function deleteReview(id: number) {
  // Cascade delete handles review_products
  await execute('DELETE FROM reviews WHERE id = ?', [id]);
}

export async function getReview(id: number): Promise<Review & { product_ids: number[] } | null> {
  const rows = await query<Review & RowDataPacket>(`
    SELECT r.*, p.title as product_title, p.slug as product_slug
    FROM reviews r
    LEFT JOIN products p ON r.product_id = p.id
    WHERE r.id = ?
  `, [id]);

  if (rows.length === 0) return null;

  const review = rows[0];

  // Fetch linked products
  const productRows = await query('SELECT product_id FROM review_products WHERE review_id = ?', [id]);
  const productIds = (productRows as any[]).map(row => row.product_id);

  return {
    ...review,
    product_ids: productIds,
    created_at: serializeDate(review.created_at),
    updated_at: serializeDate(review.updated_at)
  };
}

// ----------------------------------------------------------------------
// Listing / Search
// ----------------------------------------------------------------------

export async function getReviews(options: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  productId?: number;
  rating?: number;
} = {}) {
  const page = options.page || 1;
  const limit = options.limit || 20;
  const offset = (page - 1) * limit;

  let baseSql = `
    FROM reviews r
    LEFT JOIN products p ON r.product_id = p.id
    WHERE 1=1
  `;
  // Using LEFT JOIN for products to show reviews even if primary product is deleted/missing

  const params: any[] = [];

  if (options.status) {
    baseSql += ' AND r.status = ?';
    params.push(options.status);
  }

  if (options.productId) {
    // Check Multi-Product Link
    baseSql += ' AND r.id IN (SELECT review_id FROM review_products WHERE product_id = ?)';
    params.push(options.productId);
  }

  if (options.rating) {
    baseSql += ' AND r.rating = ?';
    params.push(options.rating);
  }

  if (options.search) {
    baseSql += ' AND (r.title LIKE ? OR r.author_name LIKE ? OR r.email LIKE ? OR p.title LIKE ?)';
    const term = `%${options.search}%`;
    params.push(term, term, term, term);
  }

  // Count
  const [countRows] = await query(`SELECT COUNT(*) as total ${baseSql}`, params);
  const total = countRows ? (countRows as any).total : 0;

  // Fetch
  const dataSql = `
    SELECT r.*, p.title as product_title, p.slug as product_slug
    ${baseSql}
    ORDER BY r.created_at DESC
    LIMIT ? OFFSET ?
  `;
  const rows = await query<Review & RowDataPacket>(dataSql, [...params, limit, offset]);

  return {
    reviews: rows.map(r => ({
      ...r,
      is_verified: Boolean(r.is_verified),
      created_at: serializeDate(r.created_at),
      updated_at: serializeDate(r.updated_at)
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

// ----------------------------------------------------------------------
// Public / Stats
// ----------------------------------------------------------------------

export async function getPublicReviews(productId: number, limit = 10, offset = 0) {
  // Use review_products join
  const rows = await query<Review & RowDataPacket>(`
    SELECT r.* 
    FROM reviews r
    JOIN review_products rp ON r.id = rp.review_id
    WHERE rp.product_id = ? AND r.status = 'active'
    ORDER BY r.created_at DESC
    LIMIT ? OFFSET ?
  `, [productId, limit, offset]);
  return rows.map(r => ({
    ...r,
    is_verified: Boolean(r.is_verified),
    created_at: serializeDate(r.created_at),
    updated_at: serializeDate(r.updated_at)
  }));
}

export async function getReviewStats(productId: number) {
  // Use review_products join
  const rows = await query(`
    SELECT 
      COUNT(*) as total_reviews,
      AVG(r.rating) as average_rating,
      SUM(CASE WHEN r.rating = 5 THEN 1 ELSE 0 END) as star_5,
      SUM(CASE WHEN r.rating = 4 THEN 1 ELSE 0 END) as star_4,
      SUM(CASE WHEN r.rating = 3 THEN 1 ELSE 0 END) as star_3,
      SUM(CASE WHEN r.rating = 2 THEN 1 ELSE 0 END) as star_2,
      SUM(CASE WHEN r.rating = 1 THEN 1 ELSE 0 END) as star_1
    FROM reviews r
    JOIN review_products rp ON r.id = rp.review_id
    WHERE rp.product_id = ? AND r.status = 'active'
  `, [productId]);

  const stats = rows[0];
  return {
    totalReviews: stats.total_reviews,
    averageRating: Number(stats.average_rating || 0).toFixed(1),
    distribution: {
      5: stats.star_5,
      4: stats.star_4,
      3: stats.star_3,
      2: stats.star_2,
      1: stats.star_1
    }
  };
}
