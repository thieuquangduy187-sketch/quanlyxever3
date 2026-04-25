import { useState } from 'react'

const LOGO_URL = 'https://lh3.googleusercontent.com/d/1gnI72gZVm9cegVnbAWjRInk3_3Ouigqm'

const NAV = [
  { id: 'overview',    sf: '◉',  label: 'Tổng quan',      section: null },
  { id: 'xe_tai',      sf: '🚛', label: 'Xe tải',          section: 'QUẢN LÝ', badgeKey: 'xeTai', rowKey: 'xe_tai' },
  { id: 'oto_con',     sf: '🚗', label: 'Ô tô con',        section: null, badgeKey: 'otocon', rowKey: 'oto_con' },
  { id: 'nhat_trinh',       sf: '📋', label: 'Nhật trình tháng', section: 'HỆ THỐNG' },
  { id: 'gia_dau',              sf: '🛢', label: 'Giá dầu diesel',       section: null },
  { id: 'bao_cao_nhat_trinh',   sf: '📊', label: 'Báo cáo nhật trình',    section: null },
]

const NAV_XE = [
  { id: 'nhat_trinh', sf: '📋', label: 'Nhật trình tháng', section: null },
]

const S = {
  aside: {
    width: 'var(--sw)',
    background: '#FFFFFF',
    borderRight: '1px solid #E5E7EB',
    position: 'fixed', top: 0, left: 0, bottom: 0,
    display: 'flex', flexDirection: 'column',
    zIndex: 100, overflowY: 'auto',
  },
  logo: {
    padding: '16px 16px 14px',
    borderBottom: '1px solid #E5E7EB',
    display: 'flex', alignItems: 'center', gap: 10,
  },
  section: {
    padding: '16px 10px 4px',
    fontSize: 10.5, fontWeight: 700, color: '#9CA3AF',
    textTransform: 'uppercase', letterSpacing: '0.06em',
  },
  navItem: (active) => ({
    display: 'flex', alignItems: 'center', gap: 9,
    padding: '8px 12px', margin: '1px 8px',
    borderRadius: 8, cursor: 'pointer',
    background: active ? '#FFF5F2' : 'transparent',
    color: active ? '#E63200' : '#374151',
    fontWeight: active ? 600 : 400,
    fontSize: 13.5,
    transition: 'background .12s, color .12s',
  }),
  navIcon: (active) => ({
    width: 28, height: 28, borderRadius: 7,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 14,
    background: active ? '#E63200' : 'transparent',
    flexShrink: 0,
  }),
  badge: {
    marginLeft: 'auto', minWidth: 20, height: 18,
    background: '#E63200', color: '#fff',
    borderRadius: 9, fontSize: 10.5, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '0 5px',
  },
  footer: {
    marginTop: 'auto', padding: '12px 16px 16px',
    borderTop: '1px solid #E5E7EB', fontSize: 11.5,
    color: '#9CA3AF',
  },
}


function SidebarContent({ page, onNav, data, refreshing, onRefresh, lastUpdated, loadProgress, user }) {
  const activeNav = user?.role === 'xe' ? NAV_XE : NAV

  // Group by section
  const groups = []
  let cur = { section: null, items: [] }
  activeNav.forEach(item => {
    if (item.section && item.section !== cur.section) {
      if (cur.items.length) groups.push(cur)
      cur = { section: item.section, items: [item] }
    } else {
      cur.items.push(item)
    }
  })
  if (cur.items.length) groups.push(cur)

  const stats = data?.xeTai?.stats || {}

  return (
    <>
      {/* Logo */}
      <div style={S.logo}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#E63200',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 18 }}>🚚</span>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>QUẢN LÝ XE TẢI</div>
          <div style={{ fontSize: 10.5, color: '#9CA3AF' }}>Hoa Sen Group</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, paddingTop: 8, paddingBottom: 8 }}>
        {groups.map(g => (
          <div key={g.section || 'main'}>
            {g.section && <div style={S.section}>{g.section}</div>}
            {g.items.map(item => {
              const active = page === item.id
              const badge = item.badgeKey && stats[item.badgeKey] ? stats[item.badgeKey] : null
              const isLoading = item.rowKey && loadProgress?.[item.rowKey] === 'loading'
              return (
                <div key={item.id} style={S.navItem(active)} onClick={() => onNav(item.id)}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#F9FAFB' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}>
                  <div style={S.navIcon(active)}>
                    <span style={{ filter: active ? 'brightness(0) invert(1)' : 'none' }}>{item.sf}</span>
                  </div>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {isLoading && <span style={{ width: 14, height: 14, border: '2px solid #E5E7EB', borderTopColor: '#E63200', borderRadius: '50%', animation: 'spin .6s linear infinite', display: 'inline-block' }} />}
                  {badge && !isLoading && <span style={S.badge}>{badge}</span>}
                </div>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={S.footer}>
        <button onClick={onRefresh} disabled={refreshing}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
            cursor: 'pointer', color: refreshing ? '#D1D5DB' : '#6B7280', fontSize: 11.5, padding: 0 }}>
          <span style={{ display: 'inline-block', animation: refreshing ? 'spin .8s linear infinite' : 'none' }}>↻</span>
          Làm mới dữ liệu
        </button>
        {lastUpdated && (
          <div style={{ marginTop: 4, color: '#9CA3AF', fontSize: 10.5 }}>
            {lastUpdated}
          </div>
        )}
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
        {/* Overlay — chỉ render khi sidebar mở */}
        {showSidebar && (
          <div
            onClick={onCloseSidebar}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.55)',
              zIndex: 200,
              WebkitTapHighlightColor: 'transparent',
            }}
          />
        )}
        <aside style={{
          ...S.aside,
          width: 280,
          zIndex: 201,
          transform: showSidebar ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform .25s ease',
          pointerEvents: showSidebar ? 'auto' : 'none',
          visibility: showSidebar ? 'visible' : 'hidden',
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
