import { type Bill, CURRENCIES, type Currency } from './api'

export type CurrencyTotals = { billed: number; paid: number; outstanding: number }
export type Summary = {
  billCount: number
  openBillCount: number
  totals: Record<Currency, CurrencyTotals>
}

/** Totals per currency, in minor units. INR and USD are tracked separately and never added. */
export function summarize(bills: Bill[]): Summary {
  const totals = Object.fromEntries(
    CURRENCIES.map((currency) => [currency, { billed: 0, paid: 0, outstanding: 0 }]),
  ) as Record<Currency, CurrencyTotals>

  let openBillCount = 0
  for (const bill of bills) {
    const bucket = totals[bill.currency]
    bucket.billed += bill.totalCents
    let hasUnpaid = false
    for (const share of bill.shares) {
      if (share.paidAt) bucket.paid += share.amountCents
      else {
        bucket.outstanding += share.amountCents
        hasUnpaid = true
      }
    }
    if (hasUnpaid) openBillCount++
  }
  return { billCount: bills.length, openBillCount, totals }
}
