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

// Shipping Zone Operations
export async function createShippingZone(data: {
  name: string;
  countries: string[];
  provinces?: string[];
}) {
  const zonesRef = collection(db, 'shippingZones');
  const docRef = await addDoc(zonesRef, {
    ...data,
    provinces: data.provinces || [],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function getShippingZones() {
  const zonesRef = collection(db, 'shippingZones');
  const snapshot = await getDocs(zonesRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getShippingZone(id: string) {
  const docRef = doc(db, 'shippingZones', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
}

export async function updateShippingZone(id: string, data: Partial<{
  name: string;
  countries: string[];
  provinces: string[];
}>) {
  const docRef = doc(db, 'shippingZones', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteShippingZone(id: string) {
  const docRef = doc(db, 'shippingZones', id);
  await deleteDoc(docRef);
}

// Shipping Method Operations
export async function createShippingMethod(data: {
  zoneId: string;
  name: string;
  description?: string;
  rateType: 'flat' | 'weight-based' | 'price-based';
  rate: number;
  minOrderAmount?: number;
  maxOrderAmount?: number;
  minWeight?: number;
  maxWeight?: number;
  estimatedDays?: string;
  isActive?: boolean;
}) {
  const methodsRef = collection(db, 'shippingMethods');
  const docRef = await addDoc(methodsRef, {
    ...data,
    isActive: data.isActive !== false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function getShippingMethods(zoneId?: string) {
  const methodsRef = collection(db, 'shippingMethods');
  let q;

  if (zoneId) {
    q = query(methodsRef, where('zoneId', '==', zoneId));
  } else {
    q = query(methodsRef);
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getActiveShippingMethods(zoneId: string) {
  const methodsRef = collection(db, 'shippingMethods');
  const q = query(
    methodsRef,
    where('zoneId', '==', zoneId),
    where('isActive', '==', true)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function updateShippingMethod(id: string, data: any) {
  const docRef = doc(db, 'shippingMethods', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteShippingMethod(id: string) {
  const docRef = doc(db, 'shippingMethods', id);
  await deleteDoc(docRef);
}

// Calculate shipping rate
export async function calculateShippingRate(
  zoneId: string,
  orderAmount: number,
  weight: number
): Promise<any[]> {
  const methods = await getActiveShippingMethods(zoneId);

  return methods
    .filter((method: any) => {
      if (method.minOrderAmount && orderAmount < method.minOrderAmount) return false;
      if (method.maxOrderAmount && orderAmount > method.maxOrderAmount) return false;
      if (method.minWeight && weight < method.minWeight) return false;
      if (method.maxWeight && weight > method.maxWeight) return false;
      return true;
    })
    .map((method: any) => ({
      id: method.id,
      name: method.name,
      description: method.description,
      rate: method.rate,
      estimatedDays: method.estimatedDays,
    }));
}
