"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { getSettingsAction } from "@/actions/settings"

interface StoreSettings {
  currency: string
  currencySymbol: string
  storeName: string
  timezone: string
  freeShippingThreshold?: number
}

interface StoreSettingsContextType {
  settings: StoreSettings
  formatPrice: (amount: number | string) => string
  refreshSettings: () => Promise<void>
  loading: boolean
}

const defaultSettings: StoreSettings = {
  currency: "USD",
  currencySymbol: "$",
  storeName: "My Store",
  timezone: "UTC",
}

const StoreSettingsContext = createContext<StoreSettingsContextType>({
  settings: defaultSettings,
  formatPrice: (amount) => `$${Number(amount).toFixed(2)}`,
  refreshSettings: async () => { },
  loading: true,
})

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹",
  JPY: "¥",
  CAD: "C$",
  AUD: "A$",
  CNY: "¥",
}

const CURRENCY_LOCALES: Record<string, string> = {
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  INR: "en-IN",
  JPY: "ja-JP",
  CAD: "en-CA",
  AUD: "en-AU",
  CNY: "zh-CN",
}

export function StoreSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)

  const refreshSettings = async () => {
    try {
      const general = await getSettingsAction("general")
      if (general) {
        const currency = general.currency || "USD"
        setSettings({
          currency,
          currencySymbol: CURRENCY_SYMBOLS[currency] || "$",
          storeName: general.storeName || "My Store",
          timezone: general.timezone || "UTC",
          freeShippingThreshold: general.freeShippingThreshold,
        })
      }
    } catch (error) {
      console.error("Failed to load store settings", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshSettings()
  }, [])

  const formatPrice = (amount: number | string) => {
    const num = Number(amount)
    if (isNaN(num)) return `${settings.currencySymbol}0.00`

    const locale = CURRENCY_LOCALES[settings.currency] || "en-US"

    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: settings.currency,
      minimumFractionDigits: 2,
    }).format(num)
  }

  return (
    <StoreSettingsContext.Provider value={{ settings, formatPrice, refreshSettings, loading }}>
      {children}
    </StoreSettingsContext.Provider>
  )
}

export const useStoreSettings = () => useContext(StoreSettingsContext)
