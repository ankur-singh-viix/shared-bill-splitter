import type { Currency } from './api'

// INR uses the Indian digit grouping (₹1,25,000.00); USD uses US grouping ($1,250.00).
const FORMATTERS: Record<Currency, Intl.NumberFormat> = {
  INR: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }),
  USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
}

export const CURRENCY_SYMBOLS: Record<Currency, string> = { INR: '₹', USD: '$' }

/** Formats minor units (paise / cents) in the given currency. No conversion between currencies. */
export function formatMoney(minorUnits: number, currency: Currency): string {
  return FORMATTERS[currency].format(minorUnits / 100)
}

/** Converts "12", "12.5" or "12.50" to minor units without floating point. Null if invalid. */
export function parseAmountToMinor(input: string): number | null {
  const match = /^(\d{1,12})(?:\.(\d{1,2}))?$/.exec(input.trim())
  if (!match?.[1]) return null
  const minor = Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'))
  return minor > 0 && Number.isSafeInteger(minor) ? minor : null
}

export function formatDate(iso: string): string | null {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export function initials(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
  return letters.join('') || '?'
}
