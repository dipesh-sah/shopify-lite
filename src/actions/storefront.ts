"use server"

import { query } from "@/lib/db"
import { getSettings } from "@/lib/settings"
import * as db from "@/lib/products"

export async function getSaleProductsAction(limit = 4) {
  try {
    const { products } = await db.getProducts({
      status: 'active',
      limit,
      onSale: true
    })

    return products
  } catch (error) {
    console.error("Error fetching sale products:", error)
    return []
  }
}

export async function getBestSellingProductsAction(limit = 4) {
  try {
    const { products } = await db.getProducts({
      status: 'active',
      limit,
      sortBy: 'created_at',
      sortOrder: 'desc'
    })

    return products
  } catch (error) {
    console.error("Error fetching best sellers:", error)
    return []
  }
}

export async function getFeaturedCategoriesAction() {
  try {
    // Fetch categories
    const categories = await query(
      `SELECT id, name, slug, description, image FROM categories WHERE parent_id IS NULL AND hide_from_nav = 0 ORDER BY position ASC LIMIT 5`
    ) as any[]

    return categories || []
  } catch (error: any) {
    console.error("Error fetching collections:", error?.message)
    // Return empty array so page doesn't crash
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
