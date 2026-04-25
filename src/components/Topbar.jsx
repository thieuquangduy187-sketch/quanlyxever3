import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const getToken = () => localStorage.getItem('hsg_token') || ''

const PAGE_TITLES = {
  overview: 'Tổng quan', xe_tai: 'Xe tải', oto_con: 'Ô tô con',
  nhat_trinh: 'Nhật trình tháng', nhat_trinh_ngay: 'Nhật trình ngày',
  gia_dau: 'Giá dầu diesel', bao_cao_nhat_trinh: 'Báo cáo nhật trình',
  bao_cao_nhat_trinh: 'Báo cáo nhật trình',
}

export default function Topbar({ page, isMobile, onMenuClick, user, onLogout, loadProgress }) {
  const [stats, setStats] = useState(null)
  const isLoading = loadProgress && Object.values(loadProgress).some(v => v === 'loading')

  useEffect(() => {
    if (user?.role !== 'admin') return
    const load = () => {
      fetch(`${API}/api/auth/stats`, { headers: { Authorization: `Bearer ${getToken()}` } })
        .then(r => r.json()).then(setStats).catch(() => {})
    }
    load()
    const t = setInterval(load, 30000)
    return () => clearInterval(t)
  }, [user])

  return (
    <header style={{
      height: 52, background: '#FFFFFF',
      borderBottom: '1px solid #E5E7EB',
      display: 'flex', alignItems: 'center',
      padding: '0 20px', gap: 12,
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      {/* Mobile hamburger */}
      {isMobile && (
        <button onClick={onMenuClick} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '6px', color: '#374151', fontSize: 18, lineHeight: 1,
        }}>☰</button>
      )}

      {/* Page title */}
      <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', flex: 1 }}>
        {PAGE_TITLES[page] || page}
        {isLoading && (
          <span style={{ marginLeft: 10, display: 'inline-block',
            width: 14, height: 14, border: '2px solid #E5E7EB',
            borderTopColor: '#E63200', borderRadius: '50%',
            animation: 'spin .6s linear infinite', verticalAlign: 'middle' }} />
        )}
      </div>

      {/* Online stats — admin only */}
      {user?.role === 'admin' && stats && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          fontSize: 12, padding: '4px 12px',
          background: '#F9FAFB', borderRadius: 20,
          border: '1px solid #E5E7EB',
        }}>
          <span>
            <span style={{ color: '#1A7F37', fontWeight: 700 }}>●</span>
            <span style={{ color: '#374151', marginLeft: 4, fontWeight: 600 }}>{stats.online}</span>
            <span style={{ color: '#9CA3AF', marginLeft: 3 }}>online</span>
          </span>
          <span style={{ color: '#E5E7EB' }}>|</span>
          <span>
            <span style={{ color: '#374151', fontWeight: 600 }}>{stats.totalVisits?.toLocaleString('vi-VN')}</span>
            <span style={{ color: '#9CA3AF', marginLeft: 3 }}>lượt</span>
          </span>
        </div>
      )}

      {/* User pill */}
      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: '#E63200', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, flexShrink: 0,
          }}>
            {(user.displayName || user.username || '?')[0].toUpperCase()}
          </div>
          {!isMobile && (
            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', maxWidth: 140,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.displayName || user.username}
            </span>
          )}
          <button onClick={onLogout} style={{
            padding: '4px 10px', borderRadius: 6,
            border: '1px solid #E5E7EB', background: 'none',
            color: '#6B7280', fontSize: 12, cursor: 'pointer',
          }}>Đăng xuất</button>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </header>
  )
}
