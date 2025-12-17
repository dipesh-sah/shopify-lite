import { NextResponse } from 'next/server'
import * as products from '@/lib/products'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { productId, variantId, sku, stock, priceDelta, mediaIds, options } = body

    if (!productId || !variantId) {
      return NextResponse.json({ error: 'Missing productId or variantId' }, { status: 400 })
    }

    const update: any = {}
    if (sku !== undefined) update.sku = sku
    if (stock !== undefined) update.stock = typeof stock === 'number' ? stock : parseInt(stock)
    if (priceDelta !== undefined) update.priceDelta = typeof priceDelta === 'number' ? priceDelta : parseFloat(priceDelta)
    if (mediaIds !== undefined) update.mediaIds = Array.isArray(mediaIds) ? mediaIds : []
    if (options !== undefined) update.options = options

    await products.updateVariantOnProduct(productId, variantId, update)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Failed to update variant', err)
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
