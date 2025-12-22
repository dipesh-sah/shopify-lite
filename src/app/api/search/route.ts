import { NextRequest, NextResponse } from 'next/server'
import { getProducts } from '@/lib/products'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q') || ''
  const limit = parseInt(searchParams.get('limit') || '5')

  try {
    const { products } = await getProducts({
      search: query,
      status: 'active',
      limit,
      sortBy: 'relevance',
      sortOrder: 'desc'
    })

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json({ products: [], error: 'Search failed' }, { status: 500 })
  }
}
