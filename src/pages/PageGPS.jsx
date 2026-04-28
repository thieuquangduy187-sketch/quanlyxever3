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

// ── Badge component ────────────────────────────────────────
function Badge({ online }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: online ? 'rgba(52,199,89,.12)' : 'rgba(255,59,48,.10)',
      color: online ? '#34C759' : '#FF3B30'
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: online ? '#34C759' : '#FF3B30', display: 'inline-block' }} />
      {online ? 'Online' : 'Offline'}
    </span>
  )
}

// ── KPI Card ───────────────────────────────────────────────
function KpiCard({ label, value, color, icon }) {
  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: '14px 18px', border: '0.5px solid var(--sep)', flex: 1, minWidth: 120 }}>
      <div style={{ fontSize: 11, color: 'var(--label-secondary)', marginBottom: 4 }}>{icon} {label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color }}>{value}</div>
    </div>
  )
}

export default function PageGPS() {
  const [status, setStatus]       = useState(null)
  const [loading, setLoading]     = useState(true)
  const [syncing, setSyncing]     = useState(false)
  const [search, setSearch]       = useState('')
  const [filterMode, setFilterMode] = useState('all') // all | online | offline | inactive
  const [token, setToken]         = useState('')
  const [tokenInput, setTokenInput] = useState('')
  const [showTokenPanel, setShowTokenPanel] = useState(false)
  const [toast, setToast]         = useState(null)
  const [cameraData, setCameraData] = useState({}) // { vehicleId: {loading, data} }

  const showToast = (msg, err) => {
    setToast({ msg, err })
    setTimeout(() => setToast(null), 3000)
  }

  // Load status
  const loadStatus = async () => {
    try {
      const r = await authFetch('/api/gps/status')
      const d = await r.json()
      setStatus(d)
    } catch(e) { showToast('Lỗi tải dữ liệu GPS', true) }
    setLoading(false)
  }

  useEffect(() => { loadStatus() }, [])

  // Sync thủ công
  const handleSync = async () => {
    setSyncing(true)
    try {
      const r = await authFetch('/api/gps/sync', { method: 'POST' })
      const d = await r.json()
      if (d.error) { showToast(d.error, true); setSyncing(false); return }
      showToast(`✓ Sync xong: ${d.online} online / ${d.offline} offline`)
      await loadStatus()
    } catch(e) { showToast('Lỗi sync: ' + e.message, true) }
    setSyncing(false)
  }

  // Lưu token
  const handleSaveToken = async () => {
    if (!tokenInput.trim()) return
    try {
      const r = await authFetch('/api/gps/set-token', {
        method: 'POST',
        body: JSON.stringify({ token: tokenInput.trim() })
      })
      const d = await r.json()
      if (d.success) { showToast('✓ Đã lưu token'); setShowTokenPanel(false); setTokenInput('') }
      else showToast(d.error, true)
    } catch(e) { showToast(e.message, true) }
  }

  // Load camera status cho 1 xe
  const loadCamera = async (vehicleId, plate) => {
    setCameraData(prev => ({ ...prev, [vehicleId]: { loading: true } }))
    try {
      const r = await authFetch(`/api/gps/camera/${vehicleId}?plate=${encodeURIComponent(plate)}`)
      const d = await r.json()
      setCameraData(prev => ({ ...prev, [vehicleId]: { loading: false, data: d } }))
    } catch(e) {
      setCameraData(prev => ({ ...prev, [vehicleId]: { loading: false, error: e.message } }))
    }
  }

  // Filter + search
  const filtered = useMemo(() => {
    if (!status?.vehicles) return []
    let r = status.vehicles
    if (filterMode === 'online')   r = r.filter(v => v.isOnline)
    if (filterMode === 'offline')  r = r.filter(v => !v.isOnline)
    if (filterMode === 'inactive') r = r.filter(v => !v.isOnline && v.totalKm === 0)
    if (search) {
      const q = search.toLowerCase()
      r = r.filter(v => (v.plateRaw || '').toLowerCase().includes(q) || (v.plateNorm || '').toLowerCase().includes(q))
    }
    return r.sort((a, b) => {
      // Offline lên trước, trong đó inactive (km=0) lên đầu
      if (a.isOnline !== b.isOnline) return a.isOnline ? 1 : -1
      if (!a.isOnline && !b.isOnline) return (a.totalKm || 0) - (b.totalKm || 0)
      return 0
    })
  }, [status, filterMode, search])

  const fmtTime = iso => {
    if (!iso) return '—'
    const d = new Date(iso)
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')} ${d.getDate()}/${d.getMonth()+1}`
  }

  const fmtKm = km => km ? `${Number(km).toFixed(1)} km` : '0 km'

  const s = status?.summary || {}

  return (
    <div style={{ padding: '20px 24px', fontFamily: '-apple-system,sans-serif', maxWidth: 1200 }}>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', top:20, right:20, zIndex:9999, padding:'10px 16px', borderRadius:10,
          background: toast.err ? '#FF3B30' : '#34C759', color:'#fff', fontSize:13, fontWeight:500,
          boxShadow:'0 4px 20px rgba(0,0,0,.2)' }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <h2 style={{ margin:0, fontSize:20, fontWeight:700 }}>📡 Giám sát GPS</h2>
          <div style={{ fontSize:12, color:'var(--label-secondary)', marginTop:3 }}>
            Sync lần cuối: {status?.lastSync ? fmtTime(status.lastSync) : 'Chưa có dữ liệu'}
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => setShowTokenPanel(true)}
            style={{ padding:'7px 14px', borderRadius:8, border:'1px solid var(--sep)', background:'var(--bg-card)', cursor:'pointer', fontSize:12, fontFamily:'inherit' }}>
            🔑 Cập nhật Token
          </button>
          <button onClick={handleSync} disabled={syncing}
            style={{ padding:'7px 14px', borderRadius:8, border:'none',
              background: syncing ? 'var(--sep)' : 'var(--brand)', color:'#fff',
              cursor: syncing ? 'not-allowed' : 'pointer', fontSize:12, fontFamily:'inherit', fontWeight:600 }}>
            {syncing ? '⏳ Đang sync...' : '🔄 Sync ngay'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {!loading && (
        <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
          <KpiCard label="Tổng xe" value={s.total || 0} color="var(--label-primary)" icon="🚛" />
          <KpiCard label="Online" value={s.online || 0} color="#34C759" icon="🟢" />
          <KpiCard label="Offline" value={s.offline || 0} color="#FF3B30" icon="🔴" />
          <KpiCard label="Không HĐ (km=0)" value={s.inactive || 0} color="#FF9500" icon="⚠️" />
        </div>
      )}

      {/* Filter bar */}
      <div style={{ display:'flex', gap:8, marginBottom:16, alignItems:'center', flexWrap:'wrap' }}>
        <div style={{ position:'relative' }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm biển số..."
            style={{ padding:'6px 28px 6px 10px', borderRadius:8, border:'1px solid var(--sep)',
              fontSize:12, outline:'none', background:'var(--bg-card)', minWidth:180, fontFamily:'inherit' }} />
          {search && <button onClick={() => setSearch('')}
            style={{ position:'absolute', right:6, top:'50%', transform:'translateY(-50%)',
              background:'none', border:'none', cursor:'pointer', color:'var(--label-tertiary)', fontSize:13 }}>✕</button>}
        </div>
        {['all','online','offline','inactive'].map(m => (
          <button key={m} onClick={() => setFilterMode(m)}
            style={{ padding:'5px 12px', borderRadius:20, border: filterMode===m ? 'none' : '1px solid var(--sep)',
              background: filterMode===m ? 'var(--brand)' : 'var(--bg-card)',
              color: filterMode===m ? '#fff' : 'var(--label-primary)',
              cursor:'pointer', fontSize:12, fontFamily:'inherit', fontWeight: filterMode===m ? 600 : 400 }}>
            {{ all:'Tất cả', online:'Online', offline:'Offline', inactive:'Không HĐ' }[m]}
          </button>
        ))}
        <span style={{ fontSize:12, color:'var(--label-secondary)', marginLeft:'auto' }}>
          {filtered.length} xe
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign:'center', padding:60, color:'var(--label-secondary)' }}>Đang tải...</div>
      ) : !status?.vehicles?.length ? (
        <div style={{ textAlign:'center', padding:60 }}>
          <div style={{ fontSize:40 }}>📡</div>
          <div style={{ fontSize:15, fontWeight:600, marginTop:12 }}>Chưa có dữ liệu GPS</div>
          <div style={{ fontSize:13, color:'var(--label-secondary)', marginTop:6 }}>
            Cập nhật token Binhanh rồi nhấn Sync ngay
          </div>
        </div>
      ) : (
        <div style={{ background:'var(--bg-card)', borderRadius:12, border:'0.5px solid var(--sep)', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr style={{ background:'var(--bg-secondary)' }}>
                {['Biển số','Trạng thái','Km hôm nay','Tín hiệu cuối','Tốc độ','Camera',''].map(h => (
                  <th key={h} style={{ padding:'9px 12px', textAlign:'left', fontSize:11,
                    fontWeight:600, color:'var(--label-secondary)', borderBottom:'1px solid var(--sep)',
                    whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((v, i) => {
                const cam = cameraData[v.vehicleId]
                const isInactive = !v.isOnline && (v.totalKm === 0 || !v.totalKm)
                return (
                  <tr key={v.plateRaw || i}
                    style={{ borderBottom:'0.5px solid var(--sep)',
                      background: isInactive ? 'rgba(255,149,0,.04)' : 'transparent' }}>
                    <td style={{ padding:'9px 12px', fontWeight:600, color:'var(--label-primary)' }}>
                      {v.plateRaw?.replace(/_[A-Z]$/, '') || '—'}
                      {isInactive && <span style={{ marginLeft:6, fontSize:10, color:'#FF9500', fontWeight:400 }}>⚠ Không HĐ</span>}
                    </td>
                    <td style={{ padding:'9px 12px' }}><Badge online={v.isOnline} /></td>
                    <td style={{ padding:'9px 12px', color: v.totalKm > 0 ? 'var(--label-primary)' : 'var(--label-tertiary)' }}>
                      {fmtKm(v.totalKm)}
                    </td>
                    <td style={{ padding:'9px 12px', color:'var(--label-secondary)' }}>{fmtTime(v.lastSeen)}</td>
                    <td style={{ padding:'9px 12px' }}>{v.speed ? `${v.speed} km/h` : '—'}</td>
                    <td style={{ padding:'9px 12px' }}>
                      {cam?.loading ? (
                        <span style={{ fontSize:11, color:'var(--label-tertiary)' }}>⏳</span>
                      ) : cam?.data ? (
                        <span style={{ fontSize:11, color: cam.data.hasSignal ? '#34C759' : '#FF3B30', fontWeight:600 }}>
                          {cam.data.hasSignal ? `🎥 ${cam.data.channels?.length || 0} kênh` : '📵 Mất tín hiệu'}
                        </span>
                      ) : (
                        <span style={{ fontSize:11, color:'var(--label-tertiary)' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding:'9px 12px' }}>
                      {v.vehicleId && !cam && (
                        <button onClick={() => loadCamera(v.vehicleId, v.plateRaw)}
                          style={{ padding:'3px 8px', borderRadius:5, border:'1px solid var(--sep)',
                            background:'none', cursor:'pointer', fontSize:11, fontFamily:'inherit',
                            color:'var(--label-secondary)' }}>
                          Kiểm tra cam
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Token Modal */}
      {showTokenPanel && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:500,
          display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={() => setShowTokenPanel(false)}>
          <div style={{ background:'var(--bg-card)', borderRadius:14, width:520, maxWidth:'95vw',
            boxShadow:'0 8px 40px rgba(0,0,0,.2)', overflow:'hidden' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--sep)',
              display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontWeight:600, fontSize:14 }}>🔑 Cập nhật Token Binhanh</span>
              <button onClick={() => setShowTokenPanel(false)}
                style={{ border:'none', background:'none', cursor:'pointer', fontSize:18, color:'var(--label-secondary)' }}>✕</button>
            </div>
            <div style={{ padding:'20px' }}>
              <div style={{ fontSize:12, color:'var(--label-secondary)', marginBottom:8, lineHeight:1.6 }}>
                Mở <strong>gps3.binhanh.vn</strong> → F12 → Network → click bất kỳ request → copy giá trị <strong>Authorization: Bearer ...</strong>
              </div>
              <textarea
                value={tokenInput}
                onChange={e => setTokenInput(e.target.value)}
                placeholder="Paste JWT token vào đây (bắt đầu bằng eyJ...)"
                rows={5}
                style={{ width:'100%', boxSizing:'border-box', padding:'8px 12px', borderRadius:8,
                  border:'1px solid var(--sep)', fontSize:11, fontFamily:'monospace',
                  outline:'none', resize:'vertical', background:'var(--fill-tertiary)' }}
              />
              <div style={{ fontSize:11, color:'var(--label-tertiary)', marginTop:6 }}>
                Token thường hết hạn sau 24h–7 ngày. Khi sync báo lỗi "Token hết hạn" thì cập nhật lại.
              </div>
            </div>
            <div style={{ padding:'12px 20px', borderTop:'1px solid var(--sep)', display:'flex', gap:8, justifyContent:'flex-end' }}>
              <button onClick={() => setShowTokenPanel(false)}
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
