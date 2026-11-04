import { useCallback, useState } from 'react'
import { Icon } from './Icon'

export type ToastKind = 'success' | 'error'
type Toast = { id: number; kind: ToastKind; text: string }

const TOAST_MS = 5000
let nextId = 1

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const push = useCallback(
    (kind: ToastKind, text: string) => {
      const id = nextId++
      setToasts((current) => [...current, { id, kind, text }])
      setTimeout(() => dismiss(id), TOAST_MS)
    },
    [dismiss],
  )

  return { toasts, push, dismiss }
}

export function ToastRegion({
  toasts,
  onDismiss,
}: {
  toasts: Toast[]
  onDismiss: (id: number) => void
}) {
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.kind}`}>
          <Icon name={toast.kind === 'success' ? 'check' : 'alert'} />
          <span>{toast.text}</span>
          <button
            type="button"
            className="icon-btn"
            aria-label="Dismiss notification"
            onClick={() => onDismiss(toast.id)}
          >
            <Icon name="close" size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
