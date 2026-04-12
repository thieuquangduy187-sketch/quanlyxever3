import { useState, useEffect, useCallback } from 'react'
import { getStats, getAllRows } from './api'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import PageOverview from './pages/PageOverview'
import PageXeTai from './pages/PageXeTai'
import PageOtoCon from './pages/PageOtoCon'
import PageCuaHang from './pages/PageCuaHang'
import LoadingScreen from './components/LoadingScreen'
import ErrorBar from './components/ErrorBar'

const PAGES = ['overview', 'xe_tai', 'oto_con', 'cua_hang']

export default function App() {
  const [page, setPage] = useState('overview')
  const [data, setData] = useState(null)
  const [rowsLoaded, setRowsLoaded] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  // Step 1: load stats only (~5KB)
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
    } catch (e) {
      setError('Lỗi kết nối: ' + e.message)
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Step 2: lazy load rows per page
  const ensureRows = useCallback(async (pageKey) => {
    const gasPage = { xe_tai: 'xe_tai', oto_con: 'oto_con', cua_hang: 'cua_hang' }[pageKey]
    if (!gasPage || rowsLoaded[pageKey]) return
    try {
      const rows = await getAllRows(gasPage)
      setData(prev => {
        const next = { ...prev }
        if (gasPage === 'xe_tai')   next.xeTai   = { ...prev.xeTai,   rows }
        if (gasPage === 'oto_con')  next.otocon  = { ...prev.otocon,  rows }
        if (gasPage === 'cua_hang') next.cuaHang = { ...prev.cuaHang, rows }
        return next
      })
      setRowsLoaded(prev => ({ ...prev, [pageKey]: true }))
    } catch (e) {
      setError('Lỗi tải dữ liệu: ' + e.message)
    }
  }, [rowsLoaded])

  useEffect(() => {
    loadStats()
    const interval = setInterval(loadStats, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [loadStats])

  const handleNavChange = useCallback((newPage) => {
    setPage(newPage)
    if (newPage !== 'overview') ensureRows(newPage)
  }, [ensureRows])

  const doRefresh = useCallback(() => {
    setRefreshing(true)
    setRowsLoaded({})
    loadStats()
  }, [loadStats])

  if (loading) return <LoadingScreen />

  const pageProps = { data, rowsLoaded, ensureRows }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar
        page={page}
        onNav={handleNavChange}
        data={data}
        refreshing={refreshing}
        onRefresh={doRefresh}
        lastUpdated={lastUpdated}
      />
      <div style={{ marginLeft: 'var(--sw)', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Topbar page={page} refreshing={refreshing} />
        <main style={{ padding: 20, flex: 1 }}>
          {error && <ErrorBar message={error} onClose={() => setError(null)} />}
          {page === 'overview'  && <PageOverview  {...pageProps} />}
          {page === 'xe_tai'    && <PageXeTai     {...pageProps} />}
          {page === 'oto_con'   && <PageOtoCon    {...pageProps} />}
          {page === 'cua_hang'  && <PageCuaHang   {...pageProps} />}
        </main>
      </div>
    </div>
  )
}
