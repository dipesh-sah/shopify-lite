"use server"

import * as db from "@/lib/wishlists"

export async function getWishlistAction(customerId: string) {
  try {
    return await db.getWishlist(customerId)
  } catch (error) {
    console.error("Error getting wishlist:", error)
    return []
  }
}

export async function addToWishlistAction(customerId: string, productId: string, variantId?: string) {
  try {
    const id = await db.addToWishlist(customerId, productId, variantId)
    return { success: true, id }
  } catch (error) {
    console.error("Error adding to wishlist:", error)
    throw error // or return { error: ... }
  }
}

export async function removeFromWishlistAction(customerId: string, productId: string) {
  try {
    await db.removeFromWishlist(customerId, productId)
    return { success: true }
  } catch (error) {
    console.error("Error removing from wishlist:", error)
    throw error
  }
}

export async function isInWishlistAction(customerId: string, productId: string) {
  try {
    return await db.isInWishlist(customerId, productId)
  } catch (error) {
    return false
  }
}
