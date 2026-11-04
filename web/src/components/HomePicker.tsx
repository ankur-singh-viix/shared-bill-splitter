import { type FormEvent, useState } from 'react'
import { api, describeError } from '../api'
import { Icon } from './Icon'
import { Notice } from './Notice'
import { ThemeToggle } from './theme/ThemeToggle'

export function HomePicker({ onSelect }: { onSelect: (homeId: string) => void }) {
  const [homeId, setHomeId] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function open(event: FormEvent) {
    event.preventDefault()
    const trimmed = homeId.trim()
    if (trimmed) onSelect(trimmed)
  }

  async function create(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setBusy(true)
    setError(null)
    try {
      const home = await api.createHome(trimmed)
      onSelect(home.id)
    } catch (err) {
      setError(describeError(err))
      setBusy(false)
    }
  }

  return (
    <div className="landing">
      <div className="landing-top">
        <span className="brand">
          <span className="brand-mark">
            <Icon name="logo" size={20} />
          </span>
          <span className="brand-name">Shared Bill Splitter</span>
        </span>
        <ThemeToggle />
      </div>
      <div className="landing-body">
        <h1>Split bills fairly. Settle up clearly.</h1>
        <p className="muted">
          Create a home, add the people who share it, and track every share in INR or USD.
        </p>
        <div className="landing-cards">
          <form className="card lift form" onSubmit={create}>
            <div>
              <h2>Create a new home</h2>
              <p className="muted">Name your household. You add its members next.</p>
            </div>
            <label className="field">
              <span>Home name</span>
              <input
                value={name}
                maxLength={100}
                placeholder="e.g. Flat 4B"
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            {error && <Notice kind="error">{error}</Notice>}
            <button
              type="submit"
              className="btn btn-primary btn-lg btn-block"
              disabled={busy || !name.trim()}
              aria-busy={busy}
            >
              {busy && <span className="btn-spinner" aria-hidden="true" />}
              {busy ? 'Creating…' : 'Create home'}
            </button>
          </form>
          <form className="card lift form" onSubmit={open}>
            <div>
              <h2>Open an existing home</h2>
              <p className="muted">Paste the Home ID from the dashboard header.</p>
            </div>
            <label className="field">
              <span>Home ID</span>
              <input
                value={homeId}
                placeholder="Paste a home ID"
                onChange={(event) => setHomeId(event.target.value)}
              />
            </label>
            <button
              type="submit"
              className="btn btn-ghost btn-lg btn-block"
              disabled={!homeId.trim()}
            >
              Open home
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
