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

export type RelationType = 'cross-sell' | 'upsell' | 'related';

// Product Relations
export async function addProductRelation(data: {
  productId: string;
  relatedProductId: string;
  relationType: RelationType;
  priority?: number;
}) {
  const relationsRef = collection(db, 'productRelations');

  // Check if relation already exists
  const q = query(
    relationsRef,
    where('productId', '==', data.productId),
    where('relatedProductId', '==', data.relatedProductId),
    where('relationType', '==', data.relationType)
  );
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    return snapshot.docs[0].id;
  }

  const docRef = await addDoc(relationsRef, {
    ...data,
    priority: data.priority || 0,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function getProductRelations(productId: string, relationType?: RelationType) {
  const relationsRef = collection(db, 'productRelations');
  let q;

  if (relationType) {
    q = query(
      relationsRef,
      where('productId', '==', productId),
      where('relationType', '==', relationType)
    );
  } else {
    q = query(relationsRef, where('productId', '==', productId));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getCrossSellProducts(productId: string) {
  return getProductRelations(productId, 'cross-sell');
}

export async function getUpsellProducts(productId: string) {
  return getProductRelations(productId, 'upsell');
}

export async function getRelatedProducts(productId: string) {
  return getProductRelations(productId, 'related');
}

export async function removeProductRelation(relationId: string) {
  const docRef = doc(db, 'productRelations', relationId);
  await deleteDoc(docRef);
}

export async function updateRelationPriority(relationId: string, priority: number) {
  const docRef = doc(db, 'productRelations', relationId);
  await updateDoc(docRef, { priority });
}
