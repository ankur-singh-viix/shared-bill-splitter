import { type FormEvent, useState } from 'react'
import { describeError } from '../../api'
import { Notice } from '../Notice'

type Props = { onSubmit: (name: string) => Promise<void>; onDone: () => void }

export function AddMemberForm({ onSubmit, onDone }: Props) {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Enter a name for the member.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onSubmit(trimmed)
      onDone()
    } catch (err) {
      setError(describeError(err))
      setBusy(false)
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label className="field">
        <span>Member name</span>
        <input
          value={name}
          maxLength={100}
          placeholder="e.g. Asha"
          // biome-ignore lint/a11y/noAutofocus: the dialog has a single field and opens on demand
          autoFocus
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      {error && <Notice kind="error">{error}</Notice>}
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onDone}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={busy} aria-busy={busy}>
          {busy && <span className="btn-spinner" aria-hidden="true" />}
          {busy ? 'Adding…' : 'Add member'}
        </button>
      </div>
    </form>
  )
}
