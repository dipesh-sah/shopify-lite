// Currency conversion service with caching
// Uses exchangerate-api.io for live exchange rates

interface ExchangeRates {
  base: string
  rates: Record<string, number>
  timestamp: number
}

let cachedRates: ExchangeRates | null = null
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Fetch exchange rates from API or cache
 */
export async function getExchangeRates(baseCurrency: string = 'USD'): Promise<ExchangeRates> {
  // Check if we have valid cached rates
  if (cachedRates && cachedRates.base === baseCurrency && Date.now() - cachedRates.timestamp < CACHE_DURATION) {
    return cachedRates
  }

  try {
    // Use exchangerate-api.io free tier
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`)

    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates')
    }

    const data = await response.json()

    cachedRates = {
      base: baseCurrency,
      rates: data.rates,
      timestamp: Date.now()
    }

    return cachedRates
  } catch (error) {
    console.error('Error fetching exchange rates:', error)

    // Return fallback rates if API fails
    return {
      base: 'USD',
      rates: {
        // North America
        USD: 1,
        CAD: 1.35,
        MXN: 17.05,

        // Europe
        EUR: 0.92,
        GBP: 0.79,
        CHF: 0.88,
        SEK: 10.45,
        NOK: 10.68,
        DKK: 6.87,
        PLN: 3.98,
        CZK: 22.85,
        HUF: 354.20,
        RON: 4.57,
        BGN: 1.80,
        HRK: 6.93,
        ISK: 137.50,
        TRY: 32.15,
        RUB: 92.50,

        // Asia-Pacific
        JPY: 149.50,
        CNY: 7.24,
        INR: 83.12,
        AUD: 1.52,
        NZD: 1.65,
        SGD: 1.34,
        HKD: 7.82,
        KRW: 1315.80,
        THB: 35.45,
        MYR: 4.62,
        IDR: 15685.50,
        PHP: 56.35,
        VND: 24485.00,
        TWD: 31.45,
        PKR: 279.50,
        BDT: 109.75,
        LKR: 326.80,
        NPR: 133.00,

        // Middle East
        AED: 3.67,
        SAR: 3.75,
        QAR: 3.64,
        KWD: 0.31,
        BHD: 0.38,
        OMR: 0.38,
        JOD: 0.71,
        ILS: 3.65,

        // South America
        BRL: 4.98,
        ARS: 985.50,
        CLP: 965.80,
        COP: 3925.40,
        PEN: 3.76,
        UYU: 39.42,

        // Africa
        ZAR: 18.75,
        EGP: 48.95,
        NGN: 1545.80,
        KES: 129.45,
        GHS: 15.85,
        TND: 3.10,
        MAD: 10.05,
      },
      timestamp: Date.now()
    }
  }
}

/**
 * Convert price from one currency to another
 */
export function convertPrice(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: ExchangeRates
): number {
  if (fromCurrency === toCurrency) {
    return amount
  }

  // If converting from base currency
  if (fromCurrency === rates.base) {
    return amount * (rates.rates[toCurrency] || 1)
  }

  // If converting to base currency
  if (toCurrency === rates.base) {
    return amount / (rates.rates[fromCurrency] || 1)
  }

  // Convert via base currency
  const inBase = amount / (rates.rates[fromCurrency] || 1)
  return inBase * (rates.rates[toCurrency] || 1)
}

/**
 * Format price with currency conversion
 */
export function formatConvertedPrice(
  amount: number,
  baseCurrency: string,
  targetCurrency: string,
  rates: ExchangeRates,
  currencySymbols: Record<string, string>
): string {
  const converted = convertPrice(amount, baseCurrency, targetCurrency, rates)
  const symbol = currencySymbols[targetCurrency] || targetCurrency
  return `${symbol}${converted.toFixed(2)}`
}
