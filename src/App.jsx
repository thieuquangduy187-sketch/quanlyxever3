// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📁 FRONTEND — quanlyxever3/src/App.jsx
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import useIsMobile from './hooks/useIsMobile'
import LoginScreen from './components/LoginScreen'
import { useState, useEffect, useCallback, useRef } from 'react'
import XeDetail from './pages/XeDetail'
import { getStats, getAllRows } from './api'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import PageOverview from './pages/PageOverview'
import PageGPS from './pages/PageGPS'
import PageChuyenDoi from './pages/PageChuyenDoi'
import PageXeTai from './pages/PageXeTai'
import PageOtoCon from './pages/PageOtoCon'
import PageCuaHang from './pages/PageCuaHang'
import PageGiaDau         from './pages/PageGiaDau'
import PageBaoCaoNhatTrinh from './pages/PageBaoCaoNhatTrinh'
import PageNhatTrinh    from './pages/PageNhatTrinh'
import PageNhatTrinhNgay from './pages/PageNhatTrinhNgay'
import PageImport from './pages/PageImport'
import PageAnalyze from './pages/PageAnalyze'
import PageHieuQua from './pages/PageHieuQua'
import LoadingScreen from './components/LoadingScreen'
import ErrorBar from './components/ErrorBar'

const PAGE_KEYS = ['xe_tai', 'oto_con', 'cua_hang']

// Route: /xe-detail → render XeDetail directly
if (typeof window !== 'undefined' && window.location.pathname === '/xe-detail') {
  // This file won't be the entry for xe-detail, handled in main.jsx
}
const GAS_PAGE  = { xe_tai: 'xe_tai', oto_con: 'oto_con', cua_hang: 'cua_hang' }

export default function App() {
  const [page, setPage] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem('hsg_user'))
      if (u?.role === 'xe') return 'nhat_trinh'
      // Admin/viewer: restore last page but never nhat_trinh
      const saved = sessionStorage.getItem('hsg_page')
      if (saved && saved !== 'nhat_trinh') return saved
      return 'overview'
    } catch { return 'overview' }
  })
  const isMobile = useIsMobile()
  const [showSidebar, setShowSidebar]         = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [token, setToken] = useState(() => {
    const t = localStorage.getItem('hsg_token')
    if (!t) return null
    // Check token chưa expire bằng cách decode payload (không cần verify signature)
    try {
      const payload = JSON.parse(atob(t.split('.')[1]))
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        // Token đã hết hạn — xóa luôn
        localStorage.removeItem('hsg_token')
        localStorage.removeItem('hsg_user')
        return null
      }
      return t
    } catch {
      localStorage.removeItem('hsg_token')
      localStorage.removeItem('hsg_user')
      return null
    }
  })
  const [user, setUser] = useState(() => {
    const t = localStorage.getItem('hsg_token')
    if (!t) return null
    try { return JSON.parse(localStorage.getItem('hsg_user')) } catch { return null }
  })
  const [data, setData]           = useState(null)
  const [rowsLoaded, setRowsLoaded] = useState({})
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [loadProgress, setLoadProgress] = useState({}) // { xe_tai: 'loading'|'done'|'error' }
  const loadingRef = useRef({})  // track in-flight loads to avoid duplicates

  // ── Load stats (~3KB, fast) ─────────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    try {
      const stats = await getStats()
      setData(prev => ({
        xeTai:   { stats: stats.xeTai?.stats   || {}, rows: prev?.xeTai?.rows   || [] },
        otocon:  { stats: stats.otocon?.stats   || {}, rows: prev?.otocon?.rows  || [] },
        cuaHang: { stats: stats.cuaHang?.stats  || {}, rows: prev?.cuaHang?.rows || [] },
      }))
      setLastUpdated(stats.fetchedAt || stats.lastUpdated)
      setLoading(false)
      setRefreshing(false)
      return true
    } catch (e) {
      setError('Lỗi kết nối: ' + e.message)
      setLoading(false)
      setRefreshing(false)
      return false
    }
  }, [])

  // ── Load rows for ONE page ──────────────────────────────────────────────────
  const loadPageRows = useCallback(async (pageKey) => {
    if (rowsLoaded[pageKey] || loadingRef.current[pageKey]) return
    loadingRef.current[pageKey] = true
    setLoadProgress(p => ({ ...p, [pageKey]: 'loading' }))
    try {
      const rows = await getAllRows(GAS_PAGE[pageKey])
      setData(prev => {
        if (!prev) return prev
        const next = { ...prev }
        if (pageKey === 'xe_tai')   next.xeTai   = { ...prev.xeTai,   rows }
        if (pageKey === 'oto_con')  next.otocon  = { ...prev.otocon,  rows }
        if (pageKey === 'cua_hang') next.cuaHang = { ...prev.cuaHang, rows }
        return next
      })
      setRowsLoaded(p => ({ ...p, [pageKey]: true }))
      setLoadProgress(p => ({ ...p, [pageKey]: 'done' }))
    } catch (e) {
      setError('Lỗi tải ' + pageKey + ': ' + e.message)
      setLoadProgress(p => ({ ...p, [pageKey]: 'error' }))
    } finally {
      loadingRef.current[pageKey] = false
    }
  }, [rowsLoaded])

  // ── On mount: load stats THEN preload ALL pages in parallel ─────────────────
  useEffect(() => {
    // Chỉ load data khi đã đăng nhập
    if (!token || !user) return

    loadStats().then(ok => {
      if (!ok) return
      PAGE_KEYS.forEach(k => loadPageRows(k))
    })
    const interval = setInterval(() => {
      loadStats()
      setRowsLoaded({})
      loadingRef.current = {}
      PAGE_KEYS.forEach(k => loadPageRows(k))
    }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [token, user]) // re-run khi login/logout

  const handleNavChange = useCallback((newPage) => {
    // Xe users can only access nhat_trinh
    if (user?.role === 'xe' && newPage !== 'nhat_trinh') return
    setPage(newPage)
    sessionStorage.setItem('hsg_page', newPage)
    setShowSidebar(false)  // Đóng sidebar khi chọn tab (mobile)
    if (newPage !== 'overview' && !rowsLoaded[newPage]) {
      loadPageRows(newPage)
    }
  }, [rowsLoaded, loadPageRows, user])

  const doRefresh = useCallback(() => {
    setRefreshing(true)
    setRowsLoaded({})
    loadingRef.current = {}
    loadStats().then(ok => {
      if (ok) PAGE_KEYS.forEach(k => loadPageRows(k))
    })
  }, [loadStats, loadPageRows])

  const handleLogout = () => {
    localStorage.removeItem('hsg_token')
    localStorage.removeItem('hsg_user')
    sessionStorage.removeItem('hsg_page')
    setToken(null)
    setUser(null)
  }

  // Lắng nghe event 401 từ api.js (token hết hạn)
  useEffect(() => {
    const onForceLogout = () => {
      setToken(null)
      setUser(null)
    }
    window.addEventListener('hsg_logout', onForceLogout)
    return () => window.removeEventListener('hsg_logout', onForceLogout)
  }, [])

  if (!user || !token) return <LoginScreen onLogin={(u, t) => {
    setUser(u); setToken(t)
    // Xe users go directly to form, reset page
    if (u?.role === 'xe') {
      setPage('nhat_trinh')
      sessionStorage.setItem('hsg_page', 'nhat_trinh')
    } else {
      setPage('overview')
      sessionStorage.setItem('hsg_page', 'overview')
    }
  }} />
  // Chưa đăng nhập → show login, không load data
  
  // Đã đăng nhập nhưng đang load data
  if (loading) return <LoadingScreen />

  const pageProps = { data, rowsLoaded, loadProgress }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar
        page={page}
        onNav={handleNavChange}
        data={data}
        refreshing={refreshing}
        loadProgress={loadProgress}
        onRefresh={doRefresh}
        lastUpdated={lastUpdated}
        isMobile={isMobile}
        showSidebar={showSidebar}
        onCloseSidebar={() => setShowSidebar(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(c => !c)}
        user={user}
        onLogout={handleLogout}
      />
      <div style={{ marginLeft: isMobile ? 0 : (sidebarCollapsed ? '52px' : 'var(--sw)'), flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', transition: 'margin-left .22s ease' }}>
        <Topbar page={page} refreshing={refreshing} loadProgress={loadProgress} isMobile={isMobile} onMenuClick={() => setShowSidebar(s => !s)} user={user} onLogout={handleLogout} />
        <main style={{ padding: '20px 20px 32px', flex: 1 }}>
          {error && <ErrorBar message={error} onClose={() => setError(null)} />}
          {page === 'overview'  && <PageOverview  {...pageProps} />}
          {page === 'xe_tai'    && <PageXeTai     {...pageProps} />}
          {page === 'oto_con'   && <PageOtoCon    {...pageProps} />}
          {page === 'cua_hang'  && <PageCuaHang   {...pageProps} />}
          {page === 'nhat_trinh'     && <PageNhatTrinh user={user} />}
          {page === 'nhat_trinh_ngay' && <PageNhatTrinhNgay user={user} />}
          {page === 'gia_dau'          && <PageGiaDau />}
          {page === 'gps'              && <PageGPS />}
          {page === 'chuyen_doi'      && <PageChuyenDoi />}
          {page === 'bao_cao_nhat_trinh' && <PageBaoCaoNhatTrinh />}
          {page === 'import'     && <PageImport />}
          {page === 'analyze'    && <PageAnalyze />}
          {page === 'hieu_qua'   && <PageHieuQua />}
        </main>
      </div>
    </div>
  )
}
