// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📁 FRONTEND — quanlyxever3/src/components/Sidebar.jsx
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { useState } from 'react'

const ICONS = {
  overview:           <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  xe_tai:             <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"><path d="M1 3h15v13H1V3zM16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  oto_con:            <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"><path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11l4 4v8a2 2 0 01-2 2h-2"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>,
  nhat_trinh:         <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>,
  gia_dau:            <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"><path d="M3 22V8l9-6 9 6v14M9 22V12h6v10"/></svg>,
  gps:                <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"><circle cx="12" cy="10" r="3"/><path d="M12 2C8.1 2 5 5.1 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.9-3.1-7-7-7z"/></svg>,
  chuyen_doi:         <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"><path d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3"/></svg>,
  bao_cao_nhat_trinh: <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  hieu_qua:           <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  analyze:            <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>,
  admin_users:        <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  bao_duong:          <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"><path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z"/><path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/><path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z"/><path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z"/><path d="M14 14.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5z"/><path d="M15.5 19H14v1.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z"/><path d="M10 9.5C10 8.67 9.33 8 8.5 8h-5C2.67 8 2 8.67 2 9.5S2.67 11 3.5 11h5c.83 0 1.5-.67 1.5-1.5z"/><path d="M8.5 5H10V3.5C10 2.67 9.33 2 8.5 2S7 2.67 7 3.5 7.67 5 8.5 5z"/></svg>,
  import:             <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  collapse:           <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" strokeWidth="1.8" strokeLinecap="round" stroke="currentColor"><path d="M15 18l-6-6 6-6"/></svg>,
  refresh:            <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>,
  logo:               <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="white"><path d="M1 3h15v13H1V3zM16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
}

const NAV = [
  { id: 'overview',              label: 'Tổng quan',          section: null },
  { id: 'xe_tai',                label: 'Xe tải',             section: 'QUẢN LÝ', badgeKey: 'xeTai' },
  { id: 'oto_con',               label: 'Ô tô con',           section: null,       badgeKey: 'otocon' },
  { id: 'nhat_trinh',            label: 'Nhật trình tháng',   section: 'NGHIỆP VỤ' },
  { id: 'gia_dau',               label: 'Giá dầu diesel',     section: null },
  { id: 'gps',                   label: 'Giám sát GPS',       section: null,       badgeKey: 'gps' },
  { id: 'chuyen_doi',            label: 'Chuyển đổi HSG→HSH', section: null },
  { id: 'bao_cao_nhat_trinh',    label: 'Báo cáo nhật trình', section: 'BÁO CÁO' },
  { id: 'hieu_qua',              label: 'Hiệu quả xe tải',    section: null },
  { id: 'analyze',               label: 'Phân tích AI',       section: null },
  { id: 'bao_duong',             label: 'Bảo dưỡng & SC',     section: 'NGHIỆP VỤ' },
  { id: 'admin_users',           label: 'Quản lý Users',      section: 'QUẢN TRỊ' },
]

const NAV_XE = [
  { id: 'nhat_trinh', label: 'Nhật trình tháng', section: null },
]

function Icon({ id, color }) {
  return (
    <div style={{ width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: color || 'var(--sb-text)' }}>
      {ICONS[id] || ICONS.gps}
    </div>
  )
}

function NavItem({ item, active, collapsed, badge, onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '7px 12px', margin: '1px 8px', borderRadius: 9,
      cursor: 'pointer', position: 'relative', whiteSpace: 'nowrap', overflow: 'visible',
      background: active ? 'var(--sb-active-bg)' : hover ? 'var(--sb-hover)' : 'transparent',
      transition: 'background 0.12s',
    }}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={{
        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: active ? 'rgba(230,50,0,0.22)' : 'var(--sb-icon-bg)',
      }}>
        <Icon id={item.id} color={active ? 'var(--sb-active)' : 'var(--sb-text)'} />
      </div>

      {!collapsed && (
        <span style={{
          fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis',
          color: active ? 'var(--sb-active)' : 'var(--sb-text)',
          fontWeight: active ? 500 : 400,
        }}>{item.label}</span>
      )}

      {!collapsed && badge > 0 && (
        <span style={{
          minWidth: 18, height: 18, background: 'var(--brand)', color: '#fff',
          borderRadius: 9, fontSize: 10, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px',
        }}>{badge > 99 ? '99+' : badge}</span>
      )}

      {collapsed && hover && (
        <div style={{
          position: 'absolute', left: 46, top: '50%', transform: 'translateY(-50%)',
          background: 'var(--ink)', color: 'var(--bg-card)',
          fontSize: 12, fontWeight: 500, padding: '5px 10px', borderRadius: 7,
          whiteSpace: 'nowrap', zIndex: 300, pointerEvents: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}>
          {item.label}
        </div>
      )}
    </div>
  )
}

function SidebarContent({ page, onNav, data, refreshing, onRefresh, lastUpdated, loadProgress, user, collapsed }) {
  const [hoverRefresh, setHoverRefresh] = useState(false)
  const activeNav = user?.role === 'xe' ? NAV_XE : NAV.filter(item => {
    // admin sees all
    if (user?.role === 'admin') return true
    // filter by allowedPages from user token
    const allowed = user?.allowedPages || []
    if (item.id === 'overview') return allowed.includes('overview')
    return allowed.includes(item.id)
  })
  const stats = data?.xeTai?.stats || {}

  const groups = []
  let cur = { section: null, items: [] }
  activeNav.forEach(item => {
    if (item.section && item.section !== cur.section) {
      if (cur.items.length) groups.push(cur)
      cur = { section: item.section, items: [item] }
    } else { cur.items.push(item) }
  })
  if (cur.items.length) groups.push(cur)

  const getBadge = (item) => {
    if (!item.badgeKey) return 0
    if (item.badgeKey === 'gps') return data?.gpsAlerts || 0
    return stats[item.badgeKey] || 0
  }

  return (
    <>
      <div style={{ padding: '15px 12px 13px', borderBottom: '1px solid var(--sb-sep)',
        display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--brand)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon id="logo" />
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.3, whiteSpace: 'nowrap' }}>HSG Fleet</div>
            <div style={{ fontSize: 10, color: 'var(--sb-text-2)', whiteSpace: 'nowrap' }}>Hoa Sen Group</div>
          </div>
        )}
      </div>

      <nav style={{ flex: 1, paddingTop: 8, paddingBottom: 8, overflowY: 'auto', overflowX: 'hidden' }}>
        {groups.map(g => (
          <div key={g.section || 'main'}>
            {g.section && !collapsed && (
              <div style={{ padding: '10px 12px 4px', fontSize: 10, fontWeight: 700,
                color: 'var(--sb-text-2)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {g.section}
              </div>
            )}
            {g.section && collapsed && <div style={{ height: 8 }} />}
            {g.items.map(item => (
              <NavItem key={item.id} item={item} active={page === item.id}
                collapsed={collapsed} badge={getBadge(item)} onClick={() => onNav(item.id)} />
            ))}
          </div>
        ))}
      </nav>

      <div style={{ padding: '10px 8px 14px', borderTop: '1px solid var(--sb-sep)', flexShrink: 0 }}>
        <button
          onClick={onRefresh} disabled={refreshing}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '7px 8px', borderRadius: 8, width: '100%',
            background: hoverRefresh ? 'var(--sb-hover)' : 'none', border: 'none', cursor: 'pointer',
          }}
          title="Làm mới dữ liệu"
          onMouseEnter={() => setHoverRefresh(true)}
          onMouseLeave={() => setHoverRefresh(false)}
        >
          <div style={{ width: 16, height: 16, color: 'var(--sb-text-2)', flexShrink: 0,
            display: 'flex', alignItems: 'center',
            animation: refreshing ? 'spin .8s linear infinite' : 'none' }}>
            {ICONS.refresh}
          </div>
          {!collapsed && (
            <span style={{ fontSize: 12, color: 'var(--sb-text-2)', whiteSpace: 'nowrap' }}>
              {refreshing ? 'Đang làm mới...' : 'Làm mới'}
            </span>
          )}
        </button>
        {!collapsed && lastUpdated && (
          <div style={{ fontSize: 10, color: 'var(--sb-text-2)', padding: '2px 8px', marginTop: 2 }}>
            {lastUpdated}
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  )
}

export default function Sidebar({ page, onNav, data, refreshing, onRefresh, lastUpdated,
  loadProgress = {}, isMobile, showSidebar, onCloseSidebar, user, collapsed, onToggleCollapse }) {

  const handleNav = (id) => { onNav(id); if (isMobile) onCloseSidebar() }

  if (isMobile) {
    return (
      <>
        {showSidebar && (
          <div onClick={onCloseSidebar}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200 }} />
        )}
        <aside style={{
          width: 260, background: 'var(--sb-bg)', borderRight: '1px solid var(--sb-sep)',
          position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 201,
          display: 'flex', flexDirection: 'column', overflowX: 'hidden', overflowY: 'auto',
          transform: showSidebar ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform .25s ease',
        }}>
          <SidebarContent page={page} onNav={handleNav} data={data} refreshing={refreshing}
            onRefresh={onRefresh} lastUpdated={lastUpdated} loadProgress={loadProgress}
            user={user} collapsed={false} />
        </aside>
      </>
    )
  }

  return (
    <aside style={{
      width: collapsed ? 56 : 'var(--sw)', background: 'var(--sb-bg)',
      borderRight: '1px solid var(--sb-sep)',
      position: 'fixed', top: 0, left: 0, bottom: 0,
      display: 'flex', flexDirection: 'column', zIndex: 100,
      overflowX: 'hidden', overflowY: 'auto',
      transition: 'width 0.25s ease',
    }}>
      {/* Collapse button */}
      <div style={{
        position: 'absolute', top: 15,
        right: collapsed ? '50%' : 10,
        transform: collapsed ? 'translateX(50%)' : 'none',
        zIndex: 1, transition: 'right 0.25s, transform 0.25s',
      }}>
        <button onClick={onToggleCollapse}
          title={collapsed ? 'Mở rộng' : 'Thu gọn'}
          style={{
            width: 22, height: 22, borderRadius: 6, border: 'none',
            background: 'var(--sb-icon-bg)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
          <div style={{
            width: 13, height: 13, color: 'var(--sb-text-2)',
            display: 'flex', alignItems: 'center',
            transform: collapsed ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.25s ease',
          }}>
            {ICONS.collapse}
          </div>
        </button>
      </div>

      <SidebarContent page={page} onNav={handleNav} data={data} refreshing={refreshing}
        onRefresh={onRefresh} lastUpdated={lastUpdated} loadProgress={loadProgress}
        user={user} collapsed={collapsed} />
    </aside>
  )
}
