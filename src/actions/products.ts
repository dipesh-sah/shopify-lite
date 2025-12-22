"use server"

import { revalidateTag, revalidatePath } from "next/cache"
import { updateMetafieldAction } from "@/actions/metadata"
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

export async function getMediaAction() {
  // Stub: returning empty array as no media lib implementation exists yet
  return []
}

export async function exportProductsAction() {
  try {
    const { products } = await db.getProducts({ limit: 10000 }); // Fetch all (or many)

    const header = [
      'ID',
      'Title',
      'Description',
      'Status',
      'Price',
      'Compare At Price',
      'Cost Per Item',
      'SKU',
      'Barcode',
      'Quantity',
      'Weight',
      'Weight Unit',
      'Vendor',
      'Product Type',
      'Tags'
    ];

    const csvRows = products.map((p: any) => {
      const escape = (text: string | null | undefined) => {
        if (!text) return '';
        const str = String(text);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      return [
        p.id,
        escape(p.title),
        escape(p.description),
        p.status,
        p.price,
        p.compareAtPrice || '',
        p.costPerItem || '',
        escape(p.sku),
        escape(p.barcode),
        p.quantity,
        p.weight || '',
        p.weightUnit || '',
        escape(p.vendor),
        escape(p.productType),
        escape(p.tags?.join(', '))
      ].join(',');
    });

    const csvContent = [header.join(','), ...csvRows].join('\n');
    return { csv: csvContent, filename: `products-export-${new Date().toISOString().split('T')[0]}.csv` };

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
    const [headerLine, ...lines] = text.split('\n');

    if (!headerLine) throw new Error("Empty CSV file");

    // Simple CSV parser
    let successCount = 0;
    let errors: string[] = [];

    const headers = headerLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));

    // Helper to split CSV line respecting quotes
    const splitCsv = (line: string) => {
      const matches = [];
      let currentMatch = '';
      let inQuote = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuote && line[i + 1] === '"') {
            currentMatch += '"';
            i++;
          } else {
            inQuote = !inQuote;
          }
        } else if (char === ',' && !inQuote) {
          matches.push(currentMatch);
          currentMatch = '';
        } else {
          currentMatch += char;
        }
      }
      matches.push(currentMatch);
      return matches;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const values = splitCsv(line);
        const row: any = {};

        headers.forEach((header, index) => {
          let val = values[index]?.trim() || '';
          if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1).replace(/""/g, '"');
          row[header] = val;
        });

        // Map CSV columns to Product Data
        const productData: any = {
          title: row['Title'],
          description: row['Description'],
          status: row['Status'] || 'draft',
          price: parseFloat(row['Price']) || 0,
          compareAtPrice: row['Compare At Price'] ? parseFloat(row['Compare At Price']) : undefined,
          costPerItem: row['Cost Per Item'] ? parseFloat(row['Cost Per Item']) : undefined,
          sku: row['SKU'],
          barcode: row['Barcode'],
          quantity: parseInt(row['Quantity']) || 0,
          weight: row['Weight'] ? parseFloat(row['Weight']) : 0,
          weightUnit: row['Weight Unit'] || 'kg',
          vendor: row['Vendor'],
          productType: row['Product Type'],
          tags: row['Tags'] ? row['Tags'].split(',').map((t: string) => t.trim()) : []
        };

        if (!productData.title) throw new Error("Title is required");

        // Generate slug
        productData.slug = productData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(7);

        await db.createProduct(productData);
        successCount++;

      } catch (e: any) {
        errors.push(`Row ${i + 1}: ${e.message}`);
      }
    }

    revalidatePath('/admin/products');
    return { success: true, count: successCount, errors };

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
