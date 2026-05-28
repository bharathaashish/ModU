export default function ConfirmModal({ isOpen, title, message, confirmLabel = 'Delete', cancelLabel = 'Cancel', onConfirm, onCancel, danger = true }) {
  if (!isOpen) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 3000, padding: '20px'
    }} onClick={onCancel}>
      <div style={{
        backgroundColor: 'var(--card-bg)', borderRadius: '16px',
        padding: '24px', width: '100%', maxWidth: '360px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        animation: 'slideUp 0.2s ease'
      }} onClick={e => e.stopPropagation()}>
        {title && <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-color)' }}>{title}</h3>}
        {message && <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.5' }}>{message}</p>}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} className="btn-secondary" style={{ padding: '10px 20px', fontSize: '14px' }}>
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="btn-primary"
            style={{
              backgroundColor: danger ? '#ef4444' : 'var(--primary-color)',
              boxShadow: danger ? '0 4px 12px rgba(239,68,68,0.3)' : undefined
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}