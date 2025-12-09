// Stubs for loyalty to replace Firebase
export async function getLoyaltyConfig() {
  return {
    pointsPerDollar: 1,
    pointsValue: 0.01,
    minPointsToRedeem: 100,
    tiers: [],
  };
}

export async function updateLoyaltyConfig(config: any) {
  // no-op
}

export async function getCustomerLoyalty(customerId: string) {
  return {
    id: 'mock-loyalty-id',
    customerId,
    points: 0,
    tier: 'Bronze',
    lifetimePoints: 0,
  };
}

export const getLoyaltyAccount = getCustomerLoyalty;

export async function addLoyaltyPoints(
  customerId: string,
  points: number,
  reason: string,
  orderId?: string
) {
  return { points: points, tier: 'Bronze' };
}

export async function redeemLoyaltyPoints(
  customerId: string,
  points: number,
  orderId: string
) {
  return 0; // discount amount
}

export async function addLoyaltyTransaction(data: any) {
  return 'mock-transaction-id';
}

export async function getLoyaltyTransactions(customerId: string) {
  return [];
}

export async function calculateOrderPoints(orderAmount: number): Promise<number> {
  return 0;
}
