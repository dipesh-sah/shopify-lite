"use server"

import * as db from "@/lib/reviews"
import { revalidatePath } from "next/cache"

export async function createReviewAction(formData: FormData) {
  const productId = formData.get('productId') as string
  const customerName = formData.get('name') as string
  const email = formData.get('email') as string
  const rating = parseInt(formData.get('rating') as string)
  const title = formData.get('title') as string
  const content = formData.get('content') as string

  if (!productId || !customerName || !rating) {
    throw new Error('Missing required fields')
  }

  await db.createReview({
    productId,
    customerName,
    customerEmail: email,
    rating,
    title,
    content
  })

  revalidatePath(`/products/${productId}`)
  return { success: true }
}

export async function getReviewsAction(productId: string) {
  return await db.getReviewsByProduct(productId)
}

export async function getReviewStatsAction(productId: string) {
  return await db.getProductRatingStats(productId)
}

// Admin Actions
export async function getAdminReviewsAction(productId: string) {
  return await db.getAdminReviewsByProduct(productId)
}

export async function updateReviewStatusAction(reviewId: string, status: 'approved' | 'rejected' | 'pending') {
  await db.updateReviewStatus(reviewId, status)
  revalidatePath('/admin/products')
  revalidatePath('/admin/reviews')
  return { success: true }
}

export async function deleteReviewAction(reviewId: string) {
  await db.deleteReview(reviewId)
  revalidatePath('/admin/products')
  revalidatePath('/admin/reviews')
  return { success: true }
}

export async function getAllAdminReviewsAction() {
  return await db.getAllAdminReviews()
}

export async function refreshProductReviewsAction(productId: string) {
  const [reviews, stats] = await Promise.all([
    db.getReviewsByProduct(productId),
    db.getProductRatingStats(productId)
  ])
  return { reviews, stats }
}
