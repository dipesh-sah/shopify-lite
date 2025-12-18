"use server"

import {
  getSegments,
  createSegment,
  updateSegment,
  deleteSegment,
  getSegmentById,
  evaluateSegment
} from "@/lib/segments"
import { revalidatePath } from "next/cache"

export async function getSegmentsAction() {
  try {
    const data = await getSegments()
    return data
  } catch (error) {
    console.error("Error getting segments:", error)
    return []
  }
}

export async function getSegmentByIdAction(id: string) {
  try {
    return await getSegmentById(id)
  } catch (error) {
    console.error("Error getting segment:", error)
    return null
  }
}

export async function createSegmentAction(data: any) {
  try {
    const id = await createSegment(data)
    revalidatePath('/admin/customers')
    return { success: true, id }
  } catch (error: any) {
    console.error("Error creating segment:", error)
    return { error: error.message || "Failed to create segment" }
  }
}

export async function updateSegmentAction(id: string, data: any) {
  try {
    await updateSegment(id, data)
    revalidatePath('/admin/customers')
    return { success: true }
  } catch (error) {
    console.error("Error updating segment:", error)
    return { error: "Failed to update segment" }
  }
}

export async function deleteSegmentAction(id: string) {
  try {
    await deleteSegment(id)
    revalidatePath('/admin/customers')
    return { success: true }
  } catch (error) {
    console.error("Error deleting segment:", error)
    return { error: "Failed to delete segment" }
  }
}

export async function evaluateSegmentAction(id: string) {
  try {
    const customers = await evaluateSegment(id)
    return customers
  } catch (error) {
    console.error("Error evaluating segment:", error)
    return []
  }
}
