// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📁 FRONTEND — quanlyxever3/src/pages/PageBaoDuong.jsx
// Quản lý bảo dưỡng, sửa chữa, lốp xe, giấy tờ
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { useState, useEffect, useRef, useCallback } from 'react'

const API = import.meta.env.VITE_API_URL || 'https://hsg-backend.onrender.com'
const tok = () => localStorage.getItem('hsg_token') || ''
const apiFetch = (path, opts = {}) => fetch(`${API}${path}`, {
  ...opts,
  headers: { Authorization: `Bearer ${tok()}`, 'Content-Type': 'application/json', ...(opts.headers || {}) },
})

// ── Bảng chu kỳ BD xe tải (HSH.QLTS-05 mục 6.1.3) ──────
const BD_XETAI = [
  { moc: 5000,  items: ['Thay dầu động cơ', 'Kiểm tra lọc dầu/nước làm mát/dầu phanh', 'Kiểm tra rò rỉ', 'Siết bulong sàn thùng, chassis', 'Kiểm tra áp suất lốp', 'Kiểm tra ắc quy'] },
  { moc: 10000, items: ['Thay dầu động cơ', 'Vệ sinh lọc gió động cơ', 'Kiểm tra lọc nhiên liệu', 'Kiểm tra hệ thống treo', 'Kiểm tra bạc đạn bánh xe', 'Kiểm tra hệ thống điện'] },
  { moc: 15000, items: ['Thay dầu động cơ', 'Kiểm tra lọc dầu/nước làm mát/dầu phanh', 'Kiểm tra rò rỉ', 'Kiểm tra bố thắng', 'Siết bulong chassis', 'Kiểm tra áp suất lốp'] },
  { moc: 20000, items: ['Thay lọc nhiên liệu', 'Thay lọc gió', 'Cân chỉnh thước lái', 'Bổ sung dầu hộp số, dầu cầu', 'Kiểm tra phốt láp'] },
  { moc: 25000, items: ['Thay dầu động cơ', 'Kiểm tra lọc dầu/nước làm mát/dầu phanh', 'Kiểm tra rò rỉ', 'Siết bulong chassis', 'Kiểm tra áp suất lốp'] },
  { moc: 30000, items: ['Thay dầu hộp số', 'Thay dầu cầu', 'Thay dầu phanh', 'Thay nước mát', 'Kiểm tra turbo, kim phun', 'Kiểm tra cầu trục, máy lạnh'] },
]

// ── Bảng giá lốp duyệt — Tờ trình 3413/TTr/HS/PMH/0126 (HT HSH) ────────────
// Hiệu lực: 01/01/2026 – 30/06/2026
// NCC ưu tiên 1 (LỐP XE VIỆT – Maxxis), ưu tiên 2 (ALPHA – Bridgestone/DRC)
const TIRE_CATALOG = [
  {
    id: 1, size: '900R20-(18PR)', boBo: 'kem',
    loaiXe: 'Xe tải thùng lửng/cẩu Thaco 6.2T',
    soLuong6T: 188,
    p1: { ncc: 'LỐP XE VIỆT', hang: 'Maxxis UR288', xuatXu: 'Thái Lan', tdp: 6534000, sdp: 5450000 },
    p2: { ncc: 'ALPHA', hang: 'Maxxis UM938', xuatXu: 'Thái Lan', tdp: 6151111, sdp: 6151111 },
  },
  {
    id: 2, size: '11.00R20-(18PR)', boBo: 'kem',
    loaiXe: 'Xe tải thùng bạt Thaco 14T',
    soLuong6T: 78,
    p1: { ncc: 'LỐP XE VIỆT', hang: 'Maxxis UR288', xuatXu: 'Thái Lan', tdp: 7111111, sdp: 7111111 },
    p2: { ncc: 'ALPHA', hang: 'Bridgestone R150', xuatXu: 'Thái Lan', tdp: 8910000, sdp: 7870000 },
  },
  {
    id: 3, size: '11.00-22-(18PR)', boBo: 'kem',
    loaiXe: 'Xe tải thùng bạt Chenglong 8.2–8.4T',
    soLuong6T: 18,
    p1: { ncc: 'LỐP XE VIỆT', hang: 'Maxxis UR288 / 11R22.5', xuatXu: 'Thái Lan', tdp: 6488889, sdp: 6488889 },
    p2: { ncc: 'ALPHA', hang: 'Bridgestone R150', xuatXu: 'Thái Lan', tdp: 8910000, sdp: 7870000 },
  },
  {
    id: 4, size: '750-16-(18PR)', boBo: 'nylon',
    loaiXe: 'Xe tải Mitsubishi/Veam',
    soLuong6T: 18,
    p1: { ncc: 'LỐP XE VIỆT', hang: 'Maxxis M276', xuatXu: 'Việt Nam', tdp: 2603780, sdp: 2603780 },
    p2: { ncc: 'ALPHA', hang: 'Bridgestone R288', xuatXu: 'Thái Lan', tdp: 4374000, sdp: 3950000 },
  },
  {
    id: 5, size: '10.00R20-(18PR)', boBo: 'kem',
    loaiXe: 'Xe tải Hino 6.75–8.4T',
    soLuong6T: 32,
    p1: { ncc: 'LỐP XE VIỆT', hang: 'Maxxis UR288', xuatXu: 'Thái Lan', tdp: 6720000, sdp: 6720000 },
    p2: { ncc: 'ALPHA', hang: 'Bridgestone R150', xuatXu: 'Thái Lan', tdp: 8478000, sdp: 7450000 },
  },
  {
    id: 6, size: '245/70R19.5-(18PR)', boBo: 'kem',
    loaiXe: 'Xe tải Hyundai 12.35T',
    soLuong6T: 6,
    p1: { ncc: 'ALPHA', hang: 'Bridgestone', xuatXu: 'Thái Lan', tdp: 5346000, sdp: 4750000 },
    p2: { ncc: 'LỐP XE VIỆT', hang: 'Maxxis UR275', xuatXu: 'Thái Lan', tdp: 4591667, sdp: 4591667 },
  },
  {
    id: 7, size: '8.25R16-(18PR)', boBo: 'nylon',
    loaiXe: 'Xe tải thùng bạt Thaco 3.45T',
    soLuong6T: 6,
    p1: { ncc: 'LỐP XE VIỆT', hang: 'Maxxis M276', xuatXu: 'Việt Nam', tdp: 2955260, sdp: 2955260 },
    p2: { ncc: 'ALPHA', hang: 'Bridgestone BS585', xuatXu: 'Thái Lan', tdp: 4914000, sdp: 4250000 },
  },
  {
    id: 8, size: '7.00R16-(16PR)', boBo: 'nylon',
    loaiXe: 'Xe tải Mitsubishi/Veam (nhỏ)',
    soLuong6T: 48,
    p1: { ncc: 'LỐP XE VIỆT', hang: 'Maxxis MA265', xuatXu: 'Việt Nam', tdp: 2083630, sdp: 2083630 },
    p2: { ncc: 'ALPHA', hang: 'DRC bố nylon', xuatXu: 'Việt Nam', tdp: 2390000, sdp: 2570000 },
  },
  {
    id: 9, size: '205/65R15', boBo: 'kem',
    loaiXe: 'Xe ô tô Toyota Innova',
    soLuong6T: 7,
    p1: { ncc: 'LỐP XE VIỆT', hang: 'Maxxis MAP5', xuatXu: 'Thái Lan', tdp: 1498148, sdp: 1205000 },
    p2: { ncc: 'ALPHA', hang: 'Bridgestone B390', xuatXu: 'Thái Lan', tdp: 2030400, sdp: 1750000 },
  },
  {
    id: 10, size: '265/65R17', boBo: 'kem',
    loaiXe: 'Xe bán tải Toyota/Ford',
    soLuong6T: 4,
    p1: { ncc: 'LỐP XE VIỆT', hang: 'Maxxis HT780', xuatXu: 'Thái Lan', tdp: 2981481, sdp: 2567000 },
    p2: { ncc: 'ALPHA', hang: 'Bridgestone D684', xuatXu: 'Thái Lan', tdp: 3952800, sdp: 3370000 },
  },
]

const VT_LOP = {
  '4':  ['trucTruoc_trai','trucTruoc_phai','trucSau_trai','trucSau_phai'],
  '6':  ['trucTruoc_trai','trucTruoc_phai','trucSau_ngoaiTrai','trucSau_trongTrai','trucSau_ngoaiPhai','trucSau_trongPhai'],
  '10': ['trucTruoc_trai','trucTruoc_phai','truc2_ngoaiTrai','truc2_trongTrai','truc2_ngoaiPhai','truc2_trongPhai','truc3_ngoaiTrai','truc3_trongTrai','truc3_ngoaiPhai','truc3_trongPhai'],
  '12': ['trucTruoc_trai','trucTruoc_phai','truc2_ngoaiTrai','truc2_trongTrai','truc2_ngoaiPhai','truc2_trongPhai','truc3_ngoaiTrai','truc3_trongTrai','truc3_ngoaiPhai','truc3_trongPhai','truc4_ngoaiTrai','truc4_ngoaiPhai'],
}
const VT_LABEL = { trucTruoc:'Cầu trước', truc2:'Cầu 2', truc3:'Cầu 3', truc4:'Cầu 4', trai:'Trái', phai:'Phải', ngoai:'Ngoài', trong:'Trong' }
function viTriLabel(vt) {
  return vt.replace(/_/g,' ').replace(/([A-Z])/g,' $1').replace('truc Truoc','Cầu trước').replace('truc 2','Cầu 2').replace('truc 3','Cầu 3').replace('truc 4','Cầu 4').replace('ngoai Trai','ngoài trái').replace('ngoai Phai','ngoài phải').replace('trong Trai','trong trái').replace('trong Phai','trong phải').replace('trai','trái').replace('phai','phải')
}

const DOCS_LABEL = { dangKy:'Đăng ký xe', dangKiem:'Đăng kiểm', baoHiemBatBuoc:'BH bắt buộc (TNDS)', baoHiemThuHai:'BH thứ 2 (xe)', phuHieu:'Phù hiệu', kiemDinhCau:'Kiểm định cầu' }
const LOAI_BDSC_LABEL = { baoDuongDinhKy:'BD định kỳ', suaChuaPhatSinh:'Sửa chữa', suaChuaTaiNan:'Tai nạn', baoHanh:'Bảo hành' }

// ━━━ Styles ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const card  = { background:'var(--color-bg-secondary)', border:'1px solid var(--color-border-secondary)', borderRadius:10, padding:'12px 14px', marginBottom:8 }
const s     = { fontSize:12, color:'var(--color-text-secondary)' }
const sectionTitle = { fontSize:12, fontWeight:700, color:'var(--color-text-secondary)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }
const inputStyle = { width:'100%', padding:'7px 10px', background:'var(--color-bg-tertiary)', border:'1px solid var(--color-border-secondary)', borderRadius:7, fontSize:13, color:'var(--color-text-primary)', boxSizing:'border-box' }
const btnPrimary = { background:'var(--color-accent)', color:'#fff', border:'none', borderRadius:7, padding:'8px 16px', fontSize:13, cursor:'pointer', fontWeight:600 }
const btnSecondary = { background:'var(--color-bg-tertiary)', color:'var(--color-text-primary)', border:'1px solid var(--color-border-secondary)', borderRadius:7, padding:'7px 14px', fontSize:12, cursor:'pointer' }

function Badge({ type='grn', children }) {
  const clr = { grn:'#22c55e', yel:'#f59e0b', red:'#ef4444', blu:'#3b82f6', gry:'#6b7280' }
  const bg  = { grn:'rgba(34,197,94,.12)', yel:'rgba(245,158,11,.12)', red:'rgba(239,68,68,.12)', blu:'rgba(59,130,246,.12)', gry:'rgba(107,114,128,.12)' }
  return <span style={{ background:bg[type]||bg.gry, color:clr[type]||clr.gry, borderRadius:5, padding:'2px 8px', fontSize:11, fontWeight:600, whiteSpace:'nowrap' }}>{children}</span>
}

function EmptyState({ icon, title, sub, action, onAction }) {
  return (
    <div style={{ textAlign:'center', padding:'32px 16px', color:'var(--color-text-secondary)' }}>
      <div style={{ fontSize:32, marginBottom:8 }}>{icon}</div>
      <div style={{ fontSize:14, fontWeight:600, color:'var(--color-text-primary)', marginBottom:6 }}>{title}</div>
      <div style={{ fontSize:12, marginBottom:16, maxWidth:280, margin:'0 auto 16px' }}>{sub}</div>
      {action && <button style={btnPrimary} onClick={onAction}>{action}</button>}
    </div>
  )
}

// ── Form nhập phiếu BDSC ──────────────────────────────────
function FormBDSC({ vehicles, onSave, onCancel }) {
  const [form, setForm] = useState({
    bienSo:'', ngay: new Date().toISOString().slice(0,10), kmThoiDiem:'',
    gara:'', tinhThanh:'', loaiBdsc:'suaChuaPhatSinh', ghiChu:'',
    tongCong:0, tongVatTu:0, tongTien:0,
  })
  const [hangMuc, setHangMuc] = useState([{ ten:'', loai:'suaChua', donGia:0, soLuong:1, donVi:'cái' }])
  const [files,   setFiles]   = useState([])
  const [saving,  setSaving]  = useState(false)
  const [warning, setWarning] = useState('')
  const fileRef = useRef()

  const setF = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const updateHM = (i, k, v) => setHangMuc(p => p.map((h,j) => j===i ? { ...h, [k]:v, thanhTien: k==='donGia'||k==='soLuong' ? (k==='donGia'?+v:h.donGia)*(k==='soLuong'?+v:h.soLuong) : h.thanhTien } : h))
  const addHM    = () => setHangMuc(p => [...p, { ten:'', loai:'suaChua', donGia:0, soLuong:1, donVi:'cái', thanhTien:0 }])
  const removeHM = i  => setHangMuc(p => p.filter((_,j) => j!==i))

  useEffect(() => {
    const cong   = hangMuc.filter(h => ['baoDuong','suaChua','giaCong'].includes(h.loai)).reduce((s,h)=>s+(+h.donGia*(+h.soLuong||1)),0)
    const vatTu  = hangMuc.filter(h => h.loai==='vatTu').reduce((s,h)=>s+(+h.donGia*(+h.soLuong||1)),0)
    setForm(p => ({ ...p, tongCong:cong, tongVatTu:vatTu, tongTien:cong+vatTu }))
  }, [hangMuc])

  const handleSave = async () => {
    if (!form.bienSo || !form.kmThoiDiem) return
    setSaving(true)
    try {
      const payload = { ...form, kmThoiDiem:+form.kmThoiDiem, hangMuc,
        anhBaoGia: files.map(f => f.name) }
      const res = await apiFetch('/api/bdsc', { method:'POST', body: JSON.stringify(payload) })
      const data = await res.json()
      if (data.canhBao) setWarning(data.canhBao)
      else onSave(data)
    } catch(e) { alert(e.message) } finally { setSaving(false) }
  }

  if (warning) return (
    <div style={{ ...card, borderColor:'rgba(245,158,11,.4)', background:'rgba(245,158,11,.05)' }}>
      <div style={{ fontWeight:700, marginBottom:8, color:'#f59e0b' }}>⚠ Phát hiện bất thường</div>
      <div style={{ fontSize:13, marginBottom:12 }}>{warning}</div>
      <div style={{ display:'flex', gap:8 }}>
        <button style={{ ...btnPrimary, background:'#f59e0b' }} onClick={()=>{ setWarning(''); onSave({}) }}>Vẫn lưu</button>
        <button style={btnSecondary} onClick={()=>setWarning('')}>Kiểm tra lại</button>
      </div>
    </div>
  )

  return (
    <div style={card}>
      <div style={{ ...sectionTitle, marginBottom:14 }}>📝 Thêm phiếu BDSC</div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
        <div>
          <label style={s}>Biển số *</label>
          <select style={inputStyle} value={form.bienSo} onChange={setF('bienSo')}>
            <option value=''>— Chọn xe —</option>
            {vehicles.map(v => <option key={v._id} value={v['BIỂN SỐ']||v['BIẼNSỐ']||v['Biển số']||''}>{v['BIỂN SỐ']||v['BIẼNSỐ']||v['Biển số']}</option>)}
          </select>
        </div>
        <div>
          <label style={s}>Loại</label>
          <select style={inputStyle} value={form.loaiBdsc} onChange={setF('loaiBdsc')}>
            {Object.entries(LOAI_BDSC_LABEL).map(([k,v])=><option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label style={s}>Ngày *</label>
          <input style={inputStyle} type='date' value={form.ngay} onChange={setF('ngay')} />
        </div>
        <div>
          <label style={s}>KM tại thời điểm *</label>
          <input style={inputStyle} type='number' placeholder='VD: 145000' value={form.kmThoiDiem} onChange={setF('kmThoiDiem')} />
        </div>
        <div>
          <label style={s}>Gara / Đơn vị sửa</label>
          <input style={inputStyle} placeholder='Tên gara' value={form.gara} onChange={setF('gara')} />
        </div>
        <div>
          <label style={s}>Tỉnh/thành</label>
          <input style={inputStyle} placeholder='VD: TP.HCM' value={form.tinhThanh} onChange={setF('tinhThanh')} />
        </div>
      </div>

      {/* Hạng mục */}
      <div style={{ marginBottom:10 }}>
        <div style={{ ...sectionTitle, marginBottom:6 }}>Hạng mục</div>
        {hangMuc.map((hm, i) => (
          <div key={i} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 80px 70px 50px 28px', gap:6, marginBottom:6, alignItems:'center' }}>
            <input style={inputStyle} placeholder='Tên hạng mục' value={hm.ten} onChange={e => updateHM(i,'ten',e.target.value)} />
            <select style={inputStyle} value={hm.loai} onChange={e => updateHM(i,'loai',e.target.value)}>
              <option value='baoDuong'>BD định kỳ</option>
              <option value='suaChua'>Sửa chữa</option>
              <option value='vatTu'>Vật tư</option>
              <option value='giaCong'>Gia công</option>
            </select>
            <input style={inputStyle} type='number' placeholder='Đơn giá' value={hm.donGia||''} onChange={e => updateHM(i,'donGia',e.target.value)} />
            <input style={inputStyle} type='number' placeholder='SL' value={hm.soLuong} onChange={e => updateHM(i,'soLuong',e.target.value)} />
            <input style={inputStyle} placeholder='ĐVT' value={hm.donVi} onChange={e => updateHM(i,'donVi',e.target.value)} />
            <button style={{ ...btnSecondary, padding:'4px 8px', color:'#ef4444' }} onClick={() => removeHM(i)}>✕</button>
          </div>
        ))}
        <button style={btnSecondary} onClick={addHM}>+ Thêm hạng mục</button>
      </div>

      {/* Tổng tiền */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:10, padding:'10px', background:'var(--color-bg-tertiary)', borderRadius:8 }}>
        <div><span style={s}>Công/gia công</span><div style={{ fontWeight:700 }}>{form.tongCong.toLocaleString('vi-VN')}đ</div></div>
        <div><span style={s}>Vật tư</span><div style={{ fontWeight:700 }}>{form.tongVatTu.toLocaleString('vi-VN')}đ</div></div>
        <div><span style={s}>Tổng cộng</span><div style={{ fontWeight:700, color:'var(--color-accent)' }}>{form.tongTien.toLocaleString('vi-VN')}đ</div></div>
      </div>

      {/* Ảnh/PDF */}
      <div style={{ marginBottom:10 }}>
        <label style={s}>Ảnh báo giá / PDF (nhiều file)</label>
        <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:4 }}>
          <button style={btnSecondary} onClick={() => fileRef.current?.click()}>📎 Chọn file</button>
          <input ref={fileRef} type='file' multiple accept='image/*,.pdf' style={{ display:'none' }}
            onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files)])} />
          <span style={s}>{files.length > 0 ? `${files.length} file đã chọn` : 'Chưa chọn'}</span>
        </div>
        {files.length > 0 && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:6 }}>
            {files.map((f,i) => (
              <span key={i} style={{ ...s, background:'var(--color-bg-tertiary)', padding:'2px 8px', borderRadius:5, display:'flex', alignItems:'center', gap:4 }}>
                {f.name.length > 20 ? f.name.slice(0,18)+'…' : f.name}
                <span style={{ cursor:'pointer', color:'#ef4444' }} onClick={() => setFiles(p=>p.filter((_,j)=>j!==i))}>✕</span>
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginBottom:10 }}>
        <label style={s}>Ghi chú</label>
        <textarea style={{ ...inputStyle, height:60, resize:'vertical' }} value={form.ghiChu} onChange={setF('ghiChu')} />
      </div>

      <div style={{ display:'flex', gap:8 }}>
        <button style={btnPrimary} onClick={handleSave} disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu phiếu'}</button>
        <button style={btnSecondary} onClick={onCancel}>Huỷ</button>
      </div>
    </div>
  )
}

// ── Sơ đồ lốp xe ─────────────────────────────────────────
function LopDiagram({ bienSo, cauHinh, viTriLop, kmHienTai, onClickVt }) {
  const vitri = VT_LOP[cauHinh] || VT_LOP['6']
  return (
    <div style={{ position:'relative', padding:'12px 0' }}>
      {vitri.map(vt => {
        const data = (viTriLop || []).find(v => v.viTri === vt)
        const kmChay = data && kmHienTai ? kmHienTai - (data.kmLap || 0) : null
        const chuKy  = data?.boBo === 'kem' ? 80000 : 50000
        const pct    = kmChay ? kmChay / chuKy : 0
        const color  = pct >= 1 ? '#ef4444' : pct >= 0.85 ? '#f59e0b' : pct > 0 ? '#22c55e' : 'var(--color-border-secondary)'
        return (
          <div key={vt} onClick={() => onClickVt(vt, data)}
            style={{ display:'inline-block', margin:4, padding:'8px 10px', border:`2px solid ${color}`, borderRadius:8,
              background: data ? `${color}18` : 'transparent', cursor:'pointer', minWidth:70, textAlign:'center' }}>
            <div style={{ fontSize:10, color:'var(--color-text-secondary)', marginBottom:2 }}>{viTriLabel(vt)}</div>
            {data?.loaiLop
              ? <div style={{ fontSize:11, fontWeight:600 }}>{data.loaiLop}</div>
              : <div style={{ fontSize:11, color:'var(--color-border-secondary)' }}>—</div>}
            {kmChay !== null && <div style={{ fontSize:10, color }}>{(kmChay/1000).toFixed(0)}k km</div>}
          </div>
        )
      })}
    </div>
  )
}

// ── Modal cập nhật 1 vị trí lốp ──────────────────────────
function TireModal({ viTri, data, onSave, onClose }) {
  const [form, setForm] = useState({ viTri, loaiLop:'', boBo:'kem', thuongHieu:'', ncc:'', kmLap:'', ngayLap:'', ghiChu:'', ...data })
  const sf = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  // gợi ý giá từ catalog
  const match = TIRE_CATALOG.find(t => form.loaiLop && form.loaiLop.includes(t.size.split('-')[0]))
  const giaSDP = match ? match.p1.sdp : null

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ ...card, width:340, marginBottom:0, maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ fontWeight:700, marginBottom:12 }}>🔧 {viTriLabel(viTri)}</div>
        <label style={s}>Kích thước lốp</label>
        <select style={{ ...inputStyle, marginBottom:8 }} value={form.loaiLop} onChange={sf('loaiLop')}>
          <option value=''>— Chọn size —</option>
          {TIRE_CATALOG.map(t => <option key={t.id} value={t.size}>{t.size} — {t.loaiXe}</option>)}
        </select>
        <label style={s}>Bố lốp</label>
        <select style={{ ...inputStyle, marginBottom:8 }} value={form.boBo} onChange={sf('boBo')}>
          <option value='nylon'>Bố nylon (thay 50k km)</option>
          <option value='kem'>Bố kẽm (thay 80k km)</option>
        </select>
        <label style={s}>Thương hiệu</label>
        <input style={{ ...inputStyle, marginBottom:8 }} placeholder='Maxxis / Bridgestone / DRC' value={form.thuongHieu} onChange={sf('thuongHieu')} />
        <label style={s}>NCC</label>
        <input style={{ ...inputStyle, marginBottom:8 }} placeholder='LỐP XE VIỆT / ALPHA' value={form.ncc} onChange={sf('ncc')} />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
          <div>
            <label style={s}>KM lúc lắp</label>
            <input style={inputStyle} type='number' value={form.kmLap} onChange={sf('kmLap')} />
          </div>
          <div>
            <label style={s}>Ngày lắp</label>
            <input style={inputStyle} type='date' value={form.ngayLap} onChange={sf('ngayLap')} />
          </div>
        </div>
        {giaSDP && (
          <div style={{ ...card, marginBottom:8, borderColor:'rgba(59,130,246,.3)', background:'rgba(59,130,246,.05)' }}>
            <div style={{ fontSize:11, color:'#3b82f6' }}>💡 Giá duyệt TTr 3413/2026</div>
            <div style={{ fontSize:13, fontWeight:600 }}>{giaSDP.toLocaleString('vi-VN')}đ ({match.p1.ncc})</div>
            <div style={{ fontSize:11, color:'var(--color-text-secondary)' }}>Hiệu lực đến 30/06/2026</div>
          </div>
        )}
        <label style={s}>Ghi chú</label>
        <input style={{ ...inputStyle, marginBottom:12 }} value={form.ghiChu} onChange={sf('ghiChu')} />
        <div style={{ display:'flex', gap:8 }}>
          <button style={btnPrimary} onClick={() => onSave(form)}>Lưu</button>
          <button style={btnSecondary} onClick={onClose}>Huỷ</button>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// MAIN — PageBaoDuong
// ══════════════════════════════════════════════════════════
export default function PageBaoDuong({ token, user }) {
  const TABS = [
    { id:'overview', label:'Tổng quan', icon:'📊' },
    { id:'alert',    label:'Cảnh báo',  icon:'🔔' },
    { id:'bdsc',     label:'Phiếu BDSC',icon:'🔧' },
    { id:'timeline', label:'Timeline',  icon:'📈' },
    { id:'tire',     label:'Lốp xe',    icon:'⭕' },
    { id:'docs',     label:'Giấy tờ',   icon:'📄' },
    { id:'catalog',  label:'Bảng giá lốp',icon:'💰' },
  ]
  const [tab,        setTab]       = useState('overview')
  const [vehicles,   setVehicles]  = useState([])
  const [bdAlerts,   setBdAlerts]  = useState([])
  const [docsAlerts, setDocsAlerts]= useState([])
  const [history,    setHistory]   = useState([])
  const [loading,    setLoading]   = useState(true)
  const [showForm,   setShowForm]  = useState(false)

  // Timeline
  const [selVe, setSelVe] = useState('')

  // Lốp xe
  const [tireVe,    setTireVe]    = useState('')
  const [lopData,   setLopData]   = useState({ cauHinh:'6', viTriLop:[] })
  const [tireModal, setTireModal] = useState(null)
  const [tireLoading, setTireLoading] = useState(false)
  const [kmMap, setKmMap]         = useState({})

  // Giấy tờ
  const [docsVe,  setDocsVe]  = useState('')
  const [docsData,setDocsData]= useState({})
  const [docsSaving, setDocsSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      apiFetch('/api/xe/all').then(r=>r.json()).catch(()=>[]),
      apiFetch('/api/bdsc/alerts').then(r=>r.json()).catch(()=>[]),
      apiFetch('/api/bdsc/docs-alerts').then(r=>r.json()).catch(()=>[]),
      apiFetch('/api/bdsc?limit=100').then(r=>r.json()).catch(()=>({ data:[] })),
    ]).then(([xe, al, da, bd]) => {
      setVehicles(Array.isArray(xe) ? xe : [])
      setBdAlerts(Array.isArray(al) ? al : [])
      setDocsAlerts(Array.isArray(da) ? da : [])
      setHistory(Array.isArray(bd?.data) ? bd.data : [])
    }).finally(() => setLoading(false))
  }, [])

  const fetchTire = async (bs) => {
    if (!bs) return
    setTireLoading(true)
    try {
      const [lopRes, kmRes] = await Promise.all([
        apiFetch(`/api/bdsc/tire/${bs}`).then(r=>r.json()),
        apiFetch('/api/bdsc/tire-alerts').then(r=>r.json()).catch(()=>[]),
      ])
      setLopData(lopRes || { cauHinh:'6', viTriLop:[] })
    } catch(e) {} finally { setTireLoading(false) }
  }

  const fetchDocs = async (bs) => {
    if (!bs) return
    try {
      const d = await apiFetch(`/api/bdsc/docs/${bs}`).then(r=>r.json())
      setDocsData(d || {})
    } catch(e) {}
  }

  const saveTireVt = async (vtData) => {
    const newLop = { ...lopData }
    const idx = (newLop.viTriLop||[]).findIndex(v=>v.viTri===vtData.viTri)
    if (idx >= 0) newLop.viTriLop[idx] = vtData
    else newLop.viTriLop = [...(newLop.viTriLop||[]), vtData]
    const res = await apiFetch(`/api/bdsc/tire/${tireVe}`, { method:'PUT', body: JSON.stringify(newLop) })
    const saved = await res.json()
    setLopData(saved)
    setTireModal(null)
  }

  const saveDocs = async () => {
    if (!docsVe) return
    setDocsSaving(true)
    try {
      await apiFetch(`/api/bdsc/docs/${docsVe}`, { method:'PUT', body: JSON.stringify(docsData) })
      alert('Đã lưu giấy tờ xe')
    } catch(e) { alert(e.message) } finally { setDocsSaving(false) }
  }

  const critCount  = bdAlerts.filter(a=>a.status==='crit').length
  const warnCount  = bdAlerts.filter(a=>a.status==='warn').length
  const docsCrit   = docsAlerts.filter(a=>a.status!=='warn').length

  if (loading) return <div style={{ padding:24, color:'var(--color-text-secondary)' }}>Đang tải…</div>

  return (
    <div style={{ padding:'0 0 40px' }}>
      {/* ── Header ── */}
      <div style={{ padding:'16px 16px 0', display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:700 }}>Bảo dưỡng & Sửa chữa</div>
          <div style={s}>{vehicles.length} xe · {history.length} phiếu BDSC</div>
        </div>
        <button style={btnPrimary} onClick={()=>{ setShowForm(true); setTab('bdsc') }}>+ Thêm phiếu</button>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display:'flex', overflowX:'auto', padding:'0 16px', gap:4, borderBottom:'1px solid var(--color-border-secondary)', marginBottom:12 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            padding:'8px 14px', fontSize:12, fontWeight:600, whiteSpace:'nowrap',
            background:'transparent', border:'none', cursor:'pointer',
            borderBottom: tab===t.id ? '2px solid var(--color-accent)' : '2px solid transparent',
            color: tab===t.id ? 'var(--color-accent)' : 'var(--color-text-secondary)',
          }}>
            {t.icon} {t.label}
            {t.id==='alert' && (critCount+warnCount) > 0 && (
              <span style={{ marginLeft:4, background:critCount>0?'#ef4444':'#f59e0b', color:'#fff', borderRadius:10, padding:'1px 6px', fontSize:10 }}>
                {critCount+warnCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <div style={{ padding:'0 16px' }}>

        {/* ══ TỔNG QUAN ══ */}
        {tab === 'overview' && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
              {[
                { label:'Xe quá hạn BD', val:critCount, clr:'#ef4444' },
                { label:'Xe sắp đến hạn', val:warnCount, clr:'#f59e0b' },
                { label:'Giấy tờ hết hạn sớm', val:docsCrit, clr:'#f59e0b' },
                { label:'Tổng phiếu BDSC', val:history.length, clr:'var(--color-accent)' },
              ].map(m => (
                <div key={m.label} style={card}>
                  <div style={{ fontSize:24, fontWeight:700, color:m.clr }}>{m.val}</div>
                  <div style={s}>{m.label}</div>
                </div>
              ))}
            </div>

            {/* Recent BDSC */}
            <div style={card}>
              <div style={sectionTitle}>Phiếu BDSC gần nhất</div>
              {history.length === 0
                ? <EmptyState icon='🔧' title='Chưa có phiếu' sub='Nhấn "+ Thêm phiếu" để bắt đầu ghi nhận' action='Thêm phiếu' onAction={()=>{ setShowForm(true); setTab('bdsc') }} />
                : history.slice(0,5).map(h => (
                  <div key={h._id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid var(--color-border-tertiary)', fontSize:12 }}>
                    <div>
                      <span style={{ fontWeight:700 }}>{h.bienSo}</span>
                      <span style={{ ...s, marginLeft:8 }}>{new Date(h.ngay).toLocaleDateString('vi-VN')} · {(h.kmThoiDiem||0).toLocaleString()}km</span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      {h.canhBao && <Badge type='yel'>⚠</Badge>}
                      <Badge type={h.loaiBdsc==='baoDuongDinhKy'?'grn':'blu'}>{LOAI_BDSC_LABEL[h.loaiBdsc]||h.loaiBdsc}</Badge>
                      <span style={{ fontWeight:700 }}>{(h.tongTien||0).toLocaleString('vi-VN')}đ</span>
                    </div>
                  </div>
                ))
              }
            </div>

            {/* BD schedule preview */}
            <div style={card}>
              <div style={sectionTitle}>Chu kỳ bảo dưỡng xe tải (HSH.QLTS-05)</div>
              {BD_XETAI.map(b => (
                <div key={b.moc} style={{ display:'flex', gap:10, padding:'6px 0', borderBottom:'1px solid var(--color-border-tertiary)', fontSize:12 }}>
                  <span style={{ fontWeight:700, color:'#f97316', minWidth:55 }}>{(b.moc).toLocaleString()}km</span>
                  <span style={s}>{b.items.slice(0,3).join(' · ')}{b.items.length>3?` +${b.items.length-3} hạng mục`:''}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ CẢNH BÁO BD ══ */}
        {tab === 'alert' && (
          <div>
            {bdAlerts.length === 0
              ? <EmptyState icon='✅' title='Không có cảnh báo' sub={vehicles.length===0 ? 'Chưa có xe trong hệ thống' : 'Tất cả xe đang trong chu kỳ an toàn. Hệ thống cảnh báo khi xe đạt 90% chu kỳ.'} />
              : bdAlerts.map((a,i) => (
                <div key={i} style={{ ...card, borderColor:a.status==='crit'?'rgba(239,68,68,.3)':'rgba(245,158,11,.2)', background:a.status==='crit'?'rgba(239,68,68,.05)':'transparent' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <Badge type={a.status==='crit'?'red':'yel'}>{a.status==='crit'?'Quá hạn':Math.round((a.pct||0)*100)+'%'}</Badge>
                    <div style={{ flex:1 }}>
                      <span style={{ fontWeight:700, fontSize:13 }}>{a.bienSo}</span>
                      <span style={s}> · Mốc {(a.mocTiepTheo||0).toLocaleString()}km · Còn {(a.conLai||0).toLocaleString()}km</span>
                    </div>
                    {a.ngayCuoiBD && <span style={s}>BD: {new Date(a.ngayCuoiBD).toLocaleDateString('vi-VN')}</span>}
                  </div>
                </div>
              ))
            }

            {docsAlerts.length > 0 && (
              <div style={{ marginTop:16 }}>
                <div style={sectionTitle}>Giấy tờ sắp hết hạn</div>
                {docsAlerts.map((a,i) => (
                  <div key={i} style={{ ...card, borderColor:a.status==='expired'?'rgba(239,68,68,.3)':'rgba(245,158,11,.2)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <Badge type={a.status==='expired'?'red':a.status==='crit'?'yel':'yel'}>
                        {a.status==='expired'?'Hết hạn':a.diffDays+'ngày'}
                      </Badge>
                      <span style={{ fontWeight:700 }}>{a.bienSo}</span>
                      <span style={s}>— {DOCS_LABEL[a.field]}</span>
                      <span style={{ marginLeft:'auto', ...s }}>{new Date(a.ngayHetHan).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ PHIẾU BDSC ══ */}
        {tab === 'bdsc' && (
          <div>
            {showForm && (
              <FormBDSC vehicles={vehicles} onSave={doc=>{ setShowForm(false); setHistory(p=>[doc,...p]) }} onCancel={()=>setShowForm(false)} />
            )}
            {!showForm && (
              <button style={{ ...btnPrimary, marginBottom:12 }} onClick={()=>setShowForm(true)}>+ Thêm phiếu BDSC</button>
            )}
            {history.length === 0
              ? <EmptyState icon='🔧' title='Chưa có phiếu nào' sub='Ghi nhận mỗi lần bảo dưỡng, sửa chữa để theo dõi chi phí và phát hiện bất thường.' />
              : history.map(h => (
                <div key={h._id} style={{ ...card, ...(h.canhBao ? { borderColor:'rgba(245,158,11,.3)', background:'rgba(245,158,11,.03)' } : {}) }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <span style={{ fontWeight:700 }}>{h.bienSo}</span>
                        <Badge type={h.loaiBdsc==='baoDuongDinhKy'?'grn':'blu'}>{LOAI_BDSC_LABEL[h.loaiBdsc]}</Badge>
                        {h.canhBao && <Badge type='yel'>⚠ Bất thường</Badge>}
                      </div>
                      <div style={{ ...s, marginTop:3 }}>
                        {new Date(h.ngay).toLocaleDateString('vi-VN')} · {(h.kmThoiDiem||0).toLocaleString()}km
                        {h.gara && ` · ${h.gara}`}{h.tinhThanh && ` (${h.tinhThanh})`}
                      </div>
                      <div style={{ fontSize:12, marginTop:4, color:'var(--color-text-secondary)' }}>
                        {(h.hangMuc||[]).map(hm=>hm.ten).slice(0,3).join(', ')}{(h.hangMuc||[]).length>3?` +${(h.hangMuc.length-3)} nữa`:''}
                      </div>
                      {h.canhBao && <div style={{ fontSize:11, color:'#f59e0b', marginTop:4 }}>{h.canhBao}</div>}
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontWeight:700, fontSize:14 }}>{(h.tongTien||0).toLocaleString('vi-VN')}đ</div>
                      <div style={s}>{h.tongCong?`Công: ${h.tongCong.toLocaleString()}đ`:''}</div>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {/* ══ TIMELINE ══ */}
        {tab === 'timeline' && (
          <div>
            <div style={{ marginBottom:12 }}>
              <label style={s}>Chọn xe để xem timeline</label>
              <select style={{ ...inputStyle, marginTop:4 }} value={selVe} onChange={e=>setSelVe(e.target.value)}>
                <option value=''>— Chọn xe —</option>
                {vehicles.map(v => { const bs=v['BIỂN SỐ']||v['BIẼNSỐ']||v['Biển số']||''; return <option key={v._id} value={bs}>{bs}</option> })}
              </select>
            </div>
            {!selVe
              ? <EmptyState icon='📈' title='Chọn xe để xem' sub='Timeline hiển thị toàn bộ lịch sử BDSC theo km' />
              : (() => {
                const veHistory = history.filter(h => h.bienSo === selVe).sort((a,b)=>a.kmThoiDiem-b.kmThoiDiem)
                if (veHistory.length === 0) return <EmptyState icon='📭' title='Chưa có phiếu nào' sub={`Xe ${selVe} chưa có phiếu BDSC nào được ghi nhận`} />
                const totalCost = veHistory.reduce((s,h)=>s+(h.tongTien||0),0)
                return (
                  <div>
                    <div style={{ ...card, marginBottom:12, display:'flex', gap:16 }}>
                      <div><div style={{ fontSize:20, fontWeight:700 }}>{veHistory.length}</div><div style={s}>Lần sửa</div></div>
                      <div><div style={{ fontSize:20, fontWeight:700 }}>{totalCost.toLocaleString('vi-VN')}đ</div><div style={s}>Tổng chi phí</div></div>
                      <div><div style={{ fontSize:20, fontWeight:700 }}>{veHistory.length>0?Math.round(totalCost/veHistory.length).toLocaleString('vi-VN')+'đ':'—'}</div><div style={s}>Trung bình/lần</div></div>
                    </div>
                    <div style={{ position:'relative', paddingLeft:24 }}>
                      <div style={{ position:'absolute', left:8, top:0, bottom:0, width:2, background:'var(--color-border-secondary)' }} />
                      {veHistory.map((h,i) => (
                        <div key={h._id} style={{ position:'relative', marginBottom:14 }}>
                          <div style={{ position:'absolute', left:-20, top:6, width:10, height:10, borderRadius:'50%', background:h.canhBao?'#f59e0b':'var(--color-accent)', border:'2px solid var(--color-bg-primary)' }} />
                          <div style={{ ...card, marginBottom:0 }}>
                            <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                              <div>
                                <Badge type={h.loaiBdsc==='baoDuongDinhKy'?'grn':'blu'}>{LOAI_BDSC_LABEL[h.loaiBdsc]}</Badge>
                                <span style={{ marginLeft:8, fontWeight:600 }}>{(h.kmThoiDiem||0).toLocaleString()}km</span>
                                <span style={s}> · {new Date(h.ngay).toLocaleDateString('vi-VN')}</span>
                                {h.gara && <span style={s}> · {h.gara}</span>}
                              </div>
                              <span style={{ fontWeight:700 }}>{(h.tongTien||0).toLocaleString('vi-VN')}đ</span>
                            </div>
                            {(h.hangMuc||[]).length > 0 && <div style={{ ...s, marginTop:4 }}>{h.hangMuc.map(m=>m.ten).join(' · ')}</div>}
                            {h.canhBao && <div style={{ fontSize:11, color:'#f59e0b', marginTop:4 }}>⚠ {h.canhBao}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()
            }
          </div>
        )}

        {/* ══ LỐP XE ══ */}
        {tab === 'tire' && (
          <div>
            <div style={{ marginBottom:12 }}>
              <label style={s}>Chọn xe để quản lý lốp</label>
              <div style={{ display:'flex', gap:8, marginTop:4 }}>
                <select style={{ ...inputStyle, flex:1 }} value={tireVe} onChange={e=>{ setTireVe(e.target.value); fetchTire(e.target.value) }}>
                  <option value=''>— Chọn xe —</option>
                  {vehicles.map(v=>{ const bs=v['BIỂN SỐ']||v['BIẼNSỐ']||v['Biển số']||''; return <option key={v._id} value={bs}>{bs}</option> })}
                </select>
                {tireVe && (
                  <select style={{ ...inputStyle, width:120 }} value={lopData.cauHinh||'6'}
                    onChange={e => setLopData(p=>({ ...p, cauHinh:e.target.value }))}>
                    <option value='4'>4 lốp (2 cầu)</option>
                    <option value='6'>6 lốp (3 cầu)</option>
                    <option value='10'>10 lốp (3 cầu kép)</option>
                    <option value='12'>12 lốp (4 cầu)</option>
                  </select>
                )}
              </div>
            </div>

            {!tireVe
              ? <EmptyState icon='⭕' title='Chọn xe để xem lốp' sub='Click vào từng vị trí lốp để cập nhật thông tin và theo dõi chu kỳ đảo/thay' />
              : tireLoading
                ? <div style={s}>Đang tải…</div>
                : (
                  <div>
                    <LopDiagram bienSo={tireVe} cauHinh={lopData.cauHinh||'6'} viTriLop={lopData.viTriLop||[]}
                      kmHienTai={kmMap[tireVe]}
                      onClickVt={(vt, data) => setTireModal({ viTri:vt, data:data||{} })} />
                    <div style={{ display:'flex', gap:10, marginTop:10, marginBottom:6, fontSize:11 }}>
                      <span>🟢 An toàn</span><span>🟡 Sắp đến hạn (85%+)</span><span>🔴 Quá hạn</span><span>⬜ Chưa nhập</span>
                    </div>
                    <div style={{ display:'flex', gap:8 }}>
                      <button style={btnPrimary} onClick={async () => {
                        const res = await apiFetch(`/api/bdsc/tire/${tireVe}`, { method:'PUT', body:JSON.stringify(lopData) })
                        const d = await res.json(); setLopData(d); alert('Đã lưu cấu hình lốp')
                      }}>💾 Lưu cấu hình</button>
                    </div>
                  </div>
                )
            }
            {tireModal && (
              <TireModal viTri={tireModal.viTri} data={tireModal.data}
                onSave={saveTireVt} onClose={() => setTireModal(null)} />
            )}
          </div>
        )}

        {/* ══ GIẤY TỜ XE ══ */}
        {tab === 'docs' && (
          <div>
            <div style={{ marginBottom:12 }}>
              <label style={s}>Chọn xe</label>
              <select style={{ ...inputStyle, marginTop:4 }} value={docsVe} onChange={e=>{ setDocsVe(e.target.value); fetchDocs(e.target.value) }}>
                <option value=''>— Chọn xe —</option>
                {vehicles.map(v=>{ const bs=v['BIỂN SỐ']||v['BIẼNSỐ']||v['Biển số']||''; return <option key={v._id} value={bs}>{bs}</option> })}
              </select>
            </div>
            {!docsVe
              ? <EmptyState icon='📄' title='Chọn xe để quản lý giấy tờ' sub='Theo dõi hạn đăng kiểm, bảo hiểm, phù hiệu — cảnh báo tự động 30 ngày trước' />
              : (
                <div>
                  <div style={card}>
                    {Object.entries(DOCS_LABEL).map(([k,label]) => {
                      const val  = docsData[k] ? new Date(docsData[k]).toISOString().slice(0,10) : ''
                      const diff = docsData[k] ? Math.ceil((new Date(docsData[k]) - new Date()) / 86400000) : null
                      return (
                        <div key={k} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                          <div style={{ flex:1 }}>
                            <label style={s}>{label}</label>
                            <input style={inputStyle} type='date' value={val}
                              onChange={e=>setDocsData(p=>({ ...p, [k]:e.target.value }))} />
                          </div>
                          {diff !== null && (
                            <Badge type={diff<0?'red':diff<=15?'red':diff<=30?'yel':'grn'}>
                              {diff<0?'Hết hạn':diff<=30?`${diff}ngày`:'OK'}
                            </Badge>
                          )}
                        </div>
                      )
                    })}
                    <div style={{ marginTop:4 }}>
                      <label style={s}>Ghi chú</label>
                      <textarea style={{ ...inputStyle, height:60, resize:'vertical', marginTop:4 }} value={docsData.ghiChu||''} onChange={e=>setDocsData(p=>({ ...p, ghiChu:e.target.value }))} />
                    </div>
                  </div>
                  <button style={btnPrimary} onClick={saveDocs} disabled={docsSaving}>{docsSaving?'Đang lưu…':'💾 Lưu giấy tờ'}</button>
                </div>
              )
            }
          </div>
        )}

        {/* ══ BẢNG GIÁ LỐP (từ Tờ trình) ══ */}
        {tab === 'catalog' && (
          <div>
            <div style={{ ...card, marginBottom:12, borderColor:'rgba(59,130,246,.3)', background:'rgba(59,130,246,.05)' }}>
              <div style={{ fontSize:13, fontWeight:700, marginBottom:4 }}>📋 Tờ trình 3413/TTr/HS/PMH/0126</div>
              <div style={s}>Mua lốp xe thường xuyên HT HSH · 01/01/2026 – 30/06/2026</div>
              <div style={{ display:'flex', gap:12, marginTop:6, fontSize:12 }}>
                <span>Ưu tiên 1: <strong>LỐP XE VIỆT</strong> (Maxxis)</span>
                <span>Ưu tiên 2: <strong>ALPHA</strong> (Bridgestone/DRC)</span>
              </div>
            </div>

            {TIRE_CATALOG.map(t => (
              <div key={t.id} style={card}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                  <div>
                    <span style={{ fontWeight:700, fontSize:14 }}>{t.size}</span>
                    <Badge type={t.boBo==='kem'?'blu':'grn'} style={{ marginLeft:6 }}>Bố {t.boBo}</Badge>
                  </div>
                  <span style={{ ...s, textAlign:'right' }}>SL dự kiến 6T:<br/><strong>{t.soLuong6T} lốp</strong></span>
                </div>
                <div style={{ ...s, marginBottom:8 }}>🚛 {t.loaiXe}</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {[t.p1, t.p2].map((p, pi) => (
                    <div key={pi} style={{ padding:'8px 10px', background:'var(--color-bg-tertiary)', borderRadius:7 }}>
                      <Badge type={pi===0?'grn':'gry'}>Ưu tiên {pi+1}</Badge>
                      <div style={{ fontWeight:600, fontSize:12, marginTop:4 }}>{p.ncc}</div>
                      <div style={s}>{p.hang}</div>
                      <div style={s}>{p.xuatXu}</div>
                      <div style={{ marginTop:4, fontSize:13 }}>
                        <span style={s}>TĐP: </span><strong>{(p.tdp).toLocaleString('vi-VN')}đ</strong>
                      </div>
                      <div style={{ fontSize:13 }}>
                        <span style={s}>SĐP: </span><strong style={{ color:'var(--color-accent)' }}>{(p.sdp).toLocaleString('vi-VN')}đ</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
