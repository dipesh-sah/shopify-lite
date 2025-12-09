import { NextResponse } from 'next/server'
import { getProducts } from '@/lib/firestore'

function escapeCsv(value: any) {
  if (value === null || value === undefined) return ''
  const s = String(value)
  if (s.includes(',') || s.includes('\n') || s.includes('"')) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const params = url.searchParams
    const categoryId = params.get('categoryId') || undefined
    const lowStock = params.get('lowStock') === '1'
    const threshold = params.has('threshold') ? parseInt(params.get('threshold') || '0') : undefined

    let products = await getProducts()
    if (categoryId) {
      products = products.filter((p: any) => p.categoryId === categoryId)
    }

    const rows: Array<any> = []
    products.forEach((p: any) => {
      const vs = p.variants || []
      if (vs.length === 0) {
        const stockVal = p.stock || 0
        if (lowStock && threshold !== undefined) {
          if (stockVal <= threshold) rows.push({ productId: p.id, productName: p.name, variantId: '', sku: p.sku || '', stock: stockVal })
        } else {
          rows.push({ productId: p.id, productName: p.name, variantId: '', sku: p.sku || '', stock: stockVal })
        }
      } else {
        vs.forEach((v: any) => {
          const stockVal = v.stock || 0
          if (lowStock && threshold !== undefined) {
            if (stockVal <= threshold) rows.push({ productId: p.id, productName: p.name, variantId: v.id, sku: v.sku || '', stock: stockVal })
          } else {
            rows.push({ productId: p.id, productName: p.name, variantId: v.id, sku: v.sku || '', stock: stockVal })
          }
        })
      }
    })

    const header = ['productId', 'productName', 'variantId', 'sku', 'stock']
    const csv = [header.join(',')]
    rows.forEach(r => {
      csv.push([r.productId, r.productName, r.variantId, r.sku, r.stock].map(escapeCsv).join(','))
    })

    const body = csv.join('\n')

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="inventory.csv"',
      },
    })
  } catch (err: any) {
    console.error('Failed to generate CSV', err)
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
