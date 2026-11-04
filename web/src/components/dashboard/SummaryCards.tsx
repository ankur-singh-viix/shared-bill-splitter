import { CURRENCIES } from '../../api'
import { formatMoney } from '../../format'
import type { CurrencyTotals, Summary } from '../../summary'

function MoneyLines({ summary, pick }: { summary: Summary; pick: keyof CurrencyTotals }) {
  return (
    <ul className="money-lines">
      {CURRENCIES.map((currency) => (
        <li key={currency}>
          <span className="currency-tag">{currency}</span>
          <span className="amount">{formatMoney(summary.totals[currency][pick], currency)}</span>
        </li>
      ))}
    </ul>
  )
}

export function SummaryCards({ summary }: { summary: Summary }) {
  return (
    <div className="summary-grid">
      <section className="card lift tilt" aria-label="Total billed">
        <h3 className="card-label">Total billed</h3>
        <MoneyLines summary={summary} pick="billed" />
      </section>
      <section className="card lift tilt" aria-label="Total paid">
        <h3 className="card-label">Total paid</h3>
        <MoneyLines summary={summary} pick="paid" />
      </section>
      <section className="card lift tilt card-emphasis" aria-label="Total outstanding">
        <h3 className="card-label">Total outstanding</h3>
        <MoneyLines summary={summary} pick="outstanding" />
      </section>
      <section className="card lift" aria-label="Bills">
        <h3 className="card-label">Bills</h3>
        <p className="big-number">{summary.billCount}</p>
        <p className="muted">
          {summary.openBillCount} open · {summary.billCount - summary.openBillCount} settled
        </p>
      </section>
    </div>
  )
}
