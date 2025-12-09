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
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

export type PostStatus = 'draft' | 'published';

// Blog Post Operations
export async function createBlogPost(data: {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  authorId: string;
  categoryIds?: string[];
  tags?: string[];
  status?: PostStatus;
  publishedAt?: Date;
  seoTitle?: string;
  seoDescription?: string;
}) {
  const postsRef = collection(db, 'blogPosts');

  // Check if slug already exists
  const q = query(postsRef, where('slug', '==', data.slug));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    throw new Error('Post with this slug already exists');
  }

  const docRef = await addDoc(postsRef, {
    ...data,
    categoryIds: data.categoryIds || [],
    tags: data.tags || [],
    status: data.status || 'draft',
    viewCount: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function getBlogPosts(status?: PostStatus) {
  const postsRef = collection(db, 'blogPosts');
  let q;

  if (status) {
    q = query(postsRef, where('status', '==', status), orderBy('createdAt', 'desc'));
  } else {
    q = query(postsRef, orderBy('createdAt', 'desc'));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getBlogPost(id: string) {
  const docRef = doc(db, 'blogPosts', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as any;
  }
  return null;
}

export async function getBlogPostBySlug(slug: string) {
  const postsRef = collection(db, 'blogPosts');
  const q = query(postsRef, where('slug', '==', slug));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as any;
}

export async function updateBlogPost(id: string, data: any) {
  const docRef = doc(db, 'blogPosts', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteBlogPost(id: string) {
  const docRef = doc(db, 'blogPosts', id);
  await deleteDoc(docRef);
}

export async function incrementPostViews(id: string) {
  const post = await getBlogPost(id);
  if (!post) return;

  const docRef = doc(db, 'blogPosts', id);
  await updateDoc(docRef, {
    viewCount: (post.viewCount || 0) + 1,
  });
}

// Blog Categories
export async function createBlogCategory(data: {
  name: string;
  slug: string;
  description?: string;
}) {
  const categoriesRef = collection(db, 'blogCategories');
  const docRef = await addDoc(categoriesRef, {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function getBlogCategories() {
  const categoriesRef = collection(db, 'blogCategories');
  const snapshot = await getDocs(categoriesRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function updateBlogCategory(id: string, data: any) {
  const docRef = doc(db, 'blogCategories', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteBlogCategory(id: string) {
  const docRef = doc(db, 'blogCategories', id);
  await deleteDoc(docRef);
}

// Blog Comments
export async function createBlogComment(data: {
  postId: string;
  authorName: string;
  authorEmail: string;
  content: string;
  userId?: string;
  isApproved?: boolean;
}) {
  const commentsRef = collection(db, 'blogComments');
  const docRef = await addDoc(commentsRef, {
    ...data,
    isApproved: data.isApproved ?? false,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function getBlogComments(postId: string, onlyApproved: boolean = true) {
  const commentsRef = collection(db, 'blogComments');
  let q;

  if (onlyApproved) {
    q = query(
      commentsRef,
      where('postId', '==', postId),
      where('isApproved', '==', true),
      orderBy('createdAt', 'desc')
    );
  } else {
    q = query(
      commentsRef,
      where('postId', '==', postId),
      orderBy('createdAt', 'desc')
    );
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function updateCommentApproval(id: string, isApproved: boolean) {
  const docRef = doc(db, 'blogComments', id);
  await updateDoc(docRef, { isApproved });
}

export async function deleteBlogComment(id: string) {
  const docRef = doc(db, 'blogComments', id);
  await deleteDoc(docRef);
}
