import { getCustomer } from './customers';
import { getProduct } from './firestore';

export interface PriceContext {
  customerId?: string;
  customerRole?: 'retail' | 'wholesale' | 'distributor';
  quantity?: number;
}

export async function calculatePrice(product: any, context: PriceContext) {
  let price = product.price;
  let role = context.customerRole || 'retail';

  // If customerId is provided but role is not, fetch the customer to get the role
  if (context.customerId && !context.customerRole) {
    const customer = await getCustomer(context.customerId) as any;
    if (customer && customer.role) {
      role = customer.role;
    }
  }

  // Apply role-based discounts
  if (role === 'wholesale') {
    price = price * 0.8; // 20% off
  } else if (role === 'distributor') {
    price = price * 0.65; // 35% off
  }

  // Apply quantity-based tiers (Bulk Pricing)
  if (context.quantity) {
    if (context.quantity >= 100) {
      price = price * 0.9; // Additional 10% off for 100+ items
    } else if (context.quantity >= 50) {
      price = price * 0.95; // Additional 5% off for 50+ items
    }
  }

  return Number(price.toFixed(2));
}

export function getBulkPricingTiers(basePrice: number) {
  return [
    { quantity: 1, price: basePrice, label: 'Single Item' },
    { quantity: 50, price: Number((basePrice * 0.95).toFixed(2)), label: '50+ Items (5% off)' },
    { quantity: 100, price: Number((basePrice * 0.90).toFixed(2)), label: '100+ Items (10% off)' },
  ];
}
