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
export default function XeDetail() {
  const [xe, setXe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const isMobile = useIsMobile()

  // Đăng kiểm data
  const [kd, setKd]           = useState(null)
  const [kdLoading, setKdLoading] = useState(false)
  const [kdEdit, setKdEdit]   = useState(false)
  const [kdForm, setKdForm]   = useState({})
  const [kdSaving, setKdSaving] = useState(false)

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
          fetchKD(d.bienSo)
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
        // Fetch KD data sau khi có biển số
        fetchKD(d.bienSo || id)
      })
      .catch(e => {
        setError('Lỗi tải dữ liệu: ' + e.message)
        setLoading(false)
      })
  }, [])

  const fetchKD = useCallback((bienSo) => {
    if (!bienSo) return
    setKdLoading(true)
    const tok = localStorage.getItem('hsg_token') || ''
    const base = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    fetch(`${base}/api/xe-kd/${encodeURIComponent(bienSo)}`, {
      headers: { Authorization: `Bearer ${tok}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { setKd(d); if (d?.kdHienHanh) setKdForm(d.kdHienHanh) })
      .catch(() => {})
      .finally(() => setKdLoading(false))
  }, [])

  const saveKD = useCallback(async () => {
    if (!xe?.bienSo) return
    setKdSaving(true)
    const tok  = localStorage.getItem('hsg_token') || ''
    const base = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    try {
      const res = await fetch(`${base}/api/xe-kd/${encodeURIComponent(xe.bienSo)}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ kdHienHanh: kdForm }),
      })
      if (res.ok) { const d = await res.json(); setKd(d); setKdEdit(false) }
    } catch(e) { alert('Lỗi lưu: ' + e.message) }
    finally { setKdSaving(false) }
  }, [xe, kdForm])

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

          {/* ── ĐĂNG KIỂM ──────────────────────────────────── */}
          {kdLoading && (
            <div style={{ background:'var(--bg-card)', border:'0.5px solid var(--sep)', borderRadius:14, padding:'14px 16px', marginBottom:12, color:'var(--label-secondary)', fontSize:12 }}>
              Đang tải dữ liệu đăng kiểm...
            </div>
          )}
          {!kdLoading && kd && (
            <div style={{ background:'var(--bg-card)', border:'0.5px solid var(--sep)', borderRadius:14, overflow:'hidden', marginBottom:12 }}>
              {/* Header */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px 0' }}>
                <div style={{ fontSize:10.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--label-secondary)' }}>
                  Chứng nhận kiểm định
                </div>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  {kd.kdHienHanh?.thoiHanKD && (() => {
                    const [d,m,y] = (kd.kdHienHanh.thoiHanKD).split('/')
                    const diff = Math.ceil((new Date(`${y}-${m}-${d}`) - new Date()) / 86400000)
                    const clr  = diff < 0 ? '#FF3B30' : diff <= 30 ? '#FF9500' : '#34C759'
                    return <span style={{ fontSize:11, fontWeight:600, color:clr, background:`${clr}18`, padding:'2px 8px', borderRadius:20 }}>
                      {diff < 0 ? 'Hết hạn' : diff <= 30 ? `Còn ${diff} ngày` : `Đến ${kd.kdHienHanh.thoiHanKD}`}
                    </span>
                  })()}
                  <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/xe-kd/export-excel`}
                    onClick={e => { const tok = localStorage.getItem('hsg_token')||''; if(!tok){e.preventDefault();alert('Cần đăng nhập');} }}
                    style={{ fontSize:11, color:'var(--apple-blue)', background:'rgba(0,122,255,.08)', padding:'3px 10px', borderRadius:20, textDecoration:'none', fontWeight:600 }}>
                    ↓ Excel 290 xe
                  </a>
                </div>
              </div>
              {/* KĐ fields */}
              <div style={{ paddingBottom:6 }}>
                {[
                  ['Số sổ KĐ',       kd.soSoKiemDinh],
                  ['Số sổ quản lý',   kd.soSoQuanLy],
                  ['Chủ phương tiện', kd.chuPhuongTien],
                  ['Địa chỉ',         kd.diaChiChu],
                  ['Ngày đăng ký',    kd.ngayDangKy],
                  ['Loại phương tiện',kd.loaiPhuongTien],
                  ['Nhãn hiệu',       kd.nhanHieu],
                  ['Số loại',         kd.soLoai],
                  ['Số khung',        kd.soKhungThucTe],
                  ['Số máy',          kd.soMayThucTe],
                  ['Năm / Nơi SX',    kd.namSanXuat ? `${kd.namSanXuat}${kd.noiSanXuat ? ' · ' + kd.noiSanXuat : ''}` : null],
                  ['Tải trọng TK',    kd.taiTrongThietKe ? kd.taiTrongThietKe + ' kG' : null],
                  ['TL bản thân',     kd.trongLuongBanThan ? kd.trongLuongBanThan + ' kG' : null],
                  ['Kích thước bao',  kd.kichThuocBao],
                  ['Kích thước thùng',kd.kichThuocThung],
                  ['Cỡ lốp',          kd.coLop],
                  ['Nhiên liệu',      kd.nhieuLieu],
                  ['Dung tích / CS',  kd.dungTich ? `${kd.dungTich} cm³${kd.congSuatLonNhat ? ' · ' + kd.congSuatLonNhat : ''}` : null],
                  ['Phí KĐ đến',      kd.phiNopDenHetNgay],
                ].map(([label, val]) => (
                  <div key={label} style={{ display:'flex', padding:'7px 14px', gap:10, borderBottom:'0.5px solid var(--sep)' }}>
                    <div style={{ fontSize:11.5, color:'var(--label-secondary)', minWidth:130, flexShrink:0 }}>{label}</div>
                    <div style={{ fontSize:12.5, fontWeight:500, color: val ? '#1C1C1C' : '#BBB', fontStyle: val ? 'normal' : 'italic' }}>
                      {val || '—'}
                    </div>
                  </div>
                ))}

                {/* KĐ hiện hành — editable */}
                <div style={{ padding:'10px 14px 4px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <div style={{ fontSize:10.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-secondary)' }}>
                      Kiểm định hiện hành
                    </div>
                    {!kdEdit
                      ? <button onClick={() => setKdEdit(true)} style={{ fontSize:11, color:'var(--apple-blue)', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>Cập nhật</button>
                      : <div style={{ display:'flex', gap:6 }}>
                          <button onClick={saveKD} disabled={kdSaving} style={{ fontSize:11, color:'#fff', background:'var(--apple-green)', border:'none', borderRadius:6, padding:'3px 10px', cursor:'pointer', fontFamily:'inherit' }}>{kdSaving ? '...' : 'Lưu'}</button>
                          <button onClick={() => { setKdEdit(false); setKdForm(kd?.kdHienHanh || {}) }} style={{ fontSize:11, color:'var(--label-secondary)', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>Huỷ</button>
                        </div>
                    }
                  </div>
                  {[
                    ['tramKD',    'Trạm KĐ'],
                    ['soPhieu',   'Số phiếu'],
                    ['ngayKD',    'Ngày KĐ'],
                    ['lanKD',     'Lần KĐ'],
                    ['soTem',     'Số tem GCN'],
                    ['thoiHanKD', 'Thời hạn KĐ'],
                  ].map(([field, label]) => (
                    <div key={field} style={{ display:'flex', gap:10, padding:'5px 0', borderBottom:'0.5px solid var(--sep)', alignItems:'center' }}>
                      <div style={{ fontSize:11.5, color:'var(--label-secondary)', minWidth:116, flexShrink:0 }}>{label}</div>
                      {kdEdit
                        ? <input value={kdForm[field] || ''} onChange={e => setKdForm(p => ({ ...p, [field]: e.target.value }))}
                            placeholder="dd/mm/yyyy hoặc nhập tay"
                            style={{ flex:1, fontSize:12, padding:'3px 8px', border:'0.5px solid #CCC', borderRadius:6, fontFamily:'inherit', outline:'none' }} />
                        : <div style={{ fontSize:12.5, fontWeight:500, color: kdForm[field] ? '#1C1C1C' : '#BBB', fontStyle: kdForm[field] ? 'normal' : 'italic' }}>
                            {kdForm[field] || '—'}
                          </div>
                      }
                    </div>
                  ))}
                </div>

                {/* Lịch sử KĐ */}
                {kd.lichSuKD?.length > 0 && (
                  <div style={{ padding:'8px 14px 10px' }}>
                    <div style={{ fontSize:10.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-secondary)', marginBottom:6 }}>Lịch sử kiểm định</div>
                    <div style={{ overflowX:'auto' }}>
                      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                        <thead>
                          <tr>{['Trạm','Số phiếu','Ngày KĐ','Lần','Thời hạn'].map(h => (
                            <th key={h} style={{ padding:'4px 6px', textAlign:'left', color:'var(--label-secondary)', fontWeight:600, borderBottom:'0.5px solid var(--sep)', fontSize:10, textTransform:'uppercase', letterSpacing:'.05em', whiteSpace:'nowrap' }}>{h}</th>
                          ))}</tr>
                        </thead>
                        <tbody>
                          {kd.lichSuKD.map((r,i) => (
                            <tr key={i} style={{ background: i===0?'rgba(52,199,89,.06)':'transparent' }}>
                              {[r.tramKD, r.soPhieu, r.ngayKD, r.lanKD, r.thoiHanKD].map((v,j) => (
                                <td key={j} style={{ padding:'4px 6px', borderBottom:'0.5px solid var(--sep)', color: i===0&&j===4?'#34C759':'#1C1C1C', fontWeight: i===0&&j===4?600:400, whiteSpace:'nowrap', fontSize:11 }}>{v||'—'}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {!kdLoading && !kd && (
            <div style={{ background:'var(--bg-card)', border:'0.5px solid var(--sep)', borderRadius:14, padding:'14px 16px', marginBottom:12 }}>
              <div style={{ fontSize:10.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--label-secondary)', marginBottom:6 }}>Chứng nhận kiểm định</div>
              <div style={{ fontSize:12, color:'#909090', fontStyle:'italic' }}>Chưa có dữ liệu đăng kiểm cho xe này. Chạy script import để đồng bộ.</div>
            </div>
          )}
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
