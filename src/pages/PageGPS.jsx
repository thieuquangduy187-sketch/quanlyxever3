// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📁 FRONTEND — quanlyxever3/src/pages/PageGPS.jsx
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { useState, useEffect, useMemo } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const getToken = () => localStorage.getItem('hsg_token') || ''
const authFetch = (path, opts = {}) => fetch(`${API}${path}`, {
  ...opts,
  headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json', ...(opts.headers||{}) }
})

// ── Status Badge ───────────────────────────────────────────
function StatusBadge({ label, color }) {
  return (
    <span style={{
      display:'inline-block', padding:'2px 9px', borderRadius:20,
      fontSize:11, fontWeight:600,
      background: color + '18', color,
      border: `1px solid ${color}30`,
      whiteSpace:'nowrap'
    }}>{label}</span>
  )
}

// ── KPI Card ───────────────────────────────────────────────
function KpiCard({ label, value, color, icon, onClick, active }) {
  return (
    <div onClick={onClick}
      style={{ background:'var(--bg-card)', borderRadius:12, padding:'14px 18px',
        border: active ? `1.5px solid ${color}` : '0.5px solid var(--sep)',
        flex:1, minWidth:110, cursor: onClick ? 'pointer' : 'default',
        background: active ? color + '10' : 'var(--bg-card)' }}>
      <div style={{ fontSize:11, color:'var(--label-secondary)', marginBottom:4 }}>{icon} {label}</div>
      <div style={{ fontSize:24, fontWeight:700, color }}>{value}</div>
    </div>
  )
}

const FILTERS = [
  { key:'all',     label:'Tất cả' },
  { key:'normal',  label:'Bình thường' },
  { key:'stopped', label:'Xe dừng HĐ' },
]

export default function PageGPS() {
  const [status, setStatus]         = useState(null)
  const [loading, setLoading]       = useState(true)
  const [syncing, setSyncing]       = useState(false)
  const [search, setSearch]         = useState('')
  const [filterMode, setFilterMode] = useState('all')
  const [tokenInput, setTokenInput] = useState('')
  const [showToken, setShowToken]   = useState(false)
  const [toast, setToast]           = useState(null)
  const [camReport, setCamReport]   = useState(null)
  const [camLoading, setCamLoading] = useState(false)
  const [showCamReport, setShowCamReport] = useState(false)
  const [camFilter, setCamFilter]   = useState('all') // all | ok | warning | noCam
  const [backfilling, setBackfilling] = useState(false)
  const [backfillInfo, setBackfillInfo] = useState(null)

  const downloadExcel = (type) => {
    const token = getToken()
    const url = `${API}/api/gps/${type}-excel-export`
    // Mở URL trực tiếp với token trong header không được → dùng fetch + blob
    authFetch(`/api/gps/${type}-excel-export`)
      .then(r => {
        if (!r.ok) throw new Error('Export failed')
        return r.blob()
      })
      .then(blob => {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `${type}_report_${new Date().toISOString().slice(0,10)}.xlsx`
        a.click()
      })
      .catch(e => showToast('Lỗi export: ' + e.message, true))
  }

  const loadCamReport = async () => {
    setCamLoading(true)
    try {
      const r = await authFetch('/api/gps/camera-status')
      const d = await r.json()
      if (d.error) { showToast(d.error, true); setCamLoading(false); return }
      // Format lại cho UI
      const now = new Date()
      // lastSync có thể là "2026-04-30 11:25:04 (GMT+7)" hoặc ISO string
      const dateStr = d.lastSync || `${now.getDate()}/${now.getMonth()+1}/${now.getFullYear()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
      setCamReport({ ...d, dateStr })
      setShowCamReport(true)
    } catch(e) { showToast('Lỗi: ' + e.message, true) }
    setCamLoading(false)
  }

  const showToast = (msg, err) => { setToast({ msg, err }); setTimeout(() => setToast(null), 3500) }

  const loadBackfillStatus = async () => {
    try {
      const r = await authFetch('/api/gps/backfill-status')
      const d = await r.json()
      setBackfillInfo(d)
    } catch(e) {}
  }

  const handleBackfill = async () => {
    if (!window.confirm('Backfill sẽ lấy km 30 ngày qua cho tất cả xe (~5 phút). Tiếp tục?')) return
    setBackfilling(true)
    try {
      const r = await authFetch('/api/gps/backfill-history', { method: 'POST' })
      const d = await r.json()
      if (d.error) { showToast(d.error, true); setBackfilling(false); return }
      showToast(d.message)
      // Poll status mỗi 10s
      const poll = setInterval(async () => {
        await loadBackfillStatus()
      }, 10000)
      setTimeout(() => { clearInterval(poll); setBackfilling(false) }, 6 * 60 * 1000)
    } catch(e) { showToast(e.message, true); setBackfilling(false) }
  }

  const loadStatus = async () => {
    setLoading(true)
    try {
      const r = await authFetch('/api/gps/status')
      const d = await r.json()
      setStatus(d)
    } catch(e) { showToast('Lỗi tải dữ liệu: ' + e.message, true) }
    setLoading(false)
  }

  useEffect(() => { loadStatus(); loadBackfillStatus() }, [])

  const handleSync = async () => {
    setSyncing(true)
    try {
      const r = await authFetch('/api/gps/sync', { method:'POST' })
      const d = await r.json()
      if (d.error) { showToast(d.error, true); setSyncing(false); return }
      showToast(`✓ Sync xong: ${d.online} online / ${d.offline} offline`)
      await loadStatus()
    } catch(e) { showToast('Lỗi: ' + e.message, true) }
    setSyncing(false)
  }

  const handleSaveToken = async () => {
    if (!tokenInput.trim()) return
    try {
      const r = await authFetch('/api/gps/set-token', { method:'POST', body: JSON.stringify({ token: tokenInput.trim() }) })
      const d = await r.json()
      if (d.success) { showToast('✓ Đã lưu token'); setShowToken(false); setTokenInput('') }
      else showToast(d.error, true)
    } catch(e) { showToast(e.message, true) }
  }

  // Filter + search
  const filtered = useMemo(() => {
    if (!status?.vehicles) return []
    let r = status.vehicles
    if (filterMode === 'normal')  r = r.filter(v => v.gpsStatus?.code === 'normal')
    if (filterMode === 'stopped') r = r.filter(v => v.gpsStatus?.code === 'stopped')

    if (search) {
      const q = search.toLowerCase()
      r = r.filter(v => (v.plateRaw||'').toLowerCase().includes(q))
    }
    // Sort: stopped (nhiều ngày nhất lên đầu) → normal
    return r.sort((a, b) => {
      const aS = a.gpsStatus?.stoppedDays ?? 0
      const bS = b.gpsStatus?.stoppedDays ?? 0
      if (a.gpsStatus?.code === 'stopped' && b.gpsStatus?.code !== 'stopped') return -1
      if (b.gpsStatus?.code === 'stopped' && a.gpsStatus?.code !== 'stopped') return 1
      return bS - aS  // stopped nhiều ngày hơn lên đầu
    })
  }, [status, filterMode, search])

  const fmtDate = iso => {
    if (!iso) return '—'
    return iso.split('T')[0].split('-').reverse().join('/')
  }
  const fmtKm = km => km ? `${Number(km).toFixed(1)} km` : '—'

  const s = status?.summary || {}

  return (
    <div style={{ padding:'20px 24px', fontFamily:'-apple-system,sans-serif', maxWidth:1300 }}>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', top:20, right:20, zIndex:9999,
          padding:'10px 18px', borderRadius:10, fontSize:13, fontWeight:500, color:'#fff',
          background: toast.err ? '#FF3B30' : '#34C759', boxShadow:'0 4px 20px rgba(0,0,0,.2)' }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:10 }}>
        <div>
          <h2 style={{ margin:0, fontSize:20, fontWeight:700 }}>📡 Giám sát GPS & Camera</h2>
          <div style={{ fontSize:12, color:'var(--label-secondary)', marginTop:3 }}>
            Sync lần cuối: {status?.lastSync ? new Date(status.lastSync).toLocaleString('vi-VN') : 'Chưa có dữ liệu'}
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={loadCamReport} disabled={camLoading}
            style={{ padding:'7px 14px', borderRadius:8, border:'1px solid var(--sep)',
              background:'var(--bg-card)', cursor: camLoading ? 'not-allowed' : 'pointer',
              fontSize:12, fontFamily:'inherit' }}>
            {camLoading ? '⏳ Đang tải...' : '📷 Báo cáo Camera'}
          </button>
          <button onClick={() => setShowToken(true)}
            style={{ padding:'7px 14px', borderRadius:8, border:'1px solid var(--sep)', background:'var(--bg-card)', cursor:'pointer', fontSize:12, fontFamily:'inherit' }}>
            🔑 Cập nhật Token
          </button>
          <button onClick={handleBackfill} disabled={backfilling}
            style={{ padding:'7px 14px', borderRadius:8, border:'1px solid var(--sep)',
              background: backfilling ? 'var(--sep)' : 'var(--bg-card)',
              cursor: backfilling ? 'not-allowed' : 'pointer', fontSize:12, fontFamily:'inherit' }}>
            {backfilling ? '⏳ Đang backfill...' : '📥 Backfill lịch sử 30 ngày'}
          </button>
          <button onClick={() => downloadExcel('gps')}
            style={{ padding:'7px 14px', borderRadius:8, border:'1px solid var(--sep)',
              background:'var(--bg-card)', cursor:'pointer', fontSize:12, fontFamily:'inherit' }}>
            ⬇ Tải Excel GPS
          </button>
          <button onClick={handleSync} disabled={syncing}
            style={{ padding:'7px 14px', borderRadius:8, border:'none',
              background: syncing ? 'var(--sep)' : 'var(--brand)', color:'#fff',
              cursor: syncing ? 'not-allowed' : 'pointer', fontSize:12, fontFamily:'inherit', fontWeight:600 }}>
            {syncing ? '⏳ Đang sync...' : '🔄 Sync ngay'}
          </button>
        </div>
      </div>

      {/* Backfill info */}
      {backfillInfo?.lastBackfill && (
        <div style={{ marginBottom:14, padding:'8px 14px', borderRadius:8, background:'rgba(0,122,255,.06)',
          border:'1px solid rgba(0,122,255,.15)', fontSize:12, color:'var(--label-secondary)', display:'flex', gap:16, flexWrap:'wrap' }}>
          <span>📥 Backfill lần cuối: <strong>{new Date(backfillInfo.lastBackfill).toLocaleString('vi-VN')}</strong></span>
          <span>✅ Thành công: <strong>{backfillInfo.done} xe</strong></span>
          {backfillInfo.errors > 0 && <span style={{color:'#FF3B30'}}>❌ Lỗi: {backfillInfo.errors} xe</span>}
          <span>📊 Tổng records km: <strong>{backfillInfo.kmRecords?.toLocaleString()}</strong></span>
        </div>
      )}

      {/* KPI Cards */}
      {!loading && (
        <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
          <KpiCard label="Tổng xe"      value={s.total   ||0} color="var(--label-primary)" icon="🚛" onClick={() => setFilterMode('all')} active={filterMode==='all'} />
          <KpiCard label="Bình thường"   value={s.normal  ||0} color="#34C759" icon="🟢" onClick={() => setFilterMode('normal')} active={filterMode==='normal'} />
          <KpiCard label="Xe dừng HĐ"   value={s.stopped ||0} color="#FF3B30" icon="🔴" onClick={() => setFilterMode('stopped')} active={filterMode==='stopped'} />
          <div onClick={loadCamReport}
            style={{ flex:1, minWidth:110, cursor:'pointer', background: 'var(--bg-card)',
              borderRadius:12, padding:'14px 18px', border:'0.5px solid var(--sep)',
              display:'flex', flexDirection:'column', gap:4 }}>
            <div style={{ fontSize:11, color:'var(--label-secondary)' }}>📷 Báo cáo Camera</div>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--brand)' }}>
              {camLoading ? '⏳ Đang tải...' : 'Xem báo cáo →'}
            </div>
          </div>
        </div>
      )}

      {/* Search + filter bar */}
      <div style={{ display:'flex', gap:8, marginBottom:14, alignItems:'center', flexWrap:'wrap' }}>
        <div style={{ position:'relative' }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm biển số..."
            style={{ padding:'6px 28px 6px 10px', borderRadius:8, border:'1px solid var(--sep)',
              fontSize:12, outline:'none', background:'var(--bg-card)', minWidth:180, fontFamily:'inherit' }} />
          {search && <button onClick={() => setSearch('')}
            style={{ position:'absolute', right:6, top:'50%', transform:'translateY(-50%)',
              background:'none', border:'none', cursor:'pointer', color:'var(--label-tertiary)', fontSize:13 }}>✕</button>}
        </div>
        <span style={{ fontSize:12, color:'var(--label-secondary)', marginLeft:'auto' }}>{filtered.length} xe</span>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign:'center', padding:60, color:'var(--label-secondary)' }}>Đang tải...</div>
      ) : !status?.vehicles?.length ? (
        <div style={{ textAlign:'center', padding:60 }}>
          <div style={{ fontSize:40 }}>📡</div>
          <div style={{ fontSize:15, fontWeight:600, marginTop:12 }}>Chưa có dữ liệu GPS</div>
          <div style={{ fontSize:13, color:'var(--label-secondary)', marginTop:6 }}>Cập nhật token rồi nhấn Sync ngay</div>
        </div>
      ) : (
        <div style={{ background:'var(--bg-card)', borderRadius:12, border:'0.5px solid var(--sep)', overflow:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr style={{ background:'var(--bg-secondary)' }}>
                {['Biển số','Cửa hàng','Tỉnh','Trạng thái GPS','Dừng từ ngày','Km tích lũy'].map(h => (
                  <th key={h} style={{ padding:'9px 12px', textAlign:'left', fontSize:11,
                    fontWeight:600, color:'var(--label-secondary)', borderBottom:'1px solid var(--sep)',
                    whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((v, i) => {
                const gs = v.gpsStatus || {}
                const cs = v.camStatus || {}
                const rowBg = gs.code === 'stopped' ? 'rgba(255,59,48,.04)'
                            : gs.code === 'gps_lost_active' ? 'rgba(255,149,0,.04)' : 'transparent'
                return (
                  <tr key={v.plateRaw || i} style={{ borderBottom:'0.5px solid var(--sep)', background: rowBg }}>
                    <td style={{ padding:'9px 12px', fontWeight:600 }}>
                      {(v.plateRaw||'').replace(/_[A-Z]$/,'')}
                    </td>
                    <td style={{ padding:'9px 12px', fontSize:11, color:'var(--label-secondary)' }}>{v.cuaHang||'—'}</td>
                    <td style={{ padding:'9px 12px', fontSize:11, color:'var(--label-secondary)' }}>{v.tinhMoi||'—'}</td>
                    <td style={{ padding:'9px 12px' }}>
                      {gs.code === 'stopped'
                        ? <StatusBadge label={gs.label} color={gs.color} />
                        : <StatusBadge label="Bình thường" color="#34C759" />
                      }
                    </td>
                    <td style={{ padding:'9px 12px', color:'var(--label-secondary)', fontSize:11 }}>
                      {gs.stoppedSince ? fmtDate(gs.stoppedSince) : '—'}
                    </td>
                    <td style={{ padding:'9px 12px', color:'var(--label-secondary)', fontSize:11 }}>
                      {gs.kmTotal ? fmtKm(gs.kmTotal) : '—'}
                    </td>
                    <td style={{ padding:'9px 12px' }}>
                      {cs.code && cs.code !== 'no_cam'
                        ? <StatusBadge label={cs.label} color={cs.color} />
                        : <span style={{ color:'var(--label-tertiary)', fontSize:11 }}>—</span>
                      }
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Camera Report Modal */}
      {showCamReport && camReport && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:500,
          display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={() => setShowCamReport(false)}>
          <div style={{ background:'var(--bg-card)', borderRadius:14, width:'90vw', maxWidth:900,
            maxHeight:'90vh', display:'flex', flexDirection:'column',
            boxShadow:'0 8px 40px rgba(0,0,0,.2)', overflow:'hidden' }}
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--sep)',
              display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
              <div>
                <div style={{ fontWeight:600, fontSize:14 }}>📷 Báo cáo Camera trực tuyến</div>
                <div style={{ fontSize:11, color:'var(--label-secondary)', marginTop:2 }}>
                  {camReport.dateStr} · Logic: ≥ 2 kênh hoạt động = Bình thường
                </div>
              </div>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <button onClick={() => downloadExcel('camera')}
                  style={{ padding:'5px 12px', borderRadius:7, border:'none', background:'#34C759',
                    color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                  ⬇ Tải Excel
                </button>
                <button onClick={() => setShowCamReport(false)}
                  style={{ border:'none', background:'none', cursor:'pointer', fontSize:18, color:'var(--label-secondary)' }}>✕</button>
              </div>
            </div>

            {/* KPI row */}
            <div style={{ display:'flex', gap:10, padding:'12px 20px', borderBottom:'1px solid var(--sep)', flexShrink:0 }}>
              {[
                { label:'Tổng xe',       value: camReport.total,   color:'var(--label-primary)' },
                { label:'✅ Bình thường', value: camReport.ok,      color:'#34C759' },
                { label:'⚠️ Cần kiểm tra',value: camReport.warning, color:'#FF9500' },
                { label:'— Không có cam', value: camReport.noCam,   color:'var(--label-tertiary)' },
              ].map(k => (
                <div key={k.label} style={{ flex:1, background:'var(--bg-secondary)', borderRadius:8, padding:'8px 12px', textAlign:'center' }}>
                  <div style={{ fontSize:20, fontWeight:700, color:k.color }}>{k.value}</div>
                  <div style={{ fontSize:10, color:'var(--label-secondary)', marginTop:2 }}>{k.label}</div>
                </div>
              ))}
            </div>

            {/* Filter */}
            <div style={{ display:'flex', gap:6, padding:'10px 20px', borderBottom:'1px solid var(--sep)', flexShrink:0 }}>
              {[['all','Tất cả'],['ok','Bình thường'],['warning','Cần kiểm tra']].map(([k,l]) => (
                <button key={k} onClick={() => setCamFilter(k)}
                  style={{ padding:'4px 12px', borderRadius:20, border: camFilter===k ? 'none' : '1px solid var(--sep)',
                    background: camFilter===k ? 'var(--brand)' : 'var(--bg-card)',
                    color: camFilter===k ? '#fff' : 'var(--label-primary)',
                    fontSize:11, cursor:'pointer', fontFamily:'inherit', fontWeight: camFilter===k ? 600 : 400 }}>
                  {l}
                </button>
              ))}
            </div>

            {/* Table */}
            <div style={{ overflowY:'auto', flex:1 }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead style={{ position:'sticky', top:0, background:'var(--bg-secondary)', zIndex:1 }}>
                  <tr>
                    {['STT','Biển số','Cửa hàng','Tỉnh','Kênh 1','Kênh 2','Kênh 3','Kênh 4','Trạng thái'].map(h => (
                      <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontSize:11,
                        fontWeight:600, color:'var(--label-secondary)', borderBottom:'1px solid var(--sep)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {camReport.rows
                    .filter(r => camFilter === 'all' ? true
                      : camFilter === 'ok' ? r.ok
                      : camFilter === 'warning' ? !r.ok
                      : false)
                    .map((r, i) => (
                    <tr key={i} style={{ borderBottom:'0.5px solid var(--sep)',
                      background: r.ok ? 'transparent' : r.camCount === 0 ? 'transparent' : 'rgba(255,149,0,.04)' }}>
                      <td style={{ padding:'7px 12px', color:'var(--label-tertiary)', fontSize:11 }}>{r.stt}</td>
                      <td style={{ padding:'7px 12px', fontWeight:600 }}>{r.bienSo}</td>
                      <td style={{ padding:'7px 12px', fontSize:11, color:'var(--label-secondary)' }}>{r.cuaHang||'—'}</td>
                      <td style={{ padding:'7px 12px', fontSize:11, color:'var(--label-secondary)' }}>{r.tinhMoi||'—'}</td>
                      {[r.kenh1, r.kenh2, r.kenh3, r.kenh4].map((k, ki) => (
                        <td key={ki} style={{ padding:'7px 12px', fontSize:11,
                          color: k === 'Hoạt động' ? '#34C759' : k === 'Không hoạt động' ? '#FF3B30' : 'var(--label-tertiary)' }}>
                          {k || '—'}
                        </td>
                      ))}
                      <td style={{ padding:'7px 12px' }}>
                        <span style={{ fontSize:11, fontWeight:600,
                          color: r.ok ? '#34C759' : r.camCount === 0 ? 'var(--label-tertiary)' : '#FF9500' }}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Token Modal */}
      {showToken && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:500,
          display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={() => setShowToken(false)}>
          <div style={{ background:'var(--bg-card)', borderRadius:14, width:520, maxWidth:'95vw',
            boxShadow:'0 8px 40px rgba(0,0,0,.2)', overflow:'hidden' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--sep)',
              display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontWeight:600, fontSize:14 }}>🔑 Cập nhật Token Binhanh</span>
              <button onClick={() => setShowToken(false)}
                style={{ border:'none', background:'none', cursor:'pointer', fontSize:18, color:'var(--label-secondary)' }}>✕</button>
            </div>
            <div style={{ padding:'20px' }}>
              <div style={{ fontSize:12, color:'var(--label-secondary)', marginBottom:10, lineHeight:1.7 }}>
                Mở <strong>gps3.binhanh.vn</strong> → F12 → Network → click bất kỳ request → copy giá trị <strong>Authorization: Bearer ...</strong> (bỏ chữ "Bearer ")
              </div>
              <textarea value={tokenInput} onChange={e => setTokenInput(e.target.value)}
                placeholder="Paste JWT token vào đây (bắt đầu bằng eyJ...)"
                rows={5}
                style={{ width:'100%', boxSizing:'border-box', padding:'8px 12px', borderRadius:8,
                  border:'1px solid var(--sep)', fontSize:11, fontFamily:'monospace',
                  outline:'none', resize:'vertical', background:'var(--fill-tertiary)' }} />
              <div style={{ fontSize:11, color:'var(--label-tertiary)', marginTop:6 }}>
                Token thường hết hạn sau 24h–7 ngày. Khi sync báo lỗi "Token hết hạn" thì cập nhật lại.
              </div>
            </div>
            <div style={{ padding:'12px 20px', borderTop:'1px solid var(--sep)', display:'flex', gap:8, justifyContent:'flex-end' }}>
              <button onClick={() => setShowToken(false)}
                style={{ padding:'7px 16px', borderRadius:7, border:'0.5px solid var(--sep)',
                  background:'var(--fill-tertiary)', cursor:'pointer', fontSize:12, fontFamily:'inherit' }}>Huỷ</button>
              <button onClick={handleSaveToken} disabled={!tokenInput.trim()}
                style={{ padding:'7px 16px', borderRadius:7, border:'none',
                  background: tokenInput.trim() ? 'var(--brand)' : 'var(--sep)',
                  color:'#fff', cursor: tokenInput.trim() ? 'pointer' : 'not-allowed',
                  fontSize:12, fontFamily:'inherit', fontWeight:600 }}>
                💾 Lưu token
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
