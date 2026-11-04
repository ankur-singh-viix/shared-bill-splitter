import { useTheme } from '../../context/ThemeContext'
import { CurrencySelect } from '../theme/CurrencySelect'

export function SettingsSection() {
  const { theme, setTheme } = useTheme()

  return (
    <section aria-labelledby="settings-title">
      <div className="section-head">
        <h2 id="settings-title">Settings</h2>
      </div>
      <div className="card table-card">
        <div className="settings-row">
          <div>
            <h3>Theme</h3>
            <p className="muted">Saved in this browser.</p>
          </div>
          <fieldset className="segmented">
            <legend className="sr-only">Theme</legend>
            {(['dark', 'light'] as const).map((option) => (
              <button
                key={option}
                type="button"
                className={option === theme ? 'seg active' : 'seg'}
                aria-pressed={option === theme}
                onClick={() => setTheme(option)}
              >
                {option === 'dark' ? 'Dark' : 'Light'}
              </button>
            ))}
          </fieldset>
        </div>
        <div className="settings-row">
          <div>
            <h3>Default currency</h3>
            <p className="muted">
              Pre-selected for new bills. Existing bills keep their own currency; nothing is
              converted.
            </p>
          </div>
          <CurrencySelect />
        </div>
      </div>
    </section>
  )
}
