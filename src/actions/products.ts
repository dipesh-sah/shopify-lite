"use server"

import * as db from "@/lib/products"

export async function getProductsAction(options: {
  search?: string;
  page?: number;
  limit?: number;
  ids?: string[];
  category?: string;
  sortBy?: 'title' | 'price' | 'quantity' | 'status' | 'created_at' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  tags?: string[];
} = {}) {
  try {
    const page = options.page || 1;
    const limit = options.limit || 15;
    const offset = (page - 1) * limit;

    const { products, totalCount } = await db.getProducts({
      ...options,
      limit,
      offset
    })

    return {
      products,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page
    }
  } catch (error) {
    console.error("Error fetching products:", error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) console.error(error.stack);
    return { products: [], totalCount: 0, totalPages: 0, currentPage: 1 }
  }
}

import { cacheable } from "@/lib/cache"

const getCachedProduct = cacheable(
  async (id: string) => db.getProduct(id),
  ['get-product'],
  { revalidate: 60, tags: ['products'] }
)

export async function getProductAction(id: string) {
  try {
    return await getCachedProduct(id)
  } catch (error) {
    console.error("Error getting product:", error)
    return null
  }
}

export async function createProductAction(formData: FormData) {
  try {
    const data = parseProductFormData(formData)
    const id = await db.createProduct(data)
    return { success: true, id }
  } catch (error) {
    console.error("Error creating product:", error)
    throw error
  }
}

export async function updateProductAction(idOrFormData: string | FormData, formData?: FormData) {
  try {
    let id: string
    let data: any

    if (typeof idOrFormData === 'string') {
      id = idOrFormData
      data = parseProductFormData(formData!)
    } else {
      id = idOrFormData.get('productId') as string
      data = parseProductFormData(idOrFormData)
    }

    if (!id) throw new Error("Product ID is required")

    await db.updateProduct(id, data)
    return { success: true }
  } catch (error) {
    console.error("Error updating product:", error)
    throw error
  }
}

export async function deleteProductAction(id: string) {
  try {
    await db.deleteProduct(id)
    return { success: true }
  } catch (error) {
    console.error("Error deleting product:", error)
    throw error
  }
}

export async function getMediaAction() {
  // Stub: returning empty array as no media lib implementation exists yet
  return []
}

function parseProductFormData(formData: FormData) {
  // Helpers to safely get strings
  const getString = (key: string) => (formData.get(key) as string) || '';
  const getNumber = (key: string) => {
    const val = formData.get(key);
    return val ? parseFloat(val as string) : undefined;
  };
  const getInt = (key: string) => {
    const val = formData.get(key);
    return val ? parseInt(val as string) : 0;
  };

  const imagesStr = getString('images');
  const variantsStr = getString('variants');
  const tagsStr = getString('tags');
  const collectionsStr = getString('collectionIds');

  return {
    title: getString('name') || getString('title'),
    slug: getString('slug') || getString('name').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''), // Auto-generate slug if missing
    description: getString('description'),
    status: (getString('status') || 'draft') as any,
    price: getNumber('price') || 0,
    compareAtPrice: getNumber('compareAtPrice'),
    costPerItem: getNumber('costPrice') || getNumber('costPerItem'),
    sku: getString('sku'),
    barcode: getString('barcode'),
    trackQuantity: formData.get('trackQuantity') !== 'false', // Default true unless 'false'
    quantity: getInt('stock') || getInt('quantity'),
    weight: getNumber('weight'),
    weightUnit: getString('weightUnit') || 'kg',
    categoryId: getString('categoryId'), // Legacy
    vendor: getString('vendor'),
    productType: getString('productType'),
    taxClassId: getInt('taxClassId'),
    images: imagesStr ? JSON.parse(imagesStr).map((img: any) => typeof img === 'string' ? { url: img } : img) : [],
    variants: variantsStr ? JSON.parse(variantsStr).map((v: any) => ({
      ...v,
      inventoryQuantity: v.stock !== undefined ? v.stock : (v.inventoryQuantity ?? 0)
    })) : [],
    tags: tagsStr ? JSON.parse(tagsStr) : [],
    collectionIds: collectionsStr ? JSON.parse(collectionsStr) : [],
    seo: {
      title: getString('seoTitle'),
      description: getString('seoDescription'),
      // Add other fields as needed
    }
  }
}
