import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

export interface BundleProduct {
  productId: string;
  variantId?: string;
  quantity: number;
}

export type BundleDiscountType = 'fixed' | 'percentage';

// Bundle Operations
export async function createBundle(data: {
  name: string;
  description?: string;
  products: BundleProduct[];
  discountType: BundleDiscountType;
  discountValue: number;
  image?: string;
  isActive?: boolean;
}) {
  const bundlesRef = collection(db, 'bundles');
  const docRef = await addDoc(bundlesRef, {
    ...data,
    isActive: data.isActive !== false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function getBundles() {
  const bundlesRef = collection(db, 'bundles');
  const snapshot = await getDocs(bundlesRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getActiveBundles() {
  const bundlesRef = collection(db, 'bundles');
  const q = query(bundlesRef, where('isActive', '==', true));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Alias for compatibility
export const getAllBundles = getBundles;

export async function getBundle(id: string) {
  const docRef = doc(db, 'bundles', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as any;
  }
  return null;
}

export async function updateBundle(id: string, data: Partial<{
  name: string;
  description: string;
  products: BundleProduct[];
  discountType: BundleDiscountType;
  discountValue: number;
  image: string;
  isActive: boolean;
}>) {
  const docRef = doc(db, 'bundles', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteBundle(id: string) {
  const docRef = doc(db, 'bundles', id);
  await deleteDoc(docRef);
}

// Calculate bundle price
export async function calculateBundlePrice(bundleId: string, productPrices: { [productId: string]: number }): Promise<number> {
  const bundle = await getBundle(bundleId);
  if (!bundle) return 0;

  let totalPrice = 0;
  for (const item of bundle.products) {
    const price = productPrices[item.productId] || 0;
    totalPrice += price * item.quantity;
  }

  if (bundle.discountType === 'percentage') {
    totalPrice = totalPrice * (1 - bundle.discountValue / 100);
  } else {
    totalPrice = totalPrice - bundle.discountValue;
  }

  return Math.max(0, totalPrice);
}
