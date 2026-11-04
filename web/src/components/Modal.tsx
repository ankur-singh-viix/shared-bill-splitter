import { type ReactNode, useEffect, useId, useRef } from 'react'
import { Icon } from './Icon'

type Props = { title: string; open: boolean; onClose: () => void; children: ReactNode }

/** Native <dialog>: focus trapping, Escape to close and the backdrop come from the browser. */
export function Modal({ title, open, onClose, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog ref={ref} className="modal" aria-labelledby={titleId} onClose={onClose}>
      {open && (
        <div className="modal-body">
          <header className="modal-header">
            <h2 id={titleId}>{title}</h2>
            <button type="button" className="icon-btn" aria-label="Close dialog" onClick={onClose}>
              <Icon name="close" />
            </button>
          </header>
          {children}
        </div>
      )}
    </dialog>
  )
}
