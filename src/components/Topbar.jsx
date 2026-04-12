const TITLES = { overview: 'Tổng quan', xe_tai: 'Xe tải', oto_con: 'Ô tô con', cua_hang: 'Cửa hàng' }

export default function Topbar({ page, refreshing }) {
  return (
    <header style={{
      height: 54, background: '#fff', borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', padding: '0 22px', gap: 12,
      position: 'sticky', top: 0, zIndex: 50
    }}>
      <div style={{ fontSize: 15, fontWeight: 600, flex: 1 }}>{TITLES[page] || page}</div>
      {refreshing && <span style={{ fontSize: 11, color: 'var(--ink3)' }}>⟳ Đang cập nhật...</span>}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        background: 'var(--brand-l)', color: 'var(--brand)',
        fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%', background: 'var(--green)',
          animation: 'pulse 2s infinite'
        }} />
        Live
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
      </div>
    </header>
  )
}
