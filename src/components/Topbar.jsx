const TITLES = {
  overview: 'Tổng quan', xe_tai: 'Xe tải',
  oto_con: 'Ô tô con', cua_hang: 'Cửa hàng', graph: 'Sơ đồ mạng'
}

export default function Topbar({ page, refreshing, loadProgress = {}, isMobile, onMenuClick, user, onLogout }) {
  const isLoading = Object.values(loadProgress).some(v => v === 'loading')

  return (
    <header style={{
      height: 52,
      background: 'rgba(28,28,30,0.96)',
      backdropFilter: 'blur(20px) saturate(1.8)',
      WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
      borderBottom: '0.5px solid var(--sep)',
      display: 'flex', alignItems: 'center',
      padding: '0 20px', gap: 12,
      position: 'sticky', top: 0, zIndex: 50,
    }}>

      {/* Hamburger (mobile) */}
      {isMobile && (
        <button onClick={onMenuClick} style={{
          border: 'none', background: 'none', cursor: 'pointer',
          padding: '4px 6px', borderRadius: 7, fontSize: 18,
          color: 'var(--apple-blue)', display: 'flex', alignItems: 'center',
          flexShrink: 0, fontFamily: 'inherit',
        }}>☰</button>
      )}

      {/* Title */}
      <div style={{
        fontSize: isMobile ? 16 : 17,
        fontWeight: 600, flex: 1,
        letterSpacing: -0.4, color: 'var(--label-primary)',
      }}>
        {TITLES[page] || page}
      </div>

      {/* Loading indicator */}
      {(refreshing || isLoading) && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 12, color: 'var(--label-secondary)',
        }}>
          <div style={{
            width: 14, height: 14,
            border: '1.5px solid var(--fill-primary)',
            borderTopColor: 'var(--apple-blue)',
            borderRadius: '50%',
            animation: 'spin .65s linear infinite',
          }} />
          {!isMobile && (refreshing ? 'Đang làm mới...' : 'Đang tải...')}
        </div>
      )}

      {/* Online stats — chỉ admin */}
      {user?.role === 'admin' && stats && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          fontSize: 12, padding: '4px 10px',
          background: 'var(--fill-tertiary)',
          borderRadius: 8, border: '0.5px solid var(--sep)',
          flexShrink: 0,
        }}>
          <span title="Đang trực tuyến (5 phút gần nhất)">
            <span style={{ color: '#30D158', fontWeight: 700 }}>● {stats.online}</span>
            <span style={{ color: 'var(--label-tertiary)', marginLeft: 2 }}>online</span>
          </span>
          <span style={{ color: 'var(--sep)' }}>|</span>
          <span title="Tổng lượt truy cập">
            <span style={{ color: '#8E8E93', fontWeight: 600 }}>{stats.totalVisits?.toLocaleString('vi-VN')}</span>
            <span style={{ color: 'var(--label-tertiary)', marginLeft: 2 }}>lượt</span>
          </span>
        </div>
      )}

      {/* User pill */}
      {user && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          borderLeft: '0.5px solid var(--sep)', paddingLeft: 12,
          flexShrink: 0,
        }}>
          {/* Avatar */}
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'var(--apple-blue)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 600, color: '#fff', flexShrink: 0,
            letterSpacing: -0.3,
          }}>
            {(user.displayName || user.username || '?').charAt(0).toUpperCase()}
          </div>

          {/* Name (desktop only) */}
          {!isMobile && (
            <div style={{ lineHeight: 1.3 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--label-primary)' }}>
                {user.displayName || user.username}
              </div>
              <div style={{ fontSize: 11, color: 'var(--label-tertiary)' }}>
                @{user.username}
              </div>
            </div>
          )}

          {/* Logout */}
          <button onClick={onLogout}
            style={{
              padding: '5px 12px', borderRadius: 8,
              border: '0.5px solid var(--sep)',
              background: 'transparent',
              fontSize: 12, fontWeight: 500,
              color: 'var(--apple-red)',
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'background .15s',
              flexShrink: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,59,48,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {isMobile ? '↩' : '↩ Đăng xuất'}
          </button>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </header>
  )
}
