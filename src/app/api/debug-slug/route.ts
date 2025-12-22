
import { NextResponse } from 'next/server';
import { getProductBySlug } from '@/lib/products';

export async function GET() {
  return NextResponse.json({ status: 'Server is running' });
  /*
  try {
    const product = await getProductBySlug('noah-barrett');
    return NextResponse.json({
      success: true,
      product,
      env: process.env.DATABASE_URL ? 'Set' : 'Unset'
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
  */
}
