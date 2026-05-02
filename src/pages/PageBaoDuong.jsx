// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📁 FRONTEND — src/pages/PageBaoDuong.jsx
// Quản lý bảo dưỡng, sửa chữa, lốp xe
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { useState, useEffect, useRef, useCallback } from 'react'

const API = import.meta.env.VITE_API_URL || 'https://hsg-backend.onrender.com'
const tok = () => localStorage.getItem('hsg_token') || ''
const apiFetch = (p, o = {}) => fetch(`${API}${p}`, {
  ...o,
  headers: { Authorization: `Bearer ${tok()}`, 'Content-Type': 'application/json', ...o.headers }
})

// ── Bảng chu kỳ BD xe tải (HSH.QLTS-05 mục 6.1.3, lặp mỗi 30.000km) ──
const BD_XETAI = [
  { moc: 5000,  items: ['Thay dầu động cơ', 'Kiểm tra lọc dầu, nước làm mát, dầu phanh, dầu trợ lực', 'Kiểm tra rò rỉ dầu động cơ, hộp số, visai', 'Kiểm tra bố thắng', 'Siết bulong sàn thùng, chassis', 'Kiểm tra áp suất lốp, độ mòn lốp', 'Kiểm tra ắc quy'] },
  { moc: 10000, items: ['Thay dầu động cơ', 'Kiểm tra và vệ sinh lọc gió động cơ', 'Kiểm tra lọc nhiên liệu', 'Kiểm tra hệ thống treo', 'Kiểm tra bạc đạn bánh xe', 'Kiểm tra hệ thống điện tổng thể'] },
  { moc: 15000, items: ['Thay dầu động cơ', 'Kiểm tra lọc dầu, nước làm mát, dầu phanh', 'Kiểm tra rò rỉ', 'Kiểm tra bố thắng', 'Siết bulong sàn thùng, chassis', 'Kiểm tra áp suất lốp, độ mòn lốp', 'Kiểm tra ắc quy'] },
  { moc: 20000, items: ['Thay lọc nhiên liệu', 'Thay lọc gió', 'Cân chỉnh thước lái', 'Kiểm tra và bổ sung dầu hộp số, dầu cầu', 'Kiểm tra phốt láp, bạc đạn moay-ơ'] },
  { moc: 25000, items: ['Thay dầu động cơ', 'Kiểm tra lọc dầu, nước làm mát, dầu phanh', 'Kiểm tra rò rỉ', 'Kiểm tra bố thắng', 'Siết bulong', 'Kiểm tra lốp, ắc quy'] },
  { moc: 30000, items: ['Thay dầu hộp số', 'Thay dầu cầu', 'Thay dầu phanh', 'Xả và thay nước mát', 'Kiểm tra turbo', 'Kiểm tra kim phun', 'Kiểm tra cầu trục', 'Kiểm tra Máy lạnh'] },
]

// Chu kỳ BD xe ô tô (7.4, lặp mỗi 60.000km)
const BD_OTO = [
  { moc: 5000,  items: ['Thay dầu động cơ, kiểm tra tổng quát'] },
  { moc: 10000, items: ['Thay dầu, lọc dầu, kiểm tra phanh, khung gầm'] },
  { moc: 15000, items: ['Thay dầu động cơ, kiểm tra tổng quát'] },
  { moc: 20000, items: ['Thay dầu, lọc dầu, thay lọc gió điều hoà, vệ sinh lọc gió động cơ'] },
  { moc: 30000, items: ['Thay dầu, lọc dầu, kiểm tra tổng quát, vệ sinh máy lạnh'] },
  { moc: 40000, items: ['Thay dầu, lọc dầu, thay lọc gió điều hoà, vệ sinh lọc gió, thay dầu phanh, thay dầu hộp số MT'] },
  { moc: 60000, items: ['Thay dầu, lọc dầu, thay lọc gió điều hoà, vệ sinh lọc gió, kiểm tra/thay bugi, vệ sinh máy lạnh'] },
]

// Cấu hình lốp theo số cầu
const AXLE_CONFIGS = {
  '4':  { label: '2 cầu đơn · 4 lốp (xe con/tải nhẹ)', positions: ['TT','TP','ST','SP'] },
  '6':  { label: '2 cầu · 6 lốp (tải vừa)', positions: ['TT','TP','STN','STT','SPN','SPT'] },
  '10': { label: '3 cầu · 10 lốp (tải lớn)', positions: ['TT','TP','C1TN','C1TT','C1PN','C1PT','C2TN','C2TT','C2PN','C2PT'] },
}

const POS_LABELS = {
  TT:'Trước trái', TP:'Trước phải',
  ST:'Sau trái', SP:'Sau phải',
  STN:'Sau trái ngoài', STT:'Sau trái trong', SPN:'Sau phải ngoài', SPT:'Sau phải trong',
  C1TN:'Cầu 1 trái ngoài', C1TT:'Cầu 1 trái trong', C1PN:'Cầu 1 phải ngoài', C1PT:'Cầu 1 phải trong',
  C2TN:'Cầu 2 trái ngoài', C2TT:'Cầu 2 trái trong', C2PN:'Cầu 2 phải ngoài', C2PT:'Cầu 2 phải trong',
}

const TABS = [
  { id:'overview', label:'Tổng quan' },
  { id:'alert',    label:'Cảnh báo BD' },
  { id:'cost',     label:'Chi phí' },
  { id:'timeline', label:'Timeline xe' },
  { id:'tire',     label:'Lốp xe' },
  { id:'forecast', label:'Dự báo' },
  { id:'ocr',      label:'Scan báo giá' },
  { id:'docs',     label:'Giấy tờ xe' },
]

// ── Empty State component ──────────────────────────────────────────────────
function EmptyState({ icon='📋', title, sub, action, onAction }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      padding:'48px 24px', gap:12, textAlign:'center' }}>
      <div style={{ fontSize:40 }}>{icon}</div>
      <div style={{ fontWeight:600, fontSize:15 }}>{title}</div>
      {sub && <div style={{ fontSize:13, color:'var(--color-text-secondary)', maxWidth:320, lineHeight:1.5 }}>{sub}</div>}
      {action && <button onClick={onAction} style={{ marginTop:8, padding:'8px 20px', borderRadius:8,
        background:'var(--color-text-info)', color:'#fff', border:'none', cursor:'pointer', fontSize:13, fontWeight:600 }}>
        {action}
      </button>}
    </div>
  )
}

// ── Badge ──────────────────────────────────────────────────────────────────
function Badge({ type, children }) {
  const colors = {
    red:  { bg:'rgba(220,38,38,.12)', color:'#ef4444' },
    yel:  { bg:'rgba(234,179,8,.12)', color:'#eab308' },
    grn:  { bg:'rgba(34,197,94,.12)', color:'#22c55e' },
    blu:  { bg:'rgba(59,130,246,.12)', color:'#60a5fa' },
    gray: { bg:'rgba(148,163,184,.12)', color:'var(--color-text-secondary)' },
  }
  const c = colors[type] || colors.gray
  return (
    <span style={{ display:'inline-block', padding:'2px 8px', borderRadius:20, fontSize:10,
      fontWeight:600, background:c.bg, color:c.color }}>
      {children}
    </span>
  )
}

// ── Tire diagram ───────────────────────────────────────────────────────────
function TireView({ config, tireData, onClickTire }) {
  const cfg = AXLE_CONFIGS[config]
  const getTire = pos => tireData?.[pos] || null

  const TireBox = ({ pos }) => {
    const t = getTire(pos)
    const kmMax = t?.loai === 'kem' ? 80000 : 50000
    const kmUsed = t ? (t.kmHienTai - t.kmLapDat) : 0
    const pct = t ? Math.min(kmUsed / kmMax, 1) : 0
    let status = 'empty'
    if (t) status = pct >= 1 ? 'crit' : pct >= 0.9 ? 'warn' : 'ok'

    const colors = {
      empty: { border:'var(--color-border-tertiary)', bg:'var(--color-background-secondary)' },
      ok:    { border:'#22c55e', bg:'rgba(34,197,94,.08)' },
      warn:  { border:'#eab308', bg:'rgba(234,179,8,.08)' },
      crit:  { border:'#ef4444', bg:'rgba(239,68,68,.1)' },
    }
    const c = colors[status]

    return (
      <div onClick={() => onClickTire(pos, t)} title={POS_LABELS[pos]}
        style={{ width:38, height:62, border:`2px solid ${c.border}`, borderRadius:7,
          background:c.bg, display:'flex', flexDirection:'column', alignItems:'center',
          justifyContent:'center', gap:2, cursor:'pointer', transition:'transform .15s' }}
        onMouseEnter={e => e.currentTarget.style.transform='scale(1.06)'}
        onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>
        {t ? (
          <>
            <div style={{ fontSize:8, fontWeight:700,
              color: status==='crit'?'#ef4444':status==='warn'?'#eab308':'#22c55e' }}>
              {Math.round(kmUsed/1000)}k
            </div>
            <div style={{ width:24, height:4, borderRadius:2, background:'rgba(255,255,255,.1)', overflow:'hidden' }}>
              <div style={{ width:`${pct*100}%`, height:'100%', borderRadius:2,
                background: status==='crit'?'#ef4444':status==='warn'?'#eab308':'#22c55e' }}/>
            </div>
          </>
        ) : (
          <div style={{ fontSize:9, color:'var(--color-text-tertiary)' }}>+</div>
        )}
        <div style={{ fontSize:8, color:'var(--color-text-secondary)' }}>{pos}</div>
      </div>
    )
  }

  const Body = ({ label }) => (
    <div style={{ width:70, height:28, background:'var(--color-background-secondary)',
      border:'1px solid var(--color-border-tertiary)', borderRadius:6,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:10, color:'var(--color-text-secondary)' }}>
      {label}
    </div>
  )

  if (config === '4') return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
      <div style={{ display:'flex', gap:80, alignItems:'center' }}>
        <TireBox pos="TT"/><Body label="TRƯỚC"/><TireBox pos="TP"/>
      </div>
      <div style={{ width:4, height:24, background:'var(--color-border-tertiary)', margin:'0 auto' }}/>
      <div style={{ display:'flex', gap:80, alignItems:'center' }}>
        <TireBox pos="ST"/><Body label="SAU"/><TireBox pos="SP"/>
      </div>
    </div>
  )

  if (config === '6') return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
      <div style={{ display:'flex', gap:80, alignItems:'center' }}>
        <TireBox pos="TT"/><Body label="CẦU TRƯỚC"/><TireBox pos="TP"/>
      </div>
      <div style={{ width:4, height:20, background:'var(--color-border-tertiary)', margin:'0 auto' }}/>
      <div style={{ display:'flex', gap:20, alignItems:'center' }}>
        <TireBox pos="STN"/><TireBox pos="STT"/>
        <Body label="CẦU SAU"/>
        <TireBox pos="SPT"/><TireBox pos="SPN"/>
      </div>
    </div>
  )

  // 10 tires
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
      <div style={{ display:'flex', gap:80, alignItems:'center' }}>
        <TireBox pos="TT"/><Body label="CẦU TRƯỚC"/><TireBox pos="TP"/>
      </div>
      <div style={{ width:4, height:16, background:'var(--color-border-tertiary)', margin:'0 auto' }}/>
      <div style={{ display:'flex', gap:16, alignItems:'center' }}>
        <TireBox pos="C1TN"/><TireBox pos="C1TT"/>
        <Body label="CẦU SAU 1"/>
        <TireBox pos="C1PT"/><TireBox pos="C1PN"/>
      </div>
      <div style={{ width:4, height:16, background:'var(--color-border-tertiary)', margin:'0 auto' }}/>
      <div style={{ display:'flex', gap:16, alignItems:'center' }}>
        <TireBox pos="C2TN"/><TireBox pos="C2TT"/>
        <Body label="CẦU SAU 2"/>
        <TireBox pos="C2PT"/><TireBox pos="C2PN"/>
      </div>
    </div>
  )
}

// ── OCR File card ──────────────────────────────────────────────────────────
function OcrCard({ file, result, onUpdate, onRemove, idx }) {
  const fields = ['bienSo','km','ngay','garage','soRO','tongTien']
  const labels = { bienSo:'Biển số xe', km:'Số KM', ngay:'Ngày', garage:'Garage/NCC', soRO:'Số RO', tongTien:'Tổng tiền' }

  return (
    <div style={{ border:'1px solid var(--color-border-tertiary)', borderRadius:10,
      padding:14, marginBottom:12, background:'var(--color-background-secondary)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:13, fontWeight:600 }}>📄 {file.name}</span>
          {result?.aiRead && (
            <span style={{ fontSize:9, padding:'2px 7px', borderRadius:10, fontWeight:700,
              background:'rgba(249,115,22,.15)', color:'#f97316' }}>AI đọc</span>
          )}
        </div>
        <button onClick={() => onRemove(idx)} style={{ background:'none', border:'none',
          cursor:'pointer', color:'var(--color-text-secondary)', fontSize:16 }}>✕</button>
      </div>

      {result ? (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 12px' }}>
          {fields.map(f => (
            <div key={f}>
              <div style={{ fontSize:10, color:'var(--color-text-secondary)', marginBottom:2 }}>{labels[f]}</div>
              <input
                value={result[f] || ''}
                onChange={e => onUpdate(idx, f, e.target.value)}
                style={{ width:'100%', padding:'5px 10px', borderRadius:6, fontSize:12,
                  background:'var(--color-background-primary)', border:'1px solid var(--color-border-secondary)',
                  color:'var(--color-text-primary)', outline:'none' }}
              />
            </div>
          ))}
          {result.hangMuc?.length > 0 && (
            <div style={{ gridColumn:'1/-1', marginTop:6 }}>
              <div style={{ fontSize:10, color:'var(--color-text-secondary)', marginBottom:4 }}>
                Hạng mục nhận dạng ({result.hangMuc.length})
              </div>
              {result.hangMuc.map((h, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4,
                  padding:'4px 8px', background:'var(--color-background-primary)', borderRadius:6 }}>
                  <span style={{ flex:1, fontSize:11 }}>{h.ten}</span>
                  <span style={{ fontSize:11, fontWeight:600 }}>{h.thanhTien?.toLocaleString('vi-VN')}đ</span>
                  <Badge type={h.loai==='baoDuong'?'grn':h.loai==='suaChua'?'yel':'blu'}>
                    {h.loai==='baoDuong'?'BD định kỳ':h.loai==='suaChua'?'Sửa chữa':'Gia công'}
                  </Badge>
                  {h.canhBao && <Badge type="red">⚠ {h.canhBao}</Badge>}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ textAlign:'center', padding:'16px 0', color:'var(--color-text-secondary)', fontSize:12 }}>
          Đang xử lý...
        </div>
      )}
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function PageBaoDuong({ token, user }) {
  const [tab, setTab] = useState('overview')

  // Data
  const [vehicles, setVehicles] = useState([])
  const [bdHistory, setBdHistory] = useState([])   // lịch sử BDSC — TODO: từ API /api/bdsc
  const [tireData, setTireData]   = useState({})   // lốp xe — TODO: từ API /api/bdsc/tire
  const [docsData, setDocsData]   = useState({})   // giấy tờ — TODO: từ API /api/bdsc/docs
  const [loadingVe, setLoadingVe] = useState(true)

  // Timeline
  const [selectedVe, setSelectedVe] = useState('')

  // Tire
  const [tireVe, setTireVe]         = useState('')
  const [axleCfg, setAxleCfg]       = useState('6')
  const [tireModal, setTireModal]   = useState(null) // { pos, data }

  // OCR
  const [ocrFiles, setOcrFiles]     = useState([])  // [{file, preview}]
  const [ocrResults, setOcrResults] = useState([])  // [{bienSo,km,...,hangMuc}] — 1 per file
  const [ocrLoading, setOcrLoading] = useState(false)
  const fileInputRef = useRef()

  // Fetch danh sách xe (đã có sẵn từ API xe cũ)
  useEffect(() => {
    apiFetch('/api/xe/all')
      .then(r => r.json())
      .then(d => { setVehicles(Array.isArray(d) ? d : []); setLoadingVe(false) })
      .catch(() => setLoadingVe(false))
  }, [])

  // OCR: gửi ảnh/PDF lên backend để AI đọc
  const processOcr = useCallback(async (files) => {
    setOcrLoading(true)
    const newResults = [...ocrResults]

    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      const startIdx = ocrFiles.length + i
      try {
        const b64 = await new Promise((res, rej) => {
          const reader = new FileReader()
          reader.onload = () => res(reader.result.split(',')[1])
          reader.onerror = rej
          reader.readAsDataURL(f.file)
        })

        // Gọi backend OCR endpoint (cần thêm route /api/bdsc/ocr vào backend)
        const resp = await apiFetch('/api/bdsc/ocr', {
          method: 'POST',
          body: JSON.stringify({
            base64: b64,
            mimeType: f.file.type || 'image/jpeg',
            filename: f.file.name,
          })
        })
        if (resp.ok) {
          const data = await resp.json()
          newResults[startIdx] = { ...data, aiRead: true }
        } else {
          // Nếu chưa có backend OCR — để trống cho user tự điền
          newResults[startIdx] = { bienSo:'', km:'', ngay:'', garage:'', soRO:'', tongTien:'', hangMuc:[], aiRead:false }
        }
      } catch {
        newResults[startIdx] = { bienSo:'', km:'', ngay:'', garage:'', soRO:'', tongTien:'', hangMuc:[], aiRead:false }
      }
    }
    setOcrResults(newResults)
    setOcrLoading(false)
  }, [ocrFiles, ocrResults])

  const handleFileSelect = useCallback((e) => {
    const selected = Array.from(e.target.files)
    const newFiles = selected.map(f => ({
      file: f,
      preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null
    }))
    setOcrFiles(prev => [...prev, ...newFiles])
    processOcr(newFiles)
  }, [processOcr])

  const removeOcrFile = useCallback((idx) => {
    setOcrFiles(prev => prev.filter((_,i) => i !== idx))
    setOcrResults(prev => prev.filter((_,i) => i !== idx))
  }, [])

  const updateOcrResult = useCallback((idx, field, val) => {
    setOcrResults(prev => prev.map((r,i) => i===idx ? {...r,[field]:val} : r))
  }, [])

  const submitAllOcr = async () => {
    // Gửi tất cả kết quả OCR đã xác nhận lên backend
    for (const result of ocrResults) {
      if (!result.bienSo || !result.km) continue
      await apiFetch('/api/bdsc', { method:'POST', body: JSON.stringify(result) })
    }
    setBdHistory(prev => [...ocrResults.map(r => ({ ...r, confirmedAt: new Date() })), ...prev])
    setOcrFiles([])
    setOcrResults([])
    alert(`Đã lưu ${ocrResults.length} báo giá vào hệ thống`)
  }

  // Tính cảnh báo BD dựa trên km GPS hiện tại
  const bdAlerts = vehicles.map(xe => {
    const km = xe.kmGPS || 0
    if (!km) return null
    const cycle = xe.loaiXe?.includes('ô tô') ? BD_OTO : BD_XETAI
    const cycleKm = xe.loaiXe?.includes('ô tô') ? 60000 : 30000
    const lastBdKm = bdHistory.find(h => h.bienSo === xe.bienSo && h.loai === 'baoDuong')?.km || 0
    const kmTuBD = km - lastBdKm
    const mocTiepTheo = Math.ceil(km / 5000) * 5000
    const conLai = mocTiepTheo - km
    const pct = Math.min(kmTuBD / 5000, 1)
    if (pct < 0.7) return null
    return { xe, km, mocTiepTheo, conLai, pct, status: pct >= 1 ? 'crit' : 'warn' }
  }).filter(Boolean)

  // CSS chung
  const card = { background:'var(--color-background-secondary)', border:'1px solid var(--color-border-tertiary)', borderRadius:10, padding:14 }
  const sectionTitle = { fontSize:11, fontWeight:600, color:'var(--color-text-secondary)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:10 }

  // ── Render các tab ─────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:'100vh', background:'var(--color-background-tertiary)' }}>
      {/* Header */}
      <div style={{ padding:'12px 16px', background:'var(--color-background-secondary)',
        borderBottom:'1px solid var(--color-border-tertiary)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontWeight:700, fontSize:15 }}>Bảo dưỡng & Sửa chữa</div>
        <div style={{ fontSize:12, color:'var(--color-text-secondary)' }}>
          {vehicles.length} xe · {bdHistory.length} lần BDSC đã ghi nhận
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, padding:'8px 12px', background:'var(--color-background-secondary)',
        borderBottom:'1px solid var(--color-border-tertiary)', overflowX:'auto' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding:'6px 14px', borderRadius:6, border:'none', cursor:'pointer', fontSize:12,
              fontWeight:500, whiteSpace:'nowrap',
              background: tab===t.id ? '#f97316' : 'transparent',
              color: tab===t.id ? '#fff' : 'var(--color-text-secondary)' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding:16 }}>

        {/* ── TỔNG QUAN ─────────────────────────────────────────── */}
        {tab === 'overview' && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
              {[
                { label:'Xe đến hạn BD', val: bdAlerts.length || 0, color: bdAlerts.length > 0 ? '#ef4444' : '#22c55e', sub:'trong 30 ngày tới' },
                { label:'Lần BDSC đã ghi nhận', val: bdHistory.length, color:'var(--color-text-primary)', sub:'tổng cộng' },
                { label:'Xe trong hệ thống', val: vehicles.length, color:'var(--color-text-primary)', sub:'đang theo dõi' },
                { label:'Báo giá chờ xác nhận', val: ocrResults.length, color: ocrResults.length > 0 ? '#f97316' : 'var(--color-text-primary)', sub:'cần review' },
              ].map((c,i) => (
                <div key={i} style={card}>
                  <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginBottom:4 }}>{c.label}</div>
                  <div style={{ fontSize:24, fontWeight:700, color:c.color }}>{c.val}</div>
                  <div style={{ fontSize:11, color:'var(--color-text-secondary)' }}>{c.sub}</div>
                </div>
              ))}
            </div>

            {bdAlerts.length === 0 && bdHistory.length === 0 ? (
              <EmptyState icon="🚛" title="Chưa có dữ liệu bảo dưỡng"
                sub="Bắt đầu bằng cách scan báo giá sửa chữa hoặc nhập lịch sử bảo dưỡng thủ công. Hệ thống sẽ tự động tính toán khi có đủ dữ liệu km từ GPS."
                action="Scan báo giá đầu tiên" onAction={() => setTab('ocr')} />
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div style={card}>
                  <div style={sectionTitle}>Xe cần bảo dưỡng sớm</div>
                  {bdAlerts.slice(0,5).map((a,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0',
                      borderBottom:'1px solid var(--color-border-tertiary)' }}>
                      <Badge type={a.status==='crit'?'red':'yel'}>{a.status==='crit'?'Quá hạn':'Sắp đến'}</Badge>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12, fontWeight:600 }}>{a.xe.bienSo}</div>
                        <div style={{ fontSize:11, color:'var(--color-text-secondary)' }}>Mốc {a.mocTiepTheo.toLocaleString()}km · Còn {a.conLai}km</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={card}>
                  <div style={sectionTitle}>Lịch sử BDSC gần nhất</div>
                  {bdHistory.slice(0,5).map((h,i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0',
                      borderBottom:'1px solid var(--color-border-tertiary)', fontSize:12 }}>
                      <span style={{ fontWeight:600 }}>{h.bienSo}</span>
                      <span style={{ color:'var(--color-text-secondary)' }}>{h.ngay}</span>
                      <span style={{ fontWeight:600 }}>{Number(h.tongTien||0).toLocaleString('vi-VN')}đ</span>
                    </div>
                  ))}
                  {bdHistory.length === 0 && <div style={{ fontSize:12, color:'var(--color-text-secondary)', padding:'8px 0' }}>Chưa có dữ liệu</div>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── CẢNH BÁO BD ──────────────────────────────────────── */}
        {tab === 'alert' && (
          <div>
            {bdAlerts.length === 0 ? (
              <EmptyState icon="✅" title="Không có cảnh báo"
                sub={vehicles.length === 0
                  ? 'Chưa có xe nào trong hệ thống. Dữ liệu km GPS cần được kết nối để tính toán chu kỳ bảo dưỡng.'
                  : 'Tất cả xe đang trong chu kỳ bảo dưỡng an toàn. Hệ thống sẽ cảnh báo khi xe đạt 90% chu kỳ.'
                } />
            ) : bdAlerts.map((a,i) => (
              <div key={i} style={{ ...card, marginBottom:8,
                borderColor: a.status==='crit'?'rgba(239,68,68,.3)':'rgba(234,179,8,.2)',
                background: a.status==='crit'?'rgba(239,68,68,.05)':'rgba(234,179,8,.03)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <Badge type={a.status==='crit'?'red':'yel'}>{a.status==='crit'?'Quá hạn':Math.round(a.pct*100)+'%'}</Badge>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:13 }}>{a.xe.bienSo} · {a.xe.tenTaiSan || a.xe.loaiXe}</div>
                    <div style={{ fontSize:12, color:'var(--color-text-secondary)', marginTop:2 }}>
                      Mốc {a.mocTiepTheo.toLocaleString()}km · KM hiện tại {a.km.toLocaleString()}km · Còn {a.conLai}km
                    </div>
                  </div>
                  <div style={{ textAlign:'right', fontSize:11, color:'var(--color-text-secondary)' }}>
                    {/* Hạng mục BD tại mốc này */}
                    {(BD_XETAI.find(b => a.mocTiepTheo % 30000 === b.moc || b.moc === a.mocTiepTheo % 30000) || BD_XETAI[0]).items.slice(0,3).join(' · ')}
                  </div>
                </div>
              </div>
            ))}

            <div style={{ ...card, marginTop:16 }}>
              <div style={sectionTitle}>Bảng chu kỳ bảo dưỡng xe tải (quy định HSH.QLTS-05)</div>
              {BD_XETAI.map(b => (
                <div key={b.moc} style={{ display:'flex', gap:12, padding:'7px 0',
                  borderBottom:'1px solid var(--color-border-tertiary)', fontSize:12 }}>
                  <span style={{ fontWeight:700, color:'#f97316', minWidth:60 }}>{b.moc.toLocaleString()}km</span>
                  <span style={{ color:'var(--color-text-secondary)' }}>{b.items.join(' · ')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CHI PHÍ ───────────────────────────────────────────── */}
        {tab === 'cost' && (
          <EmptyState icon="📊" title="Chưa có dữ liệu chi phí"
            sub="Sau khi nhập các báo giá sửa chữa qua tính năng Scan, hệ thống sẽ tự động tổng hợp chi phí theo xe và theo garage, phát hiện bất thường."
            action="Scan báo giá đầu tiên" onAction={() => setTab('ocr')} />
        )}

        {/* ── TIMELINE ─────────────────────────────────────────── */}
        {tab === 'timeline' && (
          <div>
            <div style={{ marginBottom:12 }}>
              <select value={selectedVe} onChange={e => setSelectedVe(e.target.value)}
                style={{ padding:'7px 12px', borderRadius:8, border:'1px solid var(--color-border-secondary)',
                  background:'var(--color-background-secondary)', color:'var(--color-text-primary)',
                  fontSize:13, width:260 }}>
                <option value="">-- Chọn xe --</option>
                {vehicles.map(v => <option key={v._id} value={v.bienSo}>{v.bienSo} · {v.tenTaiSan||v.loaiXe}</option>)}
              </select>
            </div>

            {!selectedVe
              ? <EmptyState icon="🔍" title="Chọn xe để xem timeline" sub="Chọn xe từ danh sách để xem lịch sử bảo dưỡng và sửa chữa theo km." />
              : bdHistory.filter(h => h.bienSo === selectedVe).length === 0
              ? <EmptyState icon="📋" title={`Chưa có lịch sử cho xe ${selectedVe}`}
                  sub="Nhập báo giá sửa chữa hoặc ghi nhận bảo dưỡng định kỳ để xem timeline."
                  action="Scan báo giá" onAction={() => setTab('ocr')} />
              : (
                <div style={{ position:'relative', paddingLeft:24 }}>
                  <div style={{ position:'absolute', left:8, top:0, bottom:0, width:2,
                    background:'var(--color-border-tertiary)' }}/>
                  {bdHistory.filter(h=>h.bienSo===selectedVe).map((h,i) => (
                    <div key={i} style={{ position:'relative', marginBottom:16 }}>
                      <div style={{ position:'absolute', left:-19, top:4, width:10, height:10,
                        borderRadius:'50%', border:`2px solid ${h.loai==='baoDuong'?'#22c55e':'#f97316'}`,
                        background: h.loai==='baoDuong'?'rgba(34,197,94,.3)':'rgba(249,115,22,.3)' }}/>
                      <div style={{ fontSize:10, color:'var(--color-text-tertiary)', marginBottom:2 }}>
                        {h.km?.toLocaleString()}km · {h.ngay}
                      </div>
                      <div style={{ fontSize:13, fontWeight:600 }}>{h.garage} · {Number(h.tongTien||0).toLocaleString('vi-VN')}đ</div>
                      <div style={{ fontSize:11, color:'var(--color-text-secondary)' }}>
                        {h.hangMuc?.slice(0,3).map(m=>m.ten).join(' · ')}
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        )}

        {/* ── LỐP XE ────────────────────────────────────────────── */}
        {tab === 'tire' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1.2fr', gap:14 }}>
            <div>
              <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
                <select value={tireVe} onChange={e => setTireVe(e.target.value)}
                  style={{ flex:1, minWidth:160, padding:'7px 10px', borderRadius:8, fontSize:12,
                    border:'1px solid var(--color-border-secondary)',
                    background:'var(--color-background-secondary)', color:'var(--color-text-primary)' }}>
                  <option value="">-- Chọn xe --</option>
                  {vehicles.map(v => <option key={v._id} value={v.bienSo}>{v.bienSo}</option>)}
                </select>
                <select value={axleCfg} onChange={e => setAxleCfg(e.target.value)}
                  style={{ padding:'7px 10px', borderRadius:8, fontSize:12,
                    border:'1px solid var(--color-border-secondary)',
                    background:'var(--color-background-secondary)', color:'var(--color-text-primary)' }}>
                  {Object.entries(AXLE_CONFIGS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>

              {!tireVe
                ? <EmptyState icon="🔧" title="Chọn xe để xem sơ đồ lốp" sub="Chọn xe và cấu hình số cầu phù hợp." />
                : (
                  <div style={{ ...card, display:'flex', flexDirection:'column', alignItems:'center', padding:24 }}>
                    <TireView
                      config={axleCfg}
                      tireData={tireData[tireVe] || {}}
                      onClickTire={(pos, data) => setTireModal({ pos, data, ve: tireVe })}
                    />
                    <div style={{ display:'flex', gap:16, marginTop:16, fontSize:11 }}>
                      <span><span style={{ color:'#22c55e' }}>■</span> Tốt</span>
                      <span><span style={{ color:'#eab308' }}>■</span> Sắp đến hạn (≥90%)</span>
                      <span><span style={{ color:'#ef4444' }}>■</span> Cần thay</span>
                      <span><span style={{ color:'var(--color-border-tertiary)' }}>■</span> Chưa nhập</span>
                    </div>
                    <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginTop:8 }}>
                      Click vào ô lốp để nhập/cập nhật thông tin
                    </div>
                  </div>
                )
              }
            </div>

            <div>
              <div style={{ ...card }}>
                <div style={sectionTitle}>Quy định thay lốp (6.2)</div>
                <div style={{ display:'flex', gap:8, marginBottom:12 }}>
                  <div style={{ flex:1, background:'var(--color-background-primary)', borderRadius:8, padding:10, textAlign:'center' }}>
                    <div style={{ fontSize:16, fontWeight:700, color:'#f97316' }}>50.000km</div>
                    <div style={{ fontSize:10, color:'var(--color-text-secondary)' }}>Lốp bố nylon</div>
                  </div>
                  <div style={{ flex:1, background:'var(--color-background-primary)', borderRadius:8, padding:10, textAlign:'center' }}>
                    <div style={{ fontSize:16, fontWeight:700, color:'#60a5fa' }}>80.000km</div>
                    <div style={{ fontSize:10, color:'var(--color-text-secondary)' }}>Lốp bố kẽm</div>
                  </div>
                  <div style={{ flex:1, background:'var(--color-background-primary)', borderRadius:8, padding:10, textAlign:'center' }}>
                    <div style={{ fontSize:16, fontWeight:700, color:'#22c55e' }}>10.000km</div>
                    <div style={{ fontSize:10, color:'var(--color-text-secondary)' }}>Chu kỳ đảo lốp</div>
                  </div>
                </div>
                <div style={{ fontSize:11, color:'var(--color-text-secondary)', lineHeight:1.6 }}>
                  <strong>Hướng dẫn đảo lốp cầu trước:</strong><br/>
                  • Chu kỳ 1: Hoán đổi lốp bên trái và bên phải<br/>
                  • Chu kỳ 2: Lật đổi lốp từ mặt phía trong ra ngoài<br/><br/>
                  <strong>Hướng dẫn đảo lốp cầu sau:</strong><br/>
                  • Chu kỳ 1: Đảo lốp vị trí trong và ngoài của mỗi cặp<br/>
                  • Chu kỳ 2: Lật đổi lốp từ mặt phía trong ra ngoài
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── DỰ BÁO ───────────────────────────────────────────── */}
        {tab === 'forecast' && (
          <EmptyState icon="📈" title="Chưa đủ dữ liệu để dự báo"
            sub="Cần ít nhất 3 tháng dữ liệu km GPS và lịch sử BDSC để tính tốc độ chạy trung bình và dự báo ngân sách. Hệ thống sẽ tự động tính khi có đủ dữ liệu."
            action="Xem cảnh báo BD hiện tại" onAction={() => setTab('alert')} />
        )}

        {/* ── SCAN BÁO GIÁ ─────────────────────────────────────── */}
        {tab === 'ocr' && (
          <div>
            {/* Upload area */}
            <div onClick={() => fileInputRef.current?.click()}
              style={{ border:'2px dashed #f97316', borderRadius:12, padding:28, textAlign:'center',
                cursor:'pointer', background:'rgba(249,115,22,.04)', marginBottom:16,
                transition:'background .15s' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(249,115,22,.08)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(249,115,22,.04)'}
              onDragOver={e => { e.preventDefault(); e.currentTarget.style.background='rgba(249,115,22,.1)' }}
              onDragLeave={e => e.currentTarget.style.background='rgba(249,115,22,.04)'}
              onDrop={e => {
                e.preventDefault()
                const dropped = Array.from(e.dataTransfer.files).map(f => ({
                  file: f, preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null
                }))
                setOcrFiles(prev => [...prev, ...dropped])
                processOcr(dropped)
              }}>
              <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf" style={{ display:'none' }}
                onChange={handleFileSelect} />
              <div style={{ fontSize:32, marginBottom:8 }}>📷</div>
              <div style={{ fontWeight:600, marginBottom:4 }}>Kéo thả hoặc click để tải báo giá</div>
              <div style={{ fontSize:12, color:'var(--color-text-secondary)' }}>
                Hỗ trợ JPG, PNG, PDF · Nhiều file cùng lúc · AI tự đọc và điền các trường
              </div>
              <button style={{ marginTop:12, padding:'8px 20px', borderRadius:8, border:'none',
                background:'#f97316', color:'#fff', cursor:'pointer', fontWeight:600, fontSize:13 }}>
                Chọn file
              </button>
            </div>

            {ocrLoading && (
              <div style={{ textAlign:'center', padding:12, color:'#f97316', fontSize:13 }}>
                Đang phân tích báo giá với AI...
              </div>
            )}

            {/* File cards - mỗi file 1 card với fields có thể edit */}
            {ocrFiles.map((f, i) => (
              <OcrCard key={i} idx={i} file={f.file} result={ocrResults[i]}
                onUpdate={updateOcrResult} onRemove={removeOcrFile} />
            ))}

            {ocrFiles.length === 0 && (
              <EmptyState icon="🧾" title="Chưa có báo giá nào"
                sub="Chụp ảnh hoặc scan file PDF báo giá sửa chữa. AI sẽ tự động đọc biển số, km, hạng mục và chi phí. Bạn có thể chỉnh sửa trước khi lưu." />
            )}

            {/* Submit button */}
            {ocrResults.filter(r => r?.bienSo).length > 0 && (
              <div style={{ display:'flex', justifyContent:'flex-end', marginTop:12, gap:10 }}>
                <button onClick={() => { setOcrFiles([]); setOcrResults([]) }}
                  style={{ padding:'8px 20px', borderRadius:8, border:'1px solid var(--color-border-secondary)',
                    background:'transparent', color:'var(--color-text-secondary)', cursor:'pointer', fontSize:13 }}>
                  Hủy tất cả
                </button>
                <button onClick={submitAllOcr}
                  style={{ padding:'8px 20px', borderRadius:8, border:'none',
                    background:'#f97316', color:'#fff', cursor:'pointer', fontWeight:600, fontSize:13 }}>
                  Xác nhận & Lưu {ocrResults.filter(r=>r?.bienSo).length} báo giá
                </button>
              </div>
            )}

            {/* Note về backend OCR */}
            <div style={{ marginTop:16, padding:12, borderRadius:8,
              background:'rgba(59,130,246,.06)', border:'1px solid rgba(59,130,246,.15)',
              fontSize:11, color:'var(--color-text-secondary)' }}>
              <strong style={{ color:'#60a5fa' }}>Lưu ý kỹ thuật:</strong> Tính năng OCR cần thêm route
              <code style={{ background:'rgba(255,255,255,.08)', padding:'1px 5px', borderRadius:4, margin:'0 4px' }}>POST /api/bdsc/ocr</code>
              vào backend. Route này nhận base64 ảnh/PDF, gọi Claude Vision để trích xuất dữ liệu,
              trả về JSON có cấu trúc. Nếu backend chưa có, các trường sẽ để trống để nhập tay.
            </div>
          </div>
        )}

        {/* ── GIẤY TỜ XE ──────────────────────────────────────── */}
        {tab === 'docs' && (
          <div>
            {vehicles.length === 0 ? (
              <EmptyState icon="📄" title="Chưa có xe nào để theo dõi giấy tờ" />
            ) : (
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ fontSize:11, color:'var(--color-text-secondary)', borderBottom:'1px solid var(--color-border-tertiary)' }}>
                      {['Biển số','Đăng kiểm','Bảo hiểm thân vỏ','Phù hiệu','Kiểm định cầu','Giấy phép NLX'].map(h => (
                        <th key={h} style={{ padding:'8px 10px', textAlign:'left', fontWeight:600, textTransform:'uppercase', letterSpacing:'.04em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.slice(0,15).map(v => {
                      const doc = docsData[v.bienSo] || {}
                      const DocCell = ({ date }) => {
                        if (!date) return <td style={{ padding:'8px 10px' }}><Badge type="gray">Chưa nhập</Badge></td>
                        const d = new Date(date), now = new Date()
                        const days = Math.round((d-now)/864e5)
                        return <td style={{ padding:'8px 10px' }}>
                          <Badge type={days<15?'red':days<30?'yel':'grn'}>
                            {days<0?`Quá hạn ${-days}ng`:days<30?`${days} ngày`:d.toLocaleDateString('vi-VN')}
                          </Badge>
                        </td>
                      }
                      return (
                        <tr key={v._id} style={{ borderBottom:'1px solid var(--color-border-tertiary)', fontSize:12 }}>
                          <td style={{ padding:'8px 10px', fontWeight:600 }}>{v.bienSo}</td>
                          <DocCell date={doc.dangKiem}/>
                          <DocCell date={doc.baoHiem}/>
                          <DocCell date={doc.phuHieu}/>
                          <DocCell date={doc.kiemDinhCau}/>
                          <DocCell date={doc.gplxNLX}/>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                <div style={{ marginTop:12, fontSize:11, color:'var(--color-text-secondary)' }}>
                  Nhập ngày hết hạn giấy tờ cho từng xe — hệ thống sẽ cảnh báo trước 30 ngày.
                  Tính năng cập nhật giấy tờ sẽ có trong phiên bản tiếp theo.
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TIRE MODAL ─────────────────────────────────────────── */}
        {tireModal && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)',
            display:'flex', alignItems:'center', justifyContent:'center', zIndex:999 }}
            onClick={() => setTireModal(null)}>
            <div style={{ background:'var(--color-background-secondary)', borderRadius:14,
              padding:20, width:300, boxShadow:'0 20px 60px rgba(0,0,0,.4)' }}
              onClick={e => e.stopPropagation()}>
              <div style={{ fontWeight:700, marginBottom:14 }}>
                Lốp {tireModal.pos} — {POS_LABELS[tireModal.pos]}
              </div>
              {[
                { key:'kmLapDat', label:'KM lắp đặt' },
                { key:'loai', label:'Loại lốp (nylon/kem)' },
                { key:'ngayLap', label:'Ngày lắp' },
                { key:'thuongHieu', label:'Thương hiệu' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom:10 }}>
                  <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginBottom:3 }}>{f.label}</div>
                  <input defaultValue={tireModal.data?.[f.key] || ''}
                    onChange={e => {
                      const updated = { ...tireData }
                      if (!updated[tireModal.ve]) updated[tireModal.ve] = {}
                      if (!updated[tireModal.ve][tireModal.pos]) updated[tireModal.ve][tireModal.pos] = {}
                      updated[tireModal.ve][tireModal.pos][f.key] = e.target.value
                      setTireData(updated)
                    }}
                    style={{ width:'100%', padding:'6px 10px', borderRadius:7,
                      border:'1px solid var(--color-border-secondary)',
                      background:'var(--color-background-primary)', color:'var(--color-text-primary)',
                      fontSize:12, outline:'none' }}/>
                </div>
              ))}
              <div style={{ display:'flex', gap:8, marginTop:14 }}>
                <button onClick={() => setTireModal(null)}
                  style={{ flex:1, padding:8, borderRadius:8, border:'1px solid var(--color-border-secondary)',
                    background:'transparent', color:'var(--color-text-secondary)', cursor:'pointer', fontSize:13 }}>
                  Đóng
                </button>
                <button onClick={() => setTireModal(null)}
                  style={{ flex:1, padding:8, borderRadius:8, border:'none',
                    background:'#f97316', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:600 }}>
                  Lưu
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
