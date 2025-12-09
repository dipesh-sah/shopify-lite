import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

export type ReturnStatus = 'requested' | 'approved' | 'rejected' | 'received' | 'refunded';
export type ReturnReason = 'defective' | 'wrong-item' | 'not-as-described' | 'changed-mind' | 'other';

// Return/Refund Operations
export async function createReturn(data: {
  orderId: string;
  customerId: string;
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
    reason: ReturnReason;
  }>;
  totalRefundAmount?: number;
  customerNotes?: string;
  customerEmail?: string;
  method?: 'refund' | 'exchange' | 'store_credit';
  status?: string;
  reason?: string;
}) {
  const returnsRef = collection(db, 'returns');
  const docRef = await addDoc(returnsRef, {
    ...data,
    status: data.status || 'requested',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function getReturns(customerId?: string) {
  const returnsRef = collection(db, 'returns');
  let q;

  if (customerId) {
    q = query(returnsRef, where('customerId', '==', customerId));
  } else {
    q = query(returnsRef);
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export const getCustomerReturns = getReturns;

export async function getReturn(id: string) {
  const docRef = doc(db, 'returns', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
}

export async function updateReturnStatus(
  id: string,
  status: ReturnStatus,
  adminNotes?: string
) {
  const docRef = doc(db, 'returns', id);
  const updateData: any = {
    status,
    updatedAt: Timestamp.now(),
  };

  if (adminNotes) {
    updateData.adminNotes = adminNotes;
  }

  if (status === 'refunded') {
    updateData.refundedAt = Timestamp.now();
  }

  await updateDoc(docRef, updateData);
}

export async function getOrderReturns(orderId: string) {
  const returnsRef = collection(db, 'returns');
  const q = query(returnsRef, where('orderId', '==', orderId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
