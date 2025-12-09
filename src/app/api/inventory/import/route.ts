import { NextResponse } from 'next/server'
import * as firestore from '@/lib/firestore'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { lines } = body // Array of CSV lines

    if (!lines || !Array.isArray(lines)) {
      return NextResponse.json({ error: 'Invalid CSV data' }, { status: 400 })
    }

    // Skip header and process rows
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    }

    // First line is header: productId,variantId,sku,stock
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const parts = line.split(',').map((p: string) => p.trim())
      if (parts.length < 3) {
        results.failed++
        results.errors.push(`Line ${i + 1}: Invalid format (expected at least 3 fields)`)
        continue
      }

      const productId = parts[0]
      const variantId = parts[1] || null
      const stock = parseInt(parts[2])

      if (!productId || isNaN(stock)) {
        results.failed++
        results.errors.push(`Line ${i + 1}: Invalid productId or stock value`)
        continue
      }

      try {
        if (variantId) {
          // Update variant stock
          await firestore.updateVariantOnProduct(productId, variantId, { stock })
        } else {
          // Update product stock
          const product = await firestore.getProduct(productId)
          if (!product) {
            results.errors.push(`Line ${i + 1}: Product ${productId} not found`)
            results.failed++
            continue
          }
          await firestore.updateProduct(productId, { stock })
        }
        results.success++
      } catch (err: any) {
        results.failed++
        results.errors.push(`Line ${i + 1}: ${err.message}`)
      }
    }

    return NextResponse.json(results)
  } catch (error: any) {
    console.error('CSV import error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
