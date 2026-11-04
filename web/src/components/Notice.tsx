import type { ReactNode } from 'react'

export type NoticeKind = 'error' | 'success' | 'info'

export function Notice({ kind, children }: { kind: NoticeKind; children: ReactNode }) {
  return (
    <p className={`notice notice-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      {children}
    </p>
  )
}
