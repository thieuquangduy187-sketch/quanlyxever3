export default function LoadingScreen() {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--bg-grouped)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 14, zIndex: 9999
    }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--brand)' }}>HSG</div>
      <div style={{
        width: 30, height: 30, border: '3px solid var(--border)',
        borderTopColor: 'var(--brand)', borderRadius: '50%',
        animation: 'spin .65s linear infinite'
      }} />
      <div style={{ color: 'var(--ink3)', fontSize: 13 }}>Đang tải dữ liệu từ Google Sheets...</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
