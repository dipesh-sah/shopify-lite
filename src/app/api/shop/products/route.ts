import { NextRequest, NextResponse } from 'next/server'
import { getProducts } from '@/lib/products'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined
    const inStock = searchParams.get('inStock') === 'true'
    const sortBy = searchParams.get('sortBy') as any || 'created_at'
    const sortOrder = searchParams.get('sortOrder') as any || 'desc'
    const category = searchParams.get('category') || undefined

    const { products, totalCount } = await getProducts({
      status: 'active',
      limit,
      offset,
      minPrice,
      maxPrice,
      inStock,
      sortBy,
      sortOrder,
      category
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
