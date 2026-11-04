import { type FormEvent, useState } from 'react'
import { CURRENCIES, type Currency, describeError } from '../../api'
import { useCurrency } from '../../context/CurrencyContext'
import { CURRENCY_SYMBOLS, parseAmountToMinor } from '../../format'
import { Notice } from '../Notice'

type Props = {
  onSubmit: (title: string, totalCents: number, currency: Currency) => Promise<void>
  onDone: () => void
}

export function BillForm({ onSubmit, onDone }: Props) {
  const preferred = useCurrency().currency
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<Currency>(preferred)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = title.trim()
    const minor = parseAmountToMinor(amount)
    if (!trimmed) return setError('Enter a title for the bill.')
    if (minor === null) return setError('Enter an amount greater than zero, like 1250 or 1250.50.')
    setBusy(true)
    setError(null)
    try {
      await onSubmit(trimmed, minor, currency)
      onDone()
    } catch (err) {
      setError(describeError(err))
      setBusy(false)
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label className="field">
        <span>Title</span>
        <input
          value={title}
          maxLength={200}
          placeholder="e.g. Electricity"
          // biome-ignore lint/a11y/noAutofocus: the dialog opens on demand and starts at its first field
          autoFocus
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>
      <div className="field-row">
        <label className="field">
          <span>Amount ({CURRENCY_SYMBOLS[currency]})</span>
          <input
            value={amount}
            inputMode="decimal"
            placeholder="0.00"
            onChange={(event) => setAmount(event.target.value)}
          />
        </label>
        <label className="field">
          <span>Currency</span>
          <select
            value={currency}
            onChange={(event) => {
              const next = CURRENCIES.find((option) => option === event.target.value)
              if (next) setCurrency(next)
            }}
          >
            {CURRENCIES.map((option) => (
              <option key={option} value={option}>
                {option} {CURRENCY_SYMBOLS[option]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="muted">
        The bill is split equally between all members and stays in {currency}. Nothing is converted.
      </p>
      {error && <Notice kind="error">{error}</Notice>}
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onDone}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={busy} aria-busy={busy}>
          {busy && <span className="btn-spinner" aria-hidden="true" />}
          {busy ? 'Splitting…' : 'Split bill'}
        </button>
      </div>
    </form>
  )
}
