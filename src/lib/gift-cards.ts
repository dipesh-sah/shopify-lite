// Stubs for gift cards to replace Firebase
export type GiftCardStatus = 'active' | 'used' | 'expired' | 'disabled';

export async function createGiftCard(data: any) {
  return 'mock-gift-card-id';
}

export async function getGiftCards() {
  return [];
}

export async function getGiftCard(id: string) {
  return null;
}

export async function getGiftCardByCode(code: string) {
  return null;
}

export async function applyGiftCard(code: string, amount: number, orderId: string) {
  // Mock success or failure
  return 0;
}

export async function addGiftCardTransaction(data: any) {
  return 'mock-transaction-id';
}

export async function getGiftCardTransactions(giftCardId: string) {
  return [];
}

export async function updateGiftCardStatus(id: string, status: GiftCardStatus) {
  // no-op
}

export function generateGiftCardCode(length: number = 16): string {
  return 'MOCK-CODE-1234';
}
