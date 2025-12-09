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

// Tax Zone Operations
export async function createTaxZone(data: {
  name: string;
  countries: string[];
  provinces?: string[];
}) {
  const zonesRef = collection(db, 'taxZones');
  const docRef = await addDoc(zonesRef, {
    ...data,
    provinces: data.provinces || [],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function getTaxZones() {
  const zonesRef = collection(db, 'taxZones');
  const snapshot = await getDocs(zonesRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getTaxZone(id: string) {
  const docRef = doc(db, 'taxZones', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
}

export async function updateTaxZone(id: string, data: Partial<{
  name: string;
  countries: string[];
  provinces: string[];
}>) {
  const docRef = doc(db, 'taxZones', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteTaxZone(id: string) {
  const docRef = doc(db, 'taxZones', id);
  await deleteDoc(docRef);
}

// Tax Rate Operations
export async function createTaxRate(data: {
  zoneId: string;
  name: string;
  rate: number;
  isCompound?: boolean;
  priority?: number;
}) {
  const ratesRef = collection(db, 'taxRates');
  const docRef = await addDoc(ratesRef, {
    ...data,
    isCompound: data.isCompound || false,
    priority: data.priority || 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function getTaxRates(zoneId?: string) {
  const ratesRef = collection(db, 'taxRates');
  let q;

  if (zoneId) {
    q = query(ratesRef, where('zoneId', '==', zoneId));
  } else {
    q = query(ratesRef);
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
}

export async function updateTaxRate(id: string, data: any) {
  const docRef = doc(db, 'taxRates', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteTaxRate(id: string) {
  const docRef = doc(db, 'taxRates', id);
  await deleteDoc(docRef);
}

// Calculate tax for an amount
export async function calculateTax(
  amount: number,
  country: string,
  province?: string
): Promise<{ taxAmount: number; totalAmount: number; appliedRates: any[] }> {
  // Find matching tax zone
  const zones = await getTaxZones();
  const matchingZone = zones.find((zone: any) => {
    if (!zone.countries.includes(country)) return false;
    if (province && zone.provinces.length > 0) {
      return zone.provinces.includes(province);
    }
    return true;
  });

  if (!matchingZone) {
    return { taxAmount: 0, totalAmount: amount, appliedRates: [] };
  }

  // Get tax rates for the zone
  const rates = await getTaxRates(matchingZone.id);

  // Sort by priority
  const sortedRates = rates.sort((a: any, b: any) => a.priority - b.priority);

  let taxAmount = 0;
  const appliedRates: any[] = [];

  for (const rate of sortedRates) {
    const baseAmount = rate.isCompound ? amount + taxAmount : amount;
    const rateTax = baseAmount * (rate.rate / 100);
    taxAmount += rateTax;

    appliedRates.push({
      name: rate.name,
      rate: rate.rate,
      amount: rateTax,
    });
  }

  return {
    taxAmount,
    totalAmount: amount + taxAmount,
    appliedRates,
  };
}
