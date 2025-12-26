'use server'

import { getSessionAction } from "@/actions/customer-auth";
import {
  getCartByUserId,
  addItemToCart,
  removeItemFromCart,
  updateItemQuantity,
  clearCart
} from "@/lib/cart";

export async function fetchCartAction() {
  const user = await getSessionAction();
  if (!user) return null;

  try {
    return await getCartByUserId(user.id);
  } catch (error) {
    console.error("Fetch Cart Error:", error);
    return null;
  }
}

export async function addToCartAction(product: any, quantity: number, variantId?: string) {
  const user = await getSessionAction();
  if (!user) return { error: "Please log in to save your cart across devices." };

  try {
    // Ensure productId is number if DB expects int
    const productIdInt = typeof product.id === 'string' ? parseInt(product.id) : product.id;
    const variantIdInt = variantId ? parseInt(variantId) : undefined;

    await addItemToCart(user.id, {
      productId: productIdInt,
      variantId: variantIdInt,
      quantity
    });
    return { success: true };
  } catch (error) {
    console.error("Add to Cart Error:", error);
    return { error: "Failed to update cart" };
  }
}

export async function removeFromCartAction(productId: string | number, variantId?: string) {
  const user = await getSessionAction();
  if (!user) return { error: "Unauthorized" };

  try {
    const pid = typeof productId === 'string' ? parseInt(productId) : productId;
    const vid = variantId ? parseInt(variantId) : undefined;

    await removeItemFromCart(user.id, pid, vid);
    return { success: true };
  } catch (error) {
    console.error("Remove Item Error:", error);
    return { error: "Failed to remove item" };
  }
}

export async function updateCartQuantityAction(productId: string | number, quantity: number, variantId?: string) {
  const user = await getSessionAction();
  if (!user) return { error: "Unauthorized" };

  try {
    const pid = typeof productId === 'string' ? parseInt(productId) : productId;
    const vid = variantId ? parseInt(variantId) : undefined;

    await updateItemQuantity(user.id, pid, quantity, vid);
    return { success: true };
  } catch (error) {
    console.error("Update Quantity Error:", error);
    return { error: "Failed to update quantity" };
  }
}

export async function syncCartAction(localItems: any[]) {
  const user = await getSessionAction();
  if (!user) return null;

  try {
    // For logged-in users, server cart is the source of truth
    // All cart operations (add/remove/update) already update the server immediately
    // So sync should just fetch the latest server state, not re-add local items
    return await getCartByUserId(user.id);
  } catch (error) {
    console.error("Sync Cart Error:", error);
    return null;
  }
}

export async function clearCartAction() {
  const user = await getSessionAction();
  if (!user) return { error: "Unauthorized" };

  try {
    await clearCart(user.id);
    return { success: true };
  } catch (error) {
    console.error("Clear Cart Error:", error);
    return { error: "Failed to clear cart" };
  }
}
