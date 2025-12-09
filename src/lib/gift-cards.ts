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

export type GiftCardStatus = 'active' | 'used' | 'expired' | 'disabled';

// Gift Card Operations
export async function createGiftCard(data: {
  code: string;
  initialBalance: number;
  expiryDate?: Date;
  customerId?: string;
  notes?: string;
}) {
  const giftCardsRef = collection(db, 'giftCards');

  // Check if code already exists
  const q = query(giftCardsRef, where('code', '==', data.code.toUpperCase()));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    throw new Error('Gift card code already exists');
  }

  const docRef = await addDoc(giftCardsRef, {
    ...data,
    code: data.code.toUpperCase(),
    currentBalance: data.initialBalance,
    status: 'active',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function getGiftCards() {
  const giftCardsRef = collection(db, 'giftCards');
  const snapshot = await getDocs(giftCardsRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getGiftCard(id: string) {
  const docRef = doc(db, 'giftCards', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
}

export async function getGiftCardByCode(code: string) {
  const giftCardsRef = collection(db, 'giftCards');
  const q = query(giftCardsRef, where('code', '==', code.toUpperCase()));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as any;
}

export async function applyGiftCard(code: string, amount: number, orderId: string) {
  const giftCard = await getGiftCardByCode(code);

  if (!giftCard) {
    throw new Error('Gift card not found');
  }

  if (giftCard.status !== 'active') {
    throw new Error('Gift card is not active');
  }

  if (giftCard.currentBalance < amount) {
    throw new Error('Insufficient gift card balance');
  }

  // Check expiry
  if (giftCard.expiryDate) {
    const expiry = giftCard.expiryDate instanceof Timestamp
      ? giftCard.expiryDate.toDate()
      : new Date(giftCard.expiryDate);
    if (expiry < new Date()) {
      throw new Error('Gift card has expired');
    }
  }

  const newBalance = giftCard.currentBalance - amount;
  const newStatus = newBalance === 0 ? 'used' : 'active';

  const docRef = doc(db, 'giftCards', giftCard.id);
  await updateDoc(docRef, {
    currentBalance: newBalance,
    status: newStatus,
    lastUsedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  // Record transaction
  await addGiftCardTransaction({
    giftCardId: giftCard.id,
    orderId,
    amount: -amount,
    balanceAfter: newBalance,
  });

  return newBalance;
}

export async function addGiftCardTransaction(data: {
  giftCardId: string;
  orderId?: string;
  amount: number;
  balanceAfter: number;
  notes?: string;
}) {
  const transactionsRef = collection(db, 'giftCardTransactions');
  const docRef = await addDoc(transactionsRef, {
    ...data,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function getGiftCardTransactions(giftCardId: string) {
  const transactionsRef = collection(db, 'giftCardTransactions');
  const q = query(transactionsRef, where('giftCardId', '==', giftCardId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function updateGiftCardStatus(id: string, status: GiftCardStatus) {
  const docRef = doc(db, 'giftCards', id);
  await updateDoc(docRef, {
    status,
    updatedAt: Timestamp.now(),
  });
}

// Generate random gift card code
export function generateGiftCardCode(length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
