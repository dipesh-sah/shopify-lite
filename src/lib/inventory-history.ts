// Stubs for inventory history to replace Firebase
export type InventoryHistoryType = 'adjustment' | 'sale' | 'return' | 'transfer' | 'restock';

export async function addInventoryHistory(data: any) {
  return 'mock-history-id';
}

export async function getInventoryHistory(productId: string, locationId?: string) {
  return [];
}

export async function getLocationHistory(locationId: string) {
  return [];
}
