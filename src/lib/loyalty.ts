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

// Loyalty Program Configuration
export async function getLoyaltyConfig() {
  const configRef = doc(db, 'settings', 'loyalty');
  const docSnap = await getDoc(configRef);

  if (docSnap.exists()) {
    return docSnap.data();
  }

  // Default config
  return {
    pointsPerDollar: 1,
    pointsValue: 0.01, // 1 point = $0.01
    minPointsToRedeem: 100,
    tiers: [
      { name: 'Bronze', minPoints: 0, discountPercentage: 0 },
      { name: 'Silver', minPoints: 1000, discountPercentage: 5 },
      { name: 'Gold', minPoints: 5000, discountPercentage: 10 },
      { name: 'Platinum', minPoints: 10000, discountPercentage: 15 },
    ],
  };
}

export async function updateLoyaltyConfig(config: any) {
  const configRef = doc(db, 'settings', 'loyalty');
  await updateDoc(configRef, {
    ...config,
    updatedAt: Timestamp.now(),
  });
}

// Customer Loyalty Points
export async function getCustomerLoyalty(customerId: string) {
  const loyaltyRef = collection(db, 'customerLoyalty');
  const q = query(loyaltyRef, where('customerId', '==', customerId));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    // Create new loyalty record
    const docRef = await addDoc(loyaltyRef, {
      customerId,
      points: 0,
      tier: 'Bronze',
      lifetimePoints: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return {
      id: docRef.id,
      customerId,
      points: 0,
      tier: 'Bronze',
      lifetimePoints: 0,
    };
  }

  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as any;
}

export const getLoyaltyAccount = getCustomerLoyalty;

export async function addLoyaltyPoints(
  customerId: string,
  points: number,
  reason: string,
  orderId?: string
) {
  const loyalty = await getCustomerLoyalty(customerId);
  const config = await getLoyaltyConfig();

  const newPoints = loyalty.points + points;
  const newLifetimePoints = loyalty.lifetimePoints + points;

  // Determine tier
  let tier = 'Bronze';
  for (const t of config.tiers.reverse()) {
    if (newLifetimePoints >= t.minPoints) {
      tier = t.name;
      break;
    }
  }

  const loyaltyRef = doc(db, 'customerLoyalty', loyalty.id);
  await updateDoc(loyaltyRef, {
    points: newPoints,
    lifetimePoints: newLifetimePoints,
    tier,
    updatedAt: Timestamp.now(),
  });

  // Record transaction
  await addLoyaltyTransaction({
    customerId,
    points,
    reason,
    orderId,
    balanceAfter: newPoints,
  });

  return { points: newPoints, tier };
}

export async function redeemLoyaltyPoints(
  customerId: string,
  points: number,
  orderId: string
) {
  const loyalty = await getCustomerLoyalty(customerId);
  const config = await getLoyaltyConfig();

  if (points < config.minPointsToRedeem) {
    throw new Error(`Minimum ${config.minPointsToRedeem} points required to redeem`);
  }

  if (loyalty.points < points) {
    throw new Error('Insufficient loyalty points');
  }

  const newPoints = loyalty.points - points;
  const discountAmount = points * config.pointsValue;

  const loyaltyRef = doc(db, 'customerLoyalty', loyalty.id);
  await updateDoc(loyaltyRef, {
    points: newPoints,
    updatedAt: Timestamp.now(),
  });

  // Record transaction
  await addLoyaltyTransaction({
    customerId,
    points: -points,
    reason: 'Redeemed for discount',
    orderId,
    balanceAfter: newPoints,
  });

  return discountAmount;
}

export async function addLoyaltyTransaction(data: {
  customerId: string;
  points: number;
  reason: string;
  orderId?: string;
  balanceAfter: number;
}) {
  const transactionsRef = collection(db, 'loyaltyTransactions');
  const docRef = await addDoc(transactionsRef, {
    ...data,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function getLoyaltyTransactions(customerId: string) {
  const transactionsRef = collection(db, 'loyaltyTransactions');
  const q = query(transactionsRef, where('customerId', '==', customerId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Calculate points for order
export async function calculateOrderPoints(orderAmount: number): Promise<number> {
  const config = await getLoyaltyConfig();
  return Math.floor(orderAmount * config.pointsPerDollar);
}
