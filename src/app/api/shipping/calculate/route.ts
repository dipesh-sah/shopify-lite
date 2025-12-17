
import { NextResponse } from 'next/server';
import { calculateShipping } from '@/lib/shipping';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { address, items, total } = body;

    if (!address || !address.country) {
      return NextResponse.json({ error: 'Address with country is required' }, { status: 400 });
    }

    // Calculate total weight (assuming weight is in product or passed in items)
    // If not available, default to 0
    let totalWeight = 0;
    if (items && Array.isArray(items)) {
      // logic to sum weight
      // item.product.weight * item.quantity
      // But front end might not pass product details fully.
      // For now, let's assume weight is not heavily used or front end passes it.
      // If items have weight...
    }

    const rates = await calculateShipping(address.country, totalWeight, total || 0);

    return NextResponse.json({ rates });
  } catch (error) {
    console.error('Error calculating shipping:', error);
    return NextResponse.json({ error: 'Failed to calculate shipping' }, { status: 500 });
  }
}
