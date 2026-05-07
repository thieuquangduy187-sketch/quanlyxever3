// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📁 FRONTEND — quanlyxever3/src/pages/XeDetail.jsx
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { useState, useEffect, useCallback } from 'react'
import { getXeDetail, getImagesFromFolder } from '../api'
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
import { fmtCur } from '../hooks/useCharts'
import useIsMobile from '../hooks/useIsMobile'

// ── LIGHTBOX ──────────────────────────────────────────────────────────────────
function Lightbox({ imgs, idx, onClose }) {
  const [cur, setCur] = useState(idx)
  useEffect(() => {
    const handler = e => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft')  setCur(c => (c - 1 + imgs.length) % imgs.length)
      if (e.key === 'ArrowRight') setCur(c => (c + 1) % imgs.length)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [imgs, onClose])

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.93)',
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      {/* Prev */}
      <button onClick={e => { e.stopPropagation(); setCur(c => (c-1+imgs.length)%imgs.length) }}
        style={{ position:'fixed', left:14, top:'50%', transform:'translateY(-50%)', background:'rgba(255,255,255,.12)', border:'none', color:'#fff', fontSize:24, width:44, height:44, borderRadius:'50%', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
      {/* Image */}
      <img src={imgs[cur]} alt="" onClick={e => e.stopPropagation()}
        style={{ maxWidth:'90vw', maxHeight:'90vh', objectFit:'contain', borderRadius:8, boxShadow:'0 20px 60px rgba(0,0,0,.5)' }} />
      {/* Next */}
      <button onClick={e => { e.stopPropagation(); setCur(c => (c+1)%imgs.length) }}
        style={{ position:'fixed', right:14, top:'50%', transform:'translateY(-50%)', background:'rgba(255,255,255,.12)', border:'none', color:'#fff', fontSize:24, width:44, height:44, borderRadius:'50%', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>
      {/* Close */}
      <button onClick={onClose} style={{ position:'fixed', top:16, right:20, background:'rgba(255,255,255,.1)', border:'none', color:'#fff', fontSize:22, width:38, height:38, borderRadius:'50%', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
      {/* Counter */}
      <div style={{ position:'fixed', bottom:16, left:'50%', transform:'translateX(-50%)', color:'rgba(255,255,255,.5)', fontSize:12 }}>
        {cur+1} / {imgs.length} · ESC để đóng · ← → chuyển ảnh
      </div>
    </div>
  )
}

// ── GALLERY ───────────────────────────────────────────────────────────────────
function Gallery({ hinhAnh, isMobile = false }) {
  const [imgs, setImgs] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const [lightbox, setLightbox] = useState(null) // index or null

  useEffect(() => {
    if (!hinhAnh) return
    const isFolder = hinhAnh.includes('/drive/folders/')
    if (isFolder) {
      setLoading(true)
      getImagesFromFolder(hinhAnh)
        .then(urls => { setImgs(urls || []); setLoading(false) })
        .catch(() => setLoading(false))
    } else {
      // Parse comma/newline separated file links
      const parts = hinhAnh.split(/[,;\n\r]+/).map(s => s.trim()).filter(s => s.length > 10)
      const urls = parts.map(u => {
        const m = u.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
        if (m) return `https://lh3.googleusercontent.com/d/${m[1]}`
        if (u.includes('lh3.googleusercontent')) return u
        return u
      })
      setImgs(urls)
    }
  }, [hinhAnh])

  if (loading) return (
    <div style={{ background:'#111', borderRadius:14, height:360, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, color:'rgba(255,255,255,.5)' }}>
      <div style={{ width:28, height:28, border:'3px solid rgba(255,255,255,.15)', borderTopColor:'var(--apple-red)', borderRadius:'50%', animation:'spin .65s linear infinite' }} />
      <div style={{ fontSize:13 }}>Đang tải ảnh từ Drive...</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!imgs.length) return (
    <div style={{ background:'#111', borderRadius:14, height:360, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, color:'rgba(255,255,255,.4)' }}>
      <div style={{ fontSize:48 }}>🚛</div>
      <div style={{ fontSize:13 }}>Chưa có hình ảnh</div>
      <div style={{ fontSize:11, opacity:.6 }}>Thêm link ảnh vào cột "Hình ảnh" trong Sheet</div>
    </div>
  )

  return (
    <>
      {lightbox !== null && <Lightbox imgs={imgs} idx={lightbox} onClose={() => setLightbox(null)} />}
      {/* Main image */}
      <div onClick={() => setLightbox(activeIdx)}
        style={{ position:'relative', borderRadius:14, overflow:'hidden', background:'#111', width:'100%', height: isMobile ? 260 : 360, cursor:'zoom-in', marginBottom:10, flexShrink:0 }}>
        <img src={imgs[activeIdx]} alt=""
          style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center', display:'block' }} />
        <div style={{ position:'absolute', bottom:12, right:12, background:'rgba(0,0,0,.55)', color:'#fff', fontSize:11, padding:'4px 10px', borderRadius:20, pointerEvents:'none' }}>
          🔍 Click để phóng to
        </div>
        <div style={{ position:'absolute', bottom:12, left:12, background:'rgba(0,0,0,.55)', color:'#fff', fontSize:11, padding:'4px 10px', borderRadius:20, pointerEvents:'none' }}>
          {activeIdx + 1} / {imgs.length}
        </div>
      </div>
      {/* Thumbnails */}
      {imgs.length > 1 && (
        <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4 }}>
          {imgs.map((url, i) => (
            <div key={i} onClick={() => setActiveIdx(i)}
              style={{ width: isMobile ? 68 : 88, height: isMobile ? 48 : 60, flexShrink:0, borderRadius:8, overflow:'hidden', cursor:'pointer', border:`2px solid ${i===activeIdx?'var(--apple-red)':'transparent'}`, transition:'border .15s', background:'#ddd' }}>
              <img src={url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            </div>
          ))}
        </div>
      )}
    </>
  )
}

// ── INFO ROW ──────────────────────────────────────────────────────────────────
function InfoRow({ label, value, money, tag }) {
  if (!value && value !== 0) return null
  if (value === '0' || value === 'NaN' || value === 'null') return null
  return (
    <div style={{ display:'flex', padding:'7px 14px', gap:10, borderBottom:'0.5px solid var(--sep)' }}>
      <div style={{ fontSize:11.5, color:'var(--label-secondary)', minWidth:120, flexShrink:0, paddingTop:1 }}>{label}</div>
      <div style={{ fontSize:12.5, fontWeight:500, color: money ? 'var(--apple-red)' : '#1C1C1C', flex:1, wordBreak:'break-word', minWidth:0 }}>
        {tag ? <span style={{ background:tag.bg, color:tag.color, fontWeight:600, fontSize:10.5, padding:'2px 7px', borderRadius:4 }}>{value}</span> : value}
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ background:'var(--bg-card)', border:'0.5px solid var(--sep)', borderRadius:14, overflow:'hidden', marginBottom:12 }}>
      <div style={{ fontSize:10.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--label-secondary)', padding:'12px 16px 0' }}>{title}</div>
      <div style={{ paddingBottom:6 }}>{children}</div>
    </div>
  )
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
const API_BASE_FETCH = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const authFetch = (path, opts = {}) => fetch(`${API_BASE_FETCH}${path}`, {
  ...opts,
  headers: { Authorization: `Bearer ${localStorage.getItem('hsg_token') || ''}`, 'Content-Type': 'application/json', ...(opts.headers||{}) }
})

// ── Đăng kiểm Tab ─────────────────────────────────────────
const DK_FIELDS = [
  { group: 'Đăng ký', fields: [
    { k:'bienSo',         label:'Biển số' },
    { k:'ngayDangKy',     label:'Ngày đăng ký' },
    { k:'soSoKiemDinh',   label:'Số sổ kiểm định' },
    { k:'soSoQuanLy',     label:'Số sổ quản lý' },
    { k:'chuPhuongTien',  label:'Chủ phương tiện' },
    { k:'diaChiChu',      label:'Địa chỉ chủ PT' },
  ]},
  { group: 'Kỹ thuật', fields: [
    { k:'loaiPhuongTien',  label:'Loại phương tiện' },
    { k:'nhanHieu',        label:'Nhãn hiệu' },
    { k:'soLoai',          label:'Số loại / Model' },
    { k:'soKhung',         label:'Số khung' },
    { k:'soMay',           label:'Số máy' },
    { k:'namSanXuat',      label:'Năm sản xuất' },
    { k:'noiSanXuat',      label:'Nơi sản xuất' },
  ]},
  { group: 'Trọng tải', fields: [
    { k:'taiTrongThietKe',   label:'Tải trọng TK (kg)' },
    { k:'trongLuongBanThan', label:'Trọng lượng bản thân (kg)' },
    { k:'soNguoi',           label:'Số người cho phép chở' },
    { k:'taiTrongKeo',       label:'Tải trọng kéo TK (kg)' },
  ]},
  { group: 'Kích thước', fields: [
    { k:'kichThuocBao',   label:'Kích thước bao (DxRxC mm)' },
    { k:'kichThuocThung', label:'Kích thước thùng (DxRxC mm)' },
    { k:'chieuDaiCoSo',   label:'Chiều dài cơ sở (mm)' },
    { k:'congThucBanhXe', label:'Công thức bánh xe' },
    { k:'vetBanhXe',      label:'Vết bánh xe (mm)' },
  ]},
  { group: 'Động cơ & lốp', fields: [
    { k:'nhienLieu',   label:'Nhiên liệu' },
    { k:'dungTich',    label:'Dung tích (cm³)' },
    { k:'congSuat',    label:'Công suất (kW/rpm)' },
    { k:'soLop',       label:'Số lốp theo cầu' },
    { k:'coLop',       label:'Cỡ lốp theo cầu' },
  ]},
  { group: 'Phí kiểm định', fields: [
    { k:'ngayNopPhi',     label:'Ngày nộp phí' },
    { k:'donViThuPhi',    label:'Đơn vị thu phí' },
    { k:'soBienLai',      label:'Số biên lai' },
    { k:'phiDenHetNgay',  label:'Phí nộp đến hết ngày' },
  ]},
]

function DangKiemTab({ bienSo }) {
  const [dk, setDk]           = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr]         = useState('')
  const [editHistory, setEditHistory] = useState(false)
  const [historyDraft, setHistoryDraft] = useState([])
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    if (!bienSo) return
    const bs = bienSo.replace(/[\s.]/g,'')
    authFetch(`/api/dang-kiem/${encodeURIComponent(bs)}`)
      .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)))
      .then(d => { setDk(d); setHistoryDraft(d.lichSuKD || []) })
      .catch(e => setErr(e.error || 'Chưa có dữ liệu đăng kiểm cho xe này'))
      .finally(() => setLoading(false))
  }, [bienSo])

  const saveHistory = async () => {
    setSaving(true)
    try {
      const bs = bienSo.replace(/[\s.]/g,'')
      const r  = await authFetch(`/api/dang-kiem/${encodeURIComponent(bs)}/history`, {
        method: 'PUT', body: JSON.stringify({ lichSuKD: historyDraft })
      })
      const d = await r.json()
      setDk(d); setEditHistory(false)
    } catch (e) { alert('Lỗi: ' + e.message) }
    setSaving(false)
  }

  const downloadExcel = () => {
    const url = `${API_BASE_FETCH}/api/dang-kiem/export/excel`
    const a   = document.createElement('a')
    a.href = url; a.setAttribute('download','dang_kiem_xetai.xlsx'); a.click()
  }

  const row = (label, val) => (
    <div key={label} style={{ display:'flex', padding:'6px 14px', gap:10, borderBottom:'0.5px solid var(--sep)' }}>
      <div style={{ fontSize:11.5, color:'var(--label-secondary)', minWidth:170, flexShrink:0, paddingTop:1 }}>{label}</div>
      <div style={{ fontSize:12.5, fontWeight:500, color: val && val !== '-' ? '#1C1C1C' : '#ABABAB', flex:1 }}>{val || '-'}</div>
    </div>
  )

  if (loading) return <div style={{ padding:24, color:'var(--label-secondary)', fontSize:13 }}>Đang tải...</div>

  if (err) return (
    <div style={{ padding:24 }}>
      <div style={{ background:'rgba(255,59,48,.06)', border:'0.5px solid rgba(255,59,48,.2)', borderRadius:10, padding:16, color:'var(--apple-red)', fontSize:13, marginBottom:14 }}>
        {err}
      </div>
      <div style={{ fontSize:12, color:'var(--label-secondary)', lineHeight:1.8 }}>
        Để import dữ liệu đăng kiểm, chạy script:<br/>
        <code style={{ background:'#F5F3EF', padding:'2px 8px', borderRadius:5, fontSize:11, display:'block', marginTop:6 }}>
          JWT_TOKEN=... node src/scripts/importDangKiem.js /path/to/html_folder
        </code>
      </div>
    </div>
  )

  if (!dk) return null

  // Thời hạn KĐ — màu theo ngày còn lại
  const parseDate = s => { const p=(s||'').split('/'); return p.length===3?new Date(`${p[2]}-${p[1]}-${p[0]}`):null }
  const hanDate   = parseDate(dk.thoiHanKDHienTai)
  const daysLeft  = hanDate ? Math.ceil((hanDate - new Date()) / 86400000) : null
  const hanColor  = daysLeft === null ? 'var(--label-secondary)' : daysLeft < 0 ? 'var(--apple-red)' : daysLeft < 30 ? 'var(--apple-orange)' : 'var(--apple-green)'

  return (
    <div>
      {/* Banner thời hạn KĐ */}
      <div style={{ margin:'0 0 14px', padding:'12px 14px', background:'var(--bg-card)', border:'0.5px solid var(--sep)', borderRadius:12, display:'flex', alignItems:'center', gap:12, justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:11, color:'var(--label-secondary)', marginBottom:3 }}>Thời hạn kiểm định hiện tại</div>
          <div style={{ fontSize:18, fontWeight:700, color:hanColor }}>{dk.thoiHanKDHienTai || '-'}</div>
          {daysLeft !== null && (
            <div style={{ fontSize:11, color:hanColor, marginTop:2 }}>
              {daysLeft < 0 ? `Đã hết hạn ${Math.abs(daysLeft)} ngày` : `Còn ${daysLeft} ngày`}
            </div>
          )}
        </div>
        <button onClick={downloadExcel} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', border:'0.5px solid var(--sep)', borderRadius:8, background:'transparent', cursor:'pointer', fontSize:12, color:'var(--apple-green)', fontFamily:'inherit' }}>
          ↓ Excel 290 xe
        </button>
      </div>

      {/* Thông tin theo nhóm */}
      {DK_FIELDS.map(grp => (
        <div key={grp.group} style={{ background:'var(--bg-card)', border:'0.5px solid var(--sep)', borderRadius:12, overflow:'hidden', marginBottom:10 }}>
          <div style={{ fontSize:10.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--label-secondary)', padding:'10px 14px 0' }}>{grp.group}</div>
          <div style={{ paddingBottom:4 }}>
            {grp.fields.map(f => row(f.label, dk[f.k]))}
          </div>
        </div>
      ))}

      {/* Lịch sử kiểm định — chỉ 2 field */}
      <div style={{ background:'var(--bg-card)', border:'0.5px solid var(--sep)', borderRadius:12, overflow:'hidden', marginBottom:10 }}>
        <div style={{ fontSize:10.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--label-secondary)', padding:'10px 14px 0' }}>
          Lịch sử kiểm định
        </div>
        <div style={{ display:'flex', gap:0, padding:'8px 0 4px' }}>
          <div style={{ flex:1, padding:'6px 14px', borderBottom:'0.5px solid var(--sep)' }}>
            <div style={{ fontSize:11, color:'var(--label-secondary)', marginBottom:3 }}>Ngày KĐ gần nhất</div>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--label-primary)' }}>{dk.ngayKDGanNhat || '-'}</div>
          </div>
          <div style={{ flex:1, padding:'6px 14px', borderBottom:'0.5px solid var(--sep)', borderLeft:'0.5px solid var(--sep)' }}>
            <div style={{ fontSize:11, color:'var(--label-secondary)', marginBottom:3 }}>Thời hạn KĐ hiện tại</div>
            <div style={{ fontSize:13, fontWeight:600, color:hanColor }}>{dk.thoiHanKDHienTai || '-'}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Chứng nhận Kiểm định — render giống PDF gốc ──────────
function GiayChungNhanKD({ dk }) {
  if (!dk) return null

  const parseDate = s => { const p=(s||'').split('/'); return p.length===3?new Date(`${p[2]}-${p[1]}-${p[0]}`):null }
  const hanDate   = parseDate(dk.thoiHanKDHienTai)
  const daysLeft  = hanDate ? Math.ceil((hanDate - new Date()) / 86400000) : null
  const hanColor  = daysLeft === null ? 'var(--label-secondary)' : daysLeft < 0 ? 'var(--apple-red)' : daysLeft < 30 ? 'var(--apple-orange)' : 'var(--apple-green)'

  // Tìm lần KĐ hiện tại (gần hôm nay nhất)
  const currentKD = (dk.lichSuKD || []).find(l => l.ngayKD === dk.ngayKDGanNhat) || dk.lichSuKD?.[0]

  const row = (label, val, labelEn) => (
    <div style={{ display:'grid', gridTemplateColumns:'180px 1fr', gap:4, padding:'4px 0', borderBottom:'0.5px solid var(--sep)', alignItems:'center' }}>
      <div>
        <div style={{ fontSize:11, color:'var(--label-secondary)' }}>{label}</div>
        {labelEn && <div style={{ fontSize:9.5, color:'#ABABAB', fontStyle:'italic' }}>{labelEn}</div>}
      </div>
      <div style={{ fontSize:12, fontWeight:500, color: val && val!=='-' ? 'var(--label-primary)' : '#ABABAB' }}>{val || '-'}</div>
    </div>
  )

  // Parse lốp thành dạng "Cầu 1 · 2 lốp · 9.00-20"
  const lopChips = () => {
    const so = (dk.soLop || '').split(';').map(s=>s.trim())
    const co = (dk.coLop || '').split(';').map(s=>s.trim())
    const len = Math.max(so.length, co.length)
    if (!len || (!so[0] && !co[0])) return null
    return Array.from({length:len}, (_,i) => ({
      cau: `Cầu ${i+1}`, soLop: so[i]||'?', coLop: co[i]||'?'
    }))
  }
  const chips = lopChips()

  return (
    <div style={{ border:'0.5px solid var(--sep)', borderRadius:12, overflow:'hidden', background:'var(--bg-card)', marginBottom:12 }}>
      {/* Header trạm */}
      <div style={{ background:'var(--bg-grouped)', padding:'10px 14px', borderBottom:'0.5px solid var(--sep)', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <div style={{ fontWeight:600, fontSize:13 }}>Cơ sở đăng kiểm {currentKD?.tramKD || dk.donViThuPhi || '-'}</div>
          <div style={{ fontSize:10, color:'var(--label-secondary)', fontStyle:'italic', marginTop:1 }}>Periodical Technical Inspection Station</div>
        </div>
        <div style={{ textAlign:'right', fontSize:11, color:'var(--label-secondary)', lineHeight:1.7 }}>
          <div>Ngày KĐ: <strong style={{ color:'var(--label-primary)' }}>{currentKD?.ngayKD || '-'}</strong></div>
          <div>Số phiếu: <strong style={{ color:'var(--label-primary)' }}>{currentKD?.soPhieu || '-'}</strong></div>
        </div>
      </div>

      {/* Tiêu đề */}
      <div style={{ padding:'10px 14px', textAlign:'center', borderBottom:'0.5px solid var(--sep)' }}>
        <div style={{ fontWeight:600, fontSize:13, color:'var(--apple-blue)', lineHeight:1.5 }}>
          CHỨNG NHẬN KIỂM ĐỊNH AN TOÀN KỸ THUẬT VÀ BẢO VỆ MÔI TRƯỜNG XE CƠ GIỚI
        </div>
        <div style={{ fontSize:10, color:'var(--label-secondary)', fontStyle:'italic', marginTop:2 }}>
          Periodical Inspection Certificate of Motor Vehicle for Compliance with Technical Safety and Environmental Protection Requirements
        </div>
      </div>

      {/* Biển số + số quản lý */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', padding:'8px 14px', borderBottom:'0.5px solid var(--sep)', gap:12 }}>
        <div>
          <div style={{ fontSize:10, color:'var(--label-secondary)' }}>Biển đăng ký <span style={{ fontStyle:'italic' }}>(Registration plate)</span></div>
          <div style={{ fontSize:20, fontWeight:700, letterSpacing:'.05em', color:'var(--apple-blue)', marginTop:2 }}>{dk.bienSo || '-'}</div>
        </div>
        <div>
          <div style={{ fontSize:10, color:'var(--label-secondary)' }}>Số quản lý phương tiện <span style={{ fontStyle:'italic' }}>(Vehicle inspection No.)</span></div>
          <div style={{ fontSize:13, fontWeight:600, marginTop:2 }}>{dk.soSoQuanLy || '-'}</div>
        </div>
      </div>

      {/* Thông số kỹ thuật */}
      <div style={{ padding:'8px 14px', borderBottom:'0.5px solid var(--sep)' }}>
        <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-secondary)', marginBottom:8 }}>
          Thông số kỹ thuật — Specifications
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
          <div>
            {row('Loại phương tiện', dk.loaiPhuongTien, 'Vehicle type')}
            {row('Nhãn hiệu', dk.nhanHieu, 'Trademark')}
            {row('Số loại / Model', dk.soLoai, 'Model code')}
            {row('Số khung', dk.soKhung, 'Chassis No.')}
            {row('Số máy', dk.soMay, 'Engine No.')}
            {row('Năm sản xuất', dk.namSanXuat, 'Production year')}
            {row('Nơi sản xuất', dk.noiSanXuat, 'Production country')}
          </div>
          <div>
            {row('KL toàn bộ TK/CPLN (kg)', dk.taiTrongThietKe ? `${dk.taiTrongThietKe} / ${dk.taiTrongThietKe}` : '-', 'Max. total mass: Designed/Authorized')}
            {row('KL bản thân / Kerb (kg)', dk.trongLuongBanThan, 'Kerb mass')}
            {row('Tải trọng thiết kế (kg)', dk.taiTrongThietKe, 'Max. cargo payload')}
            {row('Số người cho phép chở', dk.soNguoi, 'Passenger capacity')}
            {row('Kích thước bao (mm)', dk.kichThuocBao, 'Overall dimensions')}
            {row('Kích thước thùng (mm)', dk.kichThuocThung, 'Cargo dimensions')}
            {row('Chiều dài cơ sở (mm)', dk.chieuDaiCoSo, 'Wheel space')}
          </div>
        </div>
      </div>

      {/* Động cơ */}
      <div style={{ padding:'8px 14px', borderBottom:'0.5px solid var(--sep)' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
          <div>
            {row('Loại nhiên liệu', dk.nhienLieu, 'Fuel')}
            {row('Dung tích làm việc (cm³)', dk.dungTich, 'Engine displacement')}
          </div>
          <div>
            {row('Công suất / Số vòng quay', dk.congSuat, 'Max.output/rpm')}
            {row('Công thức bánh xe', dk.congThucBanhXe, 'Drive configuration')}
          </div>
        </div>
      </div>

      {/* Lốp xe */}
      {chips && (
        <div style={{ padding:'8px 14px', borderBottom:'0.5px solid var(--sep)' }}>
          <div style={{ fontSize:10, color:'var(--label-secondary)', marginBottom:6 }}>
            Số lượng lốp / cỡ lốp / trục — <span style={{ fontStyle:'italic' }}>The number of tires / tire size / axle</span>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {chips.map((c,i) => (
              <span key={i} style={{ padding:'3px 10px', background:'var(--bg-grouped)', border:'0.5px solid var(--sep)', borderRadius:20, fontSize:11, color:'var(--label-secondary)' }}>
                <strong style={{ color:'var(--label-primary)' }}>{c.cau}</strong> · {c.soLop} lốp · {c.coLop}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Phí kiểm định */}
      <div style={{ padding:'8px 14px', borderBottom:'0.5px solid var(--sep)' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
          <div>
            {row('Ngày nộp phí', dk.ngayNopPhi)}
            {row('Số biên lai', dk.soBienLai)}
          </div>
          <div>
            {row('Đơn vị thu phí', dk.donViThuPhi)}
            {row('Phí nộp đến hết ngày', dk.phiDenHetNgay)}
          </div>
        </div>
      </div>

      {/* Số tem + lịch sử */}
      <div style={{ padding:'8px 14px', borderBottom:'0.5px solid var(--sep)' }}>
        <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-secondary)', marginBottom:8 }}>
          Lịch sử kiểm định
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11.5 }}>
          <thead>
            <tr>
              {['Trạm KĐ','Số phiếu','Ngày KĐ','Lần KĐ','Số tem GCN','Thời hạn KĐ'].map(h => (
                <th key={h} style={{ textAlign:'left', padding:'4px 8px', fontSize:10, textTransform:'uppercase', letterSpacing:'.05em', color:'var(--label-secondary)', borderBottom:'0.5px solid var(--sep)', fontWeight:600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(dk.lichSuKD || []).length === 0
              ? <tr><td colSpan={6} style={{ padding:'10px 8px', color:'#ABABAB', fontStyle:'italic', fontSize:12 }}>Chưa có lịch sử</td></tr>
              : (dk.lichSuKD || []).map((l, i) => {
                const isCurrent = l.ngayKD === dk.ngayKDGanNhat
                return (
                  <tr key={i} style={{ background: isCurrent ? 'rgba(52,199,89,.07)' : undefined }}>
                    {[l.tramKD, l.soPhieu, l.ngayKD, l.lanKD||'-', l.soTem||'-', l.thoiHanKD||'-'].map((v,j) => (
                      <td key={j} style={{ padding:'5px 8px', borderBottom:'0.5px solid var(--sep)', fontWeight: isCurrent&&j===5?700:400, color: isCurrent&&j===5?hanColor:undefined }}>{v}</td>
                    ))}
                  </tr>
                )
              })
            }
          </tbody>
        </table>
      </div>

      {/* Footer — thời hạn hiện tại */}
      <div style={{ padding:'10px 14px', background: daysLeft !== null && daysLeft < 0 ? 'rgba(255,59,48,.08)' : 'rgba(52,199,89,.08)', display:'flex', alignItems:'center', gap:10, justifyContent:'space-between' }}>
        <div>
          <span style={{ fontSize:12, color:'var(--label-secondary)' }}>Chứng nhận có hiệu lực đến hết ngày </span>
          <span style={{ fontWeight:700, fontSize:13, color:hanColor }}>{dk.thoiHanKDHienTai || '-'}</span>
          {daysLeft !== null && (
            <span style={{ fontSize:11, color:hanColor, marginLeft:8 }}>
              ({daysLeft < 0 ? `Hết hạn ${Math.abs(daysLeft)} ngày` : `Còn ${daysLeft} ngày`})
            </span>
          )}
        </div>
        {currentKD?.soTem && (
          <span style={{ fontSize:11, color:'var(--label-secondary)' }}>Số tem: <strong>{currentKD.soTem}</strong></span>
        )}
      </div>
    </div>
  )
}

function DangKiemGCNTab({ bienSo }) {
  const [dk, setDk]           = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr]         = useState('')

  useEffect(() => {
    if (!bienSo) return
    const bs = bienSo.replace(/[\s.]/g,'')
    authFetch(`/api/dang-kiem/${encodeURIComponent(bs)}`)
      .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)))
      .then(d => setDk(d))
      .catch(e => setErr(e.error || 'Chưa có dữ liệu đăng kiểm'))
      .finally(() => setLoading(false))
  }, [bienSo])

  if (loading) return <div style={{ padding:24, color:'var(--label-secondary)', fontSize:13 }}>Đang tải...</div>
  if (err)     return <div style={{ padding:24, fontSize:13, color:'var(--apple-red)' }}>{err}</div>
  return <GiayChungNhanKD dk={dk} />
}

export default function XeDetail() {
  const [xe, setXe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('info')  // 'info' | 'dkd'
  const isMobile = useIsMobile()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('id')

    // 1. Thử localStorage trước (data được set bởi PageXeTai khi click biển số)
    // KHÔNG xóa ngay — React StrictMode chạy useEffect 2 lần, lần 2 cần fallback URL
    // Chỉ dùng localStorage nếu trùng với id trên URL (tránh load nhầm xe cũ)
    try {
      const raw = localStorage.getItem('xe_detail_data')
      if (raw) {
        const d = JSON.parse(raw)
        const storedId = String(d.maTaiSan || d.bienSo || '')
        const urlId    = String(id || '')
        // Chỉ dùng nếu id khớp hoặc không có id trên URL
        if (!urlId || storedId === urlId || encodeURIComponent(storedId) === urlId) {
          // Clear sau 3s để không ảnh hưởng lần mở tiếp theo
          setTimeout(() => localStorage.removeItem('xe_detail_data'), 3000)
          setXe(d)
          setLoading(false)
          document.title = `${d.bienSo} — Chi tiết xe`
          return
        }
      }
    } catch(e) {}

    // 2. Fallback: fetch từ API bằng ?id= trên URL
    if (!id) {
      setError('Không có mã tài sản. Vui lòng mở từ bảng danh sách xe.')
      setLoading(false)
      return
    }
    getXeDetail(id)
      .then(d => {
        setXe(d)
        setLoading(false)
        document.title = `${d.bienSo || id} — Chi tiết xe`
      })
      .catch(e => {
        setError('Lỗi tải dữ liệu: ' + e.message)
        setLoading(false)
      })
  }, [])

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', gap:14, background:'var(--bg-grouped)', fontFamily:"'Be Vietnam Pro',sans-serif" }}>
      <div style={{ fontSize:28, fontWeight:700, color:'var(--apple-blue)' }}>HSG</div>
      <div style={{ width:30, height:30, border:'3px solid #E6E2DC', borderTopColor:'var(--apple-red)', borderRadius:'50%', animation:'spin .65s linear infinite' }} />
      <div style={{ color:'var(--label-secondary)', fontSize:13 }}>Đang tải thông tin xe...</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (error) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', gap:12, background:'var(--bg-grouped)', fontFamily:"'Be Vietnam Pro',sans-serif" }}>
      <div style={{ fontSize:44 }}>🔍</div>
      <div style={{ fontSize:16, fontWeight:600 }}>Không tìm thấy dữ liệu</div>
      <div style={{ fontSize:13, color:'var(--label-secondary)', maxWidth:360, textAlign:'center' }}>{error}</div>
      <button onClick={() => window.close()} style={{ marginTop:8, padding:'8px 18px', borderRadius:8, border:'none', background:'var(--apple-red)', color:'#fff', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>← Đóng tab</button>
    </div>
  )

  if (!xe) return null

  const mienStyle = {
    'Miền Nam':   { bg:'rgba(255,59,48,0.1)', color:'var(--apple-blue)' },
    'Miền Bắc':   { bg:'rgba(90,200,250,0.1)', color:'var(--apple-teal)' },
    'Miền Trung': { bg:'rgba(255,204,0,0.1)', color:'var(--apple-orange)' },
  }[xe.mien] || { bg:'#F5F3EF', color:'var(--label-secondary)' }

  return (
    <div style={{ background:'var(--bg-grouped)', minHeight:'100vh', fontFamily:"'Be Vietnam Pro',sans-serif" }}>
      {/* Topbar */}
      <div style={{ background:'rgba(0,0,0,0.85)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)', height:52, display:'flex', alignItems:'center', padding: isMobile ? '0 12px' : '0 24px', gap: isMobile ? 8 : 14, position:'sticky', top:0, zIndex:100 }}>
        <button onClick={() => window.close()}
          style={{ display:'flex', alignItems:'center', gap:6, color:'rgba(255,255,255,.6)', fontSize:12.5, cursor:'pointer', border:'none', background:'none', fontFamily:'inherit', padding:'6px 10px', borderRadius:7 }}>
          ← Đóng
        </button>
        <div style={{ fontSize:16, fontWeight:700, color:'#fff', letterSpacing:.5, flex:1 }}>{xe.bienSo}</div>
        <div style={{ background:'var(--apple-red)', color:'#fff', fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20 }}>{xe.mien}</div>
      </div>

      {/* Content */}
      <div style={{ maxWidth:1200, margin:'0 auto', padding: isMobile ? '16px' : '28px 24px', display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0,1fr) 420px', gap: isMobile ? 16 : 32, alignItems:'start' }}>

        {/* LEFT: Gallery */}
        <div style={{ minWidth:0, overflow:'hidden' }}>
          <Gallery hinhAnh={xe.hinhAnh || ''} isMobile={isMobile} />
        </div>

        {/* RIGHT: Info */}
        <div>
          <div style={{ marginBottom:18 }}>
            <div style={{ fontSize: isMobile ? 20 : 26, fontWeight:700, letterSpacing:.5, lineHeight:1.2 }}>{xe.bienSo}</div>
            <div style={{ fontSize:13, color:'var(--label-secondary)', marginTop:4, lineHeight:1.5 }}>{xe.tenTaiSan}</div>
            <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginTop:10 }}>
              <span style={{ ...mienStyle, fontWeight:600, fontSize:11.5, padding:'4px 10px', borderRadius:20 }}>{xe.mien}</span>
              {xe.loaiThung && <span style={{ background:'var(--bg-grouped)', color:'var(--label-secondary)', border:'0.5px solid var(--sep)', fontWeight:600, fontSize:11.5, padding:'4px 10px', borderRadius:20 }}>{xe.loaiThung}</span>}
              {xe.loaiXe   && <span style={{ background:'var(--bg-grouped)', color:'var(--label-secondary)', border:'0.5px solid var(--sep)', fontWeight:600, fontSize:11.5, padding:'4px 10px', borderRadius:20 }}>{xe.loaiXe}</span>}
              {xe.hasTaiNan  ? <span style={{ background:'rgba(255,59,48,0.08)', color:'var(--apple-red)', fontWeight:600, fontSize:11.5, padding:'4px 10px', borderRadius:20 }}>⚠ Có tai nạn</span> : null}
              {xe.hasDieuDong ? <span style={{ background:'rgba(52,199,89,0.08)', color:'var(--apple-green)', fontWeight:600, fontSize:11.5, padding:'4px 10px', borderRadius:20 }}>🔄 Đã điều động</span> : null}
            </div>
          </div>

          {/* ── Tab bar ── */}
          <div style={{ display:'flex', gap:0, borderBottom:'0.5px solid var(--sep)', marginBottom:14 }}>
            {[['info','Thông tin xe'], ['dkd','Đăng kiểm']].map(([id, label]) => (
              <button key={id} onClick={() => setActiveTab(id)} style={{
                padding:'8px 16px', fontSize:12.5, fontWeight:activeTab===id ? 600 : 400,
                border:'none', background:'transparent', cursor:'pointer', fontFamily:'inherit',
                borderBottom:`2px solid ${activeTab===id ? 'var(--apple-blue)' : 'transparent'}`,
                color: activeTab===id ? 'var(--apple-blue)' : 'var(--label-secondary)',
                marginBottom:-1,
              }}>{label}</button>
            ))}
          </div>

          {/* ── Tab: Thông tin xe ── */}
          {activeTab === 'info' && (
            <>
              <Section title="Thông tin cơ bản">
                <InfoRow label="Biển số" value={xe.bienSo} />
                <InfoRow label="Mã TS kế toán" value={xe.maTaiSan} />
                <InfoRow label="Mã hiện tại" value={xe.maHienTai} />
                <InfoRow label="Tên tài sản" value={xe.tenTaiSan} />
                <InfoRow label="Loại thùng" value={xe.loaiThung} />
                <InfoRow label="Hãng xe" value={xe.loaiXe} />
                <InfoRow label="Tải trọng" value={xe.taiTrong ? xe.taiTrong + ' tấn' : null} />
                <InfoRow label="Năm sản xuất" value={xe.namSX && xe.namSX !== '0' ? xe.namSX : null} />
                <InfoRow label="Ngày đưa vào SD" value={xe.ngayDuaVaoSD} />
                <InfoRow label="Pháp nhân" value={xe.phapNhan} />
              </Section>

              <Section title="Vị trí & sử dụng">
                <InfoRow label="Cửa hàng SD" value={xe.cuaHang} />
                <InfoRow label="Tỉnh mới" value={xe.tinhMoi} />
                <InfoRow label="Tỉnh cũ" value={xe.tinhCu} />
                <InfoRow label="Tỉnh gộp" value={xe.tinhGop} />
                <InfoRow label="Miền" value={xe.mien} tag={mienStyle} />
              </Section>

              {(xe.nguyenGia || xe.gtcl) && (
                <Section title="Tài chính">
                  {xe.nguyenGia ? <InfoRow label="Nguyên giá" value={fmtCur(xe.nguyenGia)} money /> : null}
                  {xe.gtcl
                    ? <InfoRow label="GTCL" value={fmtCur(xe.gtcl)} money />
                    : xe.nguyenGia ? <InfoRow label="GTCL" value="Đã khấu hao hết" /> : null
                  }
                </Section>
              )}

              {(xe.dai || xe.rong || xe.cao) && (
                <Section title="Kích thước thùng xe">
                  {xe.dai  ? <InfoRow label="Dài (m)"  value={parseFloat(xe.dai).toFixed(2)} /> : null}
                  {xe.rong ? <InfoRow label="Rộng (m)" value={parseFloat(xe.rong).toFixed(2)} /> : null}
                  {xe.cao  ? <InfoRow label="Cao (m)"  value={parseFloat(xe.cao).toFixed(2)} /> : null}
                </Section>
              )}
            </>
          )}

          {/* ── Tab: Đăng kiểm ── */}
          {activeTab === 'dkd' && <DangKiemTab bienSo={xe.bienSo} />}
        </div>
      </div>

      {/* History — full width */}
      <div style={{ maxWidth:1200, margin:'0 auto', padding: isMobile ? '0 16px 24px' : '0 24px 32px', display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:12 }}>
        <div style={{ background:'var(--bg-card)', border:`1px solid ${xe.hasTaiNan?'#FCA5A5':'#E6E2DC'}`, borderRadius:14, padding:'14px 16px' }}>
          <div style={{ fontSize:10.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--label-secondary)', marginBottom:8 }}>⚠ Lịch sử tai nạn</div>
          <div style={{ fontSize:12.5, color: xe.lichSuTaiNan ? '#4A4A4A' : '#909090', lineHeight:1.75, fontStyle: xe.lichSuTaiNan ? 'normal' : 'italic', whiteSpace:'pre-wrap', wordBreak:'break-word' }}>
            {xe.lichSuTaiNan || 'Không có ghi nhận'}
          </div>
        </div>
        <div style={{ background:'var(--bg-card)', border:`1px solid ${xe.hasDieuDong?'#7DD3FC':'#E6E2DC'}`, borderRadius:14, padding:'14px 16px' }}>
          <div style={{ fontSize:10.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--label-secondary)', marginBottom:8 }}>🔄 Lịch sử điều động</div>
          <div style={{ fontSize:12.5, color: xe.cayDieuDong ? '#4A4A4A' : '#909090', lineHeight:1.75, fontStyle: xe.cayDieuDong ? 'normal' : 'italic', whiteSpace:'pre-wrap', wordBreak:'break-word' }}>
            {xe.cayDieuDong || 'Không có ghi nhận'}
          </div>
        </div>
      </div>
    </div>
  )
}
