// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📁 FRONTEND — quanlyxever3/src/components/Topbar.jsx
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const getToken = () => localStorage.getItem('hsg_token') || ''

const PAGE_META = {
  overview:              { label: 'Tổng quan',            section: null },
  xe_tai:                { label: 'Xe tải',               section: 'Quản lý' },
  oto_con:               { label: 'Ô tô con',             section: 'Quản lý' },
  nhat_trinh:            { label: 'Nhật trình tháng',     section: 'Nghiệp vụ' },
  nhat_trinh_ngay:       { label: 'Nhật trình ngày',      section: 'Nghiệp vụ' },
  gia_dau:               { label: 'Giá dầu diesel',       section: 'Nghiệp vụ' },
  gps:                   { label: 'Giám sát GPS',         section: 'Nghiệp vụ' },
  chuyen_doi:            { label: 'Chuyển đổi HSG→HSH',   section: 'Nghiệp vụ' },
  bao_duong:             { label: 'Bảo dưỡng & Sửa chữa', section: 'Nghiệp vụ' },
  bao_cao_nhat_trinh:    { label: 'Báo cáo nhật trình',   section: 'Báo cáo' },
  hieu_qua:              { label: 'Hiệu quả xe tải',      section: 'Báo cáo' },
  analyze:               { label: 'Phân tích AI',         section: 'Báo cáo' },
  import:                { label: 'Import dữ liệu',       section: null },
}

const SunIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
)

const MoonIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
  </svg>
)

export default function Topbar({ page, isMobile, onMenuClick, user, onLogout, loadProgress, darkMode, onToggleDark }) {
  const [stats, setStats] = useState(null)
  const [systemOk, setSystemOk] = useState(true)
  const isLoading = loadProgress && Object.values(loadProgress).some(v => v === 'loading')
  const hasError  = loadProgress && Object.values(loadProgress).some(v => v === 'error')

  const meta = PAGE_META[page] || { label: page, section: null }

  useEffect(() => {
    if (user?.role !== 'admin') return
    const load = () => {
      fetch(`${API}/api/auth/stats`, { headers: { Authorization: `Bearer ${getToken()}` } })
        .then(r => { if (!r.ok) throw new Error(); return r.json() })
        .then(d => { setStats(d); setSystemOk(true) })
        .catch(() => setSystemOk(false))
    }
    load()
    const t = setInterval(load, 30000)
    return () => clearInterval(t)
  }, [user])

  return (
    <header style={{
      height: 52, background: 'var(--topbar-bg)',
      borderBottom: '1px solid var(--topbar-border)',
      display: 'flex', alignItems: 'center',
      padding: '0 18px', gap: 10,
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      {isMobile && (
        <button onClick={onMenuClick} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: 6, color: 'var(--ink2)', fontSize: 18, lineHeight: 1,
        }}>☰</button>
      )}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
        {meta.section && (
          <>
            <span style={{ fontSize: 13, color: 'var(--label-tertiary)', whiteSpace: 'nowrap' }}>
              {meta.section}
            </span>
            <span style={{ fontSize: 13, color: 'var(--label-quaternary)' }}>›</span>
          </>
        )}
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
          {meta.label}
        </span>
        {isLoading && (
          <div style={{
            width: 14, height: 14, border: '2px solid var(--sep)',
            borderTopColor: 'var(--brand)', borderRadius: '50%',
            animation: 'spin .6s linear infinite', flexShrink: 0,
          }} />
        )}
        {hasError && !isLoading && (
          <span style={{
            fontSize: 11, padding: '2px 8px', borderRadius: 20,
            background: 'var(--red-l)', color: 'var(--apple-red)', fontWeight: 500,
          }}>Lỗi tải dữ liệu</span>
        )}
      </div>
      {user?.role === 'admin' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          fontSize: 11, padding: '4px 10px', borderRadius: 20,
          background: systemOk ? 'var(--green-l)' : 'var(--red-l)',
          color: systemOk ? 'var(--apple-green)' : 'var(--apple-red)',
          fontWeight: 500,
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: systemOk ? 'var(--apple-green)' : 'var(--apple-red)',
            animation: systemOk ? 'pulse .9s ease infinite alternate' : 'none',
          }} />
          {systemOk ? 'Hệ thống ổn định' : 'Mất kết nối'}
        </div>
      )}
      {user?.role === 'admin' && stats && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 12, padding: '4px 12px', borderRadius: 20,
          border: '0.5px solid var(--sep)', background: 'var(--bg-secondary)',
          color: 'var(--ink2)',
        }}>
          <span style={{ color: 'var(--apple-green)', fontWeight: 700, fontSize: 10 }}>●</span>
          <span style={{ fontWeight: 600 }}>{stats.online}</span>
          <span style={{ color: 'var(--label-tertiary)' }}>online</span>
          <span style={{ color: 'var(--sep)' }}>|</span>
          <span style={{ fontWeight: 600 }}>{stats.totalVisits?.toLocaleString('vi-VN')}</span>
          <span style={{ color: 'var(--label-tertiary)' }}>lượt</span>
        </div>
      )}
      <button onClick={onToggleDark} title={darkMode ? 'Chế độ sáng' : 'Chế độ tối'}
        style={{
          width: 32, height: 32, borderRadius: 8,
          border: '0.5px solid var(--sep)', background: 'var(--bg-secondary)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          stroke: 'var(--ink2)', color: 'var(--ink2)',
        }}>
        {darkMode ? <SunIcon /> : <MoonIcon />}
      </button>
      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'var(--brand)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, flexShrink: 0,
          }}>
            {(user.displayName || user.username || '?')[0].toUpperCase()}
          </div>
          {!isMobile && (
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink2)',
              maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.displayName || user.username}
            </span>
          )}
          <button onClick={onLogout} style={{
            padding: '4px 10px', borderRadius: 6,
            border: '0.5px solid var(--sep)', background: 'none',
            color: 'var(--ink3)', fontSize: 12, cursor: 'pointer',
          }}>Đăng xuất</button>
        </div>
      )}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { from { opacity: 1; } to { opacity: 0.3; } }
      `}</style>
    </header>
  )
}
