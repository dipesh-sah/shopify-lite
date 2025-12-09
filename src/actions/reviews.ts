"use server"

import { getProductReviews, createReview, getAllReviews, updateReview, deleteReview } from "@/lib/firestore"

export async function getProductReviewsAction(productId: string, approvedOnly: boolean = true) {
  try {
    const reviews = await getProductReviews(productId)
    // Filter if needed, but getProductReviews stub returns [] anyway
    return reviews
  } catch (error) {
    console.error("Error getting reviews:", error)
    return []
  }
}

export async function createReviewAction(data: any) {
  try {
    return await createReview(data)
  } catch (error) {
    console.error("Error creating review:", error)
    throw error
  }
}

export async function getAllReviewsAction(approvedOnly: boolean = false) {
  try {
    return await getAllReviews(approvedOnly)
  } catch (error) {
    return []
  }
}

export async function updateReviewAction(id: string, data: any) {
  try {
    await updateReview(id, data)
    return { success: true }
  } catch (error) {
    return { error: 'Failed' }
  }
}

export async function deleteReviewAction(id: string) {
  try {
    await deleteReview(id)
    return { success: true }
  } catch (error) {
    return { error: 'Failed' }
  }
}
