import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

const ToastContext = createContext(null)
const ConfirmContext = createContext(null)

// Tiny notification system: toast('Saved!') or toast('Oops', 'error')
// plus a styled confirm dialog: if (await confirm('Delete this?')) { ... }
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const [dialog, setDialog] = useState(null)
  const okRef = useRef(null)

  const toast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, message, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }, [])

  const confirm = useCallback((message, okLabel = 'Yes, continue') =>
    new Promise((resolve) => setDialog({ message, okLabel, resolve })), [])

  const close = (answer) => { dialog?.resolve(answer); setDialog(null) }

  useEffect(() => {
    if (!dialog) return
    okRef.current?.focus()
    const onKey = (e) => { if (e.key === 'Escape') close(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })

  return (
    <ToastContext.Provider value={toast}>
      <ConfirmContext.Provider value={confirm}>
        {children}
        {dialog && (
          <div className="ff-modal-backdrop" onClick={() => close(false)}>
            <div className="ff-modal ff-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
              <div className="ff-stat-icon tone-terracotta mb-3"><i className="bi bi-question-lg" /></div>
              <p className="fw-semibold fs-6 mb-4">{dialog.message}</p>
              <div className="d-flex gap-2 justify-content-end">
                <button className="btn btn-soft" onClick={() => close(false)}>Cancel</button>
                <button ref={okRef} className="btn btn-primary" onClick={() => close(true)}>{dialog.okLabel}</button>
              </div>
            </div>
          </div>
        )}
        <div className="ff-toasts" aria-live="polite">
          {toasts.map((t) => (
            <div key={t.id} className={`ff-toast ${t.type}`}>
              <i className={`bi ${t.type === 'error' ? 'bi-exclamation-circle' : 'bi-check-circle-fill'}`} />
              {t.message}
            </div>
          ))}
        </div>
      </ConfirmContext.Provider>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
export const useConfirm = () => useContext(ConfirmContext)
