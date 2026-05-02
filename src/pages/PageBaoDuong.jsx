// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📁 FRONTEND — quanlyxever3/src/pages/PageBaoDuong.jsx
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { useState, useEffect, useRef, useCallback } from 'react'
import * as React from 'react'

const API = import.meta.env.VITE_API_URL || 'https://hsg-backend.onrender.com'
const tok = () => localStorage.getItem('hsg_token') || ''
const apiFetch = (p, o = {}) => fetch(`${API}${p}`, {
  ...o, headers: { Authorization: `Bearer ${tok()}`, 'Content-Type': 'application/json', ...o.headers }
})

// ── Bảng chu kỳ BD xe tải (HSH.QLTS-05 mục 6.1.3) ──────────────────────
const BD_XETAI = [
  { moc: 5000,  items: ['Thay dầu động cơ', 'Kiểm tra lọc dầu, nước làm mát, dầu phanh', 'Kiểm tra rò rỉ dầu, hộp số, visai', 'Kiểm tra bố thắng, siết bulong', 'Kiểm tra áp suất lốp, ắc quy'] },
  { moc: 10000, items: ['Thay dầu động cơ', 'Vệ sinh lọc gió động cơ', 'Kiểm tra lọc nhiên liệu', 'Kiểm tra hệ thống treo', 'Kiểm tra bạc đạn bánh xe', 'Kiểm tra hệ thống điện'] },
  { moc: 15000, items: ['Thay dầu động cơ', 'Kiểm tra lọc dầu, nước làm mát, dầu phanh', 'Kiểm tra rò rỉ', 'Siết bulong', 'Kiểm tra lốp, ắc quy'] },
  { moc: 20000, items: ['Thay lọc nhiên liệu', 'Thay lọc gió', 'Cân chỉnh thước lái', 'Bổ sung dầu hộp số, cầu', 'Kiểm tra phốt láp, bạc đạn moay-ơ'] },
  { moc: 25000, items: ['Thay dầu động cơ', 'Kiểm tra lọc dầu, nước làm mát, dầu phanh', 'Kiểm tra rò rỉ, bố thắng', 'Siết bulong, kiểm tra lốp, ắc quy'] },
  { moc: 30000, items: ['Thay dầu hộp số', 'Thay dầu cầu', 'Thay dầu phanh', 'Xả và thay nước mát', 'Kiểm tra turbo, kim phun, cầu trục, máy lạnh'] },
]

const AXLE_CONFIGS = {
  '4':  { label: '2 cầu đơn · 4 lốp', positions: ['TT','TP','ST','SP'] },
  '6':  { label: '2 cầu · 6 lốp',     positions: ['TT','TP','STN','STT','SPN','SPT'] },
  '10': { label: '3 cầu · 10 lốp',    positions: ['TT','TP','C1TN','C1TT','C1PN','C1PT','C2TN','C2TT','C2PN','C2PT'] },
}
const POS_LABELS = {
  TT:'Trước trái', TP:'Trước phải', ST:'Sau trái', SP:'Sau phải',
  STN:'Sau trái ngoài', STT:'Sau trái trong', SPN:'Sau phải ngoài', SPT:'Sau phải trong',
  C1TN:'Cầu1 trái ngoài', C1TT:'Cầu1 trái trong', C1PN:'Cầu1 phải ngoài', C1PT:'Cầu1 phải trong',
  C2TN:'Cầu2 trái ngoài', C2TT:'Cầu2 trái trong', C2PN:'Cầu2 phải ngoài', C2PT:'Cầu2 phải trong',
}

// ── Bảng giá lốp duyệt — Tờ trình 3413/TTr/HS/PMH/0126 ─────────────────
const TIRE_CATALOG = [
  { id:1,  size:'900R20-(18PR)',       boBo:'kem',   loaiXe:'Thaco 6.2T (thùng lửng/cẩu)',  sl6T:188,
    p1:{ ncc:'ALPHA',        hang:'Bridgestone 900R20 M789 TL',     xuatXu:'Thái Lan', tdp:6534000, sdp:5450000 },
    p2:{ ncc:'LỐP XE VIỆT', hang:'Maxxis UR288 (gai xuôi)',         xuatXu:'Thái Lan', tdp:6240000, sdp:6240000 } },
  { id:2,  size:'11.00R20-(18PR)',     boBo:'kem',   loaiXe:'Thaco 14T (thùng bạt)',         sl6T:78,
    p1:{ ncc:'LỐP XE VIỆT', hang:'Maxxis UR288 (gai xuôi)',         xuatXu:'Thái Lan', tdp:7111111, sdp:7111111 },
    p2:{ ncc:'ALPHA',        hang:'Bridgestone R150 (gai hỗn hợp)', xuatXu:'Thái Lan', tdp:8910000, sdp:7870000 } },
  { id:3,  size:'11.00-22-(18PR)',     boBo:'kem',   loaiXe:'Chenglong 8.2–8.4T',            sl6T:18,
    p1:{ ncc:'LỐP XE VIỆT', hang:'Maxxis UR288 / 11R22.5',          xuatXu:'Thái Lan', tdp:6488889, sdp:6488889 },
    p2:{ ncc:'ALPHA',        hang:'Bridgestone R150 (gai hỗn hợp)', xuatXu:'Thái Lan', tdp:8910000, sdp:7870000 } },
  { id:4,  size:'750-16-(18PR)',       boBo:'nylon', loaiXe:'Mitsubishi/Veam',               sl6T:18,
    p1:{ ncc:'LỐP XE VIỆT', hang:'Maxxis M276 (gai xuôi)',          xuatXu:'Việt Nam', tdp:2603780, sdp:2603780 },
    p2:{ ncc:'ALPHA',        hang:'Bridgestone R288 (gai hỗn hợp)', xuatXu:'Thái Lan', tdp:4374000, sdp:3950000 } },
  { id:5,  size:'10.00R20-(18PR)',     boBo:'kem',   loaiXe:'Hino 6.75–8.4T',               sl6T:32,
    p1:{ ncc:'LỐP XE VIỆT', hang:'Maxxis UR288 (gai xuôi)',         xuatXu:'Thái Lan', tdp:6720000, sdp:6720000 },
    p2:{ ncc:'ALPHA',        hang:'Bridgestone R150 (gai hỗn hợp)', xuatXu:'Thái Lan', tdp:8478000, sdp:7450000 } },
  { id:6,  size:'245/70R19.5-(18PR)', boBo:'kem',   loaiXe:'Hyundai 12.35T',                sl6T:6,
    p1:{ ncc:'ALPHA',        hang:'Bridgestone (gai hỗn hợp)',      xuatXu:'Thái Lan', tdp:5346000, sdp:4750000 },
    p2:{ ncc:'LỐP XE VIỆT', hang:'Maxxis UR275 (gai xuôi)',         xuatXu:'Thái Lan', tdp:4591667, sdp:4591667 } },
  { id:7,  size:'8.25R16-(18PR)',      boBo:'nylon', loaiXe:'Thaco 3.45T (thùng bạt)',       sl6T:6,
    p1:{ ncc:'LỐP XE VIỆT', hang:'Maxxis M276 (gai xuôi)',          xuatXu:'Việt Nam', tdp:2955260, sdp:2955260 },
    p2:{ ncc:'ALPHA',        hang:'Bridgestone BS585 (gai hỗn hợp)',xuatXu:'Thái Lan', tdp:4914000, sdp:4250000 } },
  { id:8,  size:'7.00R16-(16PR)',      boBo:'nylon', loaiXe:'Mitsubishi/Veam (nhỏ)',         sl6T:48,
    p1:{ ncc:'LỐP XE VIỆT', hang:'Maxxis MA265 (gai xuôi)',         xuatXu:'Việt Nam', tdp:2083630, sdp:2083630 },
    p2:{ ncc:'ALPHA',        hang:'DRC bố nylon (gai hỗn hợp)',     xuatXu:'Việt Nam', tdp:2390000, sdp:2570000 } },
  { id:9,  size:'205/65R15',           boBo:'kem',   loaiXe:'Toyota Innova',                 sl6T:7,
    p1:{ ncc:'LỐP XE VIỆT', hang:'Maxxis MAP5 (gai xuôi)',          xuatXu:'Thái Lan', tdp:1498148, sdp:1205000 },
    p2:{ ncc:'ALPHA',        hang:'Bridgestone B390 (gai hỗn hợp)', xuatXu:'Thái Lan', tdp:2030400, sdp:1750000 } },
  { id:10, size:'265/65R17',           boBo:'kem',   loaiXe:'Toyota/Ford bán tải',           sl6T:4,
    p1:{ ncc:'LỐP XE VIỆT', hang:'Maxxis HT780 (gai xuôi)',         xuatXu:'Thái Lan', tdp:2981481, sdp:2567000 },
    p2:{ ncc:'ALPHA',        hang:'Bridgestone D684 (gai hỗn hợp)', xuatXu:'Thái Lan', tdp:3952800, sdp:3370000 } },
]

const TABS = [
  { id:'overview', label:'Tổng quan' }, { id:'alert', label:'Cảnh báo BD' },
  { id:'cost', label:'Chi phí' }, { id:'timeline', label:'Timeline xe' },
  { id:'tire', label:'Thay lốp xe' }, { id:'forecast', label:'Dự báo' },
  { id:'ocr', label:'BDSC' }, { id:'docs', label:'Giấy tờ xe' },
  { id:'gialop', label:'Giá lốp' },
]

// ── Style helpers (app variables) ────────────────────────────────────────
const S = {
  card: {
    background: 'var(--bg-card)', border: '1px solid var(--sep)',
    borderRadius: 10, padding: 14,
  },
  secTitle: {
    fontSize: 11, fontWeight: 600, color: 'var(--ink3)',
    textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10,
  },
  badge: (type) => {
    const map = {
      red:  { bg: 'var(--red-l)',   color: 'var(--apple-red)' },
      yel:  { bg: 'rgba(230,150,0,.12)', color: 'var(--apple-orange)' },
      grn:  { bg: 'var(--green-l)', color: 'var(--apple-green)' },
      blu:  { bg: 'rgba(0,85,204,.10)',  color: 'var(--apple-blue)' },
      gray: { bg: 'var(--bg-secondary)', color: 'var(--ink3)' },
    }
    const c = map[type] || map.gray
    return {
      display: 'inline-block', padding: '2px 8px', borderRadius: 20,
      fontSize: 10, fontWeight: 600, background: c.bg, color: c.color,
    }
  },
}

// ── Empty state ───────────────────────────────────────────────────────────
function EmptyState({ icon='📋', title, sub, action, onAction }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      padding:'52px 24px', gap:12, textAlign:'center' }}>
      <div style={{ fontSize:42 }}>{icon}</div>
      <div style={{ fontWeight:600, fontSize:15, color:'var(--ink)' }}>{title}</div>
      {sub && <div style={{ fontSize:13, color:'var(--ink3)', maxWidth:320, lineHeight:1.6 }}>{sub}</div>}
      {action && (
        <button onClick={onAction} style={{ marginTop:8, padding:'8px 20px', borderRadius:8,
          background:'var(--brand)', color:'#fff', border:'none', cursor:'pointer', fontSize:13, fontWeight:600 }}>
          {action}
        </button>
      )}
    </div>
  )
}

// ── Bar row ───────────────────────────────────────────────────────────────
function BarRow({ label, pct, val, color='var(--brand)' }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
      <div style={{ width:100, fontSize:11, color:'var(--ink3)', textAlign:'right', flexShrink:0 }}>{label}</div>
      <div style={{ flex:1, background:'var(--sep)', borderRadius:4, height:8, overflow:'hidden' }}>
        <div style={{ width:`${pct}%`, height:'100%', borderRadius:4, background:color, transition:'width .6s ease' }}/>
      </div>
      <div style={{ fontSize:11, color:'var(--ink)', width:64, textAlign:'right', flexShrink:0, fontWeight:500 }}>{val}</div>
    </div>
  )
}

// ── Tire diagram ──────────────────────────────────────────────────────────
function TireView({ config, tireData, onClickTire }) {
  const TireBox = ({ pos }) => {
    const t = tireData?.[pos]
    const kmMax = t?.loai === 'kem' ? 80000 : 50000
    const kmUsed = t ? (t.kmHienTai - t.kmLapDat) : 0
    const pct = t ? Math.min(kmUsed / kmMax, 1) : 0
    const status = !t ? 'empty' : pct >= 1 ? 'crit' : pct >= 0.9 ? 'warn' : 'ok'
    const colors = {
      empty: { border:'var(--sep)',         bg:'var(--bg-secondary)' },
      ok:    { border:'var(--apple-green)', bg:'var(--green-l)' },
      warn:  { border:'var(--apple-orange)',bg:'rgba(230,150,0,.08)' },
      crit:  { border:'var(--apple-red)',   bg:'var(--red-l)' },
    }
    const c = colors[status]
    return (
      <div onClick={() => onClickTire(pos, t)} title={POS_LABELS[pos]}
        style={{ width:38, height:62, border:`2px solid ${c.border}`, borderRadius:7,
          background:c.bg, display:'flex', flexDirection:'column', alignItems:'center',
          justifyContent:'center', gap:3, cursor:'pointer', transition:'transform .12s' }}
        onMouseEnter={e => e.currentTarget.style.transform='scale(1.07)'}
        onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>
        {t ? (
          <>
            <div style={{ fontSize:8, fontWeight:700, color:
              status==='crit'?'var(--apple-red)':status==='warn'?'var(--apple-orange)':'var(--apple-green)' }}>
              {Math.round(kmUsed/1000)}k
            </div>
            <div style={{ width:22, height:3, borderRadius:2, background:'var(--sep)', overflow:'hidden' }}>
              <div style={{ width:`${pct*100}%`, height:'100%', borderRadius:2, background:
                status==='crit'?'var(--apple-red)':status==='warn'?'var(--apple-orange)':'var(--apple-green)' }}/>
            </div>
          </>
        ) : (
          <div style={{ fontSize:14, color:'var(--ink3)', lineHeight:1 }}>+</div>
        )}
        <div style={{ fontSize:8, color:'var(--ink3)' }}>{pos}</div>
      </div>
    )
  }
  const AxleLabel = ({ label }) => (
    <div style={{ width:72, height:26, background:'var(--bg-secondary)',
      border:'1px solid var(--sep)', borderRadius:6,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:9, color:'var(--ink3)', textAlign:'center' }}>{label}</div>
  )
  const Bar = () => <div style={{ width:3, height:20, background:'var(--sep)', margin:'0 auto' }}/>

  if (config === '4') return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
      <div style={{ display:'flex', gap:72, alignItems:'center' }}><TireBox pos="TT"/><AxleLabel label="TRƯỚC"/><TireBox pos="TP"/></div>
      <Bar/>
      <div style={{ display:'flex', gap:72, alignItems:'center' }}><TireBox pos="ST"/><AxleLabel label="SAU"/><TireBox pos="SP"/></div>
    </div>
  )
  if (config === '6') return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
      <div style={{ display:'flex', gap:72, alignItems:'center' }}><TireBox pos="TT"/><AxleLabel label="CẦU TRƯỚC"/><TireBox pos="TP"/></div>
      <Bar/>
      <div style={{ display:'flex', gap:18, alignItems:'center' }}>
        <TireBox pos="STN"/><TireBox pos="STT"/><AxleLabel label="CẦU SAU"/><TireBox pos="SPT"/><TireBox pos="SPN"/>
      </div>
    </div>
  )
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
      <div style={{ display:'flex', gap:72, alignItems:'center' }}><TireBox pos="TT"/><AxleLabel label="CẦU TRƯỚC"/><TireBox pos="TP"/></div>
      <Bar/>
      <div style={{ display:'flex', gap:14, alignItems:'center' }}>
        <TireBox pos="C1TN"/><TireBox pos="C1TT"/><AxleLabel label="CẦU SAU 1"/><TireBox pos="C1PT"/><TireBox pos="C1PN"/>
      </div>
      <Bar/>
      <div style={{ display:'flex', gap:14, alignItems:'center' }}>
        <TireBox pos="C2TN"/><TireBox pos="C2TT"/><AxleLabel label="CẦU SAU 2"/><TireBox pos="C2PT"/><TireBox pos="C2PN"/>
      </div>
    </div>
  )
}

// ── Từ khoá phát hiện loại báo giá ───────────────────────────────────────
const TIRE_KEYWORDS = ['thay lốp','thay vỏ','vỏ xe','lốp xe','thay ruột','đảo lốp','lốp trước','lốp sau','900r','11.00r','750-16','7.00r','8.25r','205/65','265/65','10.00r','245/70']
const BD_KEYWORDS   = ['thay nhớt','dầu động cơ','lọc nhớt','lọc gió','lọc nhiên liệu','bơm mỡ','dầu hộp số','dầu cầu','nước mát','thay dầu']

function detectLoaiBaoGia(result) {
  if (!result) return 'bdsc'
  const text = [
    result.bienSo, result.garage,
    ...(result.hangMuc||[]).map(h => h.ten)
  ].join(' ').toLowerCase()
  const isTire = TIRE_KEYWORDS.some(k => text.includes(k))
  return isTire ? 'lop' : 'bdsc'
}

// ── OCR file card ─────────────────────────────────────────────────────────
function OcrCard({ file, result, onUpdate, onRemove, idx, onSaveTire }) {
  const inputStyle = {
    width:'100%', padding:'8px 12px', borderRadius:8, fontSize:13,
    background:'var(--bg-card)', border:'1px solid var(--sep)',
    color:'var(--ink)', outline:'none', fontWeight:500,
  }
  const loai = detectLoaiBaoGia(result)
  const warnings = (result?.hangMuc||[]).filter(h => h.canhBao)
  const cong  = (result?.hangMuc||[]).filter(h => h.loaiChiPhi !== 'vatTu').length
  const vatTu = (result?.hangMuc||[]).filter(h => h.loaiChiPhi === 'vatTu').length

  if (!result) return (
    <div style={{ ...S.card, marginBottom:10, textAlign:'center', padding:'28px 0' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8,
        color:'var(--brand)', fontSize:13 }}>
        <div style={{ width:14, height:14, border:'2px solid var(--sep)',
          borderTopColor:'var(--brand)', borderRadius:'50%', animation:'spin .6s linear infinite' }}/>
        Đang phân tích {file.name}…
      </div>
    </div>
  )

  return (
    <div style={{ ...S.card, marginBottom:10 }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {result.aiRead && <span style={S.badge('yel')}>AI đọc</span>}
          <span style={S.badge(loai==='lop'?'blu':'grn')}>
            {loai==='lop' ? '⭕ Thay lốp' : '🔧 BDSC'}
          </span>
          <span style={{ fontSize:12, color:'var(--ink3)' }}>{file.name}</span>
        </div>
        <button onClick={() => onRemove(idx)}
          style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ink3)', fontSize:20, lineHeight:1 }}>✕</button>
      </div>

      {/* Fields editable */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px 16px', marginBottom:14 }}>
        {[
          { key:'bienSo',   label:'Biển số xe',        type:'text'   },
          { key:'km',       label:'Số km',             type:'number' },
          { key:'ngay',     label:'Ngày sửa chữa/BD',  type:'text'   },
          { key:'garage',   label:'Garage / NCC',      type:'text'   },
          { key:'tongTien', label:'Tổng tiền (đ)',      type:'number' },
          { key:'soRO',     label:'Số RO / Báo giá',   type:'text'   },
        ].map(f => (
          <div key={f.key}>
            <div style={{ fontSize:11, color:'var(--ink3)', marginBottom:4 }}>{f.label}</div>
            <input value={result[f.key] || ''} type={f.type}
              onChange={e => onUpdate(idx, f.key, e.target.value)}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor='var(--brand)'}
              onBlur={e => e.target.style.borderColor='var(--sep)'}/>
          </div>
        ))}
      </div>

      {/* Hạng mục */}
      {(result.hangMuc||[]).length > 0 && (
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:12, color:'var(--ink3)', marginBottom:8 }}>
            Hạng mục đọc được ({cong > 0 ? `${cong} dòng công` : ''}{cong>0&&vatTu>0?' + ':''}{vatTu > 0 ? `${vatTu} vật tư` : ''}):
          </div>
          {result.hangMuc.map((h, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px',
              background:'var(--bg-secondary)', borderRadius:6, marginBottom:4 }}>
              <span style={{ color: h.canhBao?'var(--apple-orange)':'var(--apple-green)', fontSize:12, flexShrink:0 }}>
                {h.canhBao ? '△' : '✓'}
              </span>
              <span style={{ flex:1, fontSize:12, color: h.canhBao?'var(--apple-orange)':'var(--ink)' }}>
                {h.ten}{h.thanhTien ? ` — ${Number(h.thanhTien).toLocaleString('vi-VN')}đ` : ''}
              </span>
              <span style={S.badge(
                h.mucDich==='baoDuongDinhKy' ? 'grn' :
                h.loaiChiPhi==='giaCongNgoai' ? 'blu' :
                h.loaiChiPhi==='vatTu' ? 'gray' : 'yel'
              )}>
                {h.mucDich==='baoDuongDinhKy' ? 'BD định kỳ' :
                 h.loaiChiPhi==='giaCongNgoai' ? 'Gia công' :
                 h.loaiChiPhi==='vatTu' ? 'Vật tư' : 'Sửa chữa'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Warning banner — phiếu level (từ backend detectAnomaly) */}
      {result.canhBaoPhieu && (
        <div style={{ padding:'10px 12px', background:'rgba(196,85,0,.1)', borderRadius:8,
          border:'1px solid rgba(196,85,0,.25)', marginBottom:12 }}>
          <div style={{ fontSize:12, color:'var(--apple-orange)' }}>
            AI phát hiện: {result.canhBaoPhieu}
          </div>
        </div>
      )}

      {/* Warning banner — hạng mục level */}
      {warnings.length > 0 && (
        <div style={{ padding:'10px 12px', background:'rgba(196,85,0,.1)', borderRadius:8,
          border:'1px solid rgba(196,85,0,.25)', marginBottom:12 }}>
          {warnings.map((h,i) => (
            <div key={i} style={{ fontSize:12, color:'var(--apple-orange)' }}>
              AI phát hiện: {h.canhBao}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
        <button onClick={() => onRemove(idx)}
          style={{ padding:'8px 20px', borderRadius:8, border:'1px solid var(--sep)',
            background:'transparent', color:'var(--ink3)', cursor:'pointer', fontSize:13 }}>
          Sửa lại
        </button>
        {loai === 'lop' ? (
          <button onClick={() => onSaveTire(result)}
            style={{ padding:'8px 24px', borderRadius:8, border:'none',
              background:'var(--apple-blue)', color:'#fff', cursor:'pointer', fontWeight:600, fontSize:13 }}>
            ⭕ Chuyển sang tab Lốp xe
          </button>
        ) : (
          <button onClick={() => onUpdate(idx, '__save', true)}
            style={{ padding:'8px 24px', borderRadius:8, border:'none',
              background:'var(--brand)', color:'#fff', cursor:'pointer', fontWeight:600, fontSize:13 }}>
            Xác nhận & Lưu
          </button>
        )}
      </div>
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function PageBaoDuong({ token, user }) {
  const [tab, setTab]             = useState('overview')
  const [vehicles, setVehicles]   = useState([])
  const [bdHistory, setBdHistory] = useState([])
  const [tireData, setTireData]   = useState({})
  const [loadingVe, setLoadingVe] = useState(true)
  const [selectedVe, setSelectedVe] = useState('')
  const [tireVe, setTireVe]       = useState('')
  const [axleCfg, setAxleCfg]     = useState('6')
  const [tireModal, setTireModal] = useState(null)
  const [ocrFiles, setOcrFiles]   = useState([])
  const [ocrResults, setOcrResults] = useState([])
  const [ocrLoading, setOcrLoading] = useState(false)
  const [tireFromOcr, setTireFromOcr] = useState(null) // pre-fill tire tab từ OCR
  const fileInputRef = useRef()

  useEffect(() => {
    apiFetch('/api/xe/all').then(r => r.json())
      .then(d => { setVehicles(Array.isArray(d) ? d : []); setLoadingVe(false) })
      .catch(() => setLoadingVe(false))
    apiFetch('/api/bdsc').then(r => r.json())
      .then(d => Array.isArray(d) && setBdHistory(d))
      .catch(() => {})
  }, [])

  const processOcr = useCallback(async (newFiles, loai = 'bdsc') => {
    setOcrLoading(true)
    const results = []
    for (const f of newFiles) {
      try {
        const b64 = await new Promise((res, rej) => {
          const reader = new FileReader()
          reader.onload = () => res(reader.result.split(',')[1])
          reader.onerror = rej
          reader.readAsDataURL(f.file)
        })
        const resp = await apiFetch('/api/bdsc/ocr', {
          method: 'POST',
          body: JSON.stringify({ base64: b64, mimeType: f.file.type || 'image/jpeg', filename: f.file.name, loai })
        })
        results.push(resp.ok ? { ...(await resp.json()), aiRead: true }
          : { bienSo:'', km:'', ngay:'', garage:'', soRO:'', tongTien:'', hangMuc:[], lopDaThay:[], aiRead:false })
      } catch (_) {
        results.push({ bienSo:'', km:'', ngay:'', garage:'', soRO:'', tongTien:'', hangMuc:[], lopDaThay:[], aiRead:false })
      }
    }
    setOcrResults(prev => [...prev, ...results])
    setOcrLoading(false)
  }, [])
      } catch (_) {
        results.push({ bienSo:'', km:'', ngay:'', garage:'', soRO:'', tongTien:'', hangMuc:[], aiRead:false })
      }
    }
    setOcrResults(prev => [...prev, ...results])
    setOcrLoading(false)
  }, [])

  const handleFileSelect = useCallback((e) => {
    const selected = Array.from(e.target.files)
    const wrapped = selected.map(f => ({ file: f, preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null }))
    setOcrFiles(prev => [...prev, ...wrapped])
    processOcr(wrapped)
    e.target.value = ''
  }, [processOcr])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    const dropped = Array.from(e.dataTransfer.files).map(f => ({ file: f, preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null }))
    setOcrFiles(prev => [...prev, ...dropped])
    processOcr(dropped)
  }, [processOcr])

  const submitAllOcr = async () => {
    let saved = 0
    for (const result of ocrResults) {
      if (!result.bienSo || !result.km) continue
      if (detectLoaiBaoGia(result) === 'lop') continue // lốp xử lý riêng
      const resp = await apiFetch('/api/bdsc', { method:'POST', body: JSON.stringify(result) })
      if (resp.ok) saved++
    }
    setBdHistory(prev => [...ocrResults.filter(r=>r.bienSo && detectLoaiBaoGia(r)!=='lop'), ...prev])
    setOcrFiles([]); setOcrResults([])
    alert(`Đã lưu ${saved} báo giá`)
  }

  const handleSaveTire = (result) => {
    // Pre-fill tire tab với dữ liệu từ OCR và chuyển sang tab tire
    setTireFromOcr({ bienSo: result.bienSo, km: result.km, ngay: result.ngay })
    setTireVe(result.bienSo || '')
    setOcrFiles(p => p.filter((_,j) => j !== ocrResults.indexOf(result)))
    setOcrResults(p => p.filter(r => r !== result))
    setTab('tire')
  }

  const handleOcrUpdate = (idx, field, val) => {
    if (field === '__save') {
      // lưu ngay 1 phiếu
      const result = ocrResults[idx]
      if (result?.bienSo && result?.km) {
        apiFetch('/api/bdsc', { method:'POST', body: JSON.stringify(result) })
          .then(() => {
            setBdHistory(prev => [result, ...prev])
            setOcrFiles(p=>p.filter((_,j)=>j!==idx))
            setOcrResults(p=>p.filter((_,j)=>j!==idx))
          })
      }
      return
    }
    setOcrResults(prev => prev.map((r,j) => j===idx ? {...r,[field]:val} : r))
  }

  const bdAlerts = vehicles.map(xe => {
    const km = xe.kmGPS || 0
    if (!km) return null
    const lastBdKm = bdHistory.find(h => h.bienSo === xe.bienSo)?.km || 0
    const mocTiep = Math.ceil(km / 5000) * 5000
    const conLai = mocTiep - km
    const pct = Math.min((km - lastBdKm) / 5000, 1)
    if (pct < 0.7) return null
    return { xe, km, mocTiep, conLai, pct, status: pct >= 1 ? 'crit' : 'warn' }
  }).filter(Boolean)

  // ── SELECT styles ──────────────────────────────────────────────────────
  const selectStyle = {
    padding:'7px 12px', borderRadius:8, fontSize:12, cursor:'pointer',
    border:'1px solid var(--sep)', background:'var(--bg-card)',
    color:'var(--ink)', outline:'none',
  }

  const alertRowStyle = (status) => ({
    display:'flex', alignItems:'center', gap:12, padding:'10px 14px',
    borderRadius:8, background:'var(--bg-card)', border:`1px solid ${status==='crit'?'rgba(215,0,21,.25)':status==='warn'?'rgba(196,85,0,.2)':'var(--sep)'}`,
    marginBottom:6,
  })

  return (
    <div style={{ minHeight:'100vh' }}>
      {/* ── Tab nav ────────────────────────────────────────────────────── */}
      <div style={{ display:'flex', gap:4, marginBottom:16, overflowX:'auto',
        paddingBottom:2, borderBottom:'1px solid var(--sep)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding:'7px 16px', borderRadius:8, border:'none', cursor:'pointer',
              fontSize:12, fontWeight:500, whiteSpace:'nowrap', transition:'all .15s',
              background: tab===t.id ? 'var(--brand)' : 'transparent',
              color: tab===t.id ? '#fff' : 'var(--ink3)' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TỔNG QUAN ─────────────────────────────────────────────────── */}
      {tab==='overview' && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:14 }}>
            {[
              { label:'Xe đến hạn BD', val: bdAlerts.length, color: bdAlerts.length>0?'var(--apple-red)':'var(--ink)', sub:'trong 30 ngày tới' },
              { label:'Lần BDSC đã ghi nhận', val: bdHistory.length, color:'var(--ink)', sub:'tổng cộng' },
              { label:'Xe trong hệ thống', val: vehicles.length, color:'var(--ink)', sub:'đang theo dõi' },
              { label:'Báo giá chờ xác nhận', val: ocrResults.length, color: ocrResults.length>0?'var(--brand)':'var(--ink)', sub:'cần review' },
            ].map((c,i) => (
              <div key={i} style={S.card}>
                <div style={{ fontSize:11, color:'var(--ink3)', marginBottom:4 }}>{c.label}</div>
                <div style={{ fontSize:26, fontWeight:700, color:c.color, lineHeight:1.2 }}>{c.val}</div>
                <div style={{ fontSize:11, color:'var(--ink3)', marginTop:2 }}>{c.sub}</div>
              </div>
            ))}
          </div>
          {bdAlerts.length===0 && bdHistory.length===0 ? (
            <div style={S.card}>
              <EmptyState icon="🚛" title="Chưa có dữ liệu bảo dưỡng"
                sub="Bắt đầu bằng cách scan báo giá sửa chữa. Hệ thống sẽ tự động tính toán chu kỳ khi có đủ dữ liệu."
                action="Scan báo giá đầu tiên" onAction={() => setTab('ocr')} />
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div style={S.card}>
                <div style={S.secTitle}>Xe cần bảo dưỡng sớm</div>
                {bdAlerts.slice(0,5).map((a,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0',
                    borderBottom:'1px solid var(--sep)' }}>
                    <span style={S.badge(a.status==='crit'?'red':'yel')}>{a.status==='crit'?'Quá hạn':'Sắp đến'}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:'var(--ink)' }}>{a.xe.bienSo}</div>
                      <div style={{ fontSize:11, color:'var(--ink3)' }}>Mốc {a.mocTiep.toLocaleString()}km · Còn {a.conLai}km</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={S.card}>
                <div style={S.secTitle}>BDSC ghi nhận gần nhất</div>
                {bdHistory.slice(0,5).map((h,i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                    padding:'6px 0', borderBottom:'1px solid var(--sep)', fontSize:12 }}>
                    <span style={{ fontWeight:600, color:'var(--ink)' }}>{h.bienSo}</span>
                    <span style={{ color:'var(--ink3)' }}>{h.ngay}</span>
                    <span style={{ fontWeight:600, color:'var(--ink)' }}>{Number(h.tongTien||0).toLocaleString('vi-VN')}đ</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── CẢNH BÁO BD ────────────────────────────────────────────────── */}
      {tab==='alert' && (
        <div>
          {bdAlerts.length===0 ? (
            <div style={S.card}>
              <EmptyState icon="✅" title="Không có cảnh báo"
                sub={vehicles.length===0
                  ? 'Chưa có xe nào trong hệ thống hoặc chưa có dữ liệu km GPS.'
                  : 'Tất cả xe trong chu kỳ an toàn. Hệ thống cảnh báo khi xe đạt 70% chu kỳ.'} />
            </div>
          ) : bdAlerts.map((a,i) => (
            <div key={i} style={alertRowStyle(a.status)}>
              <div style={{ width:34, height:34, borderRadius:8, display:'flex', alignItems:'center',
                justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0,
                background: a.status==='crit'?'var(--red-l)':'rgba(196,85,0,.1)',
                color: a.status==='crit'?'var(--apple-red)':'var(--apple-orange)' }}>
                {a.status==='crit'?'QUÁ':Math.round(a.pct*100)+'%'}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:13, color:'var(--ink)' }}>{a.xe.bienSo} · {a.xe.tenTaiSan||a.xe.loaiXe}</div>
                <div style={{ fontSize:12, color:'var(--ink3)', marginTop:2 }}>
                  Mốc {a.mocTiep.toLocaleString()}km · KM hiện tại {a.km.toLocaleString()}km · Còn {a.conLai}km
                </div>
              </div>
              <span style={S.badge(a.status==='crit'?'red':'yel')}>{a.status==='crit'?'Quá hạn':'Sắp đến'}</span>
            </div>
          ))}

          <div style={{ ...S.card, marginTop:14 }}>
            <div style={S.secTitle}>Chu kỳ bảo dưỡng xe tải (quy định HSH.QLTS-05, mục 6.1.3 · lặp mỗi 30.000km)</div>
            {BD_XETAI.map(b => (
              <div key={b.moc} style={{ display:'flex', gap:12, padding:'7px 0',
                borderBottom:'1px solid var(--sep)', fontSize:12 }}>
                <span style={{ fontWeight:700, color:'var(--brand)', minWidth:60, flexShrink:0 }}>{b.moc.toLocaleString()}km</span>
                <span style={{ color:'var(--ink3)' }}>{b.items.join(' · ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CHI PHÍ ─────────────────────────────────────────────────────── */}
      {tab==='cost' && (
        bdHistory.length===0
          ? <div style={S.card}><EmptyState icon="📊" title="Chưa có dữ liệu chi phí"
              sub="Sau khi nhập báo giá qua Scan, hệ thống tự động tổng hợp chi phí theo xe và theo garage."
              action="Scan báo giá" onAction={() => setTab('ocr')} /></div>
          : (() => {
              const byXe = bdHistory.reduce((acc, h) => {
                if (!acc[h.bienSo]) acc[h.bienSo] = 0
                acc[h.bienSo] += Number(h.tongTien||0)
                return acc
              }, {})
              const sorted = Object.entries(byXe).sort((a,b) => b[1]-a[1]).slice(0,8)
              const maxVal = sorted[0]?.[1] || 1
              const byGarage = bdHistory.reduce((acc,h) => {
                if (!h.garage) return acc
                if (!acc[h.garage]) acc[h.garage] = 0
                acc[h.garage] += Number(h.tongTien||0)
                return acc
              }, {})
              const sortedGarage = Object.entries(byGarage).sort((a,b)=>b[1]-a[1]).slice(0,6)
              const maxG = sortedGarage[0]?.[1] || 1
              return (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div style={S.card}>
                    <div style={S.secTitle}>Chi phí theo xe (tổng cộng)</div>
                    {sorted.map(([bs, val], i) => (
                      <BarRow key={bs} label={bs} pct={val/maxVal*100}
                        val={val>=1e6?(val/1e6).toFixed(1)+'tr':(val/1e3).toFixed(0)+'k'}
                        color={i===0?'var(--apple-red)':i<3?'var(--brand)':'var(--apple-green)'} />
                    ))}
                  </div>
                  <div style={S.card}>
                    <div style={S.secTitle}>Chi phí theo garage</div>
                    {sortedGarage.map(([g, val]) => (
                      <BarRow key={g} label={g.slice(0,16)} pct={val/maxG*100}
                        val={val>=1e6?(val/1e6).toFixed(1)+'tr':(val/1e3).toFixed(0)+'k'} />
                    ))}
                    {sortedGarage.length===0 && <div style={{ fontSize:12, color:'var(--ink3)' }}>Chưa có dữ liệu garage</div>}
                  </div>
                </div>
              )
            })()
      )}

      {/* ── TIMELINE ────────────────────────────────────────────────────── */}
      {tab==='timeline' && (
        <div>
          <select value={selectedVe} onChange={e => setSelectedVe(e.target.value)}
            style={{ ...selectStyle, marginBottom:14, width:280 }}>
            <option value="">-- Chọn xe --</option>
            {vehicles.map(v => <option key={v._id} value={v.bienSo}>{v.bienSo} · {v.tenTaiSan||v.loaiXe}</option>)}
          </select>
          {!selectedVe
            ? <div style={S.card}><EmptyState icon="🔍" title="Chọn xe để xem timeline" /></div>
            : bdHistory.filter(h=>h.bienSo===selectedVe).length===0
            ? <div style={S.card}><EmptyState icon="📋" title={`Chưa có lịch sử cho xe ${selectedVe}`}
                action="Scan báo giá" onAction={() => setTab('ocr')} /></div>
            : (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:14 }}>
                <div style={S.card}>
                  <div style={{ position:'relative', paddingLeft:22 }}>
                    <div style={{ position:'absolute', left:7, top:0, bottom:0, width:2, background:'var(--sep)' }}/>
                    {bdHistory.filter(h=>h.bienSo===selectedVe).map((h,i) => (
                      <div key={i} style={{ position:'relative', marginBottom:18 }}>
                        <div style={{ position:'absolute', left:-18, top:4, width:10, height:10, borderRadius:'50%',
                          border:`2px solid ${h.loai==='baoDuong'?'var(--apple-green)':'var(--brand)'}`,
                          background: h.loai==='baoDuong'?'var(--green-l)':'var(--brand-l)' }}/>
                        <div style={{ fontSize:10, color:'var(--ink3)', marginBottom:2 }}>{h.km?.toLocaleString()}km · {h.ngay}</div>
                        <div style={{ fontSize:13, fontWeight:600, color:'var(--ink)' }}>
                          {h.garage} · {Number(h.tongTien||0).toLocaleString('vi-VN')}đ
                        </div>
                        <div style={{ fontSize:12, color:'var(--ink3)' }}>
                          {h.hangMuc?.slice(0,3).map(m=>m.ten).join(' · ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  {(() => {
                    const veHistory = bdHistory.filter(h=>h.bienSo===selectedVe)
                    const total = veHistory.reduce((s,h)=>s+Number(h.tongTien||0),0)
                    return (
                      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                        {[
                          { label:'Tổng chi phí', val: total>=1e6?(total/1e6).toFixed(1)+'tr':(total/1e3).toFixed(0)+'k đ' },
                          { label:'Số lần BDSC', val: veHistory.length },
                          { label:'Lần gần nhất', val: veHistory[0]?.ngay || '—' },
                        ].map((s,i) => (
                          <div key={i} style={{ ...S.card, padding:12 }}>
                            <div style={{ fontSize:11, color:'var(--ink3)' }}>{s.label}</div>
                            <div style={{ fontSize:18, fontWeight:700, color:'var(--ink)', marginTop:2 }}>{s.val}</div>
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                </div>
              </div>
            )
          }
        </div>
      )}

      {/* ── THAY LỐP XE ─────────────────────────────────────────────────── */}
      {tab==='tire' && (() => {
        const tireFileRef = React.useRef()
        const [tireOcrFiles, setTireOcrFiles]   = React.useState([])
        const [tireOcrResults, setTireOcrResults] = React.useState([])
        const [tireOcrLoading, setTireOcrLoading] = React.useState(false)

        const processTireOcr = async (files) => {
          setTireOcrLoading(true)
          const results = []
          for (const f of files) {
            try {
              const b64 = await new Promise((res, rej) => {
                const reader = new FileReader()
                reader.onload = () => res(reader.result.split(',')[1])
                reader.onerror = rej
                reader.readAsDataURL(f.file)
              })
              const resp = await apiFetch('/api/bdsc/ocr', {
                method: 'POST',
                body: JSON.stringify({ base64:b64, mimeType:f.file.type||'image/jpeg', filename:f.file.name, loai:'lop' })
              })
              results.push(resp.ok ? await resp.json() : { bienSo:'', km:'', ngay:new Date().toLocaleDateString('vi-VN'), garage:'', soRO:'', tongTien:'', lopDaThay:[], aiRead:false })
            } catch (_) {
              results.push({ bienSo:'', km:'', ngay:new Date().toLocaleDateString('vi-VN'), garage:'', soRO:'', tongTien:'', lopDaThay:[], aiRead:false })
            }
          }
          setTireOcrResults(p => [...p, ...results])
          setTireOcrLoading(false)
        }

        return (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1.3fr', gap:14, marginBottom:16 }}>
              {/* Upload zone */}
              <div>
                <div onClick={() => tireFileRef.current?.click()}
                  onDragOver={e=>{ e.preventDefault(); e.currentTarget.style.borderColor='var(--brand)' }}
                  onDragLeave={e=>e.currentTarget.style.borderColor='rgba(230,50,0,.3)'}
                  onDrop={e=>{ e.preventDefault(); const fs=Array.from(e.dataTransfer.files).map(f=>({file:f})); setTireOcrFiles(p=>[...p,...fs]); processTireOcr(fs) }}
                  style={{ border:'2px dashed rgba(230,50,0,.3)', borderRadius:12, padding:28,
                    textAlign:'center', cursor:'pointer', background:'var(--brand-l)', marginBottom:12 }}>
                  <input ref={tireFileRef} type="file" multiple accept="image/*,.pdf" style={{ display:'none' }}
                    onChange={e=>{ const fs=Array.from(e.target.files).map(f=>({file:f})); setTireOcrFiles(p=>[...p,...fs]); processTireOcr(fs); e.target.value='' }} />
                  <div style={{ fontSize:32, marginBottom:8 }}>⭕</div>
                  <div style={{ fontWeight:600, fontSize:13, color:'var(--ink)', marginBottom:4 }}>Chụp ảnh / tải phiếu thay lốp</div>
                  <div style={{ fontSize:12, color:'var(--ink3)', marginBottom:10 }}>JPG · PNG · PDF · AI tự đọc biển số, km, loại lốp</div>
                  <button style={{ padding:'7px 20px', borderRadius:8, border:'none', background:'var(--brand)', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600 }}>Chọn file</button>
                </div>
                {/* Sơ đồ lốp nhỏ */}
                <div style={{ ...S.card, marginBottom:0 }}>
                  <div style={S.secTitle}>Sơ đồ lốp</div>
                  <div style={{ display:'flex', gap:8, marginBottom:10, flexWrap:'wrap' }}>
                    <select value={tireVe} onChange={e=>setTireVe(e.target.value)} style={{ ...selectStyle, flex:1, minWidth:130 }}>
                      <option value="">-- Chọn xe --</option>
                      {vehicles.map(v=><option key={v._id} value={v.bienSo}>{v.bienSo}</option>)}
                    </select>
                    <select value={axleCfg} onChange={e=>setAxleCfg(e.target.value)} style={selectStyle}>
                      {Object.entries(AXLE_CONFIGS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  {tireVe ? (
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'12px 0' }}>
                      <TireView config={axleCfg} tireData={tireData[tireVe]||{}}
                        onClickTire={(pos,data)=>setTireModal({pos,data,ve:tireVe})} />
                      <div style={{ display:'flex', gap:10, marginTop:10, fontSize:10, color:'var(--ink3)' }}>
                        <span><span style={{color:'var(--apple-green)'}}>■</span> Tốt</span>
                        <span><span style={{color:'var(--apple-orange)'}}>■</span> Sắp hạn</span>
                        <span><span style={{color:'var(--apple-red)'}}>■</span> Cần thay</span>
                      </div>
                    </div>
                  ) : <div style={{ fontSize:12, color:'var(--ink3)', padding:'12px 0', textAlign:'center' }}>Chọn xe để xem sơ đồ</div>}
                </div>
              </div>

              {/* Kết quả OCR + form */}
              <div>
                {tireOcrLoading && (
                  <div style={{ display:'flex', alignItems:'center', gap:8, padding:12, color:'var(--brand)', fontSize:13 }}>
                    <div style={{ width:14, height:14, border:'2px solid var(--sep)', borderTopColor:'var(--brand)', borderRadius:'50%', animation:'spin .6s linear infinite' }}/>
                    AI đang đọc phiếu lốp…
                  </div>
                )}
                {tireOcrFiles.length === 0 && !tireOcrLoading
                  ? <div style={S.card}><EmptyState icon="⭕" title="Tải phiếu thay lốp để bắt đầu"
                      sub="AI đọc biển số, km, thương hiệu lốp. Bạn chọn kích thước từ danh sách đã thẩm định giá và chọn vị trí lốp cần ghi nhận." /></div>
                  : tireOcrFiles.map((f, i) => {
                    const r = tireOcrResults[i]
                    if (!r) return <div key={i} style={{ ...S.card, marginBottom:10, color:'var(--ink3)', fontSize:12 }}>Đang xử lý {f.file.name}…</div>

                    return (
                      <div key={i} style={{ ...S.card, marginBottom:10 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                            {r.aiRead && <span style={S.badge('yel')}>AI đọc</span>}
                            <span style={S.badge('blu')}>⭕ Thay lốp</span>
                            <span style={{ fontSize:12, color:'var(--ink3)' }}>{f.file.name}</span>
                          </div>
                          <button onClick={()=>{ setTireOcrFiles(p=>p.filter((_,j)=>j!==i)); setTireOcrResults(p=>p.filter((_,j)=>j!==i)) }}
                            style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ink3)', fontSize:18 }}>✕</button>
                        </div>

                        {/* Fields chính */}
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px 12px', marginBottom:12 }}>
                          {[
                            {k:'bienSo',label:'Biển số xe'},{k:'km',label:'Số km lắp đặt'},
                            {k:'ngay',label:'Ngày lắp'},{k:'garage',label:'Garage / NCC'},
                            {k:'tongTien',label:'Chi phí (đ)'},{k:'soRO',label:'Số phiếu / RO'},
                          ].map(({k,label})=>(
                            <div key={k}>
                              <div style={{ fontSize:11, color:'var(--ink3)', marginBottom:3 }}>{label}</div>
                              <input value={r[k]||''} onChange={e=>setTireOcrResults(p=>p.map((x,j)=>j===i?{...x,[k]:e.target.value}:x))}
                                style={{ width:'100%', padding:'7px 10px', borderRadius:7, fontSize:13, background:'var(--bg-card)',
                                  border:'1px solid var(--sep)', color:'var(--ink)', outline:'none', boxSizing:'border-box' }}
                                onFocus={e=>e.target.style.borderColor='var(--brand)'}
                                onBlur={e=>e.target.style.borderColor='var(--sep)'} />
                            </div>
                          ))}
                        </div>

                        {/* Lốp đã thay từ OCR */}
                        {(r.lopDaThay||[]).length > 0 && (
                          <div style={{ marginBottom:12 }}>
                            <div style={{ ...S.secTitle, marginBottom:6 }}>Lốp đọc được từ phiếu</div>
                            {r.lopDaThay.map((lop, li) => (
                              <div key={li} style={{ display:'flex', gap:8, alignItems:'center', padding:'6px 10px',
                                background:'var(--bg-secondary)', borderRadius:6, marginBottom:4, flexWrap:'wrap' }}>
                                <span style={{ fontSize:12, fontWeight:600, color:'var(--ink)' }}>{lop.size||'?'}</span>
                                <span style={{ fontSize:12, color:'var(--ink3)' }}>{lop.thuongHieu}</span>
                                <span style={{ fontSize:12, color:'var(--ink3)' }}>x{lop.soLuong}</span>
                                <span style={{ fontSize:12, fontWeight:600, marginLeft:'auto' }}>{Number(lop.thanhTien||0).toLocaleString('vi-VN')}đ</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Chọn kích thước từ TIRE_CATALOG */}
                        <div style={{ marginBottom:12 }}>
                          <div style={{ fontSize:11, color:'var(--ink3)', marginBottom:4 }}>Kích thước lốp (từ danh mục thẩm định giá)</div>
                          <select value={r.sizeDaChon||''} onChange={e=>setTireOcrResults(p=>p.map((x,j)=>j===i?{...x,sizeDaChon:e.target.value}:x))}
                            style={{ width:'100%', padding:'7px 10px', borderRadius:7, fontSize:13, background:'var(--bg-card)',
                              border:'1px solid var(--sep)', color:'var(--ink)', outline:'none' }}>
                            <option value=''>-- Chọn kích thước --</option>
                            {TIRE_CATALOG.map(t=>(
                              <option key={t.id} value={t.size}>{t.size} · {t.loaiXe} · SĐP {t.p1.sdp.toLocaleString('vi-VN')}đ ({t.p1.ncc})</option>
                            ))}
                          </select>
                        </div>

                        {/* Vị trí lốp */}
                        <div style={{ marginBottom:12 }}>
                          <div style={{ fontSize:11, color:'var(--ink3)', marginBottom:4 }}>Vị trí lốp đã thay (có thể chọn nhiều)</div>
                          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                            {(AXLE_CONFIGS[axleCfg]?.positions||[]).map(pos=>{
                              const sel = (r.viTriChon||[]).includes(pos)
                              return (
                                <button key={pos} onClick={()=>{
                                  const cur = r.viTriChon||[]
                                  setTireOcrResults(p=>p.map((x,j)=>j===i?{...x,viTriChon:sel?cur.filter(v=>v!==pos):[...cur,pos]}:x))
                                }} style={{ padding:'4px 10px', borderRadius:6, border:`1px solid ${sel?'var(--brand)':'var(--sep)'}`,
                                  background: sel?'var(--brand-l)':'transparent', color:sel?'var(--brand)':'var(--ink3)',
                                  fontSize:11, cursor:'pointer' }}>{POS_LABELS[pos]||pos}</button>
                              )
                            })}
                          </div>
                        </div>

                        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                          <button style={{ padding:'7px 18px', borderRadius:8, border:'1px solid var(--sep)',
                            background:'transparent', color:'var(--ink3)', cursor:'pointer', fontSize:12 }}
                            onClick={()=>{ setTireOcrFiles(p=>p.filter((_,j)=>j!==i)); setTireOcrResults(p=>p.filter((_,j)=>j!==i)) }}>
                            Bỏ qua
                          </button>
                          <button style={{ padding:'7px 20px', borderRadius:8, border:'none',
                            background:'var(--brand)', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600 }}
                            onClick={async ()=>{
                              if (!r.bienSo) return alert('Vui lòng nhập biển số xe')
                              const payload = {
                                bienSo:r.bienSo, km:+r.km||0, ngay:r.ngay, garage:r.garage,
                                soRO:r.soRO, tongTien:+r.tongTien||0, loaiBaoGia:'lop',
                                size:r.sizeDaChon||'', viTriLop:r.viTriChon||[],
                                thuongHieu:(r.lopDaThay||[])[0]?.thuongHieu||'',
                                lopDaThay:r.lopDaThay||[],
                              }
                              const resp = await apiFetch('/api/bdsc/tire-record', { method:'POST', body:JSON.stringify(payload) })
                              if (resp.ok) {
                                setTireOcrFiles(p=>p.filter((_,j)=>j!==i))
                                setTireOcrResults(p=>p.filter((_,j)=>j!==i))
                                alert(`Đã lưu phiếu thay lốp cho xe ${r.bienSo}`)
                              } else {
                                const err = await resp.json()
                                alert('Lỗi: ' + (err.error||'không lưu được'))
                              }
                            }}>
                            Xác nhận & Lưu
                          </button>
                        </div>
                      </div>
                    )
                  })
                }
              </div>
            </div>

            {/* Quy định thay lốp */}
            <div style={S.card}>
              <div style={S.secTitle}>Quy định thay lốp (mục 6.2 HSH.QLTS-05)</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                {[{val:'50.000km',label:'Lốp bố nylon',color:'var(--brand)'},{val:'80.000km',label:'Lốp bố kẽm',color:'var(--apple-blue)'},{val:'10.000km',label:'Chu kỳ đảo lốp',color:'var(--apple-green)'}]
                  .map((s,i)=>(
                    <div key={i} style={{ background:'var(--bg-secondary)', borderRadius:8, padding:10, textAlign:'center' }}>
                      <div style={{ fontSize:16, fontWeight:700, color:s.color }}>{s.val}</div>
                      <div style={{ fontSize:10, color:'var(--ink3)', marginTop:2 }}>{s.label}</div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── DỰ BÁO ──────────────────────────────────────────────────────── */}
      {tab==='forecast' && (() => {
        if (vehicles.length === 0 || bdHistory.length === 0) return (
          <div style={S.card}>
            <EmptyState icon="📈" title="Chưa đủ dữ liệu để dự báo"
              sub="Cần ít nhất 3 tháng dữ liệu km GPS và lịch sử BDSC để tính tốc độ chạy trung bình và dự báo ngân sách tháng tới."
              action="Xem cảnh báo BD" onAction={() => setTab('alert')} />
          </div>
        )

        // Tính km/tháng trung bình từ lịch sử BD mỗi xe
        const veStats = vehicles.map(xe => {
          const history = bdHistory.filter(h => h.bienSo === xe.bienSo).sort((a,b) => (a.km||0)-(b.km||0))
          if (history.length < 2) return null
          const kmDelta = (history[history.length-1].km || 0) - (history[0].km || 0)
          const monthCount = Math.max(history.length - 1, 1)
          const kmPerMonth = Math.round(kmDelta / monthCount)
          const lastKm = xe.kmGPS || history[history.length-1]?.km || 0
          const lastBdKm = history[history.length-1]?.km || 0
          const nextMoc  = Math.ceil(lastKm / 5000) * 5000
          const kmToNext = nextMoc - lastKm
          const daysToNext = kmPerMonth > 0 ? Math.round(kmToNext / (kmPerMonth / 30)) : null
          const totalCost = history.reduce((s,h) => s + Number(h.tongTien||0), 0)
          return { xe, kmPerMonth, lastKm, nextMoc, kmToNext, daysToNext, totalCost, history }
        }).filter(Boolean)

        const coming30 = veStats.filter(s => s.daysToNext !== null && s.daysToNext <= 30)
        const totalBudget = coming30.reduce((s,v) => s + (v.history.slice(-3).reduce((a,h)=>a+Number(h.tongTien||0),0) / Math.min(v.history.length,3)), 0)

        return (
          <div>
            {/* Summary */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:14 }}>
              {[
                { label:'Xe đến hạn BD trong 30 ngày', val: coming30.length, color:'var(--apple-orange)' },
                { label:'Ngân sách BD ước tính tháng tới', val: totalBudget>=1e6?(totalBudget/1e6).toFixed(1)+'tr đ':(totalBudget/1e3).toFixed(0)+'k đ', color:'var(--brand)' },
                { label:'Tổng xe đang theo dõi', val: veStats.length, color:'var(--ink)' },
              ].map((c,i) => (
                <div key={i} style={S.card}>
                  <div style={{ fontSize:11, color:'var(--ink3)', marginBottom:4 }}>{c.label}</div>
                  <div style={{ fontSize:22, fontWeight:700, color:c.color, lineHeight:1.2 }}>{c.val}</div>
                </div>
              ))}
            </div>

            {/* Xe sắp đến hạn */}
            {coming30.length > 0 && (
              <div style={S.card}>
                <div style={S.secTitle}>Xe đến hạn BD trong 30 ngày tới</div>
                {coming30.sort((a,b)=>(a.daysToNext||99)-(b.daysToNext||99)).map((s,i) => {
                  const avgCost = s.history.length > 0 ? s.totalCost / s.history.length : 0
                  return (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'9px 0',
                      borderBottom:'1px solid var(--sep)' }}>
                      <div style={{ width:40, height:40, borderRadius:8, display:'flex', flexDirection:'column',
                        alignItems:'center', justifyContent:'center', flexShrink:0,
                        background: (s.daysToNext||99)<=7?'var(--red-l)':'rgba(196,85,0,.1)',
                        color: (s.daysToNext||99)<=7?'var(--apple-red)':'var(--apple-orange)' }}>
                        <div style={{ fontSize:13, fontWeight:700, lineHeight:1 }}>{s.daysToNext}</div>
                        <div style={{ fontSize:9 }}>ngày</div>
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:600, fontSize:13, color:'var(--ink)' }}>{s.xe.bienSo}</div>
                        <div style={{ fontSize:11, color:'var(--ink3)', marginTop:1 }}>
                          Mốc {s.nextMoc.toLocaleString()}km · Còn {s.kmToNext.toLocaleString()}km · ~{s.kmPerMonth.toLocaleString()}km/tháng
                        </div>
                      </div>
                      {avgCost > 0 && (
                        <div style={{ textAlign:'right', flexShrink:0 }}>
                          <div style={{ fontSize:12, fontWeight:600, color:'var(--ink)' }}>
                            ~{avgCost>=1e6?(avgCost/1e6).toFixed(1)+'tr':(avgCost/1e3).toFixed(0)+'k'}đ
                          </div>
                          <div style={{ fontSize:10, color:'var(--ink3)' }}>TB/lần</div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Tất cả xe */}
            {veStats.length > 0 && (
              <div style={{ ...S.card, marginTop:12 }}>
                <div style={S.secTitle}>Tốc độ chạy & dự kiến BD tiếp theo</div>
                {veStats.sort((a,b)=>(a.daysToNext||999)-(b.daysToNext||999)).slice(0,10).map((s,i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                    padding:'7px 0', borderBottom:'1px solid var(--sep)', fontSize:12 }}>
                    <span style={{ fontWeight:600, color:'var(--ink)', minWidth:90 }}>{s.xe.bienSo}</span>
                    <span style={{ color:'var(--ink3)' }}>{s.kmPerMonth.toLocaleString()} km/tháng</span>
                    <span style={{ color:'var(--ink3)' }}>Mốc {s.nextMoc.toLocaleString()}km</span>
                    <span style={S.badge((s.daysToNext||99)<=7?'red':(s.daysToNext||99)<=30?'yel':'gray')}>
                      {s.daysToNext !== null ? `${s.daysToNext} ngày` : 'N/A'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })()}

      {/* ── SCAN BÁO GIÁ ────────────────────────────────────────────────── */}
      {tab==='ocr' && (
        <div style={{ display:'grid', gridTemplateColumns: ocrFiles.length>0 ? '1fr 1.3fr' : '1fr', gap:16 }}>
          {/* Cột trái — upload zone */}
          <div>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor='var(--brand)' }}
              onDragLeave={e => e.currentTarget.style.borderColor='rgba(230,50,0,.3)'}
              onDrop={handleDrop}
              style={{ border:'2px dashed rgba(230,50,0,.3)', borderRadius:12, padding:32,
                textAlign:'center', cursor:'pointer', background:'var(--brand-l)',
                marginBottom:16, transition:'border-color .15s' }}>
              <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf"
                style={{ display:'none' }} onChange={handleFileSelect} />
              <div style={{ fontSize:36, marginBottom:8 }}>📷</div>
              <div style={{ fontWeight:600, fontSize:14, color:'var(--ink)', marginBottom:4 }}>
                Chụp ảnh hoặc tải file báo giá
              </div>
              <div style={{ fontSize:12, color:'var(--ink3)', marginBottom:12 }}>
                JPG · PNG · PDF · AI tự đọc và điền các trường
              </div>
              <button style={{ padding:'8px 24px', borderRadius:8, border:'none',
                background:'var(--brand)', color:'#fff', cursor:'pointer', fontWeight:600, fontSize:13 }}>
                Chọn file
              </button>
            </div>

            {/* Hướng dẫn loại báo giá */}
            <div style={{ ...S.card, fontSize:12, color:'var(--ink3)' }}>
              <div style={{ fontWeight:600, color:'var(--ink2)', marginBottom:8 }}>AI sẽ tự phân loại:</div>
              <div style={{ display:'flex', gap:8, marginBottom:6 }}>
                <span style={S.badge('grn')}>🔧 BDSC</span>
                <span style={{ lineHeight:'20px' }}>Bảo dưỡng, sửa chữa cơ học</span>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <span style={S.badge('blu')}>⭕ Thay lốp</span>
                <span style={{ lineHeight:'20px' }}>Phiếu thay lốp → chuyển sang tab Lốp xe</span>
              </div>
            </div>
          </div>

          {/* Cột phải — kết quả */}
          {ocrFiles.length > 0 && (
            <div>
              <div style={{ fontWeight:600, fontSize:13, color:'var(--ink)', marginBottom:10 }}>
                KẾT QUẢ NHẬN DẠNG
                {ocrLoading && (
                  <span style={{ marginLeft:8, display:'inline-flex', alignItems:'center', gap:5,
                    color:'var(--brand)', fontSize:12, fontWeight:400 }}>
                    <div style={{ width:12, height:12, border:'2px solid var(--sep)',
                      borderTopColor:'var(--brand)', borderRadius:'50%', animation:'spin .6s linear infinite' }}/>
                    Đang phân tích…
                  </span>
                )}
              </div>

              {ocrFiles.map((f, i) => (
                <OcrCard key={i} idx={i} file={f.file} result={ocrResults[i]}
                  onUpdate={handleOcrUpdate}
                  onRemove={(idx) => { setOcrFiles(p=>p.filter((_,j)=>j!==idx)); setOcrResults(p=>p.filter((_,j)=>j!==idx)) }}
                  onSaveTire={handleSaveTire} />
              ))}

              {ocrResults.filter(r=>r?.bienSo && detectLoaiBaoGia(r)!=='lop').length > 1 && (
                <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:4 }}>
                  <button onClick={() => { setOcrFiles([]); setOcrResults([]) }}
                    style={{ padding:'8px 20px', borderRadius:8, border:'1px solid var(--sep)',
                      background:'transparent', color:'var(--ink3)', cursor:'pointer', fontSize:13 }}>
                    Hủy tất cả
                  </button>
                  <button onClick={submitAllOcr}
                    style={{ padding:'8px 24px', borderRadius:8, border:'none',
                      background:'var(--brand)', color:'#fff', cursor:'pointer', fontWeight:600, fontSize:13 }}>
                    Lưu tất cả ({ocrResults.filter(r=>r?.bienSo && detectLoaiBaoGia(r)!=='lop').length}) báo giá BDSC
                  </button>
                </div>
              )}
            </div>
          )}

          {ocrFiles.length === 0 && (
            <div style={S.card}><EmptyState icon="🧾" title="Chưa có báo giá nào"
              sub="Chụp ảnh hoặc scan file PDF báo giá. AI tự động đọc biển số, km, hạng mục và chi phí. Có thể chỉnh sửa trước khi lưu." /></div>
          )}
        </div>
      )}

      {/* ── GIẤY TỜ XE ──────────────────────────────────────────────────── */}
      {tab==='docs' && (
        vehicles.length===0
          ? <div style={S.card}><EmptyState icon="📄" title="Chưa có xe nào để theo dõi giấy tờ" /></div>
          : <div style={S.card}>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead>
                    <tr>
                      {['Biển số','Đăng kiểm','Bảo hiểm thân vỏ','Phù hiệu','Kiểm định cầu','GPLX NLX'].map(h => (
                        <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontWeight:600,
                          fontSize:11, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:'.04em',
                          borderBottom:'1px solid var(--sep)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.slice(0,20).map(v => (
                      <tr key={v._id} style={{ borderBottom:'1px solid var(--sep)' }}>
                        <td style={{ padding:'9px 12px', fontWeight:600, color:'var(--ink)' }}>{v.bienSo}</td>
                        {[null,null,null,null,null].map((_,i) => (
                          <td key={i} style={{ padding:'9px 12px' }}>
                            <span style={S.badge('gray')}>Chưa nhập</span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop:12, fontSize:11, color:'var(--ink3)' }}>
                  Nhập ngày hết hạn cho từng xe — hệ thống cảnh báo trước 30 ngày.
                </div>
              </div>
            </div>
      )}

      {/* ── GIÁ LỐP ────────────────────────────────────────────────────── */}
      {tab==='gialop' && (
        <div>
          <div style={{ ...S.card, marginBottom:12, background:'rgba(0,85,204,.06)', border:'1px solid rgba(0,85,204,.15)' }}>
            <div style={{ fontWeight:600, fontSize:13, color:'var(--ink)', marginBottom:2 }}>
              Tờ trình 3413/TTr/HS/PMH/0126 — Mua lốp xe thường xuyên HT HSH
            </div>
            <div style={{ fontSize:12, color:'var(--ink3)' }}>
              Hiệu lực 01/01/2026 – 30/06/2026 · <strong>LỐP XE VIỆT</strong> (Maxxis) & <strong>ALPHA</strong> (Bridgestone/DRC)
            </div>
          </div>
          {TIRE_CATALOG.map(t => (
            <div key={t.id} style={{ ...S.card, marginBottom:8 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontWeight:700, fontSize:14, color:'var(--ink)' }}>{t.size}</span>
                  <span style={S.badge(t.boBo==='kem'?'blu':'grn')}>Bố {t.boBo}</span>
                </div>
                <span style={{ fontSize:11, color:'var(--ink3)' }}>SL 6T: <strong style={{ color:'var(--ink)' }}>{t.sl6T}</strong> lốp</span>
              </div>
              <div style={{ fontSize:12, color:'var(--ink3)', marginBottom:10 }}>🚛 {t.loaiXe}</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {[t.p1, t.p2].map((p, pi) => (
                  <div key={pi} style={{ padding:'10px 12px', background:'var(--bg-secondary)',
                    borderRadius:8, border:`1px solid ${pi===0?'rgba(26,127,55,.25)':'var(--sep)'}` }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
                      <span style={S.badge(pi===0?'grn':'gray')}>Ưu tiên {pi+1}</span>
                      <span style={{ fontSize:12, fontWeight:600, color:'var(--ink)' }}>{p.ncc}</span>
                    </div>
                    <div style={{ fontSize:11, color:'var(--ink3)', marginBottom:6 }}>{p.hang} · {p.xuatXu}</div>
                    <div style={{ display:'flex', gap:12, fontSize:12 }}>
                      <div><span style={{ color:'var(--ink3)' }}>TĐP: </span><span style={{ fontWeight:500 }}>{p.tdp.toLocaleString('vi-VN')}đ</span></div>
                      <div><span style={{ color:'var(--ink3)' }}>SĐP: </span><span style={{ fontWeight:700, color:'var(--brand)' }}>{p.sdp.toLocaleString('vi-VN')}đ</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TIRE MODAL ──────────────────────────────────────────────────── */}
      {tireModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:999 }}
          onClick={() => setTireModal(null)}>
          <div style={{ ...S.card, width:300, boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight:700, fontSize:14, color:'var(--ink)', marginBottom:14 }}>
              Lốp {tireModal.pos} — {POS_LABELS[tireModal.pos]}
            </div>
            {[
              { key:'kmLapDat', label:'KM lúc lắp đặt' },
              { key:'loai', label:'Loại lốp (nylon / kem)' },
              { key:'ngayLap', label:'Ngày lắp (dd/mm/yyyy)' },
              { key:'thuongHieu', label:'Thương hiệu' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom:10 }}>
                <div style={{ fontSize:11, color:'var(--ink3)', marginBottom:3 }}>{f.label}</div>
                <input defaultValue={tireModal.data?.[f.key] || (f.key==='kmLapDat' && tireFromOcr ? tireFromOcr.km : '') || ''}
                  onChange={e => {
                    setTireData(prev => {
                      const next = { ...prev, [tireModal.ve]: { ...(prev[tireModal.ve]||{}),
                        [tireModal.pos]: { ...(prev[tireModal.ve]?.[tireModal.pos]||{}), [f.key]: e.target.value }}}
                      return next
                    })
                  }}
                  style={{ width:'100%', padding:'6px 10px', borderRadius:6, fontSize:12,
                    border:'1px solid var(--sep)', background:'var(--bg)',
                    color:'var(--ink)', outline:'none' }}
                  onFocus={e => e.target.style.borderColor='var(--brand)'}
                  onBlur={e => e.target.style.borderColor='var(--sep)'}/>
              </div>
            ))}
            <div style={{ display:'flex', gap:8, marginTop:14 }}>
              <button onClick={() => setTireModal(null)}
                style={{ flex:1, padding:8, borderRadius:8, border:'1px solid var(--sep)',
                  background:'transparent', color:'var(--ink3)', cursor:'pointer', fontSize:13 }}>
                Đóng
              </button>
              <button onClick={() => setTireModal(null)}
                style={{ flex:1, padding:8, borderRadius:8, border:'none',
                  background:'var(--brand)', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:600 }}>
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
