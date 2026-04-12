const TITLES = { overview:'Tổng quan', xe_tai:'Xe tải', oto_con:'Ô tô con', cua_hang:'Cửa hàng' }

export default function Topbar({ page, refreshing, loadProgress = {}, isMobile, onMenuClick, user, onLogout }) {
  const isLoadingRows = Object.values(loadProgress).some(v => v === 'loading')
  return (
    <header style={{
      height: 54, background: '#fff', borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10,
      position: 'sticky', top: 0, zIndex: 50
    }}>
      {isMobile && (
        <button onClick={onMenuClick} style={{ border:'none', background:'none', cursor:'pointer', padding:'6px 8px', borderRadius:7, fontSize:18, color:'var(--ink2)', display:'flex', alignItems:'center', flexShrink:0 }}>☰</button>
      )}

      <div style={{ fontSize: 15, fontWeight: 600, flex: 1 }}>{TITLES[page] || page}</div>

      {(refreshing || isLoadingRows) && (
        <span style={{ fontSize: 11, color: 'var(--ink3)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width:10, height:10, border:'2px solid var(--border)', borderTopColor:'var(--brand)', borderRadius:'50%', animation:'spin .65s linear infinite', display:'inline-block' }} />
          {refreshing ? 'Làm mới...' : 'Đang tải...'}
        </span>
      )}

      {/* Live badge */}
      <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:'var(--brand-l)', color:'var(--brand)', fontSize:11, fontWeight:600, padding:'4px 10px', borderRadius:20, flexShrink:0 }}>
        <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--green)', animation:'pulse 2s infinite' }} />
        Live
      </div>

      {/* User info + logout */}
      {user && (
        <div style={{ display:'flex', alignItems:'center', gap:8, paddingLeft:8, borderLeft:'1px solid var(--border)', flexShrink:0 }}>
          {!isMobile && (
            <div style={{ display:'flex', alignItems:'center', gap:7 }}>
              <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--brand)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', flexShrink:0 }}>
                {user.display ? user.display.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <div style={{ fontSize:12, fontWeight:600, color:'var(--ink)', lineHeight:1.2 }}>{user.display || user.username}</div>
                <div style={{ fontSize:10, color:'var(--ink3)' }}>@{user.username}</div>
              </div>
            </div>
          )}
          <button onClick={onLogout}
            style={{ padding:'5px 11px', borderRadius:7, border:'1px solid var(--border)', background:'var(--bg)', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', color:'var(--ink2)', transition:'all .12s', flexShrink:0 }}
            onMouseEnter={e => { e.target.style.background='#FEE2E2'; e.target.style.color='#B91C1C'; e.target.style.borderColor='#FCA5A5' }}
            onMouseLeave={e => { e.target.style.background='var(--bg)'; e.target.style.color='var(--ink2)'; e.target.style.borderColor='var(--border)' }}
          >
            {isMobile ? '⎋' : '↩ Đăng xuất'}
          </button>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </header>
  )
}
