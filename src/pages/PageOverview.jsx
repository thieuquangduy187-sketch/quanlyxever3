import { useState, useRef } from 'react'
import useIsMobile from '../hooks/useIsMobile'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { obj2arr, sortDesc, fmtCur, COLORS, PIE_COLORS } from '../hooks/useCharts'

function KpiCard({ icon, label, value, sub, color }) {
  const colors = {
    or: { bar: 'var(--brand)', bg: 'var(--brand-l)' },
    am: { bar: 'var(--amber)', bg: 'var(--amber-l)' },
    pu: { bar: 'var(--purple)', bg: 'var(--purple-l)' },
    te: { bar: 'var(--teal)', bg: 'var(--teal-l)' },
  }
  const c = colors[color] || colors.or
  return (
    <div style={{
      background: 'var(--bg-card)', border: '0.5px solid var(--sep)', borderRadius: 14,
      padding: '16px 18px', position: 'relative', overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: c.bar }} />
      <div style={{ width: 34, height: 34, borderRadius: 8, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--label-secondary)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--label-secondary)', marginTop: 3 }}>{sub}</div>}
    {/* ── Báo cáo tình trạng xe ── */}
      <XeActivityReport />
    </div>
  )
}

// ── Vehicle Activity Report Component ────────────────────────────────────────
function XeActivityReport() {
  const isMobile = useIsMobile()
  const fileRef  = useRef()
  const [data,   setData]   = useState(null)  // parsed CSV data
  const [error,  setError]  = useState(null)
  const [tab,    setTab]    = useState('dung') // 'dung' | 'kem' | 'hoat_dong'

  // Parse CSV file
  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const text = ev.target.result
        const lines = text.split('\n').filter(l => l.trim())
        if (!lines.length) { setError('File trống'); return }

        // Detect separator
        const sep = lines[0].includes('\t') ? '\t' : ','
        const headers = lines[0].split(sep).map(h => h.replace(/['"]/g,'').trim())

        const rows = lines.slice(1).map(line => {
          const vals = line.split(sep).map(v => v.replace(/['"]/g,'').trim())
          const obj = {}
          headers.forEach((h, i) => { obj[h] = vals[i] || '' })
          return obj
        }).filter(r => Object.values(r).some(v => v))

        // Classify rows
        const keyBienSo   = headers.find(h => /biển số|bien so|license/i.test(h)) || headers[0]
        const keyTrangThai= headers.find(h => /trạng thái|trang thai|status/i.test(h)) || headers[1]
        const keyKm       = headers.find(h => /km|kilomet/i.test(h))
        const keyNgay     = headers.find(h => /ngày|ngay|date/i.test(h))

        const classified = rows.map(r => {
          const tt = String(r[keyTrangThai] || '').toLowerCase()
          let type = 'hoat_dong'
          if (/dừng|dung|không hoạt|ko hoat|stop|inactive/i.test(tt)) type = 'dung'
          else if (/kém|kem|thấp|thap|low|ít hoạt/i.test(tt)) type = 'kem'
          return { ...r, _bienSo: r[keyBienSo], _type: type, _km: parseFloat(r[keyKm]) || 0, _ngay: r[keyNgay] }
        })

        const dung      = classified.filter(r => r._type === 'dung')
        const kem       = classified.filter(r => r._type === 'kem')
        const hd        = classified.filter(r => r._type === 'hoat_dong')

        setData({ rows: classified, dung, kem, hoat_dong: hd, headers, keyBienSo, keyTrangThai })
      } catch(err) {
        setError('Lỗi đọc file: ' + err.message)
      }
    }
    reader.readAsText(file, 'UTF-8')
    e.target.value = ''
  }

  const card = { background: 'var(--bg-card)', borderRadius: 14, border: '0.5px solid var(--sep)', padding: '14px 16px', marginBottom: 12 }
  const TAB_STYLE = (active, color) => ({
    padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600,
    border: `1px solid ${active ? color : 'var(--sep)'}`,
    background: active ? color + '22' : 'transparent',
    color: active ? color : 'var(--label-secondary)',
    cursor: 'pointer', fontFamily: 'inherit',
  })

  const currentRows = data ? data[tab] || [] : []
  const headers = data?.headers || []

  return (
    <div style={{ marginTop: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--label-primary)' }}>🚛 Báo cáo tình trạng hoạt động xe</div>
          <div style={{ fontSize: 12, color: 'var(--label-secondary)', marginTop: 2 }}>Upload file CSV để phân tích trạng thái đội xe</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFile} />
          <button onClick={() => fileRef.current?.click()}
            style={{ padding: '7px 16px', borderRadius: 8, background: 'var(--apple-blue)',
              border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            📂 Upload CSV
          </button>
          {data && (
            <span style={{ fontSize: 12, color: 'var(--label-tertiary)' }}>{data.rows.length} xe</span>
          )}
        </div>
      </div>

      {error && (
        <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(255,69,58,0.1)',
          color: 'var(--apple-red)', fontSize: 12, marginBottom: 8 }}>✗ {error}</div>
      )}

      {!data && (
        <div style={{ ...card, textAlign: 'center', padding: '30px 20px', borderStyle: 'dashed' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
          <div style={{ fontSize: 13, color: 'var(--label-secondary)', marginBottom: 4 }}>Chưa có dữ liệu</div>
          <div style={{ fontSize: 12, color: 'var(--label-tertiary)' }}>
            Upload file CSV với cột: Biển số · Trạng thái · Km · Ngày<br/>
            Trạng thái: "Dừng hoạt động" · "Kém hiệu quả" · "Hoạt động"
          </div>
        </div>
      )}

      {data && (
        <>
          {/* KPI summary */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 10, marginBottom: 12 }}>
            {[
              { key: 'dung',       label: 'Xe dừng hoạt động',       count: data.dung.length,      pct: Math.round(data.dung.length/data.rows.length*100),      color: 'var(--apple-red)' },
              { key: 'kem',        label: 'Xe hoạt động kém',         count: data.kem.length,       pct: Math.round(data.kem.length/data.rows.length*100),       color: 'var(--apple-orange)' },
              { key: 'hoat_dong',  label: 'Xe hoạt động bình thường', count: data.hoat_dong.length, pct: Math.round(data.hoat_dong.length/data.rows.length*100), color: 'var(--apple-green)' },
            ].map(s => (
              <div key={s.key} style={{ ...card, marginBottom: 0, cursor: 'pointer', border: tab === s.key ? `1.5px solid ${s.color}` : '0.5px solid var(--sep)' }}
                onClick={() => setTab(s.key)}>
                <div style={{ fontSize: 11, color: 'var(--label-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.count}</div>
                <div style={{ marginTop: 6, height: 4, background: 'var(--fill-secondary)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${s.pct}%`, background: s.color, borderRadius: 2 }} />
                </div>
                <div style={{ fontSize: 11, color: s.color, marginTop: 3 }}>{s.pct}% tổng đội xe</div>
              </div>
            ))}
          </div>

          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <button style={TAB_STYLE(tab === 'dung',      'var(--apple-red)')}    onClick={() => setTab('dung')}>✗ Dừng ({data.dung.length})</button>
            <button style={TAB_STYLE(tab === 'kem',       'var(--apple-orange)')} onClick={() => setTab('kem')}>⚠ Kém hiệu quả ({data.kem.length})</button>
            <button style={TAB_STYLE(tab === 'hoat_dong', 'var(--apple-green)')}  onClick={() => setTab('hoat_dong')}>✓ Hoạt động ({data.hoat_dong.length})</button>
          </div>

          {/* Table */}
          <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto', maxHeight: 400, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 5 }}>
                  <tr>
                    <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, fontSize: 10, color: 'var(--label-tertiary)', textTransform: 'uppercase', borderBottom: '1px solid var(--sep)' }}>STT</th>
                    {headers.map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, fontSize: 10, color: 'var(--label-tertiary)', textTransform: 'uppercase', borderBottom: '1px solid var(--sep)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentRows.map((row, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? 'var(--fill-tertiary)' : 'transparent' }}>
                      <td style={{ padding: '7px 12px', textAlign: 'center', color: 'var(--label-tertiary)', borderBottom: '0.5px solid var(--sep)' }}>{i+1}</td>
                      {headers.map(h => (
                        <td key={h} style={{ padding: '7px 12px', textAlign: 'center', color: 'var(--label-primary)', borderBottom: '0.5px solid var(--sep)', whiteSpace: 'nowrap' }}>
                          {h === data.keyTrangThai ? (
                            <span style={{
                              padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600,
                              background: row._type === 'dung' ? 'rgba(255,69,58,0.12)' : row._type === 'kem' ? 'rgba(255,159,10,0.12)' : 'rgba(48,209,88,0.12)',
                              color: row._type === 'dung' ? 'var(--apple-red)' : row._type === 'kem' ? 'var(--apple-orange)' : 'var(--apple-green)',
                            }}>{row[h]}</span>
                          ) : row[h] || '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {currentRows.length === 0 && (
                <div style={{ padding: 30, textAlign: 'center', color: 'var(--label-tertiary)', fontSize: 13 }}>Không có xe nào trong nhóm này</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function PageOverview({ data }) {
  const isMobile = useIsMobile()
  const xs = data?.xeTai?.stats || {}
  const os = data?.otocon?.stats || {}
  const cs = data?.cuaHang?.stats || {}
  const tongXe = (xs.total || 0) + (os.total || 0)

  const mArr = sortDesc(obj2arr(xs.byMien || {}))
  const ltArr = sortDesc(obj2arr(xs.byLoaiThung || {}))
  const nArr = obj2arr(xs.byNamSX || {}).sort((a, b) => +a.name - +b.name)
  const pnArr = sortDesc(obj2arr(xs.byPhapNhan || {}))

  return (
    <div>
      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
        <KpiCard icon="🚗" label="Tổng phương tiện" value={tongXe} sub="Xe tải + ô tô con" color="or" />
        <KpiCard icon="🚛" label="Xe tải" value={xs.total || 0} sub="Đang quản lý" color="am" />
        <KpiCard icon="🚗" label="Ô tô con" value={os.total || 0} sub="Đang quản lý" color="pu" />
      </div>

      {/* Charts row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '3fr 2fr', gap: 12, marginBottom: 12 }}>
        <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--sep)', borderRadius: 14, padding: '15px 18px' }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--label-primary)', marginBottom: 12 }}>Xe tải theo năm sản xuất</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={nArr} barSize={22}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(84,84,88,0.4)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={v => v.toLocaleString('vi-VN')} />
              <Bar dataKey="value" fill="#D4420A" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--sep)', borderRadius: 14, padding: '15px 18px' }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--label-primary)', marginBottom: 8 }}>Loại thùng xe tải</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={ltArr} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={3}>
                {ltArr.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={v => v.toLocaleString('vi-VN')} />
            </PieChart>
          </ResponsiveContainer>
          {ltArr.map((d, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontSize: 11.5 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[i], flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{d.name}</span>
              <b>{d.value}</b>
            </div>
          ))}
        </div>
      </div>

      {/* Charts row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
        <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--sep)', borderRadius: 14, padding: '15px 18px' }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--label-primary)', marginBottom: 12 }}>Xe tải theo miền</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={mArr} barSize={50}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(84,84,88,0.4)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={v => v.toLocaleString('vi-VN')} />
              <Bar dataKey="value" radius={[6,6,0,0]}>
                {mArr.map((_, i) => <Cell key={i} fill={['#D4420A','#0E7490','#B45309'][i] || '#666'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--sep)', borderRadius: 14, padding: '15px 18px' }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--label-primary)', marginBottom: 12 }}>Pháp nhân đứng tên</div>
          {pnArr.map((p, i) => {
            const max = Math.max(...pnArr.map(x => x.value), 1)
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--label-primary)', minWidth: 40 }}>{p.name}</div>
                <div style={{ flex: 1, height: 7, background: 'var(--bg)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 4, background: COLORS[i % COLORS.length], width: `${p.value / max * 100}%` }} />
                </div>
                <b style={{ fontSize: 12, minWidth: 28, textAlign: 'right' }}>{p.value}</b>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
