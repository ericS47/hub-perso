import { useEffect, useRef, type ReactNode } from 'react'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
}

// Panneau modal qui monte du bas de l'écran (Échap ou fond pour fermer).
export default function Sheet({ title, onClose, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="sheet-body">
        <header className="sheet-head">
          <h2>{title}</h2>
          <button type="button" className="link-btn" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </header>
        {children}
      </div>
    </dialog>
  )
}
