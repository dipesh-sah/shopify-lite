"use server"

import {
  createReview,
  getPublicReviews,
  getReviewStats,
  getReviews,
  updateReview,
  deleteReview,
  getReview
} from "@/lib/reviews"
import { revalidatePath } from "next/cache"


export async function createReviewAction(formData: FormData) {
  try {
    const productId = Number(formData.get('productId'))

    const customerName = formData.get('name') as string
    const email = formData.get('email') as string
    const rating = parseInt(formData.get('rating') as string)
    const title = formData.get('title') as string
    const content = formData.get('content') as string

    console.log('[CreateReview] Payload:', { productId, customerName, email, rating, title, content })

    if (!productId || isNaN(productId)) {
      return { success: false, error: 'Invalid Product ID' }
    }
    if (!customerName) return { success: false, error: 'Name is required' }
    if (!rating || isNaN(rating)) return { success: false, error: 'Rating is required' }

    await createReview({
      product_id: productId,
      author_name: customerName,
      email: email,
      rating,
      title,
      content,
      status: 'inactive',
      is_verified: false
    })

    revalidatePath(`/products/${productId}`)
    return { success: true }
  } catch (error: any) {
    console.error('[CreateReview] Error:', error)
    return { success: false, error: error.message || 'Server error' }
  }
}

export async function getReviewsAction(productId: string) {
  return await getPublicReviews(Number(productId))
}

export async function getReviewStatsAction(productId: string) {
  return await getReviewStats(Number(productId))
}

// Admin Actions
export async function getAdminReviewsAction(productId: string) {
  const result = await getReviews({ productId: Number(productId), limit: 100 })
  return result.reviews
}

export async function updateReviewStatusAction(reviewId: string, status: string) {
  // Map legacy/UI status to DB status
  const dbStatus = status === 'approved' || status === 'active' ? 'active' : 'inactive';

  await updateReview(Number(reviewId), { status: dbStatus })
  revalidatePath('/admin/products')
  revalidatePath('/admin/reviews')
  return { success: true }
}

export async function deleteReviewAction(reviewId: string) {
  await deleteReview(Number(reviewId))
  revalidatePath('/admin/products')
  revalidatePath('/admin/reviews')
  return { success: true }
}

export async function assignReviewToProductAction(reviewId: number, productId: number) {
  await updateReview(reviewId, { product_id: productId })
  revalidatePath('/admin/products')
  revalidatePath('/admin/reviews')
  return { success: true }
}

export async function getAllAdminReviewsAction() {
  const result = await getReviews({ limit: 100 })
  return result.reviews
}

export async function refreshProductReviewsAction(productId: string) {
  const [reviews, stats] = await Promise.all([
    getPublicReviews(Number(productId)),
    getReviewStats(Number(productId))
  ])

  return { reviews, stats }
}

export async function getReviewAction(reviewId: number) {
  return await getReview(reviewId)
}

export async function updateReviewDetailsAction(reviewId: number, data: {
  title: string
  rating: number
  content: string
  status: 'active' | 'inactive'
  author_name: string
  email: string
  phone: string
  product_id?: number
  product_ids?: number[]
}) {
  try {
    // Validate basic fields
    if (!data.title || !data.content || !data.author_name) {
      throw new Error('Missing required fields')
    }

    await updateReview(reviewId, {
      title: data.title,
      rating: data.rating,
      content: data.content,
      status: data.status,
      author_name: data.author_name,
      email: data.email,
      phone: data.phone,
      product_id: data.product_id,
      product_ids: data.product_ids
    })

    revalidatePath('/admin/reviews')
    revalidatePath(`/admin/reviews/${reviewId}`)

    // Revalidate all affected products
    if (data.product_ids) {
      for (const pid of data.product_ids) {
        revalidatePath(`/products/${pid}`)
      }
    } else if (data.product_id) {
      revalidatePath(`/products/${data.product_id}`)
    }

    return { success: true }
  } catch (error: any) {
    console.error('Failed to update review details:', error)
    return { success: false, error: error.message }
  }
}
