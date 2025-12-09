// Stubs for abandoned carts to replace Firebase
export type AbandonedCartStatus = 'abandoned' | 'recovered' | 'expired';

export async function createAbandonedCart(data: any): Promise<any> {
  return 'mock-cart-id';
}

export async function getAbandonedCarts(status?: AbandonedCartStatus): Promise<any[]> {
  return [];
}

export async function getAbandonedCart(id: string): Promise<any> {
  return null;
}

export async function updateAbandonedCartStatus(id: string, status: AbandonedCartStatus) {
  // no-op
}

export async function incrementEmailsSent(id: string) {
  // no-op
}

export async function deleteAbandonedCart(id: string) {
  // no-op
}

export async function getCartsForRecovery(hoursAbandoned: number = 1, maxEmails: number = 3): Promise<any[]> {
  return [];
}

export async function getRecoveryStats() {
  return {
    total: 0,
    abandoned: 0,
    recovered: 0,
    expired: 0,
    totalValue: 0,
    recoveredValue: 0,
    recoveryRate: 0,
  };
}
