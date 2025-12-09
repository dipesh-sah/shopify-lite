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

export type AbandonedCartStatus = 'abandoned' | 'recovered' | 'expired';

// Abandoned Cart Operations
export async function createAbandonedCart(data: {
  customerId?: string;
  customerEmail?: string;
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  sessionId?: string;
}) {
  const cartsRef = collection(db, 'abandonedCarts');
  const docRef = await addDoc(cartsRef, {
    ...data,
    status: 'abandoned',
    emailsSent: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function getAbandonedCarts(status?: AbandonedCartStatus) {
  const cartsRef = collection(db, 'abandonedCarts');
  let q;

  if (status) {
    q = query(cartsRef, where('status', '==', status));
  } else {
    q = query(cartsRef);
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getAbandonedCart(id: string) {
  const docRef = doc(db, 'abandonedCarts', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as any;
  }
  return null;
}

export async function updateAbandonedCartStatus(id: string, status: AbandonedCartStatus) {
  const docRef = doc(db, 'abandonedCarts', id);
  const updateData: any = {
    status,
    updatedAt: Timestamp.now(),
  };

  if (status === 'recovered') {
    updateData.recoveredAt = Timestamp.now();
  }

  await updateDoc(docRef, updateData);
}

export async function incrementEmailsSent(id: string) {
  const cart = await getAbandonedCart(id);
  if (!cart) return;

  const docRef = doc(db, 'abandonedCarts', id);
  await updateDoc(docRef, {
    emailsSent: (cart.emailsSent || 0) + 1,
    lastEmailSentAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

export async function deleteAbandonedCart(id: string) {
  const docRef = doc(db, 'abandonedCarts', id);
  await deleteDoc(docRef);
}

// Get carts that need recovery emails
export async function getCartsForRecovery(hoursAbandoned: number = 1, maxEmails: number = 3) {
  const cartsRef = collection(db, 'abandonedCarts');
  const q = query(cartsRef, where('status', '==', 'abandoned'));
  const snapshot = await getDocs(q);

  const now = new Date();
  const cutoffTime = new Date(now.getTime() - hoursAbandoned * 60 * 60 * 1000);

  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter((cart: any) => {
      const createdAt = cart.createdAt instanceof Timestamp
        ? cart.createdAt.toDate()
        : new Date(cart.createdAt);

      const emailsSent = cart.emailsSent || 0;
      const hasEmail = cart.customerEmail;

      return hasEmail && createdAt < cutoffTime && emailsSent < maxEmails;
    });
}

// Get recovery statistics
export async function getRecoveryStats() {
  const cartsRef = collection(db, 'abandonedCarts');
  const snapshot = await getDocs(cartsRef);

  const stats = {
    total: 0,
    abandoned: 0,
    recovered: 0,
    expired: 0,
    totalValue: 0,
    recoveredValue: 0,
    recoveryRate: 0,
  };

  snapshot.docs.forEach(doc => {
    const cart = doc.data();
    stats.total++;
    stats.totalValue += cart.total || 0;

    if (cart.status === 'abandoned') stats.abandoned++;
    else if (cart.status === 'recovered') {
      stats.recovered++;
      stats.recoveredValue += cart.total || 0;
    } else if (cart.status === 'expired') stats.expired++;
  });

  stats.recoveryRate = stats.total > 0 ? (stats.recovered / stats.total) * 100 : 0;

  return stats;
}
