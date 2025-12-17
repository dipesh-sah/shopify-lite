import { query, execute } from './db';

export interface Review {
  id: string;
  productId: string;
  customerName: string;
  customerEmail?: string;
  rating: number;
  title?: string;
  content?: string;
  status: 'pending' | 'approved' | 'rejected';
  verifiedPurchase?: boolean;
  createdAt: Date;
}

export async function createReview(data: Omit<Review, 'id' | 'createdAt' | 'status' | 'verifiedPurchase'>) {
  // Check for verified purchase
  let verified = false;
  if (data.customerEmail) {
    const [orders] = await query(
      `SELECT COUNT(*) as count 
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       WHERE o.customer_email = ? AND oi.product_id = ? AND o.payment_status = 'paid'`,
      [data.customerEmail, data.productId]
    ) as any[];
    verified = orders.count > 0;
  }

  const params = [
    data.productId,
    data.customerName,
    data.customerEmail || null,
    data.rating,
    data.title || null,
    data.content || null,
    'approved', // Auto-approve for now
    verified ? 1 : 0
  ];

  const result = await execute(
    `INSERT INTO reviews (product_id, customer_name, customer_email, rating, title, content, status, verified_purchase, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    params
  );

  return result.insertId.toString();
}

export async function getReviewsByProduct(productId: string) {
  const rows = await query(
    `SELECT * FROM reviews WHERE product_id = ? AND status = 'approved' ORDER BY created_at DESC`,
    [productId]
  );
  return rows.map((row: any) => ({
    id: row.id.toString(),
    productId: row.product_id.toString(),
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    rating: row.rating,
    title: row.title,
    content: row.content,
    status: row.status,
    verifiedPurchase: Boolean(row.verified_purchase),
    createdAt: row.created_at
  }));
}



export async function getProductRatingStats(productId: string) {
  const rows = await query(
    `SELECT COUNT(*) as count, AVG(rating) as average FROM reviews WHERE product_id = ? AND status = 'approved'`,
    [productId]
  );

  return {
    count: Number(rows[0].count) || 0,
    average: Number(rows[0].average) || 0
  };
}

// Admin Functions

export async function getAdminReviewsByProduct(productId: string) {
  const rows = await query(
    `SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC`,
    [productId]
  );

  return rows.map((row: any) => ({
    id: row.id.toString(),
    productId: row.product_id.toString(),
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    rating: row.rating,
    title: row.title,
    content: row.content,
    status: row.status,
    createdAt: row.created_at
  }));
}

export async function updateReviewStatus(reviewId: string, status: 'approved' | 'rejected' | 'pending') {
  await execute(
    `UPDATE reviews SET status = ? WHERE id = ?`,
    [status, reviewId]
  );
}

export async function deleteReview(reviewId: string) {
  await execute(
    `DELETE FROM reviews WHERE id = ?`,
    [reviewId]
  );
}

export async function getAllAdminReviews() {
  const rows = await query(
    `SELECT r.*, p.title as product_title, 
     (SELECT url FROM product_images WHERE product_id = p.id ORDER BY position ASC LIMIT 1) as product_image
     FROM reviews r 
     LEFT JOIN products p ON r.product_id = p.id 
     ORDER BY r.created_at DESC`
  );

  return rows.map((row: any) => ({
    id: row.id.toString(),
    productId: row.product_id.toString(),
    productName: row.product_title,
    productImage: row.product_image,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    rating: row.rating,
    title: row.title,
    content: row.content,
    status: row.status,
    createdAt: row.created_at
  }));
}
