"use server"

import { revalidatePath } from "next/cache"
import * as db from "@/lib/settings"

export async function getSettingsAction(category: string) {
  try {
    return await db.getSettings(category)
  } catch (error) {
    console.error(`Error getting settings for ${category}:`, error)
    return null
  }
}

export async function updateSettingsAction(category: string, data: any) {
  try {
    await db.updateSettings(category, data)
    revalidatePath("/admin/settings")
    return { success: true }
  } catch (error) {
    console.error(`Error updating settings for ${category}:`, error)
    return { error: "Failed to update settings" }
  }
}

// Specific wrappers if needed, or just use generic getSettingsAction
export async function getGeneralSettingsAction() {
  return getSettingsAction('general')
}
