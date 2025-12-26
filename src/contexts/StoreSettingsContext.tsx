'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface StoreSettings {
  storeName: string
  storeEmail: string
  storePhone: string
  storeAddress: string
  currency: string
  timezone: string
}

interface ExchangeRates {
  base: string
  rates: Record<string, number>
  timestamp: number
}

interface StoreSettingsContextType {
  settings: StoreSettings
  loading: boolean
  formatPrice: (price: number) => string
  getCurrencySymbol: () => string
}

const defaultSettings: StoreSettings = {
  storeName: 'My Store',
  storeEmail: 'store@example.com',
  storePhone: '',
  storeAddress: '',
  currency: 'USD',
  timezone: 'UTC',
}

const StoreSettingsContext = createContext<StoreSettingsContextType>({
  settings: defaultSettings,
  loading: true,
  formatPrice: (price: number) => `$${price.toFixed(2)}`,
  getCurrencySymbol: () => '$',
})

const currencySymbols: Record<string, string> = {
  // North America
  USD: '$',
  CAD: 'CA$',
  MXN: 'MX$',

  // Europe
  EUR: '€',
  GBP: '£',
  CHF: 'CHF',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  PLN: 'zł',
  CZK: 'Kč',
  HUF: 'Ft',
  RON: 'lei',
  BGN: 'лв',
  HRK: 'kn',
  ISK: 'kr',
  TRY: '₺',
  RUB: '₽',

  // Asia-Pacific
  JPY: '¥',
  CNY: '¥',
  INR: '₹',
  AUD: 'A$',
  NZD: 'NZ$',
  SGD: 'S$',
  HKD: 'HK$',
  KRW: '₩',
  THB: '฿',
  MYR: 'RM',
  IDR: 'Rp',
  PHP: '₱',
  VND: '₫',
  TWD: 'NT$',
  PKR: '₨',
  BDT: '৳',
  LKR: 'Rs',
  NPR: '₨',

  // Middle East
  AED: 'د.إ',
  SAR: '﷼',
  QAR: '﷼',
  KWD: 'د.ك',
  BHD: 'د.ب',
  OMR: '﷼',
  JOD: 'د.ا',
  ILS: '₪',

  // South America
  BRL: 'R$',
  ARS: '$',
  CLP: '$',
  COP: '$',
  PEN: 'S/',
  UYU: '$U',

  // Africa
  ZAR: 'R',
  EGP: '£',
  NGN: '₦',
  KES: 'KSh',
  GHS: '₵',
  TND: 'د.ت',
  MAD: 'د.م.',
}

export function StoreSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null)

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch('/api/storefront/settings')
        if (response.ok) {
          const data = await response.json()
          setSettings(data)
        }
      } catch (error) {
        console.error('Failed to fetch store settings:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  // Fetch exchange rates when currency changes
  useEffect(() => {
    async function fetchRates() {
      try {
        const response = await fetch('/api/currency/rates?base=USD')
        if (response.ok) {
          const rates = await response.json()
          setExchangeRates(rates)
        }
      } catch (error) {
        console.error('Failed to fetch exchange rates:', error)
      }
    }

    if (settings.currency !== 'USD') {
      fetchRates()
    }
  }, [settings.currency])

  const getCurrencySymbol = () => {
    return currencySymbols[settings.currency] || settings.currency
  }

  const formatPrice = (price: number) => {
    const symbol = getCurrencySymbol()

    // If currency is not USD and we have exchange rates, convert the price
    if (settings.currency !== 'USD' && exchangeRates) {
      const rate = exchangeRates.rates[settings.currency] || 1
      const convertedPrice = price * rate
      return `${symbol}${convertedPrice.toFixed(2)}`
    }

    return `${symbol}${price.toFixed(2)}`
  }

  return (
    <StoreSettingsContext.Provider value={{ settings, loading, formatPrice, getCurrencySymbol }}>
      {children}
    </StoreSettingsContext.Provider>
  )
}

export const useStoreSettings = () => useContext(StoreSettingsContext)
