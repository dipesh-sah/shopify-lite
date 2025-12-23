import { NextRequest, NextResponse } from 'next/server';
import { updateCategoryPositions } from '@/lib/categories';

export async function POST(req: NextRequest) {
  try {
    const { reorders } = await req.json();
    await updateCategoryPositions(reorders);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
