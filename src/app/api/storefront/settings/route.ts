import { NextResponse } from 'next/server'
import { getGeneralSettings } from '@/lib/settings'

export async function GET() {
  try {
    const settings = await getGeneralSettings()

    // Return only public-facing settings
    return NextResponse.json({
      storeName: settings.storeName || 'My Store',
      storeEmail: settings.storeEmail || 'store@example.com',
      storePhone: settings.storePhone || '',
      storeAddress: settings.storeAddress || '',
      currency: settings.currency || 'USD',
      timezone: settings.timezone || 'UTC',
    })
  } catch (error) {
    console.error('Error fetching storefront settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}
