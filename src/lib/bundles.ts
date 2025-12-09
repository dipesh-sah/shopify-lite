// Stubs for bundles to replace Firebase
export interface BundleProduct {
  productId: string;
  variantId?: string;
  quantity: number;
}

export type BundleDiscountType = 'fixed' | 'percentage';

export async function createBundle(data: any) {
  return 'mock-bundle-id';
}

export async function getBundles() {
  return [];
}

export async function getActiveBundles() {
  return [];
}

export const getAllBundles = getBundles;

export async function getBundle(id: string) {
  return null;
}

export async function updateBundle(id: string, data: any) {
  // no-op
}

export async function deleteBundle(id: string) {
  // no-op
}

export async function calculateBundlePrice(bundleId: string, productPrices: { [productId: string]: number }): Promise<number> {
  return 0;
}
