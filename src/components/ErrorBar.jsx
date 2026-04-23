export default function ErrorBar({ message, onClose }) {
  return (
    <div style={{
      background: 'var(--red-l)', color: 'var(--red)',
      padding: '9px 14px', borderRadius: 8, marginBottom: 14,
      fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    }}>
      <span>⚠ {message}</span>
      <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--red)', fontSize: 16 }}>✕</button>
    </div>
  )
}
