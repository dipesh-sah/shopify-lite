
import { query, execute } from './db';

export async function getWishlist(userId: string) {
  const sql = `
        SELECT w.*, p.title, p.price, 
               (SELECT url FROM product_images pi WHERE pi.product_id = w.product_id ORDER BY position ASC LIMIT 1) as image_url
        FROM wishlists w
        JOIN products p ON w.product_id = p.id
        WHERE w.user_id = ?
        ORDER BY w.created_at DESC
    `;
  const rows = await query(sql, [userId]);
  return rows.map((r: any) => ({
    id: r.id,
    productId: r.product_id,
    title: r.title,
    price: Number(r.price),
    image: r.image_url
  }));
}

export async function addToWishlist(userId: string, productId: string) {
  // Check if exists
  const [existing] = await query('SELECT id FROM wishlists WHERE user_id = ? AND product_id = ?', [userId, productId]);
  if (existing) return;

  await execute(
    'INSERT INTO wishlists (id, user_id, product_id) VALUES (UUID(), ?, ?)',
    [userId, productId]
  );
}

export async function removeFromWishlist(userId: string, productId: string) {
  await execute('DELETE FROM wishlists WHERE user_id = ? AND product_id = ?', [userId, productId]);
}

export async function checkWishlistStatus(userId: string, productIds: string[]) {
  if (productIds.length === 0) return {};
  const placeholders = productIds.map(() => '?').join(',');
  const sql = `SELECT product_id FROM wishlists WHERE user_id = ? AND product_id IN (${placeholders})`;
  const rows = await query(sql, [userId, ...productIds]);

  const result: Record<string, boolean> = {};
  productIds.forEach(id => result[id] = false);
  rows.forEach((r: any) => result[r.product_id] = true);
  return result;
}
