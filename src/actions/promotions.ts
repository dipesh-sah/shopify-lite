"use server"

import {
  getPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
  getPromotionByCode
} from "@/lib/firestore"

export async function getPromotionsAction(activeOnly: boolean = false) {
  try {
    const data = await getPromotions()
    return data
  } catch (error) {
    console.error("Error getting promotions:", error)
    return []
  }
}

export async function createPromotionAction(data: any) {
  try {
    const id = await createPromotion()
    return { success: true, id }
  } catch (error) {
    console.error("Error creating promotion:", error)
    return { error: "Failed to create promotion" }
  }
}

export async function updatePromotionAction(id: string, data: any) {
  try {
    await updatePromotion(id, data)
    return { success: true }
  } catch (error) {
    console.error("Error updating promotion:", error)
    return { error: "Failed to update promotion" }
  }
}

export async function deletePromotionAction(id: string) {
  try {
    await deletePromotion(id)
    return { success: true }
  } catch (error) {
    console.error("Error deleting promotion:", error)
    return { error: "Failed to delete promotion" }
  }
}

export async function getPromotionByCodeAction(code: string) {
  try {
    const promo = await getPromotionByCode(code)
    return promo
  } catch (error) {
    console.error("Error getting promotion:", error)
    // Stub behavior
    return null
  }
}
