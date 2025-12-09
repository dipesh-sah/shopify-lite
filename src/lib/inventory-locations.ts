// Stubs for inventory locations to replace Firebase
export async function createLocation(data: any) {
  return 'mock-location-id';
}

export async function getLocations() {
  return [];
}

export async function getActiveLocations() {
  return [];
}

export async function getLocation(id: string) {
  return null;
}

export async function updateLocation(id: string, data: any) {
  // no-op
}

export async function deleteLocation(id: string) {
  // no-op
}

export async function setInventoryLevel(data: any) {
  return 'mock-level-id';
}

export async function adjustInventory(
  productId: string,
  locationId: string,
  adjustment: number,
  reason?: string
) {
  return 0; // new quantity
}

export async function getInventoryLevel(productId: string, locationId: string) {
  return null;
}

export async function getProductInventory(productId: string) {
  return [];
}

export async function getLocationInventory(locationId: string) {
  return [];
}

export async function createInventoryTransfer(data: any) {
  return 'mock-transfer-id';
}

export async function completeInventoryTransfer(transferId: string) {
  // no-op
}

export async function getInventoryTransfers(status?: string) {
  return [];
}
