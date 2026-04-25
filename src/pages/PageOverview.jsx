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

// ── Vehicle Activity Report ───────────────────────────────────────────────────
function XeActivityReport() {
  const isMobile = useIsMobile()
  const fileRef  = useRef()
  const [data,   setData]  = useState(null)
  const [error,  setError] = useState(null)
  const [tab,    setTab]   = useState('all')
  const [search, setSrch]  = useState('')

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const text = ev.target.result
        const lines = text.split(/\r?\n/).filter(l => l.trim())

        // Find header row (contains "Biển số" or "STT")
        let headerIdx = 0
        for (let i = 0; i < Math.min(5, lines.length); i++) {
          if (/biển số|bien so|STT/i.test(lines[i])) { headerIdx = i; break }
        }

        const sep = lines[headerIdx].includes('\t') ? '\t' : ','
        const headers = lines[headerIdx].split(sep).map(h => h.replace(/[\uFEFF"]/g,'').trim())

        const rows = []
        for (let i = headerIdx + 1; i < lines.length; i++) {
          const vals = lines[i].split(sep).map(v => v.replace(/"/g,'').trim())
          if (!vals[0] || !/^\d+$/.test(vals[0])) continue
          const obj = {}
          headers.forEach((h, j) => { obj[h] = vals[j] || '' })
          rows.push(obj)
        }

        if (!rows.length) { setError('Không đọc được dữ liệu từ file'); return }

        // Key columns
        const keyTT  = headers.find(h => /tình trạng|tinh trang/i.test(h)) || ''
        const keyBS  = headers.find(h => /biển số|bien so/i.test(h)) || headers[1] || ''
        const keyCH  = headers.find(h => /cửa hàng|cua hang/i.test(h)) || ''
        const keyTinh= headers.find(h => /^tỉnh$|^tinh$/i.test(h)) || ''
        const keyKm  = headers.find(h => /km|kilomet/i.test(h)) || ''
        const keyNgay= headers.find(h => /ngày|ngay hoat dong/i.test(h)) || ''

        const classified = rows.map(r => {
          const tt = String(r[keyTT] || '').trim()
          let type = 'hoat_dong'
          if (/dừng|dung/i.test(tt)) type = 'dung'
          else if (/kém|kem/i.test(tt)) type = 'kem'
          return {
            ...r,
            _bienSo: r[keyBS], _type: type, _tt: tt,
            _cuaHang: r[keyCH], _tinh: r[keyTinh],
            _km: parseFloat(String(r[keyKm]).replace(/,/g,'')) || 0,
            _ngay: parseInt(r[keyNgay]) || 0,
          }
        })

        const dung = classified.filter(r => r._type === 'dung')
        const kem  = classified.filter(r => r._type === 'kem')
        const hd   = classified.filter(r => r._type === 'hoat_dong')
        setData({ rows: classified, dung, kem, hoat_dong: hd, headers, keyTT, keyBS, keyCH, keyTinh, keyKm, keyNgay, fileName: file.name })
        setTab('all')
      } catch(err) {
        setError('Lỗi: ' + err.message)
      }
    }
    reader.readAsText(file, 'UTF-8')
    e.target.value = ''
  }

  const rowsToShow = !data ? [] : (
    tab === 'all'      ? data.rows :
    tab === 'dung'     ? data.dung :
    tab === 'kem'      ? data.kem  :
    data.hoat_dong
  ).filter(r => !search || r._bienSo?.toLowerCase().includes(search.toLowerCase()) || r._cuaHang?.toLowerCase().includes(search.toLowerCase()))

  const tagStyle = (type) => ({
    display:'inline-block', padding:'2px 8px', borderRadius:4, fontSize:11, fontWeight:600,
    background: type==='dung' ? '#FEE2E2' : type==='kem' ? '#FEF3C7' : '#DCFCE7',
    color:      type==='dung' ? '#DC2626' : type==='kem' ? '#D97706' : '#16A34A',
  })

  return (
    <div style={{ marginTop: 20, background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid #E5E7EB',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>🚛 Báo cáo tình trạng hoạt động xe</div>
          {data && <div style={{ fontSize: 11.5, color: '#6B7280', marginTop: 2 }}>{data.fileName} · {data.rows.length} xe</div>}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {data && (
            <input value={search} onChange={e => setSrch(e.target.value)}
              placeholder="Tìm biển số..."
              style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #E5E7EB',
                fontSize: 12, outline: 'none', width: 140 }} />
          )}
          <input ref={fileRef} type="file" accept=".csv" style={{ display:'none' }} onChange={handleFile} />
          <button onClick={() => fileRef.current?.click()}
            style={{ padding: '5px 12px', borderRadius: 6, background: '#E63200',
              border: 'none', color: '#fff', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
            📂 {data ? 'Đổi file' : 'Upload CSV'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ margin: '10px 18px', padding: '8px 12px', borderRadius: 6,
          background: '#FEE2E2', color: '#DC2626', fontSize: 12 }}>✗ {error}</div>
      )}

      {!data && !error && (
        <div style={{ padding: '32px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
          <div style={{ fontSize: 13, color: '#374151', marginBottom: 4 }}>Chưa có dữ liệu báo cáo</div>
          <div style={{ fontSize: 12, color: '#9CA3AF' }}>
            Upload file CSV có cột: Biển số xe · Tình trạng hoạt động · Tổng Km GPS · Số ngày hoạt động
          </div>
        </div>
      )}

      {data && (
        <>
          {/* KPI cards */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)',
            gap: 0, borderBottom: '1px solid #E5E7EB' }}>
            {[
              { key:'all',      label:'Tổng đội xe',      count: data.rows.length,      pct: 100,                                                    color:'#0055CC', bg:'#EFF6FF' },
              { key:'dung',     label:'Dừng hoạt động',   count: data.dung.length,      pct: Math.round(data.dung.length/data.rows.length*100),      color:'#DC2626', bg:'#FEF2F2' },
              { key:'kem',      label:'Hoạt động kém',    count: data.kem.length,       pct: Math.round(data.kem.length/data.rows.length*100),       color:'#D97706', bg:'#FFFBEB' },
              { key:'hoat_dong',label:'Hoạt động bình thường', count: data.hoat_dong.length, pct: Math.round(data.hoat_dong.length/data.rows.length*100), color:'#16A34A', bg:'#F0FDF4' },
            ].map((s, i) => (
              <div key={s.key}
                onClick={() => setTab(s.key)}
                style={{
                  padding: '14px 18px', cursor: 'pointer',
                  background: tab === s.key ? s.bg : '#fff',
                  borderRight: i < 3 ? '1px solid #E5E7EB' : 'none',
                  borderBottom: isMobile && i < 2 ? '1px solid #E5E7EB' : 'none',
                  transition: 'background .12s',
                }}>
                <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4, fontWeight: 500 }}>{s.label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.count}</div>
                <div style={{ marginTop: 5, height: 3, background: '#E5E7EB', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${s.pct}%`, background: s.color, borderRadius: 2 }} />
                </div>
                <div style={{ fontSize: 11, color: s.color, marginTop: 2 }}>{s.pct}%</div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto', maxHeight: 420, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead style={{ position: 'sticky', top: 0, background: '#F9FAFB', zIndex: 5 }}>
                <tr>
                  {['#','Biển số','Cửa hàng','Tỉnh','Loại xe','Km GPS','Ngày HĐ','Tình trạng'].map(h => (
                    <th key={h} style={{ padding: '9px 14px', textAlign: 'center', fontWeight: 600,
                      fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em',
                      borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rowsToShow.map((row, i) => (
                  <tr key={i} style={{ background: i%2===0 ? '#FAFAFA' : '#fff' }}>
                    <td style={{ padding:'8px 14px', textAlign:'center', color:'#9CA3AF', borderBottom:'1px solid #F3F4F6' }}>{i+1}</td>
                    <td style={{ padding:'8px 14px', textAlign:'center', fontWeight:600, color:'#0055CC', borderBottom:'1px solid #F3F4F6', whiteSpace:'nowrap' }}>{row._bienSo || '—'}</td>
                    <td style={{ padding:'8px 14px', textAlign:'center', color:'#374151', borderBottom:'1px solid #F3F4F6' }}>{row._cuaHang || '—'}</td>
                    <td style={{ padding:'8px 14px', textAlign:'center', color:'#374151', borderBottom:'1px solid #F3F4F6' }}>{row._tinh || '—'}</td>
                    <td style={{ padding:'8px 14px', textAlign:'center', color:'#374151', borderBottom:'1px solid #F3F4F6', maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{row[data.headers[4]] || '—'}</td>
                    <td style={{ padding:'8px 14px', textAlign:'center', color:'#374151', borderBottom:'1px solid #F3F4F6' }}>{row._km ? row._km.toLocaleString('vi-VN') : '—'}</td>
                    <td style={{ padding:'8px 14px', textAlign:'center', color:'#374151', borderBottom:'1px solid #F3F4F6' }}>{row._ngay || '—'}</td>
                    <td style={{ padding:'8px 14px', textAlign:'center', borderBottom:'1px solid #F3F4F6' }}>
                      <span style={tagStyle(row._type)}>{row._tt}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rowsToShow.length === 0 && (
              <div style={{ padding:30, textAlign:'center', color:'#9CA3AF' }}>Không có dữ liệu</div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
