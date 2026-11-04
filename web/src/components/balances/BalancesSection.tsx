import { type Balance, CURRENCIES } from '../../api'
import { formatMoney, initials } from '../../format'
import { Icon } from '../Icon'

export function BalancesSection({ balances }: { balances: Balance[] }) {
  const totals = CURRENCIES.map((currency) => ({
    currency,
    amount: balances.reduce((sum, balance) => sum + balance.outstandingByCurrency[currency], 0),
  }))

  return (
    <section aria-labelledby="balances-title">
      <div className="section-head">
        <h2 id="balances-title">Outstanding balances</h2>
      </div>
      {balances.length === 0 ? (
        <div className="empty-state card">
          <Icon name="balances" size={28} />
          <h3>Nothing to show</h3>
          <p className="muted">Balances appear once the home has members.</p>
        </div>
      ) : (
        <div className="card table-card">
          <div className="row row-head" aria-hidden="true">
            <span className="cell-name">Member</span>
            {CURRENCIES.map((currency) => (
              <span key={currency} className="cell-money">
                {currency}
              </span>
            ))}
          </div>
          <ul>
            {balances.map((balance) => (
              <li key={balance.memberId} className="row">
                <span className="cell-name">
                  <span className="avatar avatar-sm">{initials(balance.name)}</span>
                  <span className="truncate" title={balance.name}>
                    {balance.name}
                  </span>
                </span>
                {CURRENCIES.map((currency) => {
                  const amount = balance.outstandingByCurrency[currency]
                  return (
                    <span key={currency} className="cell-money">
                      <span className="cell-caption">{currency}</span>
                      <span className={amount > 0 ? 'amount owes' : 'amount muted-amount'}>
                        {formatMoney(amount, currency)}
                      </span>
                    </span>
                  )
                })}
              </li>
            ))}
          </ul>
          <div className="row row-total">
            <span className="cell-name">Total outstanding</span>
            {totals.map(({ currency, amount }) => (
              <span key={currency} className="cell-money">
                <span className="cell-caption">{currency}</span>
                <span className="amount">{formatMoney(amount, currency)}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
