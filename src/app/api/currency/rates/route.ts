import { NextResponse } from 'next/server'
import { getExchangeRates } from '@/lib/currency'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const baseCurrency = searchParams.get('base') || 'USD'

    const rates = await getExchangeRates(baseCurrency)

    return NextResponse.json(rates)
  } catch (error) {
    console.error('Error fetching exchange rates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exchange rates' },
      { status: 500 }
    )
  }
}
