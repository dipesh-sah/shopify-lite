import { query, execute } from './db';
import { v4 as uuidv4 } from 'uuid';

export interface CartItem {
  id?: number;
  productId: number;
  variantId?: number;
  quantity: number;
  title?: string;
  price?: number;
  image?: string;
}

export async function getCartByUserId(userId: string) {
  // Find cart
  const carts = await query(`SELECT * FROM carts WHERE user_id = ?`, [userId]);
  if (carts.length === 0) return null;

  const cart = carts[0];

  // Get items with variant-specific price and title
  const items = await query(`
    SELECT ci.*, 
           COALESCE(pv.title, p.title) as title,
           COALESCE(pv.price, p.price) as price,
           (SELECT url FROM product_images pi WHERE pi.product_id = p.id ORDER BY position ASC LIMIT 1) as image,
           p.slug
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    LEFT JOIN product_variants pv ON ci.variant_id = pv.id
    WHERE ci.cart_id = ?
  `, [cart.id]);

  return {
    ...cart,
    items: items.map((i: any) => ({
      ...i,
      productId: i.product_id,
      variantId: i.variant_id,
      product: {
        id: i.product_id.toString(),
        name: i.title,
        slug: i.slug,
        price: Number(i.price),
        images: i.image ? [i.image] : [],
        description: '',
        categoryId: ''
      }
    }))
  };
}

export async function createCart(userId: string) {
  const id = uuidv4();
  await execute(`INSERT INTO carts (id, user_id) VALUES (?, ?)`, [id, userId]);
  return id;
}

export async function addItemToCart(userId: string, item: { productId: number; variantId?: number; quantity: number }) {
  const cart = await getCartByUserId(userId);
  let cartId = cart ? cart.id : null;

  if (!cartId) {
    cartId = await createCart(userId);
  }

  // Check if item exists
  const existing = await query(
    `SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ? AND (variant_id = ? OR (variant_id IS NULL AND ? IS NULL))`,
    [cartId, item.productId, item.variantId || null, item.variantId || null]
  );

  if (existing.length > 0) {
    await execute(
      `UPDATE cart_items SET quantity = quantity + ? WHERE id = ?`,
      [item.quantity, existing[0].id]
    );
  } else {
    await execute(
      `INSERT INTO cart_items (cart_id, product_id, variant_id, quantity) VALUES (?, ?, ?, ?)`,
      [cartId, item.productId, item.variantId || null, item.quantity]
    );
  }
}

export async function removeItemFromCart(userId: string, productId: number, variantId?: number) {
  const cart = await getCartByUserId(userId);
  if (!cart) return;

  await execute(
    `DELETE FROM cart_items WHERE cart_id = ? AND product_id = ? AND (variant_id = ? OR (variant_id IS NULL AND ? IS NULL))`,
    [cart.id, productId, variantId || null, variantId || null]
  );
}

export async function updateItemQuantity(userId: string, productId: number, quantity: number, variantId?: number) {
  const cart = await getCartByUserId(userId);
  if (!cart) return;

  if (quantity <= 0) {
    await removeItemFromCart(userId, productId, variantId);
    return;
  }

  await execute(
    `UPDATE cart_items SET quantity = ? WHERE cart_id = ? AND product_id = ? AND (variant_id = ? OR (variant_id IS NULL AND ? IS NULL))`,
    [quantity, cart.id, productId, variantId || null, variantId || null]
  );
}

export async function clearCart(userId: string) {
  const cart = await getCartByUserId(userId);
  if (!cart) return;
  await execute(`DELETE FROM cart_items WHERE cart_id = ?`, [cart.id]);
}
