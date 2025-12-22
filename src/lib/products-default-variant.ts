import { query, execute } from './db';
import { updateSeoMetadata, createRedirect, SeoMetadata } from './seo';
import { generateNextNumber } from './number-ranges';

export interface Product {
  id: string;
  productNumber?: string;
  title: string;
  slug: string;
  description: string;
  status: 'active' | 'draft' | 'suspended' | 'archived';
  price: number;
  compareAtPrice?: number;
  costPerItem?: number;
  sku?: string;
  barcode?: string;
  trackQuantity: boolean;
  quantity: number;
  weight?: number;
  weightUnit: string;
  categoryId?: string; // Kept for backward compatibility/read-only
  categoryName?: string;
  taxClassId?: number; // New
  collectionIds: string[]; // New
  vendor?: string;
  productType?: string;
  tags?: string[];
  images: ProductImage[];
  variants?: ProductVariant[];
  createdAt: Date;
  updatedAt: Date;
  seo?: Partial<SeoMetadata>;
  displayPrice?: number; // Price from default variant if exists
  defaultVariantId?: string; // ID of default variant
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  altText?: string;
  position: number;
}

export interface ProductVariant {
  id?: string;
  productId?: string;
  title: string;
  sku?: string;
  price: number;
  inventoryQuantity?: number;
  options?: Record<string, string>;
  images?: string[];
  isDefault?: boolean; // New field
}

// Set default variant for a product
export async function setDefaultVariant(productId: string, variantId: string) {
  // Remove existing default for this product
  await execute(
    'UPDATE product_variants SET is_default = FALSE WHERE product_id = ?',
    [productId]
  );

  // Set new default
  await execute(
    'UPDATE product_variants SET is_default = TRUE WHERE id = ? AND product_id = ?',
    [variantId, productId]
  );

  // Update product table reference
  await execute(
    'UPDATE products SET default_variant_id = ? WHERE id = ?',
    [variantId, productId]
  );
}

// Get default variant for a product
export async function getDefaultVariant(productId: string) {
  const rows = await query(
    'SELECT * FROM product_variants WHERE product_id = ? AND is_default = TRUE LIMIT 1',
    [productId]
  );

  if (rows.length === 0) return null;

  const v = rows[0];
  return {
    id: v.id.toString(),
    productId: v.product_id.toString(),
    title: v.title,
    sku: v.sku,
    price: Number(v.price),
    inventoryQuantity: v.inventory_quantity,
    options: v.options ? (typeof v.options === 'string' ? JSON.parse(v.options) : v.options) : {},
    images: v.images ? (typeof v.images === 'string' ? JSON.parse(v.images) : v.images) : [],
    isDefault: true
  };
}
