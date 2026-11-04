import { useEffect, useState } from 'react'
import { Icon } from '../Icon'
import { CurrencySelect } from '../theme/CurrencySelect'
import { ThemeToggle } from '../theme/ThemeToggle'

type Props = {
  homeId: string
  homeName: string
  onOpenMenu: () => void
  onSwitchHome: () => void
}

export function Header({ homeId, homeName, onOpenMenu, onSwitchHome }: Props) {
  const [copied, setCopied] = useState<'idle' | 'copied' | 'failed'>('idle')

  useEffect(() => {
    if (copied === 'idle') return
    const timer = setTimeout(() => setCopied('idle'), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  async function copyId() {
    try {
      await navigator.clipboard.writeText(homeId)
      setCopied('copied')
    } catch {
      setCopied('failed')
    }
  }

  return (
    <header className="topbar">
      <button
        type="button"
        className="icon-btn menu-btn"
        aria-label="Open menu"
        onClick={onOpenMenu}
      >
        <Icon name="menu" />
      </button>
      <div className="topbar-home">
        <h1 className="truncate" title={homeName}>
          {homeName}
        </h1>
        <p className="home-id">
          <code title={homeId}>{homeId}</code>
          <button type="button" className="chip-btn" onClick={() => void copyId()}>
            <Icon name={copied === 'copied' ? 'check' : 'copy'} size={14} />
            {copied === 'copied' ? 'Copied' : copied === 'failed' ? 'Copy failed' : 'Copy ID'}
          </button>
        </p>
      </div>
      <div className="topbar-actions">
        <CurrencySelect />
        <button
          type="button"
          className="btn btn-ghost"
          aria-label="Switch home"
          title="Switch home"
          onClick={onSwitchHome}
        >
          <Icon name="swap" size={16} />
          <span className="btn-label">Switch home</span>
        </button>
        <ThemeToggle />
      </div>
    </header>
  )
}
