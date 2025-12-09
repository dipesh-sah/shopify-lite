import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  deleteDoc,
  query,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

// Wishlist Operations
export async function addToWishlist(customerId: string, productId: string, variantId?: string) {
  const wishlistRef = collection(db, 'wishlists');

  // Check if already in wishlist
  const q = query(
    wishlistRef,
    where('customerId', '==', customerId),
    where('productId', '==', productId)
  );
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    return snapshot.docs[0].id; // Already exists
  }

  const docRef = await addDoc(wishlistRef, {
    customerId,
    productId,
    variantId,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function removeFromWishlist(customerId: string, productId: string) {
  const wishlistRef = collection(db, 'wishlists');
  const q = query(
    wishlistRef,
    where('customerId', '==', customerId),
    where('productId', '==', productId)
  );
  const snapshot = await getDocs(q);

  for (const docSnap of snapshot.docs) {
    await deleteDoc(doc(db, 'wishlists', docSnap.id));
  }
}

export async function getWishlist(customerId: string) {
  const wishlistRef = collection(db, 'wishlists');
  const q = query(wishlistRef, where('customerId', '==', customerId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function isInWishlist(customerId: string, productId: string): Promise<boolean> {
  const wishlistRef = collection(db, 'wishlists');
  const q = query(
    wishlistRef,
    where('customerId', '==', customerId),
    where('productId', '==', productId)
  );
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

export async function clearWishlist(customerId: string) {
  const wishlistRef = collection(db, 'wishlists');
  const q = query(wishlistRef, where('customerId', '==', customerId));
  const snapshot = await getDocs(q);

  for (const docSnap of snapshot.docs) {
    await deleteDoc(doc(db, 'wishlists', docSnap.id));
  }
}
