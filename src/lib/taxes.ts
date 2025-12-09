// Stubs for taxes to replace Firebase
export async function createTaxZone(data: any) {
  return 'mock-zone-id';
}

export async function getTaxZones() {
  return [];
}

export async function getTaxZone(id: string) {
  return null;
}

export async function updateTaxZone(id: string, data: any) {
  // no-op
}

export async function deleteTaxZone(id: string) {
  // no-op
}

export async function createTaxRate(data: any) {
  return 'mock-rate-id';
}

export async function getTaxRates(zoneId?: string) {
  return [];
}

export async function updateTaxRate(id: string, data: any) {
  // no-op
}

export async function deleteTaxRate(id: string) {
  // no-op
}

export async function calculateTax(
  amount: number,
  country: string,
  province?: string
): Promise<{ taxAmount: number; totalAmount: number; appliedRates: any[] }> {
  return {
    taxAmount: 0,
    totalAmount: amount,
    appliedRates: [],
  };
}
