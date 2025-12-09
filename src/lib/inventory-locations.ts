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
import { addInventoryHistory } from './inventory-history';

// Inventory Location Operations
export async function createLocation(data: {
  name: string;
  address?: string;
  city?: string;
  province?: string;
  country?: string;
  zip?: string;
  isActive?: boolean;
}) {
  const locationsRef = collection(db, 'inventoryLocations');
  const docRef = await addDoc(locationsRef, {
    ...data,
    isActive: data.isActive !== false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function getLocations() {
  const locationsRef = collection(db, 'inventoryLocations');
  const snapshot = await getDocs(locationsRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getActiveLocations() {
  const locationsRef = collection(db, 'inventoryLocations');
  const q = query(locationsRef, where('isActive', '==', true));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getLocation(id: string) {
  const docRef = doc(db, 'inventoryLocations', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
}

export async function updateLocation(id: string, data: Partial<{
  name: string;
  address: string;
  city: string;
  province: string;
  country: string;
  zip: string;
  isActive: boolean;
}>) {
  const docRef = doc(db, 'inventoryLocations', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteLocation(id: string) {
  const docRef = doc(db, 'inventoryLocations', id);
  await deleteDoc(docRef);
}

// Inventory Level Operations
export async function setInventoryLevel(data: {
  productId: string;
  variantId?: string;
  locationId: string;
  quantity: number;
}) {
  const inventoryRef = collection(db, 'inventoryLevels');

  // Check if inventory level already exists
  const q = query(
    inventoryRef,
    where('productId', '==', data.productId),
    where('locationId', '==', data.locationId)
  );
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    const docId = snapshot.docs[0].id;
    await updateDoc(doc(db, 'inventoryLevels', docId), {
      quantity: data.quantity,
      updatedAt: Timestamp.now(),
    });
    return docId;
  }

  const docRef = await addDoc(inventoryRef, {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function adjustInventory(
  productId: string,
  locationId: string,
  adjustment: number,
  reason?: string
) {
  const inventoryRef = collection(db, 'inventoryLevels');
  const q = query(
    inventoryRef,
    where('productId', '==', productId),
    where('locationId', '==', locationId)
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    throw new Error('Inventory level not found');
  }

  const docId = snapshot.docs[0].id;
  const currentData = snapshot.docs[0].data();
  const newQuantity = (currentData.quantity || 0) + adjustment;

  await updateDoc(doc(db, 'inventoryLevels', docId), {
    quantity: newQuantity,
    updatedAt: Timestamp.now(),
  });

  // Record history
  await addInventoryHistory({
    productId,
    locationId,
    adjustment,
    previousQuantity: currentData.quantity || 0,
    newQuantity,
    reason,
  });

  return newQuantity;
}

export async function getInventoryLevel(productId: string, locationId: string) {
  const inventoryRef = collection(db, 'inventoryLevels');
  const q = query(
    inventoryRef,
    where('productId', '==', productId),
    where('locationId', '==', locationId)
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
}

export async function getProductInventory(productId: string) {
  const inventoryRef = collection(db, 'inventoryLevels');
  const q = query(inventoryRef, where('productId', '==', productId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getLocationInventory(locationId: string) {
  const inventoryRef = collection(db, 'inventoryLevels');
  const q = query(inventoryRef, where('locationId', '==', locationId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Inventory Transfer
export async function createInventoryTransfer(data: {
  productId: string;
  variantId?: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;
  notes?: string;
}) {
  const transfersRef = collection(db, 'inventoryTransfers');
  const docRef = await addDoc(transfersRef, {
    ...data,
    status: 'pending',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function completeInventoryTransfer(transferId: string) {
  const docRef = doc(db, 'inventoryTransfers', transferId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) throw new Error('Transfer not found');

  const transfer = docSnap.data();

  // Adjust inventory at both locations
  await adjustInventory(
    transfer.productId,
    transfer.fromLocationId,
    -transfer.quantity,
    `Transfer to location ${transfer.toLocationId}`
  );

  await adjustInventory(
    transfer.productId,
    transfer.toLocationId,
    transfer.quantity,
    `Transfer from location ${transfer.fromLocationId}`
  );

  // Update transfer status
  await updateDoc(docRef, {
    status: 'completed',
    completedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

export async function getInventoryTransfers(status?: string) {
  const transfersRef = collection(db, 'inventoryTransfers');
  let q;

  if (status) {
    q = query(transfersRef, where('status', '==', status));
  } else {
    q = query(transfersRef);
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
