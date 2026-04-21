import { useState } from 'react'

const LOGO_URL = 'https://lh3.googleusercontent.com/d/1gnI72gZVm9cegVnbAWjRInk3_3Ouigqm'

const NAV = [
  { id: 'overview',    sf: '◉',  label: 'Tổng quan',      section: null },
  { id: 'xe_tai',      sf: '🚛', label: 'Xe tải',          section: 'QUẢN LÝ', badgeKey: 'xeTai', rowKey: 'xe_tai' },
  { id: 'oto_con',     sf: '🚗', label: 'Ô tô con',        section: null, badgeKey: 'otocon', rowKey: 'oto_con' },
  { id: 'graph',       sf: '🕸',  label: 'Sơ đồ mạng',     section: 'PHÂN TÍCH' },
]

const NAV_XE = [
  { id: 'nhat_trinh',  sf: '📋', label: 'Nhật trình xe',   section: null },
]

const S = {
  aside: {
    width: 'var(--sw)', background: 'rgba(28,28,30,0.96)',
    backdropFilter: 'blur(20px) saturate(1.8)',
    WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
    borderRight: '0.5px solid var(--sep)',
    position: 'fixed', top: 0, left: 0, bottom: 0,
    display: 'flex', flexDirection: 'column',
    zIndex: 100, overflowY: 'auto',
  },
  asideDark: {
    background: 'rgba(28,28,30,0.94)',
  },
  logo: {
    padding: '16px 16px 12px',
    borderBottom: '0.5px solid var(--sep)',
    display: 'flex', alignItems: 'center', gap: 10,
  },
  logoImg: {
    width: 32, height: 32, borderRadius: 8,
    background: '#fff', display: 'flex', alignItems: 'center',
    justifyContent: 'center', overflow: 'hidden', padding: 3, flexShrink: 0,
    boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
  },
  logoTitle: { fontSize: 15, fontWeight: 600, letterSpacing: -0.3 },
  logoSub:   { fontSize: 11, color: 'var(--label-secondary)', marginTop: 1 },
  nav:  { flex: 1, padding: '8px 0' },
  sectionLabel: {
    fontSize: 11, fontWeight: 600, letterSpacing: 0.06,
    color: 'var(--label-tertiary)', padding: '14px 20px 4px',
  },
  item: (active) => ({
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 14px', margin: '1px 8px', borderRadius: 9,
    cursor: 'pointer', fontSize: 14, fontWeight: active ? 600 : 400,
    color: active ? 'var(--apple-blue)' : 'var(--label-primary)',
    background: active ? 'rgba(0,122,255,0.1)' : 'transparent',
    border: 'none', width: 'calc(100% - 16px)', textAlign: 'left',
    fontFamily: 'inherit', transition: 'background .15s, color .15s',
    WebkitTapHighlightColor: 'transparent',
  }),
  icon: { fontSize: 15, width: 22, textAlign: 'center', flexShrink: 0 },
  badge: {
    marginLeft: 'auto', background: 'var(--apple-blue)',
    color: '#fff', fontSize: 11, fontWeight: 700,
    padding: '2px 7px', borderRadius: 10, minWidth: 22, textAlign: 'center',
  },
  spinner: {
    marginLeft: 'auto', width: 12, height: 12,
    border: '1.5px solid rgba(0,0,0,0.1)', borderTopColor: 'var(--apple-blue)',
    borderRadius: '50%', animation: 'spin .65s linear infinite',
  },
  footer: {
    padding: '10px 16px 20px', borderTop: '0.5px solid var(--sep)',
  },
  refreshBtn: {
    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
    padding: '8px 10px', borderRadius: 9,
    background: 'transparent', border: 'none',
    color: 'var(--label-secondary)', fontSize: 13,
    cursor: 'pointer', fontFamily: 'inherit',
    transition: 'background .15s',
  },
  lastUpd: { fontSize: 11, color: 'var(--label-tertiary)', padding: '4px 10px 0' },
}

function SidebarContent({ page, onNav, data, refreshing, onRefresh, lastUpdated, loadProgress, user }) {
  const [hovered, setHovered] = useState(null)

  // Group nav by section — xe users see only nhật trình
  const activeNav = user?.role === 'xe' ? NAV_XE : NAV
  let sections = []
  let current = { label: null, items: [] }
  activeNav.forEach(n => {
    if (n.section && n.section !== current.label) {
      if (current.items.length) sections.push(current)
      current = { label: n.section, items: [n] }
    } else {
      current.items.push(n)
    }
  })
  if (current.items.length) sections.push(current)

  return (
    <>
      {/* Logo */}
      <div style={S.logo}>
        <div style={S.logoImg}>
          <img src={LOGO_URL} alt="HSG"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            onError={e => {
              e.target.style.display = 'none'
              e.target.parentElement.innerHTML = '<span style="font-size:12px;font-weight:700;color:#FF3B30">HSG</span>'
            }}
          />
        </div>
        <div>
          <div style={S.logoTitle}>Danh sách xe</div>
          <div style={S.logoSub}>Hoa Sen Home</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={S.nav}>
        {sections.map((sec, si) => (
          <div key={si}>
            {sec.label && <div style={S.sectionLabel}>{sec.label}</div>}
            {sec.items.map(item => {
              const stats  = data && item.badgeKey && data[item.badgeKey]?.stats
              const badge  = stats?.total
              const active = page === item.id
              const status = item.rowKey ? loadProgress?.[item.rowKey] : null
              const isHov  = hovered === item.id

              return (
                <button key={item.id}
                  onClick={() => onNav(item.id)}
                  onMouseEnter={() => setHovered(item.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    ...S.item(active),
                    background: active
                      ? 'rgba(0,122,255,0.1)'
                      : isHov ? 'var(--fill-tertiary)' : 'transparent',
                  }}
                >
                  <span style={S.icon}>{item.sf}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {status === 'loading' && <span style={S.spinner} />}
                  {badge && status !== 'loading' && (
                    <span style={{
                      ...S.badge,
                      background: active ? 'var(--apple-blue)' : 'var(--fill-primary)',
                      color: active ? '#fff' : 'var(--label-secondary)',
                    }}>{badge}</span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={S.footer}>
        <button onClick={onRefresh} disabled={refreshing}
          style={{ ...S.refreshBtn, opacity: refreshing ? 0.5 : 1 }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--fill-tertiary)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <span style={{ fontSize: 14 }}>{refreshing ? '⟳' : '↻'}</span>
          <span>{refreshing ? 'Đang cập nhật...' : 'Làm mới dữ liệu'}</span>
        </button>
        {lastUpdated && <div style={S.lastUpd}>{lastUpdated}</div>}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  )
}

export default function Sidebar({ page, onNav, data, refreshing, onRefresh, lastUpdated, loadProgress = {}, isMobile, showSidebar, onCloseSidebar, user, onLogout }) {

  const handleNav = (id) => { onNav(id); if (isMobile) onCloseSidebar() }

  if (isMobile) {
    return (
      <>
        {showSidebar && (
          <div onClick={onCloseSidebar} style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(2px)',
            zIndex: 199
          }} />
        )}
        <aside style={{
          ...S.aside, width: 280,
          transform: showSidebar ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform .3s cubic-bezier(.4,0,.2,1)',
        }}>
          <SidebarContent page={page} onNav={handleNav} data={data}
            refreshing={refreshing} onRefresh={onRefresh}
            lastUpdated={lastUpdated} loadProgress={loadProgress} user={user} />
        </aside>
      </>
    )
  }

  return (
    <aside style={S.aside}>
      <SidebarContent page={page} onNav={handleNav} data={data}
        refreshing={refreshing} onRefresh={onRefresh}
        lastUpdated={lastUpdated} loadProgress={loadProgress} user={user} />
    </aside>
  )
}
