"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import * as db from "@/lib/products"

// Utility: convert undefined values → null
function cleanObject(obj: any) {
  Object.keys(obj).forEach((k) => {
    if (obj[k] === undefined) obj[k] = null
  })
  return obj
}

// Utility: convert numeric fields
function parseNumber(value: any) {
  if (value === undefined || value === null || value === "") return undefined
  const num = Number(value)
  return isNaN(num) ? undefined : num
}

export async function createProductAction(formData: FormData) {
  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const price = parseNumber(formData.get("price"))
  const compareAtPrice = parseNumber(formData.get("compareAtPrice"))
  const costPrice = parseNumber(formData.get("costPrice"))
  // const categoryId = formData.get("categoryId") as string // Legacy, replaced by collectionIds
  const sku = (formData.get("sku") as string) || undefined
  const barcode = (formData.get("barcode") as string) || undefined
  const stock = parseNumber(formData.get("stock")) ?? 0
  const trackQuantity = formData.get("trackQuantity") === "true"
  const vendor = (formData.get("vendor") as string) || undefined
  const productType = (formData.get("productType") as string) || undefined

  const weight = parseNumber(formData.get("weight"))
  const weightUnit = (formData.get("weightUnit") as string) || 'kg'

  const images = formData.get("images") ? JSON.parse(formData.get("images") as string) : []
  const tags = formData.get("tags") ? JSON.parse(formData.get("tags") as string) : []
  const variants = formData.get("variants") ? JSON.parse(formData.get("variants") as string) : []
  const collectionIds = formData.get("collectionIds") ? JSON.parse(formData.get("collectionIds") as string) : []

  if (!name || price === undefined) {
    return { error: "Invalid fields" }
  }

  const productData = {
    title: name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    description,
    status: 'draft' as const, // Default to draft
    price,
    compareAtPrice,
    costPerItem: costPrice,
    sku,
    barcode,
    trackQuantity,
    quantity: stock,
    weight,
    weightUnit,
    // categoryId, // Handled implicitly via collectionIds in lib logic
    collectionIds,
    vendor,
    productType,
    tags,
    images: images.map((img: any) => {
      const url = typeof img === 'string' ? img : img.url;
      const altText = typeof img === 'string' ? null : img.altText;
      return { url, altText };
    }),
    variants: variants.map((v: any) => ({
      title: v.title || `${v.sku || 'Variant'}`, // Default title if missing
      sku: v.sku,
      price: price + (v.priceDelta || 0), // Calculate absolute price
      inventoryQuantity: v.stock,
      options: v.options
    }))
  }

  await db.createProduct(productData)

  revalidatePath("/admin/products")
  redirect("/admin/products")
}

export async function getProductsAction() {
  return await db.getProducts()
}

export async function getProductAction(id: string) {
  return await db.getProduct(id)
}

export async function deleteProductAction(id: string) {
  await db.deleteProduct(id)
  revalidatePath("/admin/products")
  return { success: true }
}

export async function updateProductAction(productId: string | FormData, formData?: FormData) {
  // Support both (id, formData) and (formData) signatures if needed, 
  // but better to stick to one. The client code uses (id, formData) in some places?
  // Actually client code in [id]/page.tsx calls: await updateProductAction(product.id, formData)
  // Let's standardise on (id: string, formData: FormData)

  if (formData === undefined && productId instanceof FormData) {
    // Handling case where it might be called with just formData?
    // But my client code passes id.
    // If called as server action from form action={updateProductAction}, the first arg is formData?
    // Start simple.
    formData = productId as FormData
    productId = formData.get('productId') as string
  }

  // Cast again to be sure
  const form = formData as FormData
  const idStr = typeof productId === 'string' ? productId : form.get('productId') as string

  if (!idStr) throw new Error("Product ID missing")

  const name = form.get("name") as string
  const description = form.get("description") as string
  const price = parseNumber(form.get("price"))
  const compareAtPrice = parseNumber(form.get("compareAtPrice"))
  const costPrice = parseNumber(form.get("costPrice"))
  // const categoryId = form.get("categoryId") as string
  const sku = (form.get("sku") as string) || undefined
  const barcode = (form.get("barcode") as string) || undefined
  const stock = parseNumber(form.get("stock")) ?? 0
  const trackQuantity = form.get("trackQuantity") === "true"
  const status = form.get("status") as any
  const vendor = (form.get("vendor") as string) || undefined
  const productType = (form.get("productType") as string) || undefined

  const weight = parseNumber(form.get("weight"))
  const weightUnit = (form.get("weightUnit") as string) || 'kg'
  const tags = form.get("tags") ? JSON.parse(form.get("tags") as string) : undefined
  const images = form.get("images") ? JSON.parse(form.get("images") as string) : []
  const variants = form.get("variants") ? JSON.parse(form.get("variants") as string) : []
  const collectionIds = form.get("collectionIds") ? JSON.parse(form.get("collectionIds") as string) : []

  if (!name || price === undefined) {
    return { error: "Invalid fields" }
  }

  const updateData = {
    title: name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    description,
    status,
    price,
    compareAtPrice,
    costPerItem: costPrice,
    sku,
    barcode,
    trackQuantity,
    quantity: stock,
    weight,
    weightUnit,
    // categoryId,
    collectionIds,
    vendor,
    productType,
    tags,
    images: images.map((img: any) => {
      const url = typeof img === 'string' ? img : img.url;
      const altText = typeof img === 'string' ? null : img.altText;
      return { url, altText };
    }),
    variants: variants.map((v: any) => ({
      id: v.id && !v.id.startsWith('tmp-') ? v.id : undefined, // Keep ID if existing
      title: v.title || `${v.sku || 'Variant'}`, // Default title if missing
      sku: v.sku,
      price: price + (v.priceDelta || 0), // Calculate absolute price
      inventoryQuantity: v.stock,
      options: v.options
    }))
  }

  await db.updateProduct(idStr, updateData)

  revalidatePath("/admin/products")
  // redirect("/admin/products") // Optional
}

export async function getMediaAction() {
  return []
}
