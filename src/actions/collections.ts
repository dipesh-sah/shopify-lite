"use server"

import { revalidatePath } from "next/cache"
import * as db from "@/lib/collections"

export async function getCollectionsAction(options: { search?: string; limit?: number; offset?: number } = {}) {
  try {
    return await db.getCollections(options)
  } catch (error) {
    console.error("Error getting collections:", error)
    return { collections: [], totalCount: 0 }
  }
}

export async function getCollectionAction(id: string) {
  try {
    return await db.getCollection(id)
  } catch (error) {
    console.error("Error getting collection:", error)
    return null
  }
}

export async function getActiveCollectionsAction() {
  try {
    return await db.getActiveCollections()
  } catch (error) {
    console.error("Error getting active collections:", error)
    return []
  }
}

export async function getSubcategoriesAction(parentId: string) {
  try {
    return await db.getSubcategories(parentId)
  } catch (error) {
    console.error(`Error getting subcategories for ${parentId}:`, error)
    return []
  }
}

export async function createCollectionAction(data: any) {
  try {
    const id = await db.createCollection(data)
    revalidatePath("/admin/collections")
    return { success: true, id }
  } catch (error) {
    console.error("Error creating collection:", error)
    throw error
  }
}

export async function updateCollectionAction(id: string, data: any) {
  try {
    await db.updateCollection(id, data)
    revalidatePath("/admin/collections")
    return { success: true }
  } catch (error) {
    console.error("Error updating collection:", error)
    throw error
  }
}

export async function deleteCollectionAction(id: string) {
  try {
    await db.deleteCollection(id)
    revalidatePath("/admin/collections")
    return { success: true }
  } catch (error) {
    console.error("Error deleting collection:", error)
    throw error
  }
}
