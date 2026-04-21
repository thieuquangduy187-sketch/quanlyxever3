import { useState, useEffect } from 'react'

// ── Giá dầu diesel bình quân theo tháng (Petrolimex, đồng/lít) ───────────────
// Cập nhật: tháng 4/2026. Nguồn: petrolimex.com.vn
// 4 mức: DO0.001S Vùng1, DO0.001S Vùng2, DO0.05S Vùng1, DO0.05S Vùng2
// Giá dầu được fetch tự động từ backend /api/gia-dau
const API = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function getToken() { return localStorage.getItem('hsg_token') || '' }

// ── Helpers ───────────────────────────────────────────────────────────────────
function numOnly(val) {
  return val.replace(/[^0-9]/g, '')
}
function fmtNum(val) {
  if (!val) return ''
  return Number(val).toLocaleString('vi-VN')
}

// ── Field config ──────────────────────────────────────────────────────────────
const FIELDS = [
  // Nhóm km
  { key: 'kmDauThang',   label: 'Số km đầu tháng',                  unit: 'km',      group: 'km' },
  { key: 'kmCuoiThang',  label: 'Số km cuối tháng',                  unit: 'km',      group: 'km' },
  // Computed display
  { key: '_tongKm',      label: 'Tổng số km di chuyển',              unit: 'km',      group: 'km', computed: true },
  { key: 'kmDuongDeo',   label: 'Số km đường đèo',                   unit: 'km',      group: 'km' },
  // Nhóm nhiên liệu
  { key: 'tgSuDungCau',  label: 'Thời gian sử dụng cẩu',             unit: 'phút',    group: 'nhienLieu' },
  { key: 'tongLitDau',   label: 'Tổng số lít dầu đổ',                unit: 'lít',     group: 'nhienLieu' },
  { key: 'tongTienDau',  label: 'Tổng tiền dầu',                     unit: 'đồng',    group: 'nhienLieu' },
  // Nhóm vận chuyển
  { key: 'tongKLChuyen', label: 'Tổng khối lượng chuyên chở',        unit: 'kg',      group: 'vanChuyen' },
  { key: 'klNoiBo',      label: 'Khối lượng vận chuyển nội bộ',      unit: 'kg',      group: 'vanChuyen' },
  { key: 'soChuyenXe',   label: 'Số chuyến xe',                      unit: 'chuyến',  group: 'vanChuyen' },
  // Nhóm thuê ngoài
  { key: 'cpThueNgoai',  label: 'Tổng chi phí thuê ngoài',           unit: 'đồng',    group: 'thueNgoai' },
  { key: 'klThueNgoai',  label: 'Khối lượng hàng thuê ngoài',        unit: 'kg',      group: 'thueNgoai' },
]

const GROUPS = {
  km:         { label: '📍 Số kilometre', color: '#007AFF' },
  nhienLieu:  { label: '⛽ Nhiên liệu & thiết bị', color: '#FF9500' },
  vanChuyen:  { label: '📦 Vận chuyển', color: '#34C759' },
  thueNgoai:  { label: '🤝 Thuê ngoài', color: '#AF52DE' },
}

export default function PageNhatTrinh({ user }) {
  const now   = new Date()
  const [form, setForm] = useState({
    thang: now.getMonth() + 1,
    nam:   now.getFullYear(),
    kmDauThang: '', kmCuoiThang: '', kmDuongDeo: '',
    tgSuDungCau: '', tongLitDau: '', tongTienDau: '',
    tongKLChuyen: '', klNoiBo: '', soChuyenXe: '',
    cpThueNgoai: '', klThueNgoai: '',
    ghiChu: '',
  })
  const [errors,   setErrors]   = useState({})
  const [loading,  setLoading]  = useState(false)
  const [success,  setSuccess]  = useState(false)
  const [history,       setHistory]      = useState([])
  const [xeInfo,        setXeInfo]        = useState(null)
  const [priceData, setPriceData] = useState(null)

  // Load xe info + history
  useEffect(() => {
    // Get xe info from JWT user
    setXeInfo({ bienSo: user?.bienSo || user?.displayName || user?.username })
    fetch(`${API}/api/nhat-trinh/mine`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    }).then(r => r.json()).then(setHistory).catch(() => {})

  }, [])

  // Giá dầu fallback (hardcode từ giaxanghomnay.com/Petrolimex) - dùng khi backend chưa có data
  const PRICE_FALLBACK = {
    '1/2026': { available:true, min:17850, max:20200, avg:18700, soLanDieuChinh:3,
      do001:{v1:18500,v2:18870}, do05:{v1:17700,v2:18054} },
    '2/2026': { available:true, min:19500, max:21500, avg:20300, soLanDieuChinh:3,
      do001:{v1:20300,v2:20706}, do05:{v1:19400,v2:19788} },
    '3/2026': { available:true, min:33620, max:39860, avg:36570, soLanDieuChinh:5,
      do001:{v1:36570,v2:37301}, do05:{v1:35000,v2:35700} },
    '4/2026': { available:true, min:29110, max:44980, avg:37400, soLanDieuChinh:6,
      do001:{v1:37400,v2:38148}, do05:{v1:35800,v2:36516} },
  }

  // Fetch giá dầu từ backend khi tháng/năm thay đổi
  useEffect(() => {
    const key = `${form.thang}/${form.nam}`
    // Dùng fallback ngay (hiển thị nhanh)
    if (PRICE_FALLBACK[key]) setPriceData(PRICE_FALLBACK[key])
    else setPriceData(null)

    // Fetch backend để cập nhật (tháng mới chưa có trong fallback)
    const token = localStorage.getItem('hsg_token') || ''
    fetch(`${API}/api/gia-dau?thang=${form.thang}&nam=${form.nam}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => { if (d && d.available && d.min && d.max) setPriceData(d) })
      .catch(() => {})
  }, [form.thang, form.nam])

  const tongKm = Math.max(0, (Number(form.kmCuoiThang) || 0) - (Number(form.kmDauThang) || 0))

  // Real-time validation
  function validate(f = form, pd = priceData) {
    const errs = {}
    const km1 = Number(f.kmDauThang) || 0
    const km2 = Number(f.kmCuoiThang) || 0
    const deo = Number(f.kmDuongDeo) || 0
    const tKm = km2 - km1
    const tKL = Number(f.tongKLChuyen) || 0
    const noiBo = Number(f.klNoiBo) || 0

    if (f.kmCuoiThang && tKm <= 0)
      errs.kmCuoiThang = 'Số km cuối tháng phải lớn hơn số km đầu tháng'
    if (f.kmDuongDeo && deo > tKm && tKm > 0)
      errs.kmDuongDeo = `Không thể lớn hơn tổng km di chuyển (${tKm.toLocaleString('vi-VN')} km)`
    if (f.klNoiBo && noiBo > tKL && tKL > 0)
      errs.klNoiBo = `Không thể lớn hơn tổng chuyên chở (${tKL.toLocaleString('vi-VN')} kg)`

    // // Cảnh báo giá dầu: đơn giá ngoài khoảng min~max của tháng → cảnh báo sai
    const litDau  = Number(f.tongLitDau)  || 0
    const tienDau = Number(f.tongTienDau) || 0
    if (litDau > 0 && tienDau > 0 && pd) {
      const donGia = Math.round(tienDau / litDau)
      const soKy   = pd.soLanDieuChinh || '?'
      const minGia = pd.min
      const maxGia = pd.max
      if (donGia < minGia) {
        errs.tongTienDau = `Đơn giá dầu ${donGia.toLocaleString('vi-VN')}đ/lít thấp hơn giá thấp nhất tháng ${f.thang}/${f.nam}. Giá thấp nhất: ${minGia.toLocaleString('vi-VN')}đ, cao nhất: ${maxGia.toLocaleString('vi-VN')}đ (${soKy} kỳ điều chỉnh). Vui lòng kiểm tra lại tổng tiền dầu.`
      } else if (donGia > maxGia) {
        errs.tongTienDau = `Đơn giá dầu ${donGia.toLocaleString('vi-VN')}đ/lít cao hơn giá cao nhất tháng ${f.thang}/${f.nam}. Giá thấp nhất: ${minGia.toLocaleString('vi-VN')}đ, cao nhất: ${maxGia.toLocaleString('vi-VN')}đ (${soKy} kỳ điều chỉnh). Vui lòng kiểm tra lại tổng tiền dầu.`
      }
    }
    return errs
  }

  function setField(key, raw) {
    const cleaned = numOnly(raw)
    const next = { ...form, [key]: cleaned }
    setForm(next)
    const errs = validate(next, priceData)
    setErrors(errs)
  }

  async function handleSubmit() {
    const errs = validate(form, priceData)
    if (Object.keys(errs).length) { setErrors(errs); return }

    // Check required
    const required = ['kmDauThang', 'kmCuoiThang', 'tongLitDau', 'tongKLChuyen', 'soChuyenXe', 'tgSuDungCau', 'klNoiBo', 'cpThueNgoai', 'klThueNgoai']
    const missing = required.filter(k => !form[k])
    if (missing.length) {
      const m = {}
      missing.forEach(k => m[k] = 'Trường này bắt buộc')
      setErrors(m); return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API}/api/nhat-trinh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({ ...form })
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.errors) setErrors({ _form: data.errors.join(' ') })
        else setErrors({ _form: data.error || 'Lỗi khi nộp.' })
        setLoading(false); return
      }
      setSuccess(true)
      // Reload history
      fetch(`${API}/api/nhat-trinh/mine`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      }).then(r => r.json()).then(setHistory)
    } catch {
      setErrors({ _form: 'Không thể kết nối server.' })
    }
    setLoading(false)
  }

  function resetForm() {
    setForm(f => ({ ...f, kmDauThang:'',kmCuoiThang:'',kmDuongDeo:'',tgSuDungCau:'',tongLitDau:'',tongTienDau:'',tongKLChuyen:'',klNoiBo:'',soChuyenXe:'',cpThueNgoai:'',klThueNgoai:'',ghiChu:'' }))
    setErrors({}); setSuccess(false)
  }

  // ── Styles ──────────────────────────────────────────────────────────────────
  const card = { background:'var(--bg-card)', border:'0.5px solid var(--sep)', borderRadius:16, overflow:'hidden', marginBottom:16 }
  const cardHeader = (color) => ({ padding:'14px 20px', borderBottom:'0.5px solid var(--sep)', display:'flex', alignItems:'center', gap:8, background: color+'08' })
  const cardBody = { padding:'16px 20px' }

  const inputWrap = { position:'relative', display:'flex', alignItems:'center' }
  const inp = (hasError) => ({
    width:'100%', padding:'11px 14px', paddingRight: 52,
    background:'var(--fill-tertiary)',
    border:`0.5px solid ${hasError ? 'var(--apple-red)' : 'var(--sep)'}`,
    borderRadius:10, fontSize:15,
    color:'var(--label-primary)', outline:'none',
    fontFamily:'inherit', boxSizing:'border-box',
    transition:'border-color .15s',
  })
  const unitBadge = {
    position:'absolute', right:10,
    fontSize:11, fontWeight:500, color:'var(--label-tertiary)',
    pointerEvents:'none', whiteSpace:'nowrap',
  }

  if (success) return (
    <div style={{ maxWidth:480, margin:'60px auto', textAlign:'center', padding:20 }}>
      <div style={{ fontSize:64, marginBottom:16 }}>✅</div>
      <div style={{ fontSize:22, fontWeight:700, letterSpacing:-0.5, marginBottom:8 }}>Đã nộp thành công!</div>
      <div style={{ fontSize:14, color:'var(--label-secondary)', marginBottom:28 }}>
        Nhật trình tháng {form.thang}/{form.nam} đã được lưu.
      </div>
      <button onClick={resetForm} style={{
        padding:'12px 28px', borderRadius:12, border:'none',
        background:'var(--apple-blue)', color:'#fff', fontSize:15, fontWeight:600,
        cursor:'pointer', fontFamily:'inherit',
      }}>Nộp tháng khác</button>
    </div>
  )

  const byGroup = {}
  FIELDS.forEach(f => { if (!byGroup[f.group]) byGroup[f.group] = []; byGroup[f.group].push(f) })

  return (
    <div style={{ maxWidth:680, margin:'0 auto', padding:'0 0 40px' }}>

      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:22, fontWeight:700, letterSpacing:-0.5 }}>Nhật trình xe tháng</div>
        <div style={{ fontSize:13, color:'var(--label-secondary)', marginTop:4 }}>
          Điền đầy đủ thông tin và nhấn Nộp nhật trình
        </div>
      </div>

      {/* Thông tin xe + tháng */}
      <div style={card}>
        <div style={cardHeader('#007AFF')}>
          <span style={{ fontSize:14, fontWeight:600, color:'var(--apple-blue)' }}>🚛 Thông tin xe & kỳ báo cáo</span>
        </div>
        <div style={{ ...cardBody, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
          {/* Biển số — auto fill */}
          <div>
            <label style={{ fontSize:12, fontWeight:500, color:'var(--label-secondary)', display:'block', marginBottom:6 }}>Biển số xe</label>
            <div style={{
              padding:'11px 14px', background:'var(--fill-tertiary)',
              border:'0.5px solid var(--sep)', borderRadius:10,
              fontSize:15, fontWeight:600, color:'var(--apple-blue)',
              letterSpacing:0.5,
            }}>
              {user?.bienSo || user?.displayName?.replace('Xe ','') || user?.username}
            </div>
          </div>
          {/* Tháng */}
          <div>
            <label style={{ fontSize:12, fontWeight:500, color:'var(--label-secondary)', display:'block', marginBottom:6 }}>Tháng</label>
            <select value={form.thang} onChange={e => {
                setForm(f => ({...f, thang: +e.target.value}))
              }}
              style={{ ...inp(false), paddingRight:14, appearance:'none', cursor:'pointer' }}>
              {Array.from({length:12},(_,i)=><option key={i+1} value={i+1}>Tháng {i+1}</option>)}
            </select>
          </div>
          {/* Năm */}
          <div>
            <label style={{ fontSize:12, fontWeight:500, color:'var(--label-secondary)', display:'block', marginBottom:6 }}>Năm</label>
            <select value={form.nam} onChange={e => setForm(f => ({...f, nam: +e.target.value}))}
              style={{ ...inp(false), paddingRight:14, appearance:'none', cursor:'pointer' }}>
              {[2024,2025,2026].map(y=><option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Field groups */}
      {Object.entries(byGroup).map(([groupKey, fields]) => {
        const grp = GROUPS[groupKey]
        return (
          <div key={groupKey} style={card}>
            <div style={cardHeader(grp.color)}>
              <span style={{ fontSize:14, fontWeight:600, color: grp.color }}>{grp.label}</span>
            </div>
            <div style={{ ...cardBody, display:'grid', gridTemplateColumns: fields.length >= 3 ? '1fr 1fr 1fr' : fields.length === 2 ? '1fr 1fr' : '1fr', gap:12 }}>
              {fields.map(f => {
                if (f.computed && f.key === '_tongKm') {
                  return (
                    <div key="_tongKm">
                      <label style={{ fontSize:12, fontWeight:500, color:'var(--label-secondary)', display:'block', marginBottom:6 }}>
                        Tổng km di chuyển <span style={{ color:'var(--label-tertiary)' }}>(tự tính)</span>
                      </label>
                      <div style={{
                        padding:'11px 14px', background:tongKm>0?'rgba(52,199,89,0.08)':'var(--fill-tertiary)',
                        border:`0.5px solid ${tongKm>0?'var(--apple-green)':'var(--sep)'}`,
                        borderRadius:10, fontSize:15, fontWeight:600,
                        color: tongKm > 0 ? 'var(--apple-green)' : 'var(--label-tertiary)',
                        display:'flex', justifyContent:'space-between', alignItems:'center',
                      }}>
                        <span>{tongKm > 0 ? tongKm.toLocaleString('vi-VN') : '—'}</span>
                        <span style={{ fontSize:11, fontWeight:400, color:'var(--label-tertiary)' }}>km</span>
                      </div>
                    </div>
                  )
                }

                const hasErr = !!errors[f.key]
                const isRequired = ['kmDauThang','kmCuoiThang','tongLitDau','tongKLChuyen','soChuyenXe','tgSuDungCau','klNoiBo','cpThueNgoai','klThueNgoai'].includes(f.key)

                return (
                  <div key={f.key}>
                    <label style={{ fontSize:12, fontWeight:500, color:'var(--label-secondary)', display:'block', marginBottom:6 }}>
                      {f.label}
                      {isRequired && <span style={{ color:'var(--apple-red)', marginLeft:3 }}>*</span>}
                    </label>
                    <div style={inputWrap}>
                      <input
                        type="text" inputMode="numeric"
                        value={form[f.key] ? Number(form[f.key]).toLocaleString('vi-VN') : ''}
                        onChange={e => setField(f.key, e.target.value)}
                        placeholder="0"
                        style={{
                          ...inp(hasErr),
                          fontVariantNumeric: 'tabular-nums',
                        }}
                        onFocus={e => e.target.style.borderColor = hasErr ? 'var(--apple-red)' : 'var(--apple-blue)'}
                        onBlur={e  => e.target.style.borderColor = hasErr ? 'var(--apple-red)' : 'var(--sep)'}
                      />
                      <span style={unitBadge}>{f.unit}</span>
                    </div>
                    {hasErr && (
                      <div style={{ fontSize:11.5, color:'var(--apple-red)', marginTop:4, lineHeight:1.4 }}>
                        ⚠ {errors[f.key]}
                      </div>
                    )}

                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Ghi chú */}
      <div style={card}>
        <div style={cardHeader('#8E8E93')}>
          <span style={{ fontSize:14, fontWeight:600, color:'var(--label-secondary)' }}>📝 Ghi chú</span>
        </div>
        <div style={cardBody}>
          <textarea value={form.ghiChu} onChange={e => setForm(f=>({...f,ghiChu:e.target.value}))}
            placeholder="Ghi chú thêm nếu có (không bắt buộc)..."
            rows={3}
            style={{
              width:'100%', padding:'11px 14px', boxSizing:'border-box',
              background:'var(--fill-tertiary)', border:'0.5px solid var(--sep)',
              borderRadius:10, fontSize:14, color:'var(--label-primary)',
              outline:'none', fontFamily:'inherit', resize:'vertical',
              transition:'border-color .15s',
            }}
            onFocus={e => e.target.style.borderColor='var(--apple-blue)'}
            onBlur={e  => e.target.style.borderColor='var(--sep)'}
          />
        </div>
      </div>

      {/* Error */}
      {errors._form && (
        <div style={{
          background:'rgba(255,59,48,0.08)', border:'0.5px solid rgba(255,59,48,0.3)',
          borderRadius:10, padding:'12px 16px', marginBottom:14,
          color:'var(--apple-red)', fontSize:13,
        }}>⚠ {errors._form}</div>
      )}

      {/* Submit */}
      <button onClick={handleSubmit} disabled={loading || Object.keys(errors).filter(k=>k!=='_form').length>0}
        style={{
          width:'100%', padding:'15px', borderRadius:14, border:'none',
          background: loading ? 'rgba(0,122,255,0.5)' : 'var(--apple-blue)',
          color:'#fff', fontSize:16, fontWeight:700,
          cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily:'inherit', letterSpacing:-0.2,
          display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          transition:'all .15s',
        }}
        onMouseDown={e => { if (!loading) e.currentTarget.style.transform='scale(0.99)' }}
        onMouseUp={e => e.currentTarget.style.transform='scale(1)'}
      >
        {loading ? (
          <>
            <span style={{ width:16, height:16, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin .65s linear infinite' }} />
            Đang nộp...
          </>
        ) : '📤 Nộp nhật trình'}
      </button>

      {/* History */}
      {history.length > 0 && (
        <div style={{ marginTop:32 }}>
          <div style={{ fontSize:14, fontWeight:600, marginBottom:12, color:'var(--label-secondary)' }}>Lịch sử đã nộp</div>
          {history.map((h, i) => (
            <div key={i} style={{
              background:'var(--bg-card)', border:'0.5px solid var(--sep)', borderRadius:12,
              padding:'12px 16px', marginBottom:8, display:'flex', justifyContent:'space-between', alignItems:'center',
            }}>
              <div>
                <div style={{ fontSize:14, fontWeight:600 }}>Tháng {h.thang}/{h.nam}</div>
                <div style={{ fontSize:12, color:'var(--label-secondary)', marginTop:2 }}>
                  {h.tongKmDiChuyen?.toLocaleString('vi-VN')} km · {h.soChuyenXe} chuyến · {h.tongKLChuyen?.toLocaleString('vi-VN')} kg
                </div>
              </div>
              <div style={{ fontSize:11, color:'var(--apple-green)', fontWeight:600, background:'rgba(52,199,89,0.1)', padding:'3px 10px', borderRadius:8 }}>✓ Đã nộp</div>
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
