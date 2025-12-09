import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

export type InventoryHistoryType = 'adjustment' | 'sale' | 'return' | 'transfer' | 'restock';

// Inventory History
export async function addInventoryHistory(data: {
  productId: string;
  variantId?: string;
  locationId: string;
  adjustment: number;
  previousQuantity: number;
  newQuantity: number;
  type?: InventoryHistoryType;
  reason?: string;
  orderId?: string;
  userId?: string;
}) {
  const historyRef = collection(db, 'inventoryHistory');
  const docRef = await addDoc(historyRef, {
    ...data,
    type: data.type || 'adjustment',
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function getInventoryHistory(productId: string, locationId?: string) {
  const historyRef = collection(db, 'inventoryHistory');
  let q;

  if (locationId) {
    q = query(
      historyRef,
      where('productId', '==', productId),
      where('locationId', '==', locationId),
      orderBy('createdAt', 'desc')
    );
  } else {
    q = query(
      historyRef,
      where('productId', '==', productId),
      orderBy('createdAt', 'desc')
    );
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getLocationHistory(locationId: string) {
  const historyRef = collection(db, 'inventoryHistory');
  const q = query(
    historyRef,
    where('locationId', '==', locationId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
