import { useTheme } from '../../context/ThemeContext'
import { Icon } from '../Icon'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const next = theme === 'dark' ? 'light' : 'dark'

  return (
    <button
      type="button"
      className="icon-btn theme-toggle"
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      onClick={toggleTheme}
    >
      <span className="theme-icon" key={theme}>
        <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
      </span>
    </button>
  )
}
