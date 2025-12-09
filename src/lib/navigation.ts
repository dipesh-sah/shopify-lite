import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

export interface MenuItem {
  id: string;
  label: string;
  url: string;
  type: 'page' | 'collection' | 'product' | 'category' | 'custom' | 'blog';
  targetId?: string;
  children?: MenuItem[];
  order: number;
}

// Navigation Menu Operations
export async function createMenu(data: {
  name: string;
  handle: string;
  items: MenuItem[];
}) {
  const menusRef = collection(db, 'navigationMenus');
  const docRef = await addDoc(menusRef, {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function getMenus() {
  const menusRef = collection(db, 'navigationMenus');
  const snapshot = await getDocs(menusRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getMenu(id: string) {
  const docRef = doc(db, 'navigationMenus', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as any;
  }
  return null;
}

export async function getMenuByHandle(handle: string) {
  const menusRef = collection(db, 'navigationMenus');
  const snapshot = await getDocs(menusRef);
  const menu = snapshot.docs.find(doc => doc.data().handle === handle);

  if (menu) {
    return { id: menu.id, ...menu.data() } as any;
  }
  return null;
}

export async function updateMenu(id: string, data: Partial<{
  name: string;
  handle: string;
  items: MenuItem[];
}>) {
  const docRef = doc(db, 'navigationMenus', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteMenu(id: string) {
  const docRef = doc(db, 'navigationMenus', id);
  await deleteDoc(docRef);
}

// Helper to add menu item
export async function addMenuItem(menuId: string, item: Omit<MenuItem, 'id'>) {
  const menu = await getMenu(menuId);
  if (!menu) throw new Error('Menu not found');

  const items = menu.items || [];
  const newItem = {
    ...item,
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  };

  items.push(newItem);

  await updateMenu(menuId, { items });
  return newItem.id;
}

// Helper to remove menu item
export async function removeMenuItem(menuId: string, itemId: string) {
  const menu = await getMenu(menuId);
  if (!menu) throw new Error('Menu not found');

  const items = (menu.items || []).filter((item: MenuItem) => item.id !== itemId);

  await updateMenu(menuId, { items });
}

// Helper to reorder menu items
export async function reorderMenuItems(menuId: string, items: MenuItem[]) {
  await updateMenu(menuId, { items });
}
