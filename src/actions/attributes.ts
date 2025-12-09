"use server"

import * as db from "@/lib/attributes"

export async function getAttributeGroupsAction() {
  try {
    return await db.getAttributeGroups()
  } catch (error) {
    console.error("Error getting attribute groups:", error)
    return []
  }
}
