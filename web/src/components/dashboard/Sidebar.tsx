import { Icon, type IconName } from '../Icon'

export type Section = 'overview' | 'bills' | 'members' | 'balances' | 'settings'

const ITEMS: { id: Section; label: string; icon: IconName }[] = [
  { id: 'overview', label: 'Overview', icon: 'overview' },
  { id: 'bills', label: 'Bills', icon: 'bills' },
  { id: 'members', label: 'Members', icon: 'members' },
  { id: 'balances', label: 'Balances', icon: 'balances' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
]

type Props = {
  section: Section
  open: boolean
  onSelect: (section: Section) => void
  onClose: () => void
}

export function Sidebar({ section, open, onSelect, onClose }: Props) {
  return (
    <>
      {open && <button type="button" className="scrim" aria-label="Close menu" onClick={onClose} />}
      <aside className={open ? 'sidebar open' : 'sidebar'}>
        <div className="brand">
          <span className="brand-mark">
            <Icon name="logo" size={20} />
          </span>
          <span className="brand-name">Shared Bill Splitter</span>
        </div>
        <nav aria-label="Sections">
          <ul className="nav">
            {ITEMS.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={item.id === section ? 'nav-item active' : 'nav-item'}
                  aria-current={item.id === section ? 'page' : undefined}
                  onClick={() => onSelect(item.id)}
                >
                  <span className="nav-icon">
                    <Icon name={item.icon} />
                  </span>
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  )
}
