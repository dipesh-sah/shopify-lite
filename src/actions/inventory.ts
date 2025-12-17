"use server"

import { updateProduct, updateVariantOnProduct } from "@/lib/products"
import { revalidatePath } from "next/cache"

export type InventoryUpdate = {
  productId: string
  variantId?: string | null
  quantity: number
}

export async function updateInventoryAction(updates: InventoryUpdate[]) {
  try {
    // Process all updates in parallel
    await Promise.all(updates.map(async (update) => {
      if (update.variantId) {
        await updateVariantOnProduct(update.productId, update.variantId, {
          inventoryQuantity: update.quantity
        })
      } else {
        // Update main product quantity
        await updateProduct(update.productId, {
          quantity: update.quantity
        })
      }
    }))

    revalidatePath('/admin/inventory')
    return { success: true }
  } catch (err) {
    console.error("Inventory update failed:", err)
    throw new Error("Failed to update inventory")
  }
}
