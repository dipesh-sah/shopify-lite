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

export type PageStatus = 'draft' | 'published';

// CMS Page Operations
export async function createPage(data: {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  status?: PageStatus;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  template?: string;
}) {
  const pagesRef = collection(db, 'pages');

  // Check if slug already exists
  const q = query(pagesRef, where('slug', '==', data.slug));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    throw new Error('Page with this slug already exists');
  }

  const docRef = await addDoc(pagesRef, {
    ...data,
    status: data.status || 'draft',
    seoKeywords: data.seoKeywords || [],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function getPages(status?: PageStatus) {
  const pagesRef = collection(db, 'pages');
  let q;

  if (status) {
    q = query(pagesRef, where('status', '==', status));
  } else {
    q = query(pagesRef);
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getPage(id: string) {
  const docRef = doc(db, 'pages', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
}

export async function getPageBySlug(slug: string) {
  const pagesRef = collection(db, 'pages');
  const q = query(pagesRef, where('slug', '==', slug));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
}

export async function updatePage(id: string, data: Partial<{
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  status: PageStatus;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  template: string;
}>) {
  const docRef = doc(db, 'pages', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deletePage(id: string) {
  const docRef = doc(db, 'pages', id);
  await deleteDoc(docRef);
}
