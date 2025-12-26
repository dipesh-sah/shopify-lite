import { NextResponse } from 'next/server'
import { getActiveCollections } from '@/lib/collections'

export async function GET() {
  try {
    const categories = await getActiveCollections()
    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Error fetching shop categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}
