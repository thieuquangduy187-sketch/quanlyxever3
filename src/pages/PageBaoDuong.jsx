// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📁 FRONTEND — quanlyxever3/src/pages/PageBaoDuong.jsx
// Design: flat, no border, dùng CSS variables của app
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { useState, useEffect, useRef } from 'react'

const API = import.meta.env.VITE_API_URL || 'https://hsg-backend.onrender.com'
const tok = () => localStorage.getItem('hsg_token') || ''
const apiFetch = (path, opts = {}) => fetch(`${API}${path}`, {
  ...opts,
  headers: { Authorization: `Bearer ${tok()}`, 'Content-Type': 'application/json', ...(opts.headers || {}) },
})

// ── Chu kỳ BD xe tải (HSH.QLTS-05 mục 6.1.3) ────────────
const BD_XETAI = [
  { moc: 5000,  items: ['Thay dầu động cơ','Kiểm tra lọc dầu/nước làm mát/dầu phanh','Kiểm tra rò rỉ','Siết bulong sàn thùng, chassis','Kiểm tra áp suất lốp','Kiểm tra ắc quy'] },
  { moc: 10000, items: ['Thay dầu động cơ','Vệ sinh lọc gió động cơ','Kiểm tra lọc nhiên liệu','Kiểm tra hệ thống treo','Kiểm tra bạc đạn bánh xe','Kiểm tra hệ thống điện'] },
  { moc: 15000, items: ['Thay dầu động cơ','Kiểm tra lọc dầu/nước làm mát/dầu phanh','Kiểm tra rò rỉ','Kiểm tra bố thắng','Siết bulong chassis','Kiểm tra áp suất lốp'] },
  { moc: 20000, items: ['Thay lọc nhiên liệu','Thay lọc gió','Cân chỉnh thước lái','Bổ sung dầu hộp số, dầu cầu','Kiểm tra phốt láp'] },
  { moc: 25000, items: ['Thay dầu động cơ','Kiểm tra lọc dầu/nước làm mát/dầu phanh','Kiểm tra rò rỉ','Siết bulong chassis','Kiểm tra áp suất lốp'] },
  { moc: 30000, items: ['Thay dầu hộp số','Thay dầu cầu','Thay dầu phanh','Thay nước mát','Kiểm tra turbo, kim phun','Kiểm tra cầu trục, máy lạnh'] },
]

// ── Bảng giá lốp — Tờ trình 3413/TTr/HS/PMH/0126 ────────
const TIRE_CATALOG = [
  { id:1,  size:'900R20-(18PR)',      boBo:'kem',   loaiXe:'Thaco 6.2T (thùng lửng/cẩu)',    soLuong6T:188,
    p1:{ ncc:'ALPHA',        hang:'Bridgestone 900R20 M789 TL', xuatXu:'Thái Lan', tdp:6534000, sdp:5450000 },
    p2:{ ncc:'LỐP XE VIỆT', hang:'Maxxis UR288 (gai xuôi)',    xuatXu:'Thái Lan', tdp:6240000, sdp:6240000 } },
  { id:2,  size:'11.00R20-(18PR)',    boBo:'kem',   loaiXe:'Thaco 14T (thùng bạt)',           soLuong6T:78,
    p1:{ ncc:'LỐP XE VIỆT', hang:'Maxxis UR288',    xuatXu:'Thái Lan', tdp:7111111, sdp:7111111 },
    p2:{ ncc:'ALPHA',        hang:'Bridgestone R150',xuatXu:'Thái Lan', tdp:8910000, sdp:7870000 } },
  { id:3,  size:'11.00-22-(18PR)',    boBo:'kem',   loaiXe:'Chenglong 8.2–8.4T',             soLuong6T:18,
    p1:{ ncc:'LỐP XE VIỆT', hang:'Maxxis UR288',    xuatXu:'Thái Lan', tdp:6488889, sdp:6488889 },
    p2:{ ncc:'ALPHA',        hang:'Bridgestone R150',xuatXu:'Thái Lan', tdp:8910000, sdp:7870000 } },
  { id:4,  size:'750-16-(18PR)',      boBo:'nylon', loaiXe:'Mitsubishi/Veam',                soLuong6T:18,
    p1:{ ncc:'LỐP XE VIỆT', hang:'Maxxis M276',     xuatXu:'Việt Nam', tdp:2603780, sdp:2603780 },
    p2:{ ncc:'ALPHA',        hang:'Bridgestone R288',xuatXu:'Thái Lan', tdp:4374000, sdp:3950000 } },
  { id:5,  size:'10.00R20-(18PR)',    boBo:'kem',   loaiXe:'Hino 6.75–8.4T',                 soLuong6T:32,
    p1:{ ncc:'LỐP XE VIỆT', hang:'Maxxis UR288',    xuatXu:'Thái Lan', tdp:6720000, sdp:6720000 },
    p2:{ ncc:'ALPHA',        hang:'Bridgestone R150',xuatXu:'Thái Lan', tdp:8478000, sdp:7450000 } },
  { id:6,  size:'245/70R19.5-(18PR)',boBo:'kem',   loaiXe:'Hyundai 12.35T',                  soLuong6T:6,
    p1:{ ncc:'ALPHA',        hang:'Bridgestone',     xuatXu:'Thái Lan', tdp:5346000, sdp:4750000 },
    p2:{ ncc:'LỐP XE VIỆT', hang:'Maxxis UR275',    xuatXu:'Thái Lan', tdp:4591667, sdp:4591667 } },
  { id:7,  size:'8.25R16-(18PR)',     boBo:'nylon', loaiXe:'Thaco 3.45T (thùng bạt)',        soLuong6T:6,
    p1:{ ncc:'LỐP XE VIỆT', hang:'Maxxis M276',     xuatXu:'Việt Nam', tdp:2955260, sdp:2955260 },
    p2:{ ncc:'ALPHA',        hang:'Bridgestone BS585',xuatXu:'Thái Lan',tdp:4914000, sdp:4250000 } },
  { id:8,  size:'7.00R16-(16PR)',     boBo:'nylon', loaiXe:'Mitsubishi/Veam (nhỏ)',          soLuong6T:48,
    p1:{ ncc:'LỐP XE VIỆT', hang:'Maxxis MA265',    xuatXu:'Việt Nam', tdp:2083630, sdp:2083630 },
    p2:{ ncc:'ALPHA',        hang:'DRC bố nylon',    xuatXu:'Việt Nam', tdp:2390000, sdp:2570000 } },
  { id:9,  size:'205/65R15',          boBo:'kem',   loaiXe:'Toyota Innova',                  soLuong6T:7,
    p1:{ ncc:'LỐP XE VIỆT', hang:'Maxxis MAP5',     xuatXu:'Thái Lan', tdp:1498148, sdp:1205000 },
    p2:{ ncc:'ALPHA',        hang:'Bridgestone B390',xuatXu:'Thái Lan', tdp:2030400, sdp:1750000 } },
  { id:10, size:'265/65R17',          boBo:'kem',   loaiXe:'Toyota/Ford bán tải',            soLuong6T:4,
    p1:{ ncc:'LỐP XE VIỆT', hang:'Maxxis HT780',    xuatXu:'Thái Lan', tdp:2981481, sdp:2567000 },
    p2:{ ncc:'ALPHA',        hang:'Bridgestone D684',xuatXu:'Thái Lan', tdp:3952800, sdp:3370000 } },
]

// vị trí lốp theo cấu hình
const VT_LOP = {
  '4':  ['tt_trai','tt_phai','ts_trai','ts_phai'],
  '6':  ['tt_trai','tt_phai','ts_nt','ts_tt','ts_np','ts_tp'],
  '10': ['tt_trai','tt_phai','t2_nt','t2_tt','t2_np','t2_tp','t3_nt','t3_tt','t3_np','t3_tp'],
  '12': ['tt_trai','tt_phai','t2_nt','t2_tt','t2_np','t2_tp','t3_nt','t3_tt','t3_np','t3_tp','t4_nt','t4_np'],
}
const VT_LABEL = {
  tt_trai:'CT · trái', tt_phai:'CT · phải',
  ts_trai:'CS · trái', ts_phai:'CS · phải',
  ts_nt:'CS · ngoài trái', ts_tt:'CS · trong trái', ts_np:'CS · ngoài phải', ts_tp:'CS · trong phải',
  t2_nt:'C2 · NT', t2_tt:'C2 · TT', t2_np:'C2 · NP', t2_tp:'C2 · TP',
  t3_nt:'C3 · NT', t3_tt:'C3 · TT', t3_np:'C3 · NP', t3_tp:'C3 · TP',
  t4_nt:'C4 · NT', t4_np:'C4 · NP',
}
const DOCS_FIELDS = [
  { k:'dangKy',          label:'Đăng ký xe' },
  { k:'dangKiem',        label:'Đăng kiểm' },
  { k:'baoHiemBatBuoc',  label:'BH bắt buộc (TNDS)' },
  { k:'baoHiemThuHai',   label:'BH thứ 2 (vật chất xe)' },
  { k:'phuHieu',         label:'Phù hiệu' },
  { k:'kiemDinhCau',     label:'Kiểm định cầu' },
]
const LOAI_LABEL = { baoDuongDinhKy:'BD định kỳ', suaChuaPhatSinh:'Sửa chữa', suaChuaTaiNan:'Tai nạn', baoHanh:'Bảo hành' }
const fmt = n => Number(n||0).toLocaleString('vi-VN')

// ── Pill Badge ────────────────────────────────────────────
function Pill({ color='var(--ink3)', bg='var(--fill-tertiary)', children }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', padding:'2px 9px',
      borderRadius:20, fontSize:11, fontWeight:600, color, background:bg, whiteSpace:'nowrap' }}>
      {children}
    </span>
  )
}

// ── Stat card (tổng quan) ─────────────────────────────────
function StatCard({ val, label, color='var(--ink)' }) {
  return (
    <div style={{ background:'var(--bg-card)', borderRadius:12, padding:'14px 16px' }}>
      <div style={{ fontSize:26, fontWeight:700, color, lineHeight:1 }}>{val}</div>
      <div style={{ fontSize:12, color:'var(--ink3)', marginTop:4 }}>{label}</div>
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────
function Empty({ icon, title, sub, cta, onCta }) {
  return (
    <div style={{ textAlign:'center', padding:'40px 20px' }}>
      <div style={{ fontSize:36, marginBottom:10 }}>{icon}</div>
      <div style={{ fontWeight:600, fontSize:14, color:'var(--ink)', marginBottom:6 }}>{title}</div>
      <div style={{ fontSize:12, color:'var(--ink3)', marginBottom:16 }}>{sub}</div>
      {cta && <button onClick={onCta} style={BTN_PRIMARY}>{cta}</button>}
    </div>
  )
}

// ── Button styles ─────────────────────────────────────────
const BTN_PRIMARY = {
  background:'var(--brand)', color:'#fff', border:'none',
  borderRadius:8, padding:'8px 18px', fontSize:13, fontWeight:600, cursor:'pointer',
}
const BTN_GHOST = {
  background:'var(--fill-tertiary)', color:'var(--ink2)', border:'none',
  borderRadius:8, padding:'7px 14px', fontSize:12, cursor:'pointer',
}
const INPUT = {
  width:'100%', padding:'8px 11px', background:'var(--fill-tertiary)',
  border:'none', borderRadius:8, fontSize:13, color:'var(--ink)',
  outline:'none', boxSizing:'border-box',
}

// ── Form thêm phiếu BDSC ──────────────────────────────────
function FormBDSC({ vehicles, onSave, onCancel }) {
  const [form, setForm] = useState({
    bienSo:'', ngay:new Date().toISOString().slice(0,10),
    kmThoiDiem:'', gara:'', tinhThanh:'', loaiBdsc:'suaChuaPhatSinh', ghiChu:'',
  })
  const [hm,    setHm]    = useState([{ ten:'', loai:'suaChua', donGia:'', soLuong:1, donVi:'cái' }])
  const [files, setFiles] = useState([])
  const [saving,setSaving]= useState(false)
  const [warn,  setWarn]  = useState('')
  const fileRef = useRef()

  const sf = k => e => setForm(p => ({ ...p, [k]:e.target.value }))

  const tongCong  = hm.filter(h=>h.loai!=='vatTu').reduce((s,h)=>s+(+h.donGia||0)*(+h.soLuong||1),0)
  const tongVatTu = hm.filter(h=>h.loai==='vatTu').reduce((s,h)=>s+(+h.donGia||0)*(+h.soLuong||1),0)
  const tongTien  = tongCong + tongVatTu

  const handleSave = async () => {
    if (!form.bienSo || !form.kmThoiDiem) return alert('Vui lòng chọn xe và nhập km')
    setSaving(true)
    try {
      const payload = { ...form, kmThoiDiem:+form.kmThoiDiem,
        hangMuc: hm.map(h=>({ ...h, donGia:+h.donGia||0, soLuong:+h.soLuong||1,
          thanhTien:(+h.donGia||0)*(+h.soLuong||1) })),
        tongCong, tongVatTu, tongTien, anhBaoGia:files.map(f=>f.name) }
      const res  = await apiFetch('/api/bdsc', { method:'POST', body:JSON.stringify(payload) })
      const data = await res.json()
      if (data.canhBao) { setWarn(data.canhBao); setSaving(false); return }
      onSave(data)
    } catch(e) { alert(e.message); setSaving(false) }
  }

  if (warn) return (
    <div style={{ background:'var(--bg-card)', borderRadius:12, padding:16, marginBottom:12 }}>
      <div style={{ fontWeight:700, color:'var(--amber)', marginBottom:8 }}>⚠ Phát hiện bất thường</div>
      <div style={{ fontSize:13, color:'var(--ink2)', marginBottom:14 }}>{warn}</div>
      <div style={{ display:'flex', gap:8 }}>
        <button style={{ ...BTN_PRIMARY, background:'var(--amber)' }}
          onClick={()=>{ setWarn(''); onSave({}) }}>Vẫn lưu</button>
        <button style={BTN_GHOST} onClick={()=>setWarn('')}>Xem lại</button>
      </div>
    </div>
  )

  return (
    <div style={{ background:'var(--bg-card)', borderRadius:12, padding:16, marginBottom:12 }}>
      <div style={{ fontWeight:700, fontSize:14, color:'var(--ink)', marginBottom:14 }}>Thêm phiếu BDSC</div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
        {[
          { label:'Biển số *', el: <select style={INPUT} value={form.bienSo} onChange={sf('bienSo')}>
              <option value=''>— Chọn xe —</option>
              {vehicles.map(v=>{ const b=v['BIỂN SỐ']||v['BIẼNSỐ']||v['Biển số']||''; return <option key={v._id} value={b}>{b}</option> })}
            </select> },
          { label:'Loại', el: <select style={INPUT} value={form.loaiBdsc} onChange={sf('loaiBdsc')}>
              {Object.entries(LOAI_LABEL).map(([k,v])=><option key={k} value={k}>{v}</option>)}
            </select> },
          { label:'Ngày *',        el:<input style={INPUT} type='date' value={form.ngay} onChange={sf('ngay')} /> },
          { label:'KM tại thời điểm *', el:<input style={INPUT} type='number' placeholder='145000' value={form.kmThoiDiem} onChange={sf('kmThoiDiem')} /> },
          { label:'Gara',          el:<input style={INPUT} placeholder='Tên gara' value={form.gara} onChange={sf('gara')} /> },
          { label:'Tỉnh/thành',   el:<input style={INPUT} placeholder='TP.HCM' value={form.tinhThanh} onChange={sf('tinhThanh')} /> },
        ].map(({ label, el }) => (
          <div key={label}>
            <div style={{ fontSize:11, color:'var(--ink3)', marginBottom:4 }}>{label}</div>
            {el}
          </div>
        ))}
      </div>

      {/* Hạng mục */}
      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:11, color:'var(--ink3)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.05em' }}>Hạng mục</div>
        {hm.map((h,i) => (
          <div key={i} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 90px 64px 58px 28px', gap:6, marginBottom:6 }}>
            <input style={INPUT} placeholder='Tên hạng mục' value={h.ten}
              onChange={e=>setHm(p=>p.map((x,j)=>j===i?{...x,ten:e.target.value}:x))} />
            <select style={INPUT} value={h.loai}
              onChange={e=>setHm(p=>p.map((x,j)=>j===i?{...x,loai:e.target.value}:x))}>
              <option value='baoDuong'>BD định kỳ</option>
              <option value='suaChua'>Sửa chữa</option>
              <option value='vatTu'>Vật tư</option>
              <option value='giaCong'>Gia công</option>
            </select>
            <input style={INPUT} type='number' placeholder='Đơn giá' value={h.donGia}
              onChange={e=>setHm(p=>p.map((x,j)=>j===i?{...x,donGia:e.target.value}:x))} />
            <input style={INPUT} type='number' placeholder='SL' value={h.soLuong}
              onChange={e=>setHm(p=>p.map((x,j)=>j===i?{...x,soLuong:e.target.value}:x))} />
            <input style={INPUT} placeholder='ĐVT' value={h.donVi}
              onChange={e=>setHm(p=>p.map((x,j)=>j===i?{...x,donVi:e.target.value}:x))} />
            <button onClick={()=>setHm(p=>p.filter((_,j)=>j!==i))}
              style={{ ...BTN_GHOST, padding:'0 6px', color:'var(--apple-red)' }}>✕</button>
          </div>
        ))}
        <button style={BTN_GHOST}
          onClick={()=>setHm(p=>[...p,{ten:'',loai:'suaChua',donGia:'',soLuong:1,donVi:'cái'}])}>
          + Hạng mục
        </button>
      </div>

      {/* Tổng */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12,
        padding:12, background:'var(--fill-tertiary)', borderRadius:10 }}>
        {[['Công/gia công', fmt(tongCong)+'đ'], ['Vật tư', fmt(tongVatTu)+'đ'],
          ['Tổng cộng', fmt(tongTien)+'đ']].map(([l,v],i) => (
          <div key={l}>
            <div style={{ fontSize:11, color:'var(--ink3)' }}>{l}</div>
            <div style={{ fontWeight:700, fontSize:13, color:i===2?'var(--brand)':'var(--ink)' }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Files */}
      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:11, color:'var(--ink3)', marginBottom:6 }}>Ảnh báo giá / PDF (nhiều file)</div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button style={BTN_GHOST} onClick={()=>fileRef.current?.click()}>📎 Chọn file</button>
          <input ref={fileRef} type='file' multiple accept='image/*,.pdf' style={{ display:'none' }}
            onChange={e=>setFiles(p=>[...p,...Array.from(e.target.files)])} />
          <span style={{ fontSize:12, color:'var(--ink3)' }}>{files.length ? `${files.length} file` : 'Chưa chọn'}</span>
        </div>
        {files.length > 0 && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:6 }}>
            {files.map((f,i)=>(
              <span key={i} style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11,
                color:'var(--ink2)', background:'var(--fill-tertiary)', padding:'3px 8px', borderRadius:6 }}>
                {f.name.length>20?f.name.slice(0,18)+'…':f.name}
                <span style={{ cursor:'pointer', color:'var(--apple-red)' }}
                  onClick={()=>setFiles(p=>p.filter((_,j)=>j!==i))}>✕</span>
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:11, color:'var(--ink3)', marginBottom:4 }}>Ghi chú</div>
        <textarea style={{ ...INPUT, height:60, resize:'vertical' }} value={form.ghiChu} onChange={sf('ghiChu')} />
      </div>

      <div style={{ display:'flex', gap:8 }}>
        <button style={BTN_PRIMARY} onClick={handleSave} disabled={saving}>
          {saving ? 'Đang lưu…' : 'Lưu phiếu'}
        </button>
        <button style={BTN_GHOST} onClick={onCancel}>Huỷ</button>
      </div>
    </div>
  )
}

// ── Sơ đồ lốp ────────────────────────────────────────────
function LopDiagram({ cauHinh, viTriLop, kmHienTai, onClickVt }) {
  const vts = VT_LOP[cauHinh] || VT_LOP['6']
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
      {vts.map(vt => {
        const d = (viTriLop||[]).find(v=>v.viTri===vt)
        const km = d && kmHienTai ? kmHienTai-(d.kmLap||0) : null
        const chu = d?.boBo==='kem' ? 80000 : 50000
        const pct = km ? km/chu : 0
        const clr = pct>=1 ? 'var(--apple-red)' : pct>=0.85 ? 'var(--amber)' : pct>0 ? 'var(--green)' : 'var(--ink3)'
        const bg  = pct>=1 ? 'rgba(215,0,21,.08)' : pct>=0.85 ? 'rgba(196,85,0,.08)' : pct>0 ? 'rgba(26,127,55,.08)' : 'var(--fill-tertiary)'
        return (
          <div key={vt} onClick={()=>onClickVt(vt,d||{})}
            style={{ minWidth:80, padding:'8px 10px', background:bg, borderRadius:10, cursor:'pointer',
              textAlign:'center', transition:'opacity .15s' }}>
            <div style={{ fontSize:10, color:'var(--ink3)', marginBottom:2 }}>{VT_LABEL[vt]||vt}</div>
            <div style={{ fontSize:11, fontWeight:600, color:clr }}>{d?.loaiLop||'—'}</div>
            {km!==null && <div style={{ fontSize:10, color:clr }}>{(km/1000).toFixed(0)}k km</div>}
          </div>
        )
      })}
    </div>
  )
}

// ── Modal lốp ────────────────────────────────────────────
function TireModal({ viTri, data, onSave, onClose }) {
  const [f, setF] = useState({ viTri, loaiLop:'', boBo:'kem', thuongHieu:'', ncc:'', kmLap:'', ngayLap:'', ...data })
  const sf = k => e => setF(p=>({...p,[k]:e.target.value}))
  const match = TIRE_CATALOG.find(t => f.loaiLop && (f.loaiLop.includes(t.size.replace('R','').split('-')[0]) || t.size===f.loaiLop))
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:1000,
      display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'var(--bg-card)', borderRadius:16, padding:20, width:340,
        maxHeight:'88vh', overflowY:'auto' }}>
        <div style={{ fontWeight:700, fontSize:14, color:'var(--ink)', marginBottom:14 }}>
          {VT_LABEL[viTri]||viTri}
        </div>
        {[
          { label:'Size lốp', el:<select style={INPUT} value={f.loaiLop} onChange={sf('loaiLop')}>
              <option value=''>— Chọn size —</option>
              {TIRE_CATALOG.map(t=><option key={t.id} value={t.size}>{t.size} · {t.loaiXe}</option>)}
            </select> },
          { label:'Loại bố', el:<select style={INPUT} value={f.boBo} onChange={sf('boBo')}>
              <option value='nylon'>Bố nylon (thay 50.000km)</option>
              <option value='kem'>Bố kẽm (thay 80.000km)</option>
            </select> },
          { label:'Thương hiệu', el:<input style={INPUT} placeholder='Maxxis / Bridgestone / DRC' value={f.thuongHieu} onChange={sf('thuongHieu')} /> },
          { label:'NCC', el:<input style={INPUT} placeholder='LỐP XE VIỆT / ALPHA' value={f.ncc} onChange={sf('ncc')} /> },
        ].map(({label,el})=>(
          <div key={label} style={{ marginBottom:10 }}>
            <div style={{ fontSize:11, color:'var(--ink3)', marginBottom:4 }}>{label}</div>
            {el}
          </div>
        ))}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
          {[['KM lúc lắp','number','145000','kmLap'],['Ngày lắp','date','','ngayLap']].map(([l,t,ph,k])=>(
            <div key={k}>
              <div style={{ fontSize:11, color:'var(--ink3)', marginBottom:4 }}>{l}</div>
              <input style={INPUT} type={t} placeholder={ph} value={f[k]} onChange={sf(k)} />
            </div>
          ))}
        </div>
        {match && (
          <div style={{ padding:'10px 12px', background:'rgba(0,85,204,.07)', borderRadius:10, marginBottom:12 }}>
            <div style={{ fontSize:11, color:'var(--apple-blue)', fontWeight:600, marginBottom:4 }}>
              💡 Giá duyệt TTr 3413/2026 · đến 30/06/2026
            </div>
            <div style={{ fontSize:13, color:'var(--ink)', fontWeight:700 }}>
              {fmt(match.p1.sdp)}đ <span style={{ fontWeight:400, color:'var(--ink3)' }}>({match.p1.ncc})</span>
            </div>
          </div>
        )}
        <div style={{ display:'flex', gap:8 }}>
          <button style={BTN_GHOST} onClick={onClose}>Đóng</button>
          <button style={{ ...BTN_PRIMARY, flex:1 }} onClick={()=>onSave(f)}>Lưu</button>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════
export default function PageBaoDuong({ token, user }) {
  const TABS = [
    { id:'overview', label:'Tổng quan' },
    { id:'alert',    label:'Cảnh báo' },
    { id:'bdsc',     label:'Phiếu BDSC' },
    { id:'timeline', label:'Timeline' },
    { id:'tire',     label:'Lốp xe' },
    { id:'docs',     label:'Giấy tờ' },
    { id:'catalog',  label:'Bảng giá lốp' },
  ]

  const [tab,        setTab]       = useState('overview')
  const [vehicles,   setVehicles]  = useState([])
  const [bdAlerts,   setBdAlerts]  = useState([])
  const [docsAlerts, setDocsAlerts]= useState([])
  const [history,    setHistory]   = useState([])
  const [loading,    setLoading]   = useState(true)
  const [showForm,   setShowForm]  = useState(false)

  const [selVe,    setSelVe]    = useState('')
  const [veHistory,setVeHistory]= useState([])

  const [tireVe,   setTireVe]   = useState('')
  const [lopData,  setLopData]  = useState({ cauHinh:'6', viTriLop:[] })
  const [tireModal,setTireModal]= useState(null)

  const [docsVe,   setDocsVe]   = useState('')
  const [docsData, setDocsData] = useState({})

  useEffect(() => {
    Promise.all([
      apiFetch('/api/xe/all').then(r=>r.json()).catch(()=>[]),
      apiFetch('/api/bdsc/alerts').then(r=>r.json()).catch(()=>[]),
      apiFetch('/api/bdsc/docs-alerts').then(r=>r.json()).catch(()=>[]),
      apiFetch('/api/bdsc?limit=100').then(r=>r.json()).catch(()=>({ data:[] })),
    ]).then(([xe,al,da,bd]) => {
      setVehicles(Array.isArray(xe)?xe:[])
      setBdAlerts(Array.isArray(al)?al:[])
      setDocsAlerts(Array.isArray(da)?da:[])
      setHistory(Array.isArray(bd?.data)?bd.data:[])
    }).finally(()=>setLoading(false))
  }, [])

  const loadVeHistory = async (bs) => {
    if (!bs) return
    const d = await apiFetch(`/api/bdsc/history/${bs}`).then(r=>r.json()).catch(()=>[])
    setVeHistory(Array.isArray(d)?d:[])
  }

  const loadTire = async (bs) => {
    if (!bs) return
    const d = await apiFetch(`/api/bdsc/tire/${bs}`).then(r=>r.json()).catch(()=>({ cauHinh:'6', viTriLop:[] }))
    setLopData(d)
  }

  const loadDocs = async (bs) => {
    if (!bs) return
    const d = await apiFetch(`/api/bdsc/docs/${bs}`).then(r=>r.json()).catch(()=>({}))
    setDocsData(d||{})
  }

  const saveTireVt = async (vtData) => {
    const next = { ...lopData, viTriLop: [...(lopData.viTriLop||[]).filter(v=>v.viTri!==vtData.viTri), vtData] }
    const res  = await apiFetch(`/api/bdsc/tire/${tireVe}`, { method:'PUT', body:JSON.stringify(next) })
    const d    = await res.json(); setLopData(d); setTireModal(null)
  }

  const saveDocs = async () => {
    if (!docsVe) return
    await apiFetch(`/api/bdsc/docs/${docsVe}`, { method:'PUT', body:JSON.stringify(docsData) })
  }

  const critBD   = bdAlerts.filter(a=>a.status==='crit').length
  const warnBD   = bdAlerts.filter(a=>a.status==='warn').length
  const critDocs = docsAlerts.filter(a=>a.diffDays<=15).length

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200, color:'var(--ink3)', fontSize:13 }}>
      Đang tải…
    </div>
  )

  return (
    <div style={{ paddingBottom:40 }}>

      {/* ── Header ── */}
      <div style={{ padding:'16px 16px 0', display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:700, color:'var(--ink)' }}>Bảo dưỡng & Sửa chữa</div>
          <div style={{ fontSize:12, color:'var(--ink3)', marginTop:2 }}>
            {vehicles.length} xe · {history.length} phiếu BDSC
          </div>
        </div>
        <button style={BTN_PRIMARY} onClick={()=>{ setShowForm(true); setTab('bdsc') }}>
          + Thêm phiếu
        </button>
      </div>

      {/* ── Tab bar ── */}
      <div style={{ display:'flex', overflowX:'auto', padding:'0 16px', gap:2, marginBottom:14,
        borderBottom:'1px solid var(--sep)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            padding:'9px 14px', fontSize:13, fontWeight:tab===t.id?600:400,
            background:'transparent', border:'none', borderBottom:tab===t.id?'2px solid var(--brand)':'2px solid transparent',
            color:tab===t.id?'var(--brand)':'var(--ink3)', cursor:'pointer', whiteSpace:'nowrap',
            display:'flex', alignItems:'center', gap:5,
          }}>
            {t.label}
            {t.id==='alert' && (critBD+warnBD+critDocs)>0 && (
              <span style={{ background:'var(--apple-red)', color:'#fff',
                borderRadius:10, padding:'1px 6px', fontSize:10, fontWeight:700 }}>
                {critBD+warnBD+critDocs}
              </span>
            )}
          </button>
        ))}
      </div>

      <div style={{ padding:'0 16px' }}>

        {/* ══ TỔNG QUAN ══ */}
        {tab==='overview' && (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
              <StatCard val={critBD}          label='Xe quá hạn BD'       color='var(--apple-red)' />
              <StatCard val={warnBD}          label='Xe sắp đến hạn'      color='var(--amber)' />
              <StatCard val={critDocs}        label='Giấy tờ sắp hết hạn' color='var(--amber)' />
              <StatCard val={history.length}  label='Tổng phiếu BDSC'     color='var(--brand)' />
            </div>

            <div style={{ fontSize:12, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>
              Phiếu BDSC gần nhất
            </div>
            {history.length === 0
              ? <Empty icon='🔧' title='Chưa có phiếu nào'
                  sub='Nhấn "+ Thêm phiếu" để bắt đầu ghi nhận bảo dưỡng & sửa chữa'
                  cta='+ Thêm phiếu' onCta={()=>{ setShowForm(true); setTab('bdsc') }} />
              : history.slice(0,5).map(h=>(
                <div key={h._id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                  padding:'10px 0', borderBottom:'1px solid var(--sep)' }}>
                  <div>
                    <span style={{ fontWeight:600, color:'var(--ink)', fontSize:13 }}>{h.bienSo}</span>
                    <span style={{ fontSize:12, color:'var(--ink3)', marginLeft:8 }}>
                      {new Date(h.ngay).toLocaleDateString('vi-VN')} · {fmt(h.kmThoiDiem)}km
                    </span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    {h.canhBao && <Pill color='var(--amber)' bg='rgba(196,85,0,.1)'>⚠</Pill>}
                    <Pill color={h.loaiBdsc==='baoDuongDinhKy'?'var(--green)':'var(--apple-blue)'}
                      bg={h.loaiBdsc==='baoDuongDinhKy'?'rgba(26,127,55,.1)':'rgba(0,85,204,.1)'}>
                      {LOAI_LABEL[h.loaiBdsc]||h.loaiBdsc}
                    </Pill>
                    <span style={{ fontWeight:700, fontSize:13, color:'var(--ink)' }}>{fmt(h.tongTien)}đ</span>
                  </div>
                </div>
              ))
            }

            <div style={{ fontSize:12, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:'0.05em', marginTop:20, marginBottom:8 }}>
              Chu kỳ bảo dưỡng xe tải (HSH.QLTS-05 · 6.1.3)
            </div>
            {BD_XETAI.map(b=>(
              <div key={b.moc} style={{ display:'flex', gap:10, padding:'8px 0', borderBottom:'1px solid var(--sep)', fontSize:12 }}>
                <span style={{ fontWeight:700, color:'var(--brand)', minWidth:52 }}>{(b.moc).toLocaleString()}km</span>
                <span style={{ color:'var(--ink2)' }}>{b.items.slice(0,3).join(' · ')}{b.items.length>3?` +${b.items.length-3}`:''}</span>
              </div>
            ))}
          </>
        )}

        {/* ══ CẢNH BÁO ══ */}
        {tab==='alert' && (
          <>
            {bdAlerts.length===0 && docsAlerts.length===0
              ? <Empty icon='✅' title='Không có cảnh báo'
                  sub={vehicles.length===0 ? 'Chưa có xe trong hệ thống' : 'Tất cả xe đang trong chu kỳ bảo dưỡng an toàn'} />
              : null
            }

            {bdAlerts.length>0 && (
              <>
                <div style={{ fontSize:12, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>
                  Bảo dưỡng định kỳ
                </div>
                {bdAlerts.map((a,i)=>(
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'1px solid var(--sep)' }}>
                    <Pill color={a.status==='crit'?'var(--apple-red)':'var(--amber)'}
                      bg={a.status==='crit'?'rgba(215,0,21,.1)':'rgba(196,85,0,.1)'}>
                      {a.status==='crit'?'Quá hạn':Math.round((a.pct||0)*100)+'%'}
                    </Pill>
                    <div style={{ flex:1 }}>
                      <span style={{ fontWeight:600, color:'var(--ink)' }}>{a.bienSo}</span>
                      <span style={{ fontSize:12, color:'var(--ink3)', marginLeft:8 }}>
                        Mốc {fmt(a.mocTiepTheo)}km · còn {fmt(a.conLai)}km
                      </span>
                    </div>
                    {a.ngayCuoiBD && (
                      <span style={{ fontSize:11, color:'var(--ink3)' }}>
                        BD cuối: {new Date(a.ngayCuoiBD).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                  </div>
                ))}
              </>
            )}

            {docsAlerts.length>0 && (
              <>
                <div style={{ fontSize:12, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:'0.05em', marginTop:20, marginBottom:8 }}>
                  Giấy tờ sắp hết hạn
                </div>
                {docsAlerts.map((a,i)=>{
                  const lbl = DOCS_FIELDS.find(f=>f.k===a.field)?.label||a.field
                  return (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'1px solid var(--sep)' }}>
                      <Pill color={a.diffDays<=0?'var(--apple-red)':a.diffDays<=15?'var(--apple-red)':'var(--amber)'}
                        bg={a.diffDays<=15?'rgba(215,0,21,.1)':'rgba(196,85,0,.1)'}>
                        {a.diffDays<=0?'Hết hạn':`${a.diffDays}ngày`}
                      </Pill>
                      <span style={{ fontWeight:600, color:'var(--ink)' }}>{a.bienSo}</span>
                      <span style={{ fontSize:12, color:'var(--ink3)' }}>— {lbl}</span>
                      <span style={{ marginLeft:'auto', fontSize:11, color:'var(--ink3)' }}>
                        {new Date(a.ngayHetHan).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  )
                })}
              </>
            )}
          </>
        )}

        {/* ══ PHIẾU BDSC ══ */}
        {tab==='bdsc' && (
          <>
            {showForm
              ? <FormBDSC vehicles={vehicles}
                  onSave={d=>{ setShowForm(false); if(d?._id) setHistory(p=>[d,...p]) }}
                  onCancel={()=>setShowForm(false)} />
              : <button style={{ ...BTN_PRIMARY, marginBottom:14 }} onClick={()=>setShowForm(true)}>
                  + Thêm phiếu BDSC
                </button>
            }
            {history.length===0
              ? <Empty icon='🔧' title='Chưa có phiếu nào'
                  sub='Ghi nhận mỗi lần BDSC để theo dõi chi phí và phát hiện bất thường' />
              : history.map(h=>(
                <div key={h._id} style={{ padding:'10px 0', borderBottom:'1px solid var(--sep)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                        <span style={{ fontWeight:600, color:'var(--ink)', fontSize:13 }}>{h.bienSo}</span>
                        <Pill color={h.loaiBdsc==='baoDuongDinhKy'?'var(--green)':'var(--apple-blue)'}
                          bg={h.loaiBdsc==='baoDuongDinhKy'?'rgba(26,127,55,.1)':'rgba(0,85,204,.1)'}>
                          {LOAI_LABEL[h.loaiBdsc]}
                        </Pill>
                        {h.canhBao && <Pill color='var(--amber)' bg='rgba(196,85,0,.1)'>⚠ Bất thường</Pill>}
                      </div>
                      <div style={{ fontSize:12, color:'var(--ink3)' }}>
                        {new Date(h.ngay).toLocaleDateString('vi-VN')} · {fmt(h.kmThoiDiem)}km
                        {h.gara ? ` · ${h.gara}` : ''}{h.tinhThanh ? ` (${h.tinhThanh})` : ''}
                      </div>
                      {(h.hangMuc||[]).length>0 && (
                        <div style={{ fontSize:12, color:'var(--ink2)', marginTop:3 }}>
                          {h.hangMuc.map(m=>m.ten).slice(0,3).join(' · ')}
                          {h.hangMuc.length>3?` +${h.hangMuc.length-3} nữa`:''}
                        </div>
                      )}
                      {h.canhBao && <div style={{ fontSize:11, color:'var(--amber)', marginTop:3 }}>{h.canhBao}</div>}
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontWeight:700, fontSize:14, color:'var(--ink)' }}>{fmt(h.tongTien)}đ</div>
                      {h.tongCong>0 && <div style={{ fontSize:11, color:'var(--ink3)' }}>Công {fmt(h.tongCong)}đ</div>}
                    </div>
                  </div>
                </div>
              ))
            }
          </>
        )}

        {/* ══ TIMELINE ══ */}
        {tab==='timeline' && (
          <>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, color:'var(--ink3)', marginBottom:4 }}>Chọn xe</div>
              <select style={INPUT} value={selVe} onChange={e=>{ setSelVe(e.target.value); loadVeHistory(e.target.value) }}>
                <option value=''>— Chọn xe —</option>
                {vehicles.map(v=>{ const b=v['BIỂN SỐ']||v['BIẼNSỐ']||v['Biển số']||''; return <option key={v._id} value={b}>{b}</option> })}
              </select>
            </div>
            {!selVe
              ? <Empty icon='📈' title='Chọn xe để xem timeline' sub='Timeline hiển thị toàn bộ lịch sử BDSC theo km' />
              : veHistory.length===0
                ? <Empty icon='📭' title={`${selVe} chưa có phiếu BDSC nào`} sub='' />
                : (()=>{
                  const total = veHistory.reduce((s,h)=>s+(h.tongTien||0),0)
                  return (
                    <>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:16 }}>
                        <StatCard val={veHistory.length} label='Lần sửa' color='var(--brand)' />
                        <StatCard val={fmt(total)+'đ'} label='Tổng chi phí' color='var(--ink)' />
                        <StatCard val={veHistory.length?fmt(Math.round(total/veHistory.length))+'đ':'—'} label='Trung bình/lần' color='var(--ink3)' />
                      </div>
                      <div style={{ position:'relative', paddingLeft:20 }}>
                        <div style={{ position:'absolute', left:6, top:6, bottom:6, width:2, background:'var(--sep)' }} />
                        {[...veHistory].sort((a,b)=>b.kmThoiDiem-a.kmThoiDiem).map(h=>(
                          <div key={h._id} style={{ position:'relative', marginBottom:14 }}>
                            <div style={{ position:'absolute', left:-17, top:4, width:10, height:10, borderRadius:'50%',
                              background:h.canhBao?'var(--amber)':'var(--brand)', border:'2px solid var(--bg)' }} />
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                              <div>
                                <div style={{ display:'flex', gap:6, alignItems:'center', marginBottom:2 }}>
                                  <Pill color={h.loaiBdsc==='baoDuongDinhKy'?'var(--green)':'var(--apple-blue)'}
                                    bg={h.loaiBdsc==='baoDuongDinhKy'?'rgba(26,127,55,.1)':'rgba(0,85,204,.1)'}>
                                    {LOAI_LABEL[h.loaiBdsc]}
                                  </Pill>
                                  <span style={{ fontSize:12, fontWeight:600, color:'var(--ink)' }}>{fmt(h.kmThoiDiem)}km</span>
                                  <span style={{ fontSize:11, color:'var(--ink3)' }}>{new Date(h.ngay).toLocaleDateString('vi-VN')}</span>
                                </div>
                                {h.gara && <span style={{ fontSize:12, color:'var(--ink3)' }}>{h.gara}</span>}
                                {(h.hangMuc||[]).length>0 && (
                                  <div style={{ fontSize:12, color:'var(--ink2)', marginTop:2 }}>
                                    {h.hangMuc.map(m=>m.ten).slice(0,3).join(' · ')}
                                  </div>
                                )}
                                {h.canhBao && <div style={{ fontSize:11, color:'var(--amber)', marginTop:2 }}>⚠ {h.canhBao}</div>}
                              </div>
                              <span style={{ fontWeight:700, color:'var(--ink)', fontSize:13, flexShrink:0, marginLeft:8 }}>
                                {fmt(h.tongTien)}đ
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )
                })()
            }
          </>
        )}

        {/* ══ LỐP XE ══ */}
        {tab==='tire' && (
          <>
            <div style={{ display:'flex', gap:8, marginBottom:14 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11, color:'var(--ink3)', marginBottom:4 }}>Chọn xe</div>
                <select style={INPUT} value={tireVe} onChange={e=>{ setTireVe(e.target.value); loadTire(e.target.value) }}>
                  <option value=''>— Chọn xe —</option>
                  {vehicles.map(v=>{ const b=v['BIỂN SỐ']||v['BIẼNSỐ']||v['Biển số']||''; return <option key={v._id} value={b}>{b}</option> })}
                </select>
              </div>
              {tireVe && (
                <div>
                  <div style={{ fontSize:11, color:'var(--ink3)', marginBottom:4 }}>Cấu hình</div>
                  <select style={{ ...INPUT, width:130 }} value={lopData.cauHinh||'6'}
                    onChange={e=>setLopData(p=>({...p,cauHinh:e.target.value}))}>
                    <option value='4'>4 lốp · 2 cầu</option>
                    <option value='6'>6 lốp · 2 cầu sau kép</option>
                    <option value='10'>10 lốp · 3 cầu kép</option>
                    <option value='12'>12 lốp · 4 cầu</option>
                  </select>
                </div>
              )}
            </div>

            {!tireVe
              ? <Empty icon='⭕' title='Chọn xe để quản lý lốp'
                  sub='Click vào từng vị trí để cập nhật. Màu = % chu kỳ còn lại. Đảo mỗi 10.000km.' />
              : (
                <>
                  <LopDiagram cauHinh={lopData.cauHinh||'6'} viTriLop={lopData.viTriLop||[]}
                    kmHienTai={null} onClickVt={(vt,d)=>setTireModal({viTri:vt,data:d})} />
                  <div style={{ display:'flex', gap:12, marginTop:10, marginBottom:12, fontSize:11, color:'var(--ink3)' }}>
                    <span style={{ color:'var(--green)' }}>● An toàn</span>
                    <span style={{ color:'var(--amber)' }}>● Sắp hạn (85%+)</span>
                    <span style={{ color:'var(--apple-red)' }}>● Quá hạn</span>
                    <span>● Chưa nhập</span>
                  </div>
                  <button style={BTN_PRIMARY} onClick={async()=>{
                    const r = await apiFetch(`/api/bdsc/tire/${tireVe}`,{ method:'PUT', body:JSON.stringify(lopData) })
                    const d = await r.json(); setLopData(d)
                  }}>Lưu cấu hình lốp</button>
                </>
              )
            }
            {tireModal && (
              <TireModal viTri={tireModal.viTri} data={tireModal.data}
                onSave={saveTireVt} onClose={()=>setTireModal(null)} />
            )}
          </>
        )}

        {/* ══ GIẤY TỜ ══ */}
        {tab==='docs' && (
          <>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, color:'var(--ink3)', marginBottom:4 }}>Chọn xe</div>
              <select style={INPUT} value={docsVe} onChange={e=>{ setDocsVe(e.target.value); loadDocs(e.target.value) }}>
                <option value=''>— Chọn xe —</option>
                {vehicles.map(v=>{ const b=v['BIỂN SỐ']||v['BIẼNSỐ']||v['Biển số']||''; return <option key={v._id} value={b}>{b}</option> })}
              </select>
            </div>
            {!docsVe
              ? <Empty icon='📄' title='Chọn xe để quản lý giấy tờ'
                  sub='Theo dõi hạn đăng kiểm, bảo hiểm, phù hiệu — cảnh báo tự động 30 ngày trước' />
              : (
                <>
                  {DOCS_FIELDS.map(({ k, label }) => {
                    const val  = docsData[k] ? new Date(docsData[k]).toISOString().slice(0,10) : ''
                    const diff = docsData[k] ? Math.ceil((new Date(docsData[k])-new Date())/86400000) : null
                    return (
                      <div key={k} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--sep)' }}>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:11, color:'var(--ink3)', marginBottom:4 }}>{label}</div>
                          <input style={INPUT} type='date' value={val}
                            onChange={e=>setDocsData(p=>({...p,[k]:e.target.value}))} />
                        </div>
                        {diff!==null && (
                          <Pill color={diff<=0?'var(--apple-red)':diff<=15?'var(--apple-red)':diff<=30?'var(--amber)':'var(--green)'}
                            bg={diff<=15?'rgba(215,0,21,.1)':diff<=30?'rgba(196,85,0,.1)':'rgba(26,127,55,.1)'}>
                            {diff<=0?'Hết hạn':diff<=30?`${diff} ngày`:'OK'}
                          </Pill>
                        )}
                      </div>
                    )
                  })}
                  <div style={{ marginTop:10, marginBottom:14 }}>
                    <div style={{ fontSize:11, color:'var(--ink3)', marginBottom:4 }}>Ghi chú</div>
                    <textarea style={{ ...INPUT, height:60, resize:'vertical' }}
                      value={docsData.ghiChu||''} onChange={e=>setDocsData(p=>({...p,ghiChu:e.target.value}))} />
                  </div>
                  <button style={BTN_PRIMARY} onClick={saveDocs}>Lưu giấy tờ</button>
                </>
              )
            }
          </>
        )}

        {/* ══ BẢNG GIÁ LỐP ══ */}
        {tab==='catalog' && (
          <>
            <div style={{ padding:'10px 14px', background:'rgba(0,85,204,.07)', borderRadius:10, marginBottom:14 }}>
              <div style={{ fontWeight:600, fontSize:13, color:'var(--ink)', marginBottom:2 }}>
                Tờ trình 3413/TTr/HS/PMH/0126
              </div>
              <div style={{ fontSize:12, color:'var(--ink3)' }}>
                Mua lốp xe thường xuyên HT HSH · 01/01/2026 – 30/06/2026
              </div>
              <div style={{ display:'flex', gap:14, marginTop:6, fontSize:12 }}>
                <span><strong>Ưu tiên 1:</strong> LỐP XE VIỆT (Maxxis)</span>
                <span><strong>Ưu tiên 2:</strong> ALPHA (Bridgestone/DRC)</span>
              </div>
            </div>

            {TIRE_CATALOG.map(t=>(
              <div key={t.id} style={{ padding:'12px 0', borderBottom:'1px solid var(--sep)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontWeight:700, fontSize:14, color:'var(--ink)' }}>{t.size}</span>
                    <Pill color={t.boBo==='kem'?'var(--apple-blue)':'var(--green)'}
                      bg={t.boBo==='kem'?'rgba(0,85,204,.1)':'rgba(26,127,55,.1)'}>
                      Bố {t.boBo}
                    </Pill>
                  </div>
                  <span style={{ fontSize:12, color:'var(--ink3)' }}>SL 6T: <strong>{t.soLuong6T}</strong></span>
                </div>
                <div style={{ fontSize:12, color:'var(--ink3)', marginBottom:8 }}>🚛 {t.loaiXe}</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {[t.p1,t.p2].map((p,pi)=>(
                    <div key={pi} style={{ padding:'10px 12px', background:'var(--fill-tertiary)', borderRadius:10 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
                        <Pill color={pi===0?'var(--green)':'var(--ink3)'}
                          bg={pi===0?'rgba(26,127,55,.1)':'var(--fill-secondary)'}>
                          {pi===0?'Ưu tiên 1':'Ưu tiên 2'}
                        </Pill>
                        <span style={{ fontSize:12, fontWeight:600, color:'var(--ink)' }}>{p.ncc}</span>
                      </div>
                      <div style={{ fontSize:11, color:'var(--ink3)' }}>{p.hang} · {p.xuatXu}</div>
                      <div style={{ marginTop:6, fontSize:12 }}>
                        <span style={{ color:'var(--ink3)' }}>TĐP: </span>
                        <span style={{ fontWeight:600, color:'var(--ink)' }}>{fmt(p.tdp)}đ</span>
                      </div>
                      <div style={{ fontSize:12 }}>
                        <span style={{ color:'var(--ink3)' }}>SĐP: </span>
                        <span style={{ fontWeight:700, color:'var(--brand)' }}>{fmt(p.sdp)}đ</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

      </div>

      <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
    </div>
  )
}
