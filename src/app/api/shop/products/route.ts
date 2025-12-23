import { NextRequest, NextResponse } from 'next/server'
import { getProducts } from '@/lib/products'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    const { products, totalCount } = await getProducts({
      status: 'active',
      limit,
      offset,
      sortBy: 'created_at',
      sortOrder: 'desc'
    })

    return NextResponse.json({
      products,
      totalCount,
      page,
      hasMore: offset + products.length < totalCount
    })
  } catch (error) {
    console.error('Error fetching shop products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}
