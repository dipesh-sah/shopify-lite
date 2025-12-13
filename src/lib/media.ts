import { query, execute } from './db';

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  altText?: string;
  position: number;
  productTitle?: string;
  createdAt: Date;
}

export async function getAllImages(limit: number = 50, offset: number = 0) {
  const sql = `
    SELECT pi.*, p.title as product_title
    FROM product_images pi
    LEFT JOIN products p ON pi.product_id = p.id
    ORDER BY pi.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const rows = await query(sql, [limit, offset]);
  return rows.map(mapImageFromDb);
}

export async function createImage(url: string, altText?: string) {
  const result = await execute(
    'INSERT INTO product_images (url, alt_text, position, created_at) VALUES (?, ?, 0, NOW())',
    [url, altText || null]
  );
  return result.insertId.toString();
}

export async function updateImage(id: string, data: { altText: string }) {
  await execute('UPDATE product_images SET alt_text = ? WHERE id = ?', [data.altText, id]);
}

export async function deleteImage(id: string) {
  await execute('DELETE FROM product_images WHERE id = ?', [id]);
}

function mapImageFromDb(row: any): ProductImage {
  return {
    id: row.id.toString(),
    productId: row.product_id ? row.product_id.toString() : '',
    url: row.url,
    altText: row.alt_text,
    position: row.position,
    productTitle: row.product_title,
    createdAt: row.created_at
  };
}
