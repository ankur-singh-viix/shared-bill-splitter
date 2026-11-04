import { createRootRoute, Outlet } from '@tanstack/react-router'
import { CurrencyProvider } from '../context/CurrencyContext'
import { ThemeProvider } from '../context/ThemeContext'

export const Route = createRootRoute({
  component: () => (
    <ThemeProvider>
      <CurrencyProvider>
        <Outlet />
      </CurrencyProvider>
    </ThemeProvider>
  ),
})
