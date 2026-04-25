import { useState, useEffect, useMemo } from 'react'
import * as XLSX from 'xlsx'
import useIsMobile from '../hooks/useIsMobile'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const getToken = () => localStorage.getItem('hsg_token') || ''

function fmtNum(v, unit = '') {
  if (v === null || v === undefined || v === '') return '—'
  const n = Number(v)
  if (isNaN(n)) return '—'
  return n.toLocaleString('vi-VN') + (unit ? ' ' + unit : '')
}
function fmtM(v) {
  if (!v) return '—'
  return (v / 1e6).toFixed(1) + 'M'
}
function pctColor(p) {
  if (p >= 80) return '#30D158'
  if (p >= 50) return '#FF9F0A'
  return '#FF453A'
}

// ─────────────────────────────────────────────────────────────────────────────
export default function PageBaoCaoNhatTrinh() {
  const isMobile = useIsMobile()
  const now = new Date()
  const [thang, setThang] = useState(now.getMonth() + 1)
  const [nam,   setNam]   = useState(now.getFullYear())
  const [data,  setData]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterTinh, setFilterTinh] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all') // all | done | pending
  const [expandedTinh, setExpandedTinh] = useState({})
  const [tinhExpanded, setTinhExpanded] = useState(true)
  const [sortCol, setSortCol] = useState('tinh')
  const [sortDir, setSortDir] = useState(1)

  const load = async () => {
    setLoading(true)
    try {
      const r = await fetch(
        `${API}/api/stats/nhat-trinh-report?thang=${thang}&nam=${nam}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      )
      const d = await r.json()
      setData(d)
      // Auto-expand all provinces
      const exp = {}
      d.byTinh?.forEach(t => { exp[t.tinh] = true })
      setExpandedTinh(exp)
    } catch(e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { load() }, [thang, nam])

  // ── Styles ──────────────────────────────────────────────────────────────
  const V = {
    card:  { background: '#1C1C1E', borderRadius: 14, border: '0.5px solid #2C2C2E', marginBottom: 12 },
    hdr:   { padding: '10px 14px', background: '#252527', borderBottom: '0.5px solid #2C2C2E', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.5px' },
    cell:  { padding: isMobile ? '8px 10px' : '9px 12px', fontSize: isMobile ? 12 : 13, borderBottom: '0.5px solid #1a1a1a', color: 'rgba(255,255,255,0.75)', verticalAlign: 'middle' },
    cellH: { padding: isMobile ? '7px 10px' : '8px 12px', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '0.5px solid #2C2C2E', background: '#1a1a1a', cursor: 'pointer', whiteSpace: 'nowrap' },
  }

  // ── Filtered xe list ─────────────────────────────────────────────────────
  const filteredXe = useMemo(() => {
    if (!data) return []
    return data.xeList.filter(xe => {
      const q = search.toLowerCase()
      const matchSearch = !q || xe.bienSo?.toLowerCase().includes(q)
        || xe.ma?.toLowerCase().includes(q)
        || xe.cuaHang?.toLowerCase().includes(q)
        || xe.tinh?.toLowerCase().includes(q)
      const matchTinh   = filterTinh === 'all'    || xe.tinh === filterTinh
      const matchStatus = filterStatus === 'all'  || (filterStatus === 'done' ? xe.daNop : !xe.daNop)
      return matchSearch && matchTinh && matchStatus
    }).sort((a, b) => {
      let va, vb
      if (sortCol === 'tinh')    { va = a.tinh;    vb = b.tinh }
      else if (sortCol === 'km') { va = a.record?.tongKmDiChuyen || -1; vb = b.record?.tongKmDiChuyen || -1 }
      else if (sortCol === 'kl') { va = a.record?.tongKLChuyen || -1;   vb = b.record?.tongKLChuyen || -1 }
      else { va = a[sortCol]; vb = b[sortCol] }
      if (va === vb) return 0
      return (va > vb ? 1 : -1) * sortDir
    })
  }, [data, search, filterTinh, filterStatus, sortCol, sortDir])

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir(d => -d)
    else { setSortCol(col); setSortDir(1) }
  }
  const sortIcon = (col) => sortCol === col ? (sortDir === 1 ? ' ↑' : ' ↓') : ''

  // ── Export Excel ────────────────────────────────────────────────────────
  const exportExcel = () => {
    if (!data) return
    const wb = XLSX.utils.book_new()

    // Sheet 1: Tổng hợp
    const summary = [
      ['Báo cáo nhật trình xe tải', `Tháng ${thang}/${nam}`],
      [],
      ['Tổng số xe', data.summary.tongXe],
      ['Đã nộp', data.summary.daNop],
      ['Chưa nộp', data.summary.chuaNop],
      ['Tỷ lệ hoàn thành', `${data.summary.phanTram}%`],
      [],
      ['Tổng km', data.tongHop.tongKm],
      ['Tổng KL chuyên chở (kg)', data.tongHop.tongKL],
      ['TB KL/xe (kg)', data.tongHop.avgKL],
      ['Tổng lít dầu', data.tongHop.tongLitDau],
      ['Tổng tiền dầu', data.tongHop.tongTienDau],
      ['Tổng phút cẩu', data.tongHop.tongPhutCau],
      ['Tổng KL nội bộ (kg)', data.tongHop.tongKLNoiBo],
      ['TB KL nội bộ/xe (kg)', data.tongHop.avgKLNoBo],
      ['CP thuê ngoài', data.tongHop.tongCPThue],
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), 'Tổng hợp')

    // Sheet 2: Chi tiết từng xe
    const headers = [
      'Tỉnh', 'Cửa hàng', 'Biển số', 'Mã xe', 'Trạng thái',
      'Km đầu', 'Km cuối', 'Tổng km', 'Km đèo', 'Số chuyến',
      'Phút cẩu', 'Lít dầu', 'Tiền dầu', 'Tổng KL (kg)',
      'KL nội bộ (kg)', 'CP thuê ngoài', 'KL thuê ngoài (kg)', 'Ghi chú',
    ]
    const rows = filteredXe.map(xe => {
      const r = xe.record
      return [
        xe.tinh, xe.cuaHang, xe.bienSo, xe.ma,
        xe.daNop ? 'Đã nộp' : 'Chưa nộp',
        r?.kmDauThang || '', r?.kmCuoiThang || '', r?.tongKmDiChuyen || '',
        r?.kmDuongDeo || '', r?.soChuyenXe || '', r?.tgSuDungCau || '',
        r?.tongLitDau || '', r?.tongTienDau || '', r?.tongKLChuyen || '',
        r?.klNoiBo || '', r?.cpThueNgoai || '', r?.klThueNgoai || '',
        r?.ghiChu || '',
      ]
    })
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
    // Column widths
    ws['!cols'] = [18,20,14,10,12,12,12,10,10,10,10,10,14,14,14,14,14,30].map(w => ({wch: w}))
    XLSX.utils.book_append_sheet(wb, ws, 'Chi tiết xe')

    // Sheet 3: Theo tỉnh
    const tinhHeaders = ['Tỉnh', 'Miền', 'Tổng xe', 'Đã nộp', 'Chưa nộp', 'Tỷ lệ %']
    const tinhRows = data.byTinh.map(t => [
      t.tinh, t.mien, t.tongXe, t.daNop, t.chuaNop,
      Math.round(t.daNop / t.tongXe * 100) + '%'
    ])
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([tinhHeaders, ...tinhRows]), 'Theo tỉnh')

    XLSX.writeFile(wb, `NhatTrinh_T${thang}_${nam}.xlsx`)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'rgba(255,255,255,0.3)', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 32 }}>⏳</div>
      <div>Đang tải báo cáo...</div>
    </div>
  )

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '10px 10px 40px' : '20px 20px 40px' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: -0.5 }}>
            📊 Báo cáo nhật trình xe tải
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>
            Tháng {thang}/{nam} · {data ? `${data.summary.tongXe} xe` : '...'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select value={thang} onChange={e => setThang(+e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, background: '#2C2C2E', border: '0.5px solid #3a3a3c', color: '#fff', fontSize: 13, colorScheme: 'dark', fontFamily: 'inherit' }}>
            {[...Array(12)].map((_,i) => <option key={i+1} value={i+1}>Tháng {i+1}</option>)}
          </select>
          <select value={nam} onChange={e => setNam(+e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, background: '#2C2C2E', border: '0.5px solid #3a3a3c', color: '#fff', fontSize: 13, colorScheme: 'dark', fontFamily: 'inherit' }}>
            {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={load}
            style={{ padding: '8px 16px', borderRadius: 8, background: '#0A84FF', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            🔄 Tải lại
          </button>
          {data && (
            <button onClick={exportExcel}
              style={{ padding: '8px 16px', borderRadius: 8, background: '#30D158', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              📥 Xuất Excel
            </button>
          )}
        </div>
      </div>

      {data && <>

        {/* ── KPI Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
          {/* Progress circle card */}
          <div style={{ ...V.card, padding: '16px', display: 'flex', alignItems: 'center', gap: 14, gridColumn: isMobile ? 'span 2' : 'span 1' }}>
            <svg width={64} height={64} viewBox="0 0 64 64">
              <circle cx={32} cy={32} r={28} fill="none" stroke="#2C2C2E" strokeWidth={6}/>
              <circle cx={32} cy={32} r={28} fill="none"
                stroke={pctColor(data.summary.phanTram)} strokeWidth={6}
                strokeDasharray={`${data.summary.phanTram * 1.759} 175.9`}
                strokeLinecap="round" transform="rotate(-90 32 32)"/>
              <text x={32} y={37} textAnchor="middle" fontSize={14} fontWeight={700} fill={pctColor(data.summary.phanTram)}>
                {data.summary.phanTram}%
              </text>
            </svg>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>{data.summary.daNop}<span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginLeft: 4 }}>/ {data.summary.tongXe}</span></div>
              <div style={{ fontSize: 12, color: '#30D158', fontWeight: 600 }}>✓ Đã nộp</div>
              <div style={{ fontSize: 12, color: '#FF453A', marginTop: 2 }}>{data.summary.chuaNop} chưa nộp</div>
            </div>
          </div>
          {[
            { lbl: 'Tổng km', val: fmtNum(data.tongHop.tongKm), unit: 'km', col: '#0A84FF' },
            { lbl: 'Tổng KL chuyên chở', val: fmtNum(data.tongHop.tongKL), unit: 'kg', col: '#30D158' },
            { lbl: 'KL vận chuyển nội bộ', val: fmtNum(data.tongHop.tongKLNoiBo), unit: 'kg', col: '#FF9F0A' },
          ].map(k => (
            <div key={k.lbl} style={{ ...V.card, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>{k.lbl}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: k.col }}>{k.val}</div>
              {k.unit && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{k.unit}</div>}
            </div>
          ))}
        </div>

        {/* ── Tổng hợp nhanh ── */}
        <div style={{ ...V.card, marginBottom: 14 }}>
          <div style={V.hdr}>📋 Tổng hợp số liệu tháng {thang}/{nam}</div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 0 }}>
            {[
              { lbl: 'Tổng phút cẩu',    val: fmtNum(data.tongHop.tongPhutCau), unit: 'phút', col: '#FF9F0A' },
              { lbl: 'Tổng lít dầu',     val: fmtNum(data.tongHop.tongLitDau),  unit: 'lít' },
              { lbl: `TB KL chuyên chở (${data.tongHop.soXeCoKL} xe)`, val: fmtNum(data.tongHop.avgKL), unit: 'kg/xe', col: '#30D158' },
              { lbl: `TB KL nội bộ (${data.tongHop.soXeCoKL} xe)`,     val: fmtNum(data.tongHop.avgKLNoBo), unit: 'kg/xe', col: '#FF9F0A' },
            ].map((k, i) => (
              <div key={k.lbl} style={{ padding: '12px 16px', borderRight: i < 3 && !isMobile ? '0.5px solid #2C2C2E' : 'none', borderBottom: isMobile && i < 2 ? '0.5px solid #2C2C2E' : 'none' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 4 }}>{k.lbl}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: k.col || 'rgba(255,255,255,0.85)' }}>{k.val}</div>
                {k.unit && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>{k.unit}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* ── Progress theo tỉnh ── */}
        <div style={{ ...V.card, marginBottom: 14 }}>
          <div style={{ ...V.hdr, display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }}
            onClick={() => setTinhExpanded(v => !v)}>
            <span>🗺 Tiến độ theo tỉnh</span>
            <span style={{ fontSize:14, color:'rgba(255,255,255,0.4)', transition:'transform .2s',
              display:'inline-block', transform: tinhExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}>▼</span>
          </div>
          {tinhExpanded && <div style={{ padding: '12px 14px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 8 }}>
            {data.byTinh.map(t => {
              const pct = Math.round(t.daNop / t.tongXe * 100) || 0
              return (
                <div key={t.tinh} style={{ background: '#111', borderRadius: 10, padding: '10px 12px', cursor: 'pointer' }}
                  onClick={() => setFilterTinh(p => p === t.tinh ? 'all' : t.tinh)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: filterTinh === t.tinh ? '#0A84FF' : 'rgba(255,255,255,0.8)' }}>
                      {t.tinh || 'Chưa phân loại'}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: pctColor(pct) }}>{t.daNop}/{t.tongXe}</div>
                  </div>
                  <div style={{ height: 5, background: '#2C2C2E', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: pctColor(pct), borderRadius: 3, transition: 'width .5s ease' }} />
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>
                    {pct}% · {t.mien || ''}
                  </div>
                </div>
              )
            })}
          </div>}
        </div>

        {/* ── Bảng chi tiết ── */}
        <div style={V.card}>
          {/* Toolbar */}
          <div style={{ padding: '10px 14px', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', borderBottom: '0.5px solid #2C2C2E' }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="🔍 Tìm biển số, cửa hàng, tỉnh..."
              style={{ flex: 1, minWidth: 180, padding: '7px 12px', borderRadius: 8, background: '#111', border: '0.5px solid #3a3a3c', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
            />
            <select value={filterTinh} onChange={e => setFilterTinh(e.target.value)}
              style={{ padding: '7px 10px', borderRadius: 8, background: '#111', border: '0.5px solid #3a3a3c', color: '#fff', fontSize: 12, colorScheme: 'dark', fontFamily: 'inherit' }}>
              <option value="all">Tất cả tỉnh</option>
              {data.byTinh.map(t => <option key={t.tinh} value={t.tinh}>{t.tinh}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              style={{ padding: '7px 10px', borderRadius: 8, background: '#111', border: '0.5px solid #3a3a3c', color: '#fff', fontSize: 12, colorScheme: 'dark', fontFamily: 'inherit' }}>
              <option value="all">Tất cả ({data.summary.tongXe})</option>
              <option value="done">✓ Đã nộp ({data.summary.daNop})</option>
              <option value="pending">✗ Chưa nộp ({data.summary.chuaNop})</option>
            </select>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>
              {filteredXe.length} kết quả
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: isMobile ? 12 : 13 }}>
              <thead>
                <tr>
                  {[
                    { k:'tinh',    l:'Tỉnh / Cửa hàng' },
                    { k:'bienSo',  l:'Biển số' },
                    { k:'status',  l:'Trạng thái' },
                    { k:'km',      l:'Tổng km' },
                    { k:'kl',      l:'Tổng KL (kg)' },
                    { k:'litDau',  l:'Lít dầu' },
                    { k:'tienDau', l:'Tiền dầu' },
                    { k:'phutCau', l:'Phút cẩu' },
                    { k:'chuyen',  l:'Chuyến' },
                    { k:'ghiChu',  l:'Ghi chú' },
                  ].map(col => (
                    <th key={col.k} onClick={() => toggleSort(col.k)}
                      style={{ ...V.cellH, textAlign: 'left' }}>
                      {col.l}{sortIcon(col.k)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredXe.map((xe, i) => {
                  const r = xe.record
                  const rowBg = i % 2 === 0 ? '#111' : 'transparent'
                  return (
                    <tr key={xe.ma + xe.bienSo} style={{ background: rowBg }}>
                      <td style={V.cell}>
                        <div style={{ fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{xe.tinh || '—'}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>{xe.cuaHang || '—'}</div>
                      </td>
                      <td style={{ ...V.cell, fontWeight: 600, color: '#0A84FF', whiteSpace: 'nowrap' }}>{xe.bienSo || xe.ma}</td>
                      <td style={V.cell}>
                        {xe.daNop ? (
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#30D158', background: 'rgba(48,209,88,0.12)', padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap' }}>
                            ✓ Đã nộp
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#FF453A', background: 'rgba(255,69,58,0.12)', padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap' }}>
                            ✗ Chưa nộp
                          </span>
                        )}
                      </td>
                      <td style={{ ...V.cell, color: r ? '#0A84FF' : 'rgba(255,255,255,0.2)', fontWeight: r ? 600 : 400 }}>
                        {r ? fmtNum(r.tongKmDiChuyen) : '—'}
                      </td>
                      <td style={{ ...V.cell, color: r ? '#30D158' : 'rgba(255,255,255,0.2)' }}>
                        {r ? fmtNum(r.tongKLChuyen) : '—'}
                      </td>
                      <td style={V.cell}>{r ? fmtNum(r.tongLitDau) : '—'}</td>
                      <td style={{ ...V.cell, color: r?.tongTienDau ? '#FF453A' : 'rgba(255,255,255,0.2)' }}>
                        {r ? fmtM(r.tongTienDau) : '—'}
                      </td>
                      <td style={{ ...V.cell, color: r?.tgSuDungCau > 0 ? '#FF9F0A' : 'rgba(255,255,255,0.2)' }}>
                        {r ? (r.tgSuDungCau || 0) : '—'}
                      </td>
                      <td style={V.cell}>{r ? (r.soChuyenXe || 0) : '—'}</td>
                      <td style={{ ...V.cell, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'rgba(255,255,255,0.4)' }}>
                        {r?.ghiChu || '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {filteredXe.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
              Không có kết quả
            </div>
          )}
        </div>

        {/* ── Gợi ý tính năng ── */}
        <div style={{ ...V.card, marginTop: 8 }}>
          <div style={V.hdr}>💡 Gợi ý tính năng bổ sung</div>
          <div style={{ padding: '12px 14px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 8 }}>
            {[
              { icon: '📈', title: 'So sánh tháng trước', desc: 'Hiển thị % thay đổi km, KL, tiền dầu so với T-1' },
              { icon: '🏆', title: 'Xếp hạng xe', desc: 'Top xe chạy nhiều km nhất, nhiều chuyến nhất, tiêu thụ dầu nhiều nhất' },
              { icon: '⚠️', title: 'Cảnh báo bất thường', desc: 'Km/lít dầu bất thường, KL thấp bất thường, xe không hoạt động' },
              { icon: '📤', title: 'Xuất Excel', desc: 'Export bảng dữ liệu ra file .xlsx để lưu hồ sơ hoặc gửi kế toán' },
              { icon: '📅', title: 'Nhắc nhở hạn nộp', desc: 'Gửi thông báo cho xe chưa nộp khi gần cuối tháng' },
              { icon: '📊', title: 'Biểu đồ xu hướng', desc: 'Biểu đồ km/KL theo tháng của từng xe hoặc theo tỉnh' },
            ].map(f => (
              <div key={f.title} style={{ background: '#111', borderRadius: 10, padding: '10px 12px', display: 'flex', gap: 10 }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{f.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 2 }}>{f.title}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </>}
    </div>
  )
}
