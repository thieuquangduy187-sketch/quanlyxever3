// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📁 FRONTEND — quanlyxever3/src/pages/PageXeTai.jsx
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📁 FRONTEND — quanlyxever3/src/pages/PageXeTai.jsx
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import useIsMobile from '../hooks/useIsMobile'
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { obj2arr, sortDesc, fmtCur, COLORS, PIE_COLORS } from '../hooks/useCharts'
import { updateXeRow } from '../api'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const getToken = () => localStorage.getItem('hsg_token') || ''


const PAGE_SIZE = 50
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1y5WZ0IP0uRtrjD71_I3bpFQZcKRcDNJoD4Rv6a5xMDw/edit'

const ALL_COLS = [
  { k: 'stt',         l: 'STT',                  sort: false },
  { k: 'maTaiSan',    l: 'Mã TS kế toán',        sort: true },
  { k: 'maHienTai',   l: 'Mã hiện tại',          sort: true },
  { k: 'bienSo',      l: 'Biển số',              sort: true, edit: true },
  { k: 'bienSoKhDau', l: 'Biển số không dấu',   sort: true },
  { k: 'phapNhan',    l: 'Pháp nhân đứng tên',  sort: true, edit: true },
  { k: 'tenTaiSan',   l: 'Tên tài sản',          sort: true, edit: true },
  { k: 'loaiThung',   l: 'Loại thùng',           sort: true, edit: true },
  { k: 'loaiXe',      l: 'Loại xe (hãng)',       sort: true, edit: true },
  { k: 'taiTrong',    l: 'Tải trọng (T)',        sort: true, edit: true },
  { k: 'cuaHang',     l: 'Cửa hàng SD',          sort: true, edit: true },
  { k: 'tinhCu',      l: 'Tỉnh cũ',              sort: true },
  { k: 'tinhMoi',     l: 'Tỉnh mới',             sort: true, edit: true },
  { k: 'tinhGop',     l: 'Tỉnh gộp',             sort: true },
  { k: 'maHienTai2',  l: 'Mã hiện tại 2',        sort: true },
  { k: 'mien',        l: 'Miền',                 sort: true, edit: true },
  { k: 'nguyenGia',   l: 'Nguyên giá',           sort: true },
  { k: 'gtcl',        l: 'GTCL',                 sort: true },
  { k: 'namSX',       l: 'Năm SX',               sort: true, edit: true },
  { k: 'ngayDuaVaoSD',l: 'Ngày đưa vào SD',      sort: true },
  { k: 'hasTaiNan',   l: 'Có tai nạn',           sort: true },
  { k: 'hasDieuDong', l: 'Đã điều động',         sort: true },
  { k: 'cayDieuDong', l: 'Cây điều động',        sort: false },
]

// Derive dynamic columns from actual API data keys
function deriveColsFromData(rows) {
  if (!rows || !rows.length) return ALL_COLS
  // Get all keys from first few rows
  const keysInData = new Set()
  rows.slice(0, 5).forEach(r => Object.keys(r).forEach(k => keysInData.add(k)))
  // Map to column definitions - use ALL_COLS labels if available, else auto-label
  const labelMap = {}
  ALL_COLS.forEach(c => { labelMap[c.k] = c })
  const skip = new Set(['_id','__v','hinhAnh','lichSuTaiNan','cayDieuDong','cao','dai','rong','loaiHinh'])
  const derived = []
  // Always put STT first
  derived.push({ k:'stt', l:'STT', sort:false })
  // Known cols in order
  ALL_COLS.filter(c => c.k !== 'stt' && keysInData.has(c.k)).forEach(c => derived.push(c))
  // New unknown cols at end
  Array.from(keysInData)
    .filter(k => k !== 'stt' && !skip.has(k) && !labelMap[k])
    .sort()
    .forEach(k => derived.push({ k, l: k, sort: true }))
  return derived
}

const DEFAULT_VISIBLE = ['stt','bienSo','tenTaiSan','loaiThung','loaiXe','taiTrong','mien','tinhMoi','cuaHang','namSX','gtcl','phapNhan','cayDieuDong']
const NO_COL_FILTER = new Set(['stt','gtcl','nguyenGia','hasTaiNan','hasDieuDong','cayDieuDong'])

function KpiCard({ icon, label, value, sub, color }) {
  const accents = { or:'#FF9500', te:'#5AC8FA', rd:'#FF3B30', am:'#FFCC00' }
  const accent = accents[color] || '#007AFF'
  return (
    <div style={{
      background: 'var(--bg-card)', border: '0.5px solid var(--sep)',
      borderRadius: 14, padding: '16px 18px',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: accent + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, marginBottom: 10,
      }}>{icon}</div>
      <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--label-secondary)', marginBottom: 4, letterSpacing: 0.1 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1, letterSpacing: -0.5, color: 'var(--label-primary)' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--label-tertiary)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

export default function PageXeTai({ data, rowsLoaded }) {
  const s = data?.xeTai?.stats || {}
  const rows = data?.xeTai?.rows || []

  const [search, setSearch] = useState('')
  const [filterMien, setFilterMien] = useState('')
  const [filterLT,       setFilterLT]       = useState('')
  const [filterLoaiHinh, setFilterLoaiHinh] = useState('')
  const [colFilters, setColFilters] = useState({}) // { colKey: string[] } — filter đang áp dụng cho bảng
  const [pendingFilters, setPendingFilters] = useState({}) // selections đang chọn, chưa apply
  const [openFilterCol, setOpenFilterCol] = useState(null) // colKey đang mở dropdown
  const [sortCol, setSortCol] = useState(null) // lưu col.k (string) thay vì index
  const [sortDir, setSortDir] = useState(1)
  const [pg, setPg] = useState(0)
  const [visibleKeys, setVisibleKeys] = useState(DEFAULT_VISIBLE)
  const [showColPicker, setShowColPicker] = useState(false)
  const [showSyncDrive, setShowSyncDrive] = useState(false)
  const [fullscreen, setFullscreen]       = useState(false)
  const [syncFolderId, setSyncFolderId] = useState('')
  const [syncResult, setSyncResult] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const [editCell, setEditCell] = useState(null) // {rowIdx, field, value}
  const [suggestions, setSuggestions] = useState([]) // autocomplete cửa hàng
  const [showSug, setShowSug]         = useState(false)
  const isMobile = useIsMobile()
  const [toast, setToast] = useState(null)

  // Đóng fullscreen khi nhấn Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setFullscreen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Đóng dropdown filter khi click ra ngoài → apply pending
  useEffect(() => {
    if (!openFilterCol) return
    const handler = () => {
      setColFilters(prev => ({ ...prev, [openFilterCol]: pendingFilters[openFilterCol] || [] }))
      setPg(0)
      setOpenFilterCol(null)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [openFilterCol, pendingFilters])

  const handleSyncDrive = async () => {
    if (!syncFolderId.trim()) return
    // Hỗ trợ cả URL lẫn folder ID thuần
    const idMatch = syncFolderId.match(/folders\/([a-zA-Z0-9_-]+)/)
    const folderId = idMatch ? idMatch[1] : syncFolderId.trim()
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await fetch(`${API}/api/xe/sync-drive-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ rootFolderId: folderId })
      })
      const d = await res.json()
      setSyncResult(d)
      if (d.matched > 0) showToast(`✓ Đã map ${d.matched} xe`)
    } catch(e) {
      setSyncResult({ error: e.message })
    }
    setSyncing(false)
  }

  const fetchSuggestions = async (q) => {
    if (!q || q.length < 1) { setSuggestions([]); return }
    try {
      const r = await fetch(`${API}/api/cua-hang/suggest?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      const d = await r.json()
      setSuggestions(d || [])
      setShowSug(true)
    } catch(e) { setSuggestions([]) }
  }

  const handleSelectSuggestion = async (rowIdx, sug) => {
    setShowSug(false)
    setSuggestions([])
    // Update cell value
    setEditCell(null)
    // Lưu tên CH (không có tỉnh)
    await handleEdit(rowIdx, 'cuaHang', sug.value, { ma: sug.ma, tinh: sug.tinh, mien: sug.mien })
  }

  const showToast = (msg, err) => {
    setToast({ msg, err })
    setTimeout(() => setToast(null), 2800)
  }

  const ltArr = sortDesc(obj2arr(s.byLoaiThung || {}))
  const lxArr = sortDesc(obj2arr(s.byLoaiXe || {}))
  const nArr = obj2arr(s.byNamSX || {}).sort((a,b) => +a.name - +b.name)
  const ttArr = obj2arr(s.byTaiTrong || {})
  const tto = ['< 1T','1–2.5T','2.5–6T','6–10T','> 10T']
  ttArr.sort((a,b) => tto.indexOf(a.name) - tto.indexOf(b.name))

  const dynamicCols = useMemo(() => deriveColsFromData(rows), [rows])
  const visibleCols = useMemo(() => dynamicCols.filter(c => visibleKeys.includes(c.k)), [dynamicCols, visibleKeys])

  const filtered = useMemo(() => {
    let r = rows.filter(row => {
      const s2 = search.toLowerCase()
      const ms = !s2 || (row.bienSo||'').toLowerCase().includes(s2) || (row.cuaHang||'').toLowerCase().includes(s2) || (row.tinhMoi||'').toLowerCase().includes(s2)
      const mm = !filterMien || row.mien === filterMien
      const ml = !filterLT || row.loaiThung === filterLT
      const mh = !filterLoaiHinh || (() => {
        const lh = String(row.loaiHinh||'')
        return filterLoaiHinh === 'tonkho' ? lh === 'Tổng kho' : lh !== 'Tổng kho'
      })()
      // Per-column filter (multi-select)
      const mc = Object.entries(colFilters).every(([k, vals]) => {
        if (!vals || vals.length === 0) return true
        return vals.includes(String(row[k] || '').trim())
      })
      return ms && mm && ml && mh && mc
    })
    if (sortCol) {
      const col = visibleCols.find(c => c.k === sortCol)
      if (col) {
        r = [...r].sort((a, b) => {
          const av = String(a[col.k] ?? '').trim()
          const bv = String(b[col.k] ?? '').trim()
          // Luôn đẩy hàng rỗng/0 xuống cuối bất kể chiều sort
          if (!av && !bv) return 0
          if (!av) return 1
          if (!bv) return -1
          const n = parseFloat(av) - parseFloat(bv)
          return (isNaN(n) ? av.localeCompare(bv, 'vi') : n) * sortDir
        })
      }
    }
    // Dedup: loại bỏ hàng có bienSo trùng (giữ hàng đầu tiên)
    const seen = new Set()
    const deduped = r.filter(row => {
      const key = (row.bienSo || '').trim().toUpperCase() || row._id
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    return deduped
  }, [rows, search, filterMien, filterLT, filterLoaiHinh, colFilters, sortCol, sortDir, visibleCols])

  const totalPg = Math.ceil(filtered.length / PAGE_SIZE)
  const pgRows = filtered.slice(pg * PAGE_SIZE, (pg+1) * PAGE_SIZE)

  const handleSort = (colKey) => {
    if (sortCol === colKey) setSortDir(d => d * -1)
    else { setSortCol(colKey); setSortDir(1) }
    setPg(0)
  }

  const handleEdit = async (rowIdx, field, newVal, extraFields) => {
    const row = filtered[rowIdx]
    if (!row || String(row[field]) === String(newVal)) return
    const oldVal = row[field] || ''
    row[field] = newVal
    try {
      showToast('💾 Đang lưu...')
      const res = await updateXeRow(row.maTaiSan, field, newVal, field === 'cuaHang' ? oldVal : undefined)
      if (res?.cayDieuDong) row.cayDieuDong = res.cayDieuDong
      // Auto-fill mã CH, tỉnh, miền nếu có (từ autocomplete)
      if (extraFields && field === 'cuaHang') {
        const fields = [
          { f: 'maHienTai', v: extraFields.ma   },
          { f: 'tinhMoi',   v: extraFields.tinh  },
          { f: 'mien',      v: extraFields.mien  },
        ].filter(x => x.v)
        for (const { f, v } of fields) {
          await updateXeRow(row.maTaiSan, f, v)
          row[f] = v
        }
      }
      showToast('✓ Đã lưu')
    } catch(e) {
      showToast('✗ Lỗi: ' + e.message, true)
    }
  }

  const exportExcel = () => {
    const cols = visibleCols.filter(c => c.k !== 'stt')
    const html = '<html><head><meta charset="UTF-8"><style>th{background:#D4420A;color:#fff;padding:6px 10px;border:1px solid #ccc}td{padding:5px 10px;border:1px solid #ddd}</style></head><body><table border="1"><thead><tr><th>#</th>' + cols.map(c => `<th>${c.l}</th>`).join('') + '</tr></thead><tbody>' +
      filtered.map((r, i) => '<tr><td>' + (i+1) + '</td>' + cols.map(c => {
        if (c.k === 'gtcl' || c.k === 'nguyenGia') return `<td style="text-align:right">${r[c.k] ? (+r[c.k]).toLocaleString('vi-VN') : ''}</td>`
        if (c.k === 'hasTaiNan') return `<td>${r[c.k] ? 'Có' : ''}</td>`
        if (c.k === 'hasDieuDong') return `<td>${r[c.k] ? 'Có' : ''}</td>`
        return `<td>${r[c.k] || ''}</td>`
      }).join('') + '</tr>').join('') + '</tbody></table></body></html>'
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `HSG_XeTai_${new Date().toISOString().slice(0,10)}.xls`
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
  }

  // Upload Excel to update xetai
  const uploadRef = useRef()
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState(null)

  const [previewData, setPreviewData] = useState(null)
  const [pendingFile, setPendingFile] = useState(null)

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadMsg(null)
    setPreviewData(null)
    const fd = new FormData()
    fd.append('file', file)
    try {
      // Step 1: Preview headers first
      const r = await fetch(`${API}/api/xe/upload/preview`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      })
      const d = await r.json()
      if (d.headers) {
        setPreviewData(d)
        setPendingFile(file)
      } else {
        setUploadMsg({ ok: false, text: d.error || 'Lỗi đọc file' })
      }
    } catch(err) {
      setUploadMsg({ ok: false, text: err.message })
    }
    setUploading(false)
    e.target.value = ''
  }

  const confirmUpload = async () => {
    if (!pendingFile) return
    setUploading(true)
    setUploadMsg(null)
    const fd = new FormData()
    fd.append('file', pendingFile)
    try {
      const r = await fetch(`${API}/api/xe/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      })
      const d = await r.json()
      if (d.success) {
        setUploadMsg({ ok: true, text: d.message })
        setPreviewData(null)
        setPendingFile(null)
        setTimeout(() => { window.location.reload() }, 1500)
      } else {
        setUploadMsg({ ok: false, text: d.error || 'Lỗi upload' })
      }
    } catch(err) {
      setUploadMsg({ ok: false, text: err.message })
    }
    setUploading(false)
  }


  const mienTag = { 'Miền Nam': { bg:'var(--brand-l)', color:'var(--brand)' }, 'Miền Bắc': { bg:'var(--teal-l)', color:'var(--teal)' }, 'Miền Trung': { bg:'var(--amber-l)', color:'var(--amber)' } }

  const isLoading = !rowsLoaded?.xe_tai && rows.length === 0

  return (
    <div style={fullscreen ? {
      position:'fixed', inset:0, zIndex:999,
      background:'var(--bg-secondary)', overflowY:'auto',
      padding:'12px 16px', boxSizing:'border-box'
    } : {}}>
      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', bottom:24, right:24, background: toast.err?'var(--red)':'#1A1A1A', color:'#fff', padding:'10px 18px', borderRadius:9, fontSize:13, zIndex:9999 }}>
          {toast.msg}
        </div>
      )}

      {/* KPI */}
      {!fullscreen && <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap:12, marginBottom:16 }}>
        <KpiCard icon="🚛" label="Tổng xe tải" value={s.total||0} sub="Xe đang quản lý" color="or" />
        <KpiCard icon="💰" label="GTCL tổng" value={fmtCur(s.tongGTCL||0)} sub="Giá trị còn lại" color="te" />
        <KpiCard icon="⚠️" label="Có tai nạn" value={s.coTaiNan||0} sub="Xe có lịch sử" color="rd" />
        <KpiCard icon="🔄" label="Đã điều động" value={s.daDieuDong||0} sub="Có lịch sử dịch chuyển" color="am" />
      </div>}

      {/* Charts */}
      {!fullscreen && <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '3fr 2fr', gap:12, marginBottom:12 }}>
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, padding:'15px 18px' }}>
          <div style={{ fontSize:12.5, fontWeight:600, color:'var(--ink2)', marginBottom:12 }}>Xe theo năm sản xuất</div>
          <ResponsiveContainer width="100%" height={isMobile ? 160 : 220}>
            <BarChart data={nArr} barSize={22}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(84,84,88,0.4)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize:11, fill:'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:11, fill:'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={v => v.toLocaleString('vi-VN')} />
              <Bar dataKey="value" fill="#D4420A" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, padding:'15px 18px' }}>
          <div style={{ fontSize:12.5, fontWeight:600, color:'var(--ink2)', marginBottom:8 }}>Loại thùng xe</div>
          <ResponsiveContainer width="100%" height={isMobile ? 140 : 160}>
            <PieChart>
              <Pie data={ltArr} dataKey="value" cx="50%" cy="50%" outerRadius={70} innerRadius={35} paddingAngle={3}>
                {ltArr.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          {ltArr.map((d, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:6, marginTop:4, fontSize:11 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:PIE_COLORS[i], flexShrink:0 }} />
              <span style={{ flex:1 }}>{d.name}</span>
              <b>{d.value}</b>
              <span style={{ color:'var(--ink3)', minWidth:30 }}>{s.total ? Math.round(d.value/s.total*100) : 0}%</span>
            </div>
          ))}
        </div>
      </div>}

      {/* Table card */}
      <div style={{ background:'var(--bg-card)', border:'0.5px solid var(--sep)', borderRadius: fullscreen ? 10 : 14,
        overflow:'hidden', display:'flex', flexDirection:'column',
        ...(fullscreen ? { height:'calc(100vh - 110px)' } : {}) }}>
        {/* Filter bar */}
        <div style={{ display:'flex', alignItems:'center', gap:8, padding: isMobile ? '10px 12px' : '12px 16px', borderBottom:'1px solid var(--border)', flexWrap:'wrap' }}>
          <span style={{ fontSize:11, fontWeight:600, color:'var(--ink3)' }}>Lọc:</span>
          <div style={{ position:'relative', display:'inline-flex', alignItems:'center' }}>
            <input placeholder="Biển số, cửa hàng..." value={search}
              onChange={e => { setSearch(e.target.value); setPg(0) }}
              style={{ border:'0.5px solid var(--sep)', background:'var(--fill-tertiary)', borderRadius:7, padding:'5px 28px 5px 9px', fontSize:12, outline:'none', minWidth:180 }}
            />
            {search && (
              <button onClick={() => { setSearch(''); setPg(0) }}
                style={{ position:'absolute', right:6, background:'none', border:'none', cursor:'pointer', color:'var(--label-tertiary)', fontSize:14, lineHeight:1, padding:'0 2px', display:'flex', alignItems:'center' }}>
                ✕
              </button>
            )}
          </div>
          <select value={filterMien} onChange={e => { setFilterMien(e.target.value); setPg(0) }}
            style={{ border:'0.5px solid var(--sep)', background:'var(--fill-tertiary)', borderRadius:7, padding:'5px 9px', fontSize:12 }}>
            <option value="">Tất cả miền</option>
            {['Miền Nam','Miền Bắc','Miền Trung'].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <select value={filterLT} onChange={e => { setFilterLT(e.target.value); setPg(0) }}
            style={{ border:'0.5px solid var(--sep)', background:'var(--fill-tertiary)', borderRadius:7, padding:'5px 9px', fontSize:12 }}>
            <option value="">Tất cả loại thùng</option>
            {['Thùng lửng, có cẩu','Thùng lửng','Thùng mui bạt','Thùng kín'].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <select value={filterLoaiHinh} onChange={e => { setFilterLoaiHinh(e.target.value); setPg(1) }}
            style={{ padding:'5px 10px', borderRadius:7, border:'1px solid var(--border)',
              background:'var(--card)', fontSize:12, color:'var(--ink)', outline:'none' }}>
            <option value="">Tất cả loại hình</option>
            <option value="cuahang">🏪 Xe cửa hàng</option>
            <option value="tonkho">🏭 Xe tổng kho</option>
          </select>
          <span style={{ fontSize:11, color:'var(--ink3)' }}>{filtered.length} / {rows.length} xe</span>
          <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
            <button onClick={() => setShowColPicker(true)}
              style={{ padding:'5px 11px', borderRadius:7, border:'1px solid var(--border)', background:'var(--card)', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
              ⚙ Chọn cột
            </button>
            <button onClick={() => { setShowSyncDrive(true); setSyncResult(null) }}
              style={{ padding:'5px 11px', borderRadius:7, border:'1px solid var(--border)', background:'var(--card)', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
              🔗 Sync ảnh Drive
            </button>
            <button onClick={() => setFullscreen(f => !f)}
              title={fullscreen ? 'Thoát toàn màn hình (Esc)' : 'Toàn màn hình'}
              style={{ padding:'5px 11px', borderRadius:7, border:'1px solid var(--border)', background: fullscreen ? 'var(--brand)' : 'var(--card)',
                color: fullscreen ? '#fff' : 'var(--label-primary)',
                fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
              {fullscreen ? '⊠ Thu nhỏ' : '⊡ Toàn màn hình'}
            </button>

            <button onClick={exportExcel}
              style={{ padding:'5px 11px', borderRadius:7, border:'none', background:'var(--green)', color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
              ⬇ Tải Excel
            </button>
            <input ref={uploadRef} type="file" accept=".xlsx,.xls,.csv"
              style={{ display:'none' }} onChange={handleUpload} />
            <button onClick={() => uploadRef.current?.click()} disabled={uploading}
              style={{ padding:'5px 12px', borderRadius:7, border:'1px solid var(--apple-green)',
                background:'var(--apple-green)', color:'#fff', fontSize:12, fontWeight:600,
                cursor:'pointer', fontFamily:'inherit', opacity: uploading ? 0.6 : 1 }}>
              {uploading ? '⏳ Đang upload...' : '⬆ Upload Excel'}
            </button>
          </div>
          {uploadMsg && (
            <div style={{ fontSize:12, padding:'6px 12px', marginTop:6, borderRadius:7,
              background: uploadMsg.ok ? '#DCFCE7' : '#FEE2E2',
              color: uploadMsg.ok ? '#1A7F37' : '#D70015', fontWeight:500 }}>
              {uploadMsg.ok ? '✓' : '✗'} {uploadMsg.text}
            </div>
          )}

          {/* Preview modal */}
          {previewData && (
            <div style={{ marginTop:8, padding:'12px', borderRadius:8, border:'1px solid #E5E7EB', background:'#F9FAFB' }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#374151', marginBottom:6 }}>
                📋 Xem trước: {previewData.totalRows} dòng · {previewData.headers.length} cột
              </div>
              <div style={{ fontSize:11, color:'#6B7280', marginBottom:8 }}>
                Cột phát hiện: {previewData.headers.slice(0,6).join(' · ')}{previewData.headers.length > 6 ? ` +${previewData.headers.length-6}` : ''}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={confirmUpload} disabled={uploading}
                  style={{ padding:'6px 14px', borderRadius:6, background:'#1A7F37', border:'none',
                    color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                  {uploading ? '⏳...' : '✓ Xác nhận cập nhật'}
                </button>
                <button onClick={() => { setPreviewData(null); setPendingFile(null) }}
                  style={{ padding:'6px 14px', borderRadius:6, background:'#F3F4F6', border:'1px solid #E5E7EB',
                    color:'#374151', fontSize:12, cursor:'pointer' }}>
                  Huỷ
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        {isLoading ? (
          <div style={{ textAlign:'center', padding:40, color:'var(--ink3)' }}>Đang tải dữ liệu...</div>
        ) : (
          <div style={{ overflowX:'auto', overflowY:'auto', ...(fullscreen ? { flex:1, maxHeight:'none' } : { maxHeight: isMobile ? '60vh' : 520 }) }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead style={{ position:'sticky', top:0, zIndex:10, background:'var(--bg-secondary)' }}>
                <tr>
                  {visibleCols.map((col, i) => (
                    <th key={col.k}
                      onClick={() => col.sort && handleSort(col.k)}
                      style={{
                        padding:'9px 10px', background:'var(--bg-secondary)', borderBottom:'1px solid var(--sep)',
                        fontWeight:600, fontSize:10.5, color:'var(--label-secondary)', textTransform:'uppercase',
                        letterSpacing:'.05em', whiteSpace:'nowrap', cursor: col.sort ? 'pointer' : 'default',
                        textAlign:'center'
                      }}
                    >
                      {col.l}
                      {col.sort && <span style={{ marginLeft:3, opacity:.5, fontSize:10 }}>
                        {sortCol === col.k ? (sortDir === 1 ? '▲' : '▼') : '⇅'}
                      </span>}
                    </th>
                  ))}
                </tr>
                {/* ── Filter row ── */}
                <tr>
                  {visibleCols.map(col => {
                    if (NO_COL_FILTER.has(col.k)) return <th key={col.k + '_f'} style={{ padding:'4px 6px', background:'var(--bg-secondary)', borderBottom:'2px solid var(--sep)' }} />
                    const opts = [...new Set(rows.map(r => String(r[col.k] || '')).filter(Boolean))].sort((a,b) => a.localeCompare(b, 'vi'))
                    if (opts.length === 0) return <th key={col.k + '_f'} style={{ padding:'4px 6px', background:'var(--bg-secondary)', borderBottom:'2px solid var(--sep)' }} />
                    const applied  = colFilters[col.k] || []
                    const isOpen   = openFilterCol === col.k
                    const selected = isOpen ? (pendingFilters[col.k] || []) : applied
                    const label    = applied.length === 0 ? '--' : applied.length === 1 ? applied[0] : `${applied.length} mục`
                    const toggleVal = (v) => {
                      setPendingFilters(prev => {
                        const cur = prev[col.k] || []
                        const next = cur.includes(v) ? cur.filter(x => x !== v) : [...cur, v]
                        return { ...prev, [col.k]: next }
                      })
                    }
                    return (
                      <th key={col.k + '_f'} style={{ padding:'4px 6px', background:'var(--bg-secondary)', borderBottom:'2px solid var(--sep)', position:'relative' }}>
                        {/* Trigger button */}
                        <button
                          onClick={e => {
                          e.stopPropagation()
                          if (!isOpen) {
                            // Copy giá trị hiện tại vào pending khi mở
                            setPendingFilters(prev => ({ ...prev, [col.k]: [...(colFilters[col.k] || [])] }))
                          } else {
                            // Đóng → apply pending vào colFilters
                            setColFilters(prev => ({ ...prev, [col.k]: pendingFilters[col.k] || [] }))
                            setPg(0)
                          }
                          setOpenFilterCol(isOpen ? null : col.k)
                        }}
                          style={{
                            width:'100%', fontSize:10, padding:'2px 18px 2px 5px', position:'relative',
                            border: selected.length ? '1.5px solid var(--brand)' : '1px solid var(--sep)',
                            borderRadius:4,
                            background: selected.length ? 'rgba(230,50,0,0.06)' : 'var(--bg-card)',
                            color: selected.length ? 'var(--brand)' : 'var(--label-secondary)',
                            cursor:'pointer', outline:'none', fontWeight: selected.length ? 700 : 400,
                            textAlign:'left', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                            fontFamily:'inherit'
                          }}
                        >
                          {label}
                          <span style={{ position:'absolute', right:4, top:'50%', transform:'translateY(-50%)', fontSize:8, opacity:.5 }}>▼</span>
                        </button>
                        {/* Dropdown panel */}
                        {isOpen && (
                          <div
                            onClick={e => e.stopPropagation()}
                            style={{
                            position:'absolute', top:'100%', left:0, zIndex:200,
                            background:'var(--bg-card)', border:'1px solid var(--sep)',
                            borderRadius:7, boxShadow:'0 4px 20px rgba(0,0,0,.12)',
                            minWidth:160, maxHeight:240, overflowY:'auto', padding:'4px 0'
                          }}>
                            {/* -- Reset */}
                            <div
                              onClick={() => {
                                setColFilters(prev => ({ ...prev, [col.k]: [] }))
                                setPendingFilters(prev => ({ ...prev, [col.k]: [] }))
                                setPg(0)
                                setOpenFilterCol(null)
                              }}
                              style={{ padding:'6px 10px', fontSize:11, cursor:'pointer', color:'var(--label-secondary)', fontWeight:500,
                                borderBottom:'1px solid var(--sep)', background: selected.length === 0 ? 'rgba(230,50,0,0.05)' : 'transparent' }}
                            >
                              -- Tất cả (bỏ lọc)
                            </div>
                            {opts.map(o => {
                              const checked = selected.includes(o)
                              return (
                                <div key={o}
                                  onClick={() => toggleVal(o)}
                                  style={{ padding:'5px 10px', fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', gap:6,
                                    background: checked ? 'rgba(230,50,0,0.06)' : 'transparent',
                                    color: checked ? 'var(--brand)' : 'var(--label-primary)', fontWeight: checked ? 600 : 400 }}
                                >
                                  <span style={{ width:13, height:13, borderRadius:3, border: checked ? '2px solid var(--brand)' : '1.5px solid var(--sep)',
                                    background: checked ? 'var(--brand)' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center',
                                    flexShrink:0, fontSize:8, color:'#fff' }}>
                                    {checked ? '✓' : ''}
                                  </span>
                                  <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{o}</span>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {pgRows.map((r, idx) => {
                  const globalIdx = pg * PAGE_SIZE + idx
                  return (
                    <tr key={r._id || r.maTaiSan || idx} style={{ borderBottom:'1px solid var(--border)' }}>
                      {visibleCols.map(col => {
                        if (col.k === 'stt') return <td key="stt" style={{ padding:'8px 10px', color:'var(--ink3)', fontSize:11, textAlign:'center' }}>{globalIdx+1}</td>
                        if (col.k === 'bienSo') return (
                          <td key="bs" style={{ padding:'8px 10px', textAlign:'center' }}>
                            <span
                          style={{ color:'var(--brand)', fontWeight:700, cursor:'pointer', borderBottom:'1px dashed var(--brand)' }}
                          onClick={() => { localStorage.setItem('xe_detail_data', JSON.stringify(r)); window.open(`/xe-detail?id=${encodeURIComponent(r.maTaiSan || r.bienSo || '')}`, '_blank') }}
                          title="Click để xem chi tiết"
                        >{r.bienSo}</span>
                          </td>
                        )
                        if (col.k === 'mien') {
                          const s2 = mienTag[r.mien] || {}
                          return <td key="mien" style={{ padding:'8px 10px', textAlign:'center' }}><span style={{ background:s2.bg, color:s2.color, fontWeight:600, fontSize:10.5, padding:'2px 7px', borderRadius:4 }}>{r.mien}</span></td>
                        }
                        if (col.k === 'gtcl' || col.k === 'nguyenGia') return <td key={col.k} style={{ padding:'8px 10px', textAlign:'center' }}>{r[col.k] ? fmtCur(r[col.k]) : '—'}</td>
                        if (col.k === 'taiTrong') return <td key="tt" style={{ padding:'8px 10px', textAlign:'center' }}>{r.taiTrong}</td>
                        if (col.k === 'hasTaiNan') return <td key="tn" style={{ padding:'8px 10px', textAlign:'center' }}>{r.hasTaiNan ? <span style={{ background:'var(--red-l)', color:'var(--red)', fontWeight:600, fontSize:10.5, padding:'2px 7px', borderRadius:4 }}>Có</span> : ''}</td>
                        if (col.k === 'hasDieuDong') return <td key="dd" style={{ padding:'8px 10px', textAlign:'center' }}>{r.hasDieuDong ? <span style={{ background:'var(--teal-l)', color:'var(--teal)', fontWeight:600, fontSize:10.5, padding:'2px 7px', borderRadius:4 }}>Có</span> : ''}</td>

                        const isEditing = editCell?.rowIdx === globalIdx && editCell?.field === col.k
                        return (
                          <td key={col.k}
                            style={{ padding: isEditing ? 0 : '8px 10px', color:'var(--ink2)', whiteSpace:'nowrap', maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', cursor: col.edit ? 'text' : 'default', position:'relative' }}
                            onDoubleClick={() => col.edit && setEditCell({ rowIdx: globalIdx, field: col.k, value: r[col.k] || '' })}
                            title={col.edit ? 'Nhấp đúp để sửa' : ''}
                          >
                            {isEditing ? (
                              <>
                                <input
                                  autoFocus
                                  value={editCell.value}
                                  onChange={e => {
                                    setEditCell(ec => ({ ...ec, value: e.target.value }))
                                    if (col.k === 'cuaHang') fetchSuggestions(e.target.value)
                                  }}
                                  onBlur={() => { setTimeout(() => { handleEdit(globalIdx, col.k, editCell.value); setEditCell(null); setShowSug(false) }, 200) }}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') { handleEdit(globalIdx, col.k, editCell.value); setEditCell(null); setShowSug(false) }
                                    if (e.key === 'Escape') { setEditCell(null); setShowSug(false) }
                                  }}
                                  style={{ width:'100%', padding:'7px 10px', border:'2px solid var(--brand)', outline:'none', fontFamily:'inherit', fontSize:12 }}
                                />
                                {col.k === 'cuaHang' && showSug && suggestions.length > 0 && (
                                  <div style={{ position:'absolute', top:'100%', left:0, zIndex:300,
                                    background:'var(--bg-card)', border:'1px solid var(--sep)',
                                    borderRadius:8, boxShadow:'0 4px 20px rgba(0,0,0,.15)',
                                    minWidth:280, maxHeight:200, overflowY:'auto' }}>
                                    {suggestions.map((sug, si) => (
                                      <div key={si}
                                        onMouseDown={() => handleSelectSuggestion(globalIdx, sug)}
                                        style={{ padding:'7px 12px', cursor:'pointer', fontSize:12,
                                          borderBottom:'0.5px solid var(--sep)', color:'var(--label-primary)' }}
                                        onMouseEnter={e => e.currentTarget.style.background='var(--fill-tertiary)'}
                                        onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                                        <span style={{ fontWeight:600 }}>{sug.value}</span>
                                        <span style={{ color:'var(--label-secondary)', marginLeft:6 }}>- {sug.tinh}</span>
                                        <span style={{ fontSize:10, color:'var(--label-tertiary)', marginLeft:8 }}>{sug.type} · {sug.ma}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </>
                            ) : (r[col.k] || '')}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {filtered.length > PAGE_SIZE && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding: isMobile ? '10px 12px' : '12px 16px', borderTop:'1px solid var(--border)', background:'var(--bg)', flexWrap:'wrap', gap:8 }}>
            <div style={{ fontSize:12, color:'var(--ink3)' }}>
              Hiển thị {pg*PAGE_SIZE+1}–{Math.min((pg+1)*PAGE_SIZE, filtered.length)} trong {filtered.length} xe
            </div>
            <div style={{ display:'flex', gap:6 }}>
              <button disabled={pg===0} onClick={() => setPg(0)} style={{ padding:'5px 10px', borderRadius:7, border:'1px solid var(--border)', background:'var(--bg-card)', cursor:'pointer' }}>«</button>
              <button disabled={pg===0} onClick={() => setPg(p=>p-1)} style={{ padding:'5px 10px', borderRadius:7, border:'1px solid var(--border)', background:'var(--bg-card)', cursor:'pointer' }}>‹</button>
              {Array.from({ length: Math.min(5, totalPg) }, (_, i) => {
                const start = Math.max(0, Math.min(pg-2, totalPg-5))
                const pi = start + i
                return (
                  <button key={pi} onClick={() => setPg(pi)}
                    style={{ padding:'5px 10px', borderRadius:7, border:'1px solid var(--border)', background: pi===pg ? 'var(--brand)' : '#fff', color: pi===pg ? '#fff' : 'inherit', cursor:'pointer' }}>
                    {pi+1}
                  </button>
                )
              })}
              <button disabled={pg>=totalPg-1} onClick={() => setPg(p=>p+1)} style={{ padding:'5px 10px', borderRadius:7, border:'1px solid var(--border)', background:'var(--bg-card)', cursor:'pointer' }}>›</button>
              <button disabled={pg>=totalPg-1} onClick={() => setPg(totalPg-1)} style={{ padding:'5px 10px', borderRadius:7, border:'1px solid var(--border)', background:'var(--bg-card)', cursor:'pointer' }}>»</button>
            </div>
          </div>
        )}
      </div>

      {/* Column Picker Modal */}
      {/* ── Modal Sync Drive ── */}
      {showSyncDrive && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={() => setShowSyncDrive(false)}>
          <div style={{ background:'var(--bg-card)', borderRadius:14, width:480, maxWidth:'95vw', boxShadow:'0 8px 40px rgba(0,0,0,.18)', overflow:'hidden' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--sep)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontSize:14, fontWeight:600 }}>🔗 Sync ảnh từ Google Drive</span>
              <button onClick={() => setShowSyncDrive(false)} style={{ border:'none', background:'none', cursor:'pointer', fontSize:18, color:'var(--label-secondary)' }}>✕</button>
            </div>
            <div style={{ padding:'20px' }}>
              <div style={{ fontSize:12, color:'var(--label-secondary)', marginBottom:12 }}>
                Nhập URL hoặc ID của folder Drive gốc chứa các subfolder đặt tên theo biển số xe.
              </div>
              <input
                value={syncFolderId}
                onChange={e => setSyncFolderId(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/1abc... hoặc ID"
                style={{ width:'100%', boxSizing:'border-box', padding:'8px 12px', borderRadius:8, border:'1px solid var(--sep)', fontSize:12, fontFamily:'inherit', outline:'none', background:'var(--fill-tertiary)' }}
              />
              {syncResult && (
                <div style={{ marginTop:12, padding:'10px 14px', borderRadius:8,
                  background: syncResult.error ? 'rgba(255,59,48,.08)' : 'rgba(52,199,89,.08)',
                  border: `1px solid ${syncResult.error ? 'rgba(255,59,48,.2)' : 'rgba(52,199,89,.2)'}`,
                  fontSize:12 }}>
                  {syncResult.error ? (
                    <span style={{ color:'var(--apple-red)' }}>❌ {syncResult.error}</span>
                  ) : (
                    <div style={{ color:'var(--apple-green)', lineHeight:1.8 }}>
                      <div>✅ {syncResult.message}</div>
                      <div style={{ color:'var(--label-secondary)' }}>
                        Tổng folder: {syncResult.total} · Khớp: {syncResult.matched} · Không tìm thấy: {syncResult.notFound}
                      </div>
                      {syncResult.notFoundList?.length > 0 && (
                        <div style={{ marginTop:6, color:'var(--label-tertiary)', fontSize:11 }}>
                          Folder không khớp: {syncResult.notFoundList.join(', ')}
                          {syncResult.notFound > 20 ? ` ... và ${syncResult.notFound - 20} folder khác` : ''}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div style={{ padding:'12px 20px', borderTop:'1px solid var(--sep)', display:'flex', gap:8, justifyContent:'flex-end' }}>
              <button onClick={() => setShowSyncDrive(false)} style={{ padding:'7px 16px', borderRadius:7, border:'0.5px solid var(--sep)', background:'var(--fill-tertiary)', cursor:'pointer', fontSize:12, fontFamily:'inherit' }}>Đóng</button>
              <button onClick={handleSyncDrive} disabled={syncing || !syncFolderId.trim()}
                style={{ padding:'7px 16px', borderRadius:7, border:'none', background: syncing ? 'var(--sep)' : 'var(--brand)', color:'#fff', cursor: syncing ? 'not-allowed' : 'pointer', fontSize:12, fontFamily:'inherit', fontWeight:600 }}>
                {syncing ? '⏳ Đang sync...' : '🔗 Bắt đầu Sync'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showColPicker && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={() => setShowColPicker(false)}>
          <div style={{ background:'var(--bg-card)', borderRadius:14, width:480, maxWidth:'95vw', boxShadow:'0 8px 40px rgba(0,0,0,.18)', overflow:'hidden' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontSize:14, fontWeight:600 }}>⚙ Chọn cột hiển thị</span>
              <button onClick={() => setShowColPicker(false)} style={{ border:'none', background:'var(--bg)', borderRadius:4, padding:'4px 8px', cursor:'pointer', fontSize:16 }}>✕</button>
            </div>
            <div style={{ padding:'16px 20px', maxHeight:'60vh', overflowY:'auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
              {dynamicCols.map(col => {
                const checked = visibleKeys.includes(col.k)
                const fixed = col.k === 'stt'
                return (
                  <label key={col.k} style={{
                    display:'flex', alignItems:'center', gap:8, padding:'7px 10px', borderRadius:7, cursor: fixed ? 'default' : 'pointer',
                    border: `1px solid ${checked ? 'var(--brand)' : 'var(--border)'}`,
                    background: checked ? 'var(--brand-l)' : 'var(--bg)',
                    color: checked ? 'var(--brand)' : 'var(--ink2)',
                    fontWeight: checked ? 600 : 400, fontSize:12.5
                  }}>
                    <input type="checkbox" checked={checked} disabled={fixed}
                      onChange={() => {
                        if (fixed) return
                        setVisibleKeys(prev => {
                          const next = checked ? prev.filter(k => k !== col.k) : [...prev, col.k]
                          return dynamicCols.map(c => c.k).filter(k => next.includes(k))
                        })
                      }}
                      style={{ display:'none' }}
                    />
                    {checked ? '✓ ' : '  '}{col.l}
                  </label>
                )
              })}
            </div>
            <div style={{ padding:'12px 20px', borderTop:'1px solid var(--border)', display:'flex', gap:8, justifyContent:'flex-end' }}>
              <button onClick={() => setVisibleKeys(dynamicCols.map(c => c.k))} style={{ padding:'6px 14px', borderRadius:7, border:'0.5px solid var(--sep)', background:'var(--fill-tertiary)', cursor:'pointer', fontSize:12, fontFamily:'inherit' }}>Chọn tất cả</button>
              <button onClick={() => setVisibleKeys(DEFAULT_VISIBLE)} style={{ padding:'6px 14px', borderRadius:7, border:'0.5px solid var(--sep)', background:'var(--fill-tertiary)', cursor:'pointer', fontSize:12, fontFamily:'inherit' }}>Mặc định</button>
              <button onClick={() => setShowColPicker(false)} style={{ padding:'6px 14px', borderRadius:7, border:'none', background:'var(--brand)', color:'#fff', cursor:'pointer', fontSize:12, fontFamily:'inherit' }}>Xong</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
