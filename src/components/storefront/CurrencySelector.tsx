"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useStoreSettings } from "@/contexts/StoreSettingsContext"
import { useState, useEffect } from "react"
import { updateSettingsAction } from "@/actions/settings"

const currencies = [
  // North America
  { code: 'USD', label: 'United States | USD $', symbol: '$', country: 'United States' },
  { code: 'CAD', label: 'Canada | CAD $', symbol: 'CA$', country: 'Canada' },
  { code: 'MXN', label: 'Mexico | MXN $', symbol: 'MX$', country: 'Mexico' },

  // Europe
  { code: 'EUR', label: 'Europe | EUR €', symbol: '€', country: 'Europe' },
  { code: 'EUR', label: 'Germany | EUR €', symbol: '€', country: 'Germany' },
  { code: 'EUR', label: 'France | EUR €', symbol: '€', country: 'France' },
  { code: 'EUR', label: 'Italy | EUR €', symbol: '€', country: 'Italy' },
  { code: 'EUR', label: 'Spain | EUR €', symbol: '€', country: 'Spain' },
  { code: 'GBP', label: 'United Kingdom | GBP £', symbol: '£', country: 'United Kingdom' },
  { code: 'CHF', label: 'Switzerland | CHF ₣', symbol: 'CHF', country: 'Switzerland' },
  { code: 'SEK', label: 'Sweden | SEK kr', symbol: 'kr', country: 'Sweden' },
  { code: 'NOK', label: 'Norway | NOK kr', symbol: 'kr', country: 'Norway' },
  { code: 'DKK', label: 'Denmark | DKK kr', symbol: 'kr', country: 'Denmark' },
  { code: 'PLN', label: 'Poland | PLN zł', symbol: 'zł', country: 'Poland' },
  { code: 'CZK', label: 'Czech Republic | CZK Kč', symbol: 'Kč', country: 'Czech Republic' },
  { code: 'HUF', label: 'Hungary | HUF Ft', symbol: 'Ft', country: 'Hungary' },
  { code: 'RON', label: 'Romania | RON lei', symbol: 'lei', country: 'Romania' },
  { code: 'BGN', label: 'Bulgaria | BGN лв', symbol: 'лв', country: 'Bulgaria' },
  { code: 'HRK', label: 'Croatia | HRK kn', symbol: 'kn', country: 'Croatia' },
  { code: 'ISK', label: 'Iceland | ISK kr', symbol: 'kr', country: 'Iceland' },
  { code: 'TRY', label: 'Turkey | TRY ₺', symbol: '₺', country: 'Turkey' },
  { code: 'RUB', label: 'Russia | RUB ₽', symbol: '₽', country: 'Russia' },

  // Asia-Pacific
  { code: 'JPY', label: 'Japan | JPY ¥', symbol: '¥', country: 'Japan' },
  { code: 'CNY', label: 'China | CNY ¥', symbol: '¥', country: 'China' },
  { code: 'INR', label: 'India | INR ₹', symbol: '₹', country: 'India' },
  { code: 'AUD', label: 'Australia | AUD $', symbol: 'A$', country: 'Australia' },
  { code: 'NZD', label: 'New Zealand | NZD $', symbol: 'NZ$', country: 'New Zealand' },
  { code: 'SGD', label: 'Singapore | SGD $', symbol: 'S$', country: 'Singapore' },
  { code: 'HKD', label: 'Hong Kong | HKD $', symbol: 'HK$', country: 'Hong Kong' },
  { code: 'KRW', label: 'South Korea | KRW ₩', symbol: '₩', country: 'South Korea' },
  { code: 'THB', label: 'Thailand | THB ฿', symbol: '฿', country: 'Thailand' },
  { code: 'MYR', label: 'Malaysia | MYR RM', symbol: 'RM', country: 'Malaysia' },
  { code: 'IDR', label: 'Indonesia | IDR Rp', symbol: 'Rp', country: 'Indonesia' },
  { code: 'PHP', label: 'Philippines | PHP ₱', symbol: '₱', country: 'Philippines' },
  { code: 'VND', label: 'Vietnam | VND ₫', symbol: '₫', country: 'Vietnam' },
  { code: 'TWD', label: 'Taiwan | TWD NT$', symbol: 'NT$', country: 'Taiwan' },
  { code: 'PKR', label: 'Pakistan | PKR ₨', symbol: '₨', country: 'Pakistan' },
  { code: 'BDT', label: 'Bangladesh | BDT ৳', symbol: '৳', country: 'Bangladesh' },
  { code: 'LKR', label: 'Sri Lanka | LKR Rs', symbol: 'Rs', country: 'Sri Lanka' },
  { code: 'NPR', label: 'Nepal | NPR ₨', symbol: '₨', country: 'Nepal' },

  // Middle East
  { code: 'AED', label: 'UAE | AED د.إ', symbol: 'د.إ', country: 'UAE' },
  { code: 'SAR', label: 'Saudi Arabia | SAR ﷼', symbol: '﷼', country: 'Saudi Arabia' },
  { code: 'QAR', label: 'Qatar | QAR ﷼', symbol: '﷼', country: 'Qatar' },
  { code: 'KWD', label: 'Kuwait | KWD د.ك', symbol: 'د.ك', country: 'Kuwait' },
  { code: 'BHD', label: 'Bahrain | BHD د.ب', symbol: 'د.ب', country: 'Bahrain' },
  { code: 'OMR', label: 'Oman | OMR ﷼', symbol: '﷼', country: 'Oman' },
  { code: 'JOD', label: 'Jordan | JOD د.ا', symbol: 'د.ا', country: 'Jordan' },
  { code: 'ILS', label: 'Israel | ILS ₪', symbol: '₪', country: 'Israel' },

  // South America
  { code: 'BRL', label: 'Brazil | BRL R$', symbol: 'R$', country: 'Brazil' },
  { code: 'ARS', label: 'Argentina | ARS $', symbol: '$', country: 'Argentina' },
  { code: 'CLP', label: 'Chile | CLP $', symbol: '$', country: 'Chile' },
  { code: 'COP', label: 'Colombia | COP $', symbol: '$', country: 'Colombia' },
  { code: 'PEN', label: 'Peru | PEN S/', symbol: 'S/', country: 'Peru' },
  { code: 'UYU', label: 'Uruguay | UYU $U', symbol: '$U', country: 'Uruguay' },

  // Africa
  { code: 'ZAR', label: 'South Africa | ZAR R', symbol: 'R', country: 'South Africa' },
  { code: 'EGP', label: 'Egypt | EGP £', symbol: '£', country: 'Egypt' },
  { code: 'NGN', label: 'Nigeria | NGN ₦', symbol: '₦', country: 'Nigeria' },
  { code: 'KES', label: 'Kenya | KES KSh', symbol: 'KSh', country: 'Kenya' },
  { code: 'GHS', label: 'Ghana | GHS ₵', symbol: '₵', country: 'Ghana' },
  { code: 'TND', label: 'Tunisia | TND د.ت', symbol: 'د.ت', country: 'Tunisia' },
  { code: 'MAD', label: 'Morocco | MAD د.م.', symbol: 'د.م.', country: 'Morocco' },
]

export function CurrencySelector() {
  const { settings } = useStoreSettings()
  const [currentCurrency, setCurrentCurrency] = useState(settings.currency || 'USD')

  useEffect(() => {
    setCurrentCurrency(settings.currency || 'USD')
  }, [settings.currency])

  const handleCurrencyChange = async (newCurrency: string) => {
    setCurrentCurrency(newCurrency)

    try {
      // Update currency in settings
      await updateSettingsAction('general', { currency: newCurrency })
      // Reload page to apply new currency
      window.location.reload()
    } catch (error) {
      console.error('Failed to update currency:', error)
    }
  }

  return (
    <Select value={currentCurrency} onValueChange={handleCurrencyChange}>
      <SelectTrigger className="w-[200px] h-9 bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 focus:ring-gray-300 text-sm">
        <SelectValue>
          {currencies.find(c => c.code === currentCurrency)?.label || 'United States | USD $'}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-[300px] overflow-y-auto">
        {currencies.map((currency, index) => (
          <SelectItem key={`${currency.code}-${index}`} value={currency.code}>
            {currency.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
