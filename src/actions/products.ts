"use server"

import { revalidateTag, revalidatePath } from "next/cache"
import { updateMetafieldAction } from "@/actions/metadata"
import * as db from "@/lib/products"
import * as collectionDb from "@/lib/collections"

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

// const getCachedProduct = cacheable(
//   async (id: string) => db.getProduct(id),
//   ['get-product'],
//   { revalidate: 60, tags: ['products'] }
// )


export async function getProductBySlugAction(slug: string) {
  try {
    const product = await db.getProductBySlug(slug)
    return product
  } catch (error) {
    console.error("Error getting product by slug:", error)
    return null
  }
}

export async function getProductAction(id: string) {
  try {
    // return await getCachedProduct(id)
    const product = await db.getProduct(id)
    return product
  } catch (error) {
    console.error("Error getting product:", error)
    return null
  }
}

export async function getRelatedProductsAction(productId: string, limit: number = 4) {
  try {
    const products = await db.getRelatedProducts(productId, limit)
    return products
  } catch (error) {
    console.error("Error getting related products:", error)
    return []
  }
}



export async function createProductAction(formData: FormData) {
  try {
    const data = parseProductFormData(formData)
    console.log('[createProductAction] description:', data.description)
    const id = await db.createProduct(data)
    // @ts-ignore
    revalidateTag('products')
    revalidatePath('/admin/products')

    // Handle Metafields
    if (data.metafields && Array.isArray(data.metafields)) {
      for (const field of data.metafields) {
        await updateMetafieldAction(
          'product',
          id,
          field.namespace || 'custom',
          field.key,
          field.value,
          field.type
        )
      }
    }

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

    console.log('[updateProductAction] Updating product:', id)
    console.log('[updateProductAction] New description:', data.description)

    await db.updateProduct(id, data)

    // Handle Metafields
    if (data.metafields && Array.isArray(data.metafields)) {
      for (const field of data.metafields) {
        await updateMetafieldAction(
          'product',
          id,
          field.namespace || 'custom',
          field.key,
          field.value,
          field.type
        )
      }
    }

    // @ts-ignore
    revalidateTag('products')
    revalidatePath('/admin/products')
    return { success: true }
  } catch (error) {
    console.error("Error updating product:", error)
    throw error
  }
}

export async function deleteProductAction(id: string) {
  try {
    await db.deleteProduct(id)
    // @ts-ignore
    revalidateTag('products')
    revalidatePath('/admin/products')
    return { success: true }
  } catch (error) {
    console.error("Error deleting product:", error)
    throw error
  }
}

export async function bulkUpdateProductsStatusAction(ids: string[], status: 'active' | 'draft' | 'archived') {
  try {
    for (const id of ids) {
      await db.updateProduct(id, { status })
    }
    // @ts-ignore
    revalidateTag('products')
    revalidatePath('/admin/products')
    return { success: true }
  } catch (error) {
    console.error("Error bulk updating status:", error)
    throw error
  }
}

export async function getMediaAction() {
  // Stub: returning empty array as no media lib implementation exists yet
  return []
}

import { parseShopifyCsv, exportToShopifyCsv } from "@/lib/shopify-csv";

export async function exportProductsAction() {
  try {
    const { products } = await db.getProducts({ limit: 10000 });
    const csvContent = exportToShopifyCsv(products);

    return {
      csv: csvContent,
      filename: `shopify-products-export-${new Date().toISOString().split('T')[0]}.csv`
    };

  } catch (error) {
    console.error("Export Products Error:", error);
    return { error: "Failed to export products" };
  }
}

export async function importProductsAction(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    if (!file) throw new Error("No file uploaded");

    const text = await file.text();
    const importedProducts = parseShopifyCsv(text);

    console.log(`[Import] Starting import of ${importedProducts.length} products...`);

    let successCount = 0;
    const errors: string[] = [];

    // Process in batches to avoid timeout and improve performance
    const BATCH_SIZE = 50;
    for (let i = 0; i < importedProducts.length; i += BATCH_SIZE) {
      const batch = importedProducts.slice(i, i + BATCH_SIZE);
      console.log(`[Import] Processing batch ${Math.floor(i / BATCH_SIZE) + 1} (${i + 1}-${Math.min(i + BATCH_SIZE, importedProducts.length)} of ${importedProducts.length})`);

      // Process batch items sequentially to maintain data consistency
      for (const productData of batch) {
        try {
          if (!productData.title) throw new Error(`Missing Title for handle: ${productData.slug}`);

          if (!productData.slug) {
            productData.slug = productData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(7);
          }

          // Handle auto-collection creation for productType
          if (productData.productType) {
            const typeName = productData.productType.trim();
            const typeSlug = typeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

            if (typeName && typeSlug) {
              const collection = await collectionDb.getCollectionBySlug(typeSlug);

              if (!collection) {
                // Create collection if missing
                const newId = await collectionDb.createCollection({
                  name: typeName,
                  slug: typeSlug,
                  type: 'manual',
                  isActive: true
                });
                productData.collectionIds = [...(productData.collectionIds || []), newId];
              } else {
                // Add existing id to collectionIds
                if (!productData.collectionIds?.includes(collection.id)) {
                  productData.collectionIds = [...(productData.collectionIds || []), collection.id];
                }
              }
            }
          }

          // Check if product exists for upsert
          const existingProduct = await db.getProductBySlug(productData.slug);
          if (existingProduct) {
            await db.updateProduct(existingProduct.id, productData);
          } else {
            await db.createProduct(productData);
          }
          successCount++;
        } catch (e: any) {
          errors.push(`Product "${productData.title || productData.slug}": ${e.message}`);
          console.error(`[Import] Error processing product:`, e.message);
        }
      }
    }

    console.log(`[Import] Completed: ${successCount} successful, ${errors.length} errors`);

    revalidatePath('/admin/products');
    return { success: true, count: successCount, total: importedProducts.length, errors };

  } catch (error) {
    console.error("Import Products Error:", error);
    return { success: false, error: "Failed to import products" };
  }
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
  const metafieldsStr = getString('metafields');

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
    },
    metafields: metafieldsStr ? JSON.parse(metafieldsStr) : []
  }
}
