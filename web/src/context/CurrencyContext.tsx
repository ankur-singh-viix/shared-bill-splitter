import { createContext, type ReactNode, useContext, useEffect, useState } from 'react'
import { CURRENCIES, type Currency } from '../api'

const STORAGE_KEY = 'bill-splitter-currency'

type CurrencyValue = { currency: Currency; setCurrency: (currency: Currency) => void }

const CurrencyContext = createContext<CurrencyValue | null>(null)

function readStoredCurrency(): Currency {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return CURRENCIES.find((currency) => currency === saved) ?? 'INR'
  } catch {
    return 'INR'
  }
}

/** The preferred currency for NEW bills. It never changes how existing bills are shown. */
export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>(readStoredCurrency)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, currency)
    } catch {
      // Ignore: the preference simply will not survive a reload.
    }
  }, [currency])

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency(): CurrencyValue {
  const value = useContext(CurrencyContext)
  if (!value) throw new Error('useCurrency must be used inside CurrencyProvider')
  return value
}
