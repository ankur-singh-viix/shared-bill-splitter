import { CURRENCIES } from '../../api'
import { useCurrency } from '../../context/CurrencyContext'
import { CURRENCY_SYMBOLS } from '../../format'

/** Chooses the currency pre-selected for new bills. Existing bills keep their own currency. */
export function CurrencySelect() {
  const { currency, setCurrency } = useCurrency()

  return (
    <fieldset
      className="segmented"
      title="Default currency for new bills. Existing bills keep their own currency."
    >
      <legend className="sr-only">Default currency for new bills</legend>
      <span className="segmented-label" aria-hidden="true">
        New bills
      </span>
      {CURRENCIES.map((option) => (
        <button
          key={option}
          type="button"
          className={option === currency ? 'seg active' : 'seg'}
          aria-pressed={option === currency}
          onClick={() => setCurrency(option)}
        >
          {option} {CURRENCY_SYMBOLS[option]}
        </button>
      ))}
    </fieldset>
  )
}
