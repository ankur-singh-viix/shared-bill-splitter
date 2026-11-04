import { useCallback, useEffect, useRef, useState } from 'react'
import { api, type Balance, describeError, type HomeDetails } from './api'

type HomeState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; home: HomeDetails; balances: Balance[] }

/** Loads a home with its bills and balances. `refresh` reloads without the loading screen. */
export function useHome(homeId: string) {
  const [state, setState] = useState<HomeState>({ status: 'loading' })
  const [refreshError, setRefreshError] = useState<string | null>(null)
  const latest = useRef(0)

  const load = useCallback(
    async (showLoading: boolean) => {
      const requestId = ++latest.current
      if (showLoading) setState({ status: 'loading' })
      try {
        const [home, balances] = await Promise.all([api.getHome(homeId), api.getBalances(homeId)])
        if (requestId === latest.current) {
          setState({ status: 'ready', home, balances: balances.balances })
          setRefreshError(null)
        }
      } catch (err) {
        if (requestId !== latest.current) return
        const message = describeError(err)
        // Keep showing the last good data if a background refresh fails.
        setState((previous) =>
          previous.status === 'ready' && !showLoading ? previous : { status: 'error', message },
        )
        if (!showLoading) setRefreshError(message)
      }
    },
    [homeId],
  )

  useEffect(() => {
    void load(true)
    return () => {
      latest.current++
    }
  }, [load])

  return { state, refreshError, reload: () => load(true), refresh: () => load(false) }
}
