// Stubs for shipping to replace Firebase
export async function createShippingZone(data: any) {
  return 'mock-zone-id';
}

export async function getShippingZones() {
  return [];
}

export async function getShippingZone(id: string) {
  return null;
}

export async function updateShippingZone(id: string, data: any) {
  // no-op
}

export async function deleteShippingZone(id: string) {
  // no-op
}

export async function createShippingMethod(data: any) {
  return 'mock-method-id';
}

export async function getShippingMethods(zoneId?: string) {
  return [];
}

export async function getActiveShippingMethods(zoneId: string) {
  return [];
}

export async function updateShippingMethod(id: string, data: any) {
  // no-op
}

export async function deleteShippingMethod(id: string) {
  // no-op
}

export async function calculateShippingRate(
  zoneId: string,
  orderAmount: number,
  weight: number
): Promise<any[]> {
  return [];
}
