import { useState, useRef } from 'react'
import useIsMobile from '../hooks/useIsMobile'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { obj2arr, sortDesc, fmtCur, COLORS, PIE_COLORS } from '../hooks/useCharts'

function KpiCard({ icon, label, value, sub, color }) {
  return (
    <div style={{
      background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12,
      padding: '16px 18px', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: color === 'or' ? '#E63200' : color === 'am' ? '#D97706' : color === 'pu' ? '#7C3AED' : '#0055CC' }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{label}</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#111827', letterSpacing: -1 }}>{value}</div>
          {sub && <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>{sub}</div>}
        </div>
        <span style={{ fontSize: 26 }}>{icon}</span>
      </div>
    </div>
  )
}

function MiniBar({ label, items, max }) {
  return (
    <div>
      {items.slice(0, 8).map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <div style={{ fontSize: 12, color: '#374151', minWidth: 80, textAlign: 'right', flexShrink: 0 }}>{p.name}</div>
          <div style={{ flex: 1, height: 6, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 3, background: COLORS[i % COLORS.length], width: `${p.value / max * 100}%` }} />
          </div>
          <b style={{ fontSize: 12, color: '#374151', minWidth: 28, textAlign: 'right' }}>{p.value}</b>
        </div>
      ))}
    </div>
  )
}

export default function PageOverview({ data }) {
  const isMobile = useIsMobile()
  const xs = data?.xeTai?.stats  || {}
  const os = data?.otocon?.stats || {}

  const namArr  = obj2arr(xs.byNamSX || {}).filter(x => +x.name > 2000).sort((a,b) => +a.name - +b.name)
  const loaiArr = obj2arr(xs.byLoaiThung || {}).map(item => ({
    ...item,
    name: item.name.includes('Lửng') ? 'Thùng lửng' :
          item.name.includes('mui bạt') ? 'Mui bạt' :
          item.name.includes('kín') ? 'Thùng kín' :
          item.name.substring(0, 15) || item.name
  }))
  const mienArr = obj2arr(xs.byMien      || {})
  const pnArr   = obj2arr(xs.byPhapNhan  || {}).sort((a,b) => b.value - a.value)
  const ttArr   = obj2arr(xs.byTaiTrong  || {})
  const tto     = ['< 1T','1–2.5T','2.5–6T','6–10T','> 10T']
  ttArr.sort((a,b) => tto.indexOf(a.name) - tto.indexOf(b.name))

  const maxPn = pnArr[0]?.value || 1

  return (
    <div>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
        <KpiCard icon="🚗" label="Tổng phương tiện" value={(xs.total||0)+(os.total||0)} sub="Xe tải + ô tô con" color="or" />
        <KpiCard icon="🚛" label="Xe tải" value={xs.total||0} sub="Đang quản lý" color="am" />
        <KpiCard icon="🚙" label="Ô tô con" value={os.total||0} sub="Đang quản lý" color="pu" />
      </div>

      {/* Báo cáo tình trạng xe */}
      <XeActivityReport />

      {/* Charts row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '3fr 2fr', gap: 12, marginTop: 16, marginBottom: 12 }}>
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 14 }}>Xe tải theo năm sản xuất</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={namArr} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <Tooltip formatter={(v) => [v, 'Xe']} />
              <Bar dataKey="value" fill="#E63200" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 14 }}>Loại thùng xe tải</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={loaiArr} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {loaiArr.map((_,i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v,n) => [v, n]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 14 }}>Xe tải theo miền</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={mienArr} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <Tooltip formatter={(v) => [v, 'Xe']} />
              <Bar dataKey="value" radius={[3,3,0,0]}>
                {mienArr.map((_,i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 14 }}>Pháp nhân đứng tên</div>
          <MiniBar label="Pháp nhân" items={pnArr} max={maxPn} />
        </div>
      </div>
    </div>
  )
}

// ── Vehicle Activity Report ───────────────────────────────────────────────────
function XeActivityReport() {
  const isMobile = useIsMobile()
  const fileRef  = useRef()
  const API = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  const getToken = () => localStorage.getItem('hsg_token') || ''

  const [data,      setData]     = useState(null)
  const [uploading, setUploading]= useState(false)
  const [error,     setError]    = useState(null)
  const [tab,       setTab]      = useState('dung')

  // Load saved data from backend on mount
  useEffect(() => {
    fetch(`${API}/api/xe-hoat-dong`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(d => { if (d.available) setData(d) })
      .catch(() => {})
  }, [])

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true); setError(null)
    const fd = new FormData(); fd.append('file', file)
    try {
      const r = await fetch(`${API}/api/xe-hoat-dong/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      })
      const d = await r.json()
      if (d.success) {
        // Reload full data
        const r2 = await fetch(`${API}/api/xe-hoat-dong`, { headers: { Authorization: `Bearer ${getToken()}` } })
        const d2 = await r2.json()
        if (d2.available) setData(d2)
      } else {
        setError(d.error || 'Lỗi upload')
      }
    } catch(err) { setError(err.message) }
    setUploading(false)
    e.target.value = ''
  }

  const rows = data?.rows || []
  const filtered = tab === 'all' ? rows : rows.filter(r => {
    if (tab === 'dung') return r.tinhTrang === 'Dừng hoạt động'
    if (tab === 'kem')  return r.tinhTrang === 'Hoạt động kém hiệu quả'
    return r.tinhTrang === 'Hoạt động'
  })

  const tagStyle = (tt) => ({
    display: 'inline-block', padding: '2px 8px', borderRadius: 4,
    fontSize: 11, fontWeight: 600,
    background: /dừng/i.test(tt) ? '#FEE2E2' : /kém/i.test(tt) ? '#FEF3C7' : '#DCFCE7',
    color:      /dừng/i.test(tt) ? '#DC2626' : /kém/i.test(tt) ? '#D97706' : '#16A34A',
  })

  const total = data?.total || 0
  const S = data?.summary || {}

  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12,
      marginTop: 16, overflow: 'hidden' }}>

      {/* Header row */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #E5E7EB',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>🚛 Tình trạng hoạt động xe</span>
          {data && (
            <>
              <span style={{ fontSize: 11.5, color: '#6B7280' }}>{data.fileName} · {total} xe</span>
              <span style={{ fontSize: 11, color: '#9CA3AF' }}>
                {new Date(data.uploadedAt).toLocaleDateString('vi-VN')}
              </span>
            </>
          )}
          {error && <span style={{ fontSize: 11.5, color: '#DC2626' }}>✗ {error}</span>}
        </div>
        <div>
          <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleUpload} />
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            style={{ padding: '5px 12px', borderRadius: 6, background: uploading ? '#9CA3AF' : '#E63200',
              border: 'none', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {uploading ? '⏳' : '📂'} {data ? 'Cập nhật' : 'Upload CSV'}
          </button>
        </div>
      </div>

      {!data && !uploading && (
        <div style={{ padding: '24px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
          Upload file CSV báo cáo GPS để xem tình trạng hoạt động xe
        </div>
      )}

      {data && (
        <>
          {/* KPI chips */}
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #E5E7EB' }}>
            {[
              { key: 'all',  label: 'Tất cả',  count: total,      color: '#374151' },
              { key: 'dung', label: 'Dừng',     count: S.dung||0,  color: '#DC2626' },
              { key: 'kem',  label: 'Kém HQ',   count: S.kem||0,   color: '#D97706' },
              { key: 'hd',   label: 'Hoạt động',count: S.hoatDong||0, color: '#16A34A' },
            ].map((s, i) => (
              <div key={s.key} onClick={() => setTab(s.key)}
                style={{
                  flex: 1, padding: '10px 6px', textAlign: 'center', cursor: 'pointer',
                  borderRight: i < 3 ? '1px solid #E5E7EB' : 'none',
                  background: tab === s.key ? '#F9FAFB' : '#fff',
                  borderBottom: tab === s.key ? `2px solid ${s.color}` : '2px solid transparent',
                }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.count}</div>
                <div style={{ fontSize: 10.5, color: '#6B7280', marginTop: 1 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto', maxHeight: 300, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead style={{ position: 'sticky', top: 0, background: '#F9FAFB', zIndex: 5 }}>
                <tr>
                  {['#','Biển số','Cửa hàng','Tỉnh','Km GPS','Ngày HĐ','Tình trạng'].map(h => (
                    <th key={h} style={{ padding: '7px 12px', textAlign: 'center', fontWeight: 600,
                      fontSize: 10.5, color: '#6B7280', textTransform: 'uppercase',
                      borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={i} style={{ background: i%2===0?'#FAFAFA':'#fff' }}>
                    <td style={{ padding:'6px 12px', textAlign:'center', color:'#9CA3AF', borderBottom:'1px solid #F3F4F6' }}>{i+1}</td>
                    <td style={{ padding:'6px 12px', textAlign:'center', fontWeight:600, color:'#0055CC', borderBottom:'1px solid #F3F4F6', whiteSpace:'nowrap' }}>{r.bienSo||'—'}</td>
                    <td style={{ padding:'6px 12px', textAlign:'center', borderBottom:'1px solid #F3F4F6' }}>{r.cuaHang||'—'}</td>
                    <td style={{ padding:'6px 12px', textAlign:'center', borderBottom:'1px solid #F3F4F6' }}>{r.tinh||'—'}</td>
                    <td style={{ padding:'6px 12px', textAlign:'center', borderBottom:'1px solid #F3F4F6' }}>{r.kmGPS?.toLocaleString('vi-VN')||'—'}</td>
                    <td style={{ padding:'6px 12px', textAlign:'center', borderBottom:'1px solid #F3F4F6' }}>{r.soNgay||'—'}</td>
                    <td style={{ padding:'6px 12px', textAlign:'center', borderBottom:'1px solid #F3F4F6' }}>
                      <span style={tagStyle(r.tinhTrang)}>{r.tinhTrang}</span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: 20, textAlign: 'center', color: '#9CA3AF' }}>Không có dữ liệu</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
