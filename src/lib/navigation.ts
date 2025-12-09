// Stubs for navigation to replace Firebase
export interface MenuItem {
  id: string;
  label: string;
  url: string;
  type: 'page' | 'collection' | 'product' | 'category' | 'custom' | 'blog';
  targetId?: string;
  children?: MenuItem[];
  order: number;
}

export async function createMenu(data: any) {
  return 'mock-menu-id';
}

export async function getMenus() {
  return [];
}

export async function getMenu(id: string) {
  return null;
}

export async function getMenuByHandle(handle: string) {
  return null;
}

export async function updateMenu(id: string, data: any) {
  // no-op
}

export async function deleteMenu(id: string) {
  // no-op
}

export async function addMenuItem(menuId: string, item: any) {
  return 'mock-item-id';
}

export async function removeMenuItem(menuId: string, itemId: string) {
  // no-op
}

export async function reorderMenuItems(menuId: string, items: MenuItem[]) {
  // no-op
}
