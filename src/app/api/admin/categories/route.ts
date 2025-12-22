import { NextRequest, NextResponse } from 'next/server';
import { getCategoryTree, createCategory } from '@/lib/categories';
import { getSessionAction } from '@/actions/customer-auth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get('locale') || 'en-GB';

  try {
    const tree = await getCategoryTree(locale);
    return NextResponse.json(tree);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Check auth
  // const user = await getSessionAction();
  // if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = await req.json();
    const id = await createCategory(data);
    return NextResponse.json({ id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
