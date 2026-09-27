import { useEffect, useId } from 'react'
import { X } from 'lucide-react'

export function Modal({ title, children, footer, onClose, size = 'md' }) {
  const titleId = useId()
  useEffect(() => {
    const escape = event => { if (event.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [onClose])
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose?.()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId} style={{ maxWidth: size === 'lg' ? 640 : size === 'sm' ? 360 : 480 }}>
        <div className="modal-header">
          <span className="modal-title" id={titleId}>{title}</span>
          <button className="btn-ghost" aria-label="Close dialog" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}

export function ConfirmModal({ title, description, confirmLabel = 'Confirm', dangerConfirm, onConfirm, onCancel, loading }) {
  return (
    <Modal title={title} onClose={onCancel} footer={
      <>
        <button className="btn btn-secondary btn-sm" onClick={onCancel} disabled={loading}>Cancel</button>
        <button className={`btn btn-sm ${dangerConfirm ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={loading}>
          {loading ? 'Loading…' : confirmLabel}
        </button>
      </>
    }>
      <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>{description}</p>
    </Modal>
  )
}
