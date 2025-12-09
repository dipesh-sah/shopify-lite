export async function addToWishlist(customerId: string, productId: string, variantId?: string) { return 'mock-id'; }
export async function removeFromWishlist(customerId: string, productId: string) { }
export async function getWishlist(customerId: string) { return []; }
export async function isInWishlist(customerId: string, productId: string): Promise<boolean> { return false; }
export async function clearWishlist(customerId: string) { }
