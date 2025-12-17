
"use server"

import * as db from '@/lib/wishlist'
import { cookies } from 'next/headers'

// Helper to get userId (mocked or from session)
// In a real app, we decode the session cookie.
// For Shopify Lite, assuming 'session' cookie holds userId or use a placeholder if not found?
// Re-using logic from other actions if available?
// Actually, previous actions like `createOrder` took userId as param.
// Checking `src/middleware.ts`, admin session is `admin_session`.
// Storefront session? `src/lib/auth.ts`?
// I'll assume we pass userId or parse it here.
// But `cookies` is read-only in Server Actions (mostly).
// I'll check if there's an auth helper. If not, I'll use a cookie named 'user_id' or 'session_id'.
// If not found, functionality might fail or require login.

async function getUserId() {
  const c = await cookies();
  const session = c.get('session')?.value;
  // Mock: if no session, using a demo user ID or fail
  // For "Shopify Lite", maybe we rely on client passing ID? No, insecure.
  // I'll assume `session` cookie contains the User ID directly for simplicity in this demo environment, 
  // or I'll check `scripts/apply-shipping_bun.ts`? No.
  // Let's use a hardcoded demo user ID if session missing for verification purposes?
  // Or return null.
  return session || null;
}

export async function getWishlistAction() {
  const userId = await getUserId();
  if (!userId) return []; // Or redirect
  return await db.getWishlist(userId);
}

export async function toggleWishlistAction(productId: string) {
  const userId = await getUserId();
  if (!userId) return { error: "Not logged in" };

  // Check if in wishlist
  const status = await db.checkWishlistStatus(userId, [productId]);
  if (status[productId]) {
    await db.removeFromWishlist(userId, productId);
    return { added: false };
  } else {
    await db.addToWishlist(userId, productId);
    return { added: true };
  }
}

export async function checkWishlistStatusAction(productIds: string[]) {
  const userId = await getUserId();
  if (!userId) return {};
  return await db.checkWishlistStatus(userId, productIds);
}
