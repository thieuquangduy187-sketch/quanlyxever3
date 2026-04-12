const LOGO_URL = 'https://lh3.googleusercontent.com/d/1gnI72gZVm9cegVnbAWjRInk3_3Ouigqm'

const NAV = [
  { id: 'overview',  icon: '◉',  label: 'Tổng quan' },
  { id: 'xe_tai',    icon: '🚛', label: 'Xe tải',    badgeKey: 'xeTai' },
  { id: 'oto_con',   icon: '🚗', label: 'Ô tô con',  badgeKey: 'otocon' },
  { id: 'cua_hang',  icon: '🏪', label: 'Cửa hàng',  badgeKey: 'cuaHang' },
]

export default function Sidebar({ page, onNav, data, refreshing, onRefresh, lastUpdated }) {
  return (
    <aside style={{
      width: 'var(--sw)', background: '#1A1A1A', position: 'fixed',
      top: 0, left: 0, bottom: 0, display: 'flex', flexDirection: 'column',
      zIndex: 100, overflowY: 'auto'
    }}>
      {/* Logo */}
      <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 8, background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, overflow: 'hidden', padding: 3
          }}>
            <img src={LOGO_URL} alt="HSG"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={e => { e.target.style.display='none'; e.target.parentElement.innerHTML='<span style="font-size:13px;font-weight:700;color:var(--brand)">HSG</span>'; }}
            />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', lineHeight: 1.3 }}>Danh sách xe</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)' }}>Hoa Sen Home</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px' }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.08em', color: 'rgba(255,255,255,.25)', textTransform: 'uppercase', padding: '10px 10px 4px' }}>Menu chính</div>
        {NAV.map(item => {
          const stats = data && item.badgeKey && data[item.badgeKey]?.stats
          const badge = stats?.total
          const active = page === item.id
          return (
            <button key={item.id}
              onClick={() => onNav(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '9px 11px', borderRadius: 8, cursor: 'pointer',
                color: active ? '#FF7A50' : 'rgba(255,255,255,.5)',
                fontSize: 12.5, fontWeight: 500,
                border: 'none', width: '100%', textAlign: 'left',
                fontFamily: 'inherit', transition: 'all .12s', marginBottom: 1,
                background: active ? 'rgba(212,66,10,.2)' : 'transparent',
              }}
            >
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              <span>{item.label}</span>
              {badge && (
                <span style={{
                  marginLeft: 'auto', background: 'var(--brand)', color: '#fff',
                  fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10
                }}>{badge}</span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '10px 8px 14px', borderTop: '1px solid rgba(255,255,255,.07)' }}>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          style={{
            display: 'flex', alignItems: 'center', gap: 7, width: '100%',
            padding: '9px 11px', borderRadius: 8, background: 'rgba(255,255,255,.05)',
            border: 'none', cursor: refreshing ? 'not-allowed' : 'pointer',
            color: 'rgba(255,255,255,.45)', fontSize: 12, fontFamily: 'inherit',
            opacity: refreshing ? .5 : 1
          }}
        >
          <span>{refreshing ? '⟳' : '↻'}</span>
          <span>{refreshing ? 'Đang cập nhật...' : 'Làm mới dữ liệu'}</span>
        </button>
        {lastUpdated && (
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,.22)', padding: '5px 11px 0' }}>
            Cập nhật: {lastUpdated}
          </div>
        )}
      </div>
    </aside>
  )
}
