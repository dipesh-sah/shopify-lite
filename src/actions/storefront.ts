"use server"

import { query } from "@/lib/db"
import { getSettings } from "@/lib/settings"

export async function getSaleProductsAction(limit = 4) {
  try {
    const products = await query(
      `SELECT * FROM products 
       WHERE compare_at_price > price 
       AND status = 'active'
       LIMIT ?`,
      [limit]
    ) as any[]

    // Parse JSON fields
    return products.map(p => ({
      ...p,
      images: typeof p.images === 'string' ? JSON.parse(p.images) : p.images,
      variants: typeof p.variants === 'string' ? JSON.parse(p.variants) : p.variants
    }))
  } catch (error) {
    console.error("Error fetching sale products:", error)
    return []
  }
}

export async function getBestSellingProductsAction(limit = 4) {
  try {
    // Basic implementation: fetch active products. 
    // In a real app, you'd join with order_items to count sales or use a 'total_sold' column.
    // For now, let's assume popular products are Active ones.
    const products = await query(
      `SELECT * FROM products 
       WHERE status = 'active' 
       ORDER BY created_at DESC 
       LIMIT ?`,
      [limit]
    ) as any[]

    return products.map(p => ({
      ...p,
      images: typeof p.images === 'string' ? JSON.parse(p.images) : p.images,
      variants: typeof p.variants === 'string' ? JSON.parse(p.variants) : p.variants
    }))
  } catch (error) {
    console.error("Error fetching best sellers:", error)
    return []
  }
}

export async function getFeaturedCategoriesAction() {
  try {
    // For now, just fetch all root categories
    const categories = await query(
      `SELECT * FROM categories WHERE parent_id IS NULL LIMIT 5`
    ) as any[]
    return categories
  } catch (error) {
    console.error("Error fetching categories:", error)
    return []
  }
}

export async function getHomepageContentAction() {
  try {
    const heroSettings = await getSettings('hero')
    const faqSettings = await getSettings('faq')

    return {
      hero: heroSettings,
      faqs: faqSettings?.items || []
    }
  } catch (error) {
    console.error("Error fetching homepage content:", error)
    return { hero: {}, faqs: [] }
  }
}
