import { useState, useEffect, useRef } from 'react'
import useIsMobile from '../hooks/useIsMobile'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const getToken = () => localStorage.getItem('hsg_token') || ''

const MUC_DICH = [
  { key: 'ban_ngoai', label: 'Bán ngoài',  icon: '🛍' },
  { key: 'noi_bo',    label: 'Nội bộ',     icon: '🏭' },
  { key: 'bao_duong', label: 'Bảo dưỡng',  icon: '🔧' },
  { key: 'do_xang',   label: 'Đổ xăng',    icon: '⛽' },
  { key: 'khac',      label: 'Khác',        icon: '📝' },
]

// Format date to vi DD/MM/YYYY
function formatNgay(d) {
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}
function parseNgay(s) {
  const [d,m,y] = s.split('/').map(Number)
  return new Date(y, m-1, d)
}
function fmtKm(v) {
  return v ? Number(v).toLocaleString('vi-VN') : '—'
}
function fmtMoney(v) {
  if (!v) return '—'
  if (v >= 1e6) return (v/1e6).toFixed(1).replace('.0','') + 'M'
  return v.toLocaleString('vi-VN')
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PageNhatTrinhNgay({ user }) {
  const isMobile = useIsMobile()
  const [ngay, setNgay] = useState(formatNgay(new Date()))
  const [chuyens, setChuyens] = useState([])
  const [loading, setLoading] = useState(false)
  const [screen, setScreen] = useState('list') // 'list' | 'add' | 'ocr'
  const [editId, setEditId] = useState(null)   // editing existing trip

  // Biển số
  const bienSoList = user?.bienSoList || []
  const hasMulti   = bienSoList.length > 1
  const [bienSoChon, setBienSoChon] = useState(bienSoList[0] || user?.bienSo || '')

  // Load trips for day
  const loadChuyens = async (d = ngay) => {
    setLoading(true)
    try {
      const r = await fetch(`${API}/api/nhat-trinh-ngay?ngay=${encodeURIComponent(d)}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      const data = await r.json()
      setChuyens(data.chuyens || [])
    } catch {}
    setLoading(false)
  }
  useEffect(() => { loadChuyens(ngay) }, [ngay])

  // Computed totals
  const totals = {
    km:   chuyens.reduce((s, c) => s + (c.tongKm || 0), 0),
    kl:   chuyens.reduce((s, c) => s + (c.tongKL || 0), 0),
    tien: chuyens.reduce((s, c) => s + (c.tongTien || 0), 0),
    cau:  chuyens.reduce((s, c) => s + (c.phutCau || 0), 0),
  }
  const kmDauNgay = chuyens[0]?.kmBatDau || null
  const kmCuoiNgay = chuyens[chuyens.length - 1]?.kmKetThuc || null

  // ── CSS vars ──────────────────────────────────────────────────────────────
  const V = {
    bg:      '#000',
    card:    '#1C1C1E',
    card2:   '#252527',
    fill:    '#2C2C2E',
    fill2:   '#111',
    sep:     '#2C2C2E',
    lbl1:    'rgba(255,255,255,0.88)',
    lbl2:    'rgba(255,255,255,0.55)',
    lbl3:    'rgba(255,255,255,0.30)',
    blue:    '#0A84FF',
    green:   '#30D158',
    orange:  '#FF9F0A',
    red:     '#FF453A',
    r14:     14,
    r10:     10,
    p:       isMobile ? '12px 14px' : '14px 18px',
  }

  const S = {
    page: {
      maxWidth: 560, margin: '0 auto',
      padding: isMobile ? '10px 10px 100px' : '20px 16px',
      fontFamily: "-apple-system, 'SF Pro Text', sans-serif",
    },
    card: {
      background: V.card, borderRadius: V.r14,
      border: `0.5px solid ${V.sep}`, overflow: 'hidden',
      marginBottom: isMobile ? 10 : 12,
    },
    cardHdr: (color = V.lbl2) => ({
      padding: '10px 14px',
      background: V.card2,
      borderBottom: `0.5px solid ${V.sep}`,
      fontSize: 11, fontWeight: 600, color,
      textTransform: 'uppercase', letterSpacing: '0.5px',
      display: 'flex', alignItems: 'center', gap: 6,
    }),
    cardBody: { padding: V.p },
    inp: (err) => ({
      width: '100%', padding: isMobile ? '13px 14px' : '11px 14px',
      background: V.fill2,
      border: `0.5px solid ${err ? V.red : V.sep}`,
      borderRadius: V.r10, fontSize: isMobile ? 16 : 15,
      color: V.lbl1, outline: 'none', fontFamily: 'inherit',
      boxSizing: 'border-box',
    }),
    label: {
      fontSize: 11, color: V.lbl3, marginBottom: 5,
      textTransform: 'uppercase', letterSpacing: '0.4px',
    },
    chip: (active) => ({
      padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500,
      border: `1px solid ${active ? V.blue : V.fill}`,
      background: active ? `${V.blue}22` : 'transparent',
      color: active ? V.blue : V.lbl2,
      cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
    }),
    btn: (color = V.blue, ghost = false) => ({
      padding: isMobile ? '15px 20px' : '13px 20px',
      borderRadius: V.r14, border: ghost ? `1px solid ${color}` : 'none',
      background: ghost ? 'transparent' : color,
      color: ghost ? color : '#fff',
      fontSize: isMobile ? 15 : 14, fontWeight: 700,
      cursor: 'pointer', fontFamily: 'inherit', letterSpacing: -0.2,
    }),
    toggle: (on) => ({
      width: 50, height: 30, borderRadius: 15,
      background: on ? V.green : V.fill,
      position: 'relative', cursor: 'pointer',
      transition: 'background .2s', flexShrink: 0,
    }),
    toggleDot: (on) => ({
      width: 26, height: 26, borderRadius: 13,
      background: 'var(--bg-card)',
      position: 'absolute', top: 2,
      left: on ? 22 : 2,
      transition: 'left .2s',
      boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
    }),
  }

  // ── Delete trip ───────────────────────────────────────────────────────────
  const deleteChuyen = async (id) => {
    if (!confirm('Xoá chuyến này?')) return
    await fetch(`${API}/api/nhat-trinh-ngay/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` }
    })
    loadChuyens(ngay)
  }

  // ── SCREEN: List ──────────────────────────────────────────────────────────
  if (screen === 'list') return (
    <div style={S.page}>

      {/* Header */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: isMobile ? 22 : 24, fontWeight: 700, color: V.lbl1, letterSpacing: -0.5 }}>
          📋 Nhật trình ngày
        </div>
        <div style={{ fontSize: 13, color: V.lbl2, marginTop: 3 }}>
          Theo dõi từng chuyến xe trong ngày
        </div>
      </div>

      {/* Biển số + ngày chọn */}
      <div style={{ ...S.card }}>
        <div style={{ padding: V.p, display: 'grid', gridTemplateColumns: hasMulti ? '1fr 1fr' : '1fr', gap: 10 }}>
          {hasMulti && (
            <div>
              <div style={S.label}>Biển số xe</div>
              <select value={bienSoChon} onChange={e => setBienSoChon(e.target.value)}
                style={{ ...S.inp(false), colorScheme: 'dark', paddingRight: 10 }}>
                {bienSoList.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          )}
          <div>
            <div style={S.label}>Ngày làm việc</div>
            <input type="date"
              value={ngay.split('/').reverse().join('-')}
              onChange={e => {
                const [y,m,d] = e.target.value.split('-')
                setNgay(`${d}/${m}/${y}`)
              }}
              style={{ ...S.inp(false), colorScheme: 'dark' }}
            />
          </div>
        </div>
      </div>

      {/* Km đầu/cuối ngày banner */}
      {(kmDauNgay || kmCuoiNgay) && (
        <div style={{ ...S.card, background: 'linear-gradient(135deg,#0a1f3a,#001a30)' }}>
          <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 10, color: V.blue, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Km đầu ngày</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: V.lbl1 }}>{fmtKm(kmDauNgay)}</div>
            </div>
            <div style={{ textAlign: 'center', fontSize: 20, color: V.blue }}>→</div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: V.green, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Km cuối ngày</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: kmCuoiNgay ? V.green : V.lbl3 }}>
                {kmCuoiNgay ? fmtKm(kmCuoiNgay) : '—'}
              </div>
            </div>
          </div>
          {kmDauNgay && kmCuoiNgay && (
            <div style={{ padding: '0 16px 12px', display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: V.lbl3 }}>Tổng km đồng hồ</span>
              <span style={{ color: V.blue, fontWeight: 700 }}>{fmtKm(kmCuoiNgay - kmDauNgay)} km</span>
            </div>
          )}
        </div>
      )}

      {/* Trip list */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: V.lbl3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {chuyens.length > 0 ? `${chuyens.length} chuyến` : 'Chưa có chuyến nào'}
        </div>
        <button style={{ ...S.chip(true), fontSize: 12 }} onClick={() => { setEditId(null); setScreen('add') }}>
          ＋ Thêm chuyến
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 40, color: V.lbl3 }}>Đang tải...</div>
      )}

      {chuyens.map((c, i) => (
        <div key={c._id} style={S.card}>
          {/* Trip header */}
          <div style={{ padding: '11px 14px', background: V.card2, borderBottom: `0.5px solid ${V.sep}`, display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, flexShrink: 0,
              background: c.coTai ? `${V.blue}22` : `${V.orange}22`,
              border: `1px solid ${c.coTai ? V.blue : V.orange}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: c.coTai ? V.blue : V.orange,
            }}>{i+1}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: V.lbl1, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{c.noiDi}</span>
                <span style={{ color: V.blue, fontSize: 11, flexShrink: 0 }}>→</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{c.noiDen}</span>
              </div>
              <div style={{ fontSize: 11, color: V.lbl3, marginTop: 2 }}>
                {MUC_DICH.find(m => m.key === c.mucDich)?.label || c.mucDich}
                {' · '}{c.coTai ? 'Có tải' : 'Không tải'}
              </div>
            </div>
            <button onClick={() => deleteChuyen(c._id)}
              style={{ background: 'none', border: 'none', color: V.red, fontSize: 16, cursor: 'pointer', padding: '4px 8px' }}>
              ✕
            </button>
          </div>

          {/* Trip stats */}
          <div style={{ padding: '10px 14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7, marginBottom: c.hangHoa?.length ? 10 : 0 }}>
              {[
                { lbl: 'Km bắt đầu', val: fmtKm(c.kmBatDau), col: V.lbl1 },
                { lbl: 'Km kết thúc', val: fmtKm(c.kmKetThuc), col: c.kmKetThuc ? V.lbl1 : V.lbl3, highlight: i === chuyens.length-1 && c.kmKetThuc },
                { lbl: 'Tổng km',     val: c.tongKm ? `${c.tongKm} km` : '—', col: V.blue },
              ].map(s => (
                <div key={s.lbl} style={{
                  background: s.highlight ? `${V.green}15` : V.fill2,
                  borderRadius: V.r10, padding: '8px 10px', textAlign: 'center',
                  border: s.highlight ? `0.5px solid ${V.green}44` : 'none',
                }}>
                  <div style={{ fontSize: isMobile ? 14 : 13, fontWeight: 700, color: s.highlight ? V.green : s.col }}>{s.val}</div>
                  <div style={{ fontSize: 10, color: s.highlight ? V.green : V.lbl3, marginTop: 2 }}>
                    {s.highlight ? 'Km cuối ngày ✓' : s.lbl}
                  </div>
                </div>
              ))}
            </div>

            {/* Secondary stats */}
            {(c.kmDeoDoc > 0 || c.phutCau > 0) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: c.hangHoa?.length ? 10 : 0 }}>
                {c.kmDeoDoc > 0 && (
                  <div style={{ background: V.fill2, borderRadius: V.r10, padding: '7px 10px', textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: V.orange }}>{c.kmDeoDoc} km</div>
                    <div style={{ fontSize: 10, color: V.lbl3, marginTop: 2 }}>Km đèo/dốc</div>
                  </div>
                )}
                {c.phutCau > 0 && (
                  <div style={{ background: V.fill2, borderRadius: V.r10, padding: '7px 10px', textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: V.orange }}>{c.phutCau} phút</div>
                    <div style={{ fontSize: 10, color: V.lbl3, marginTop: 2 }}>Phút cẩu</div>
                  </div>
                )}
              </div>
            )}

            {/* Cargo */}
            {c.hangHoa?.length > 0 && (
              <div>
                <div style={{ fontSize: 10, color: V.lbl3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Hàng vận chuyển</div>
                {c.hangHoa.map((h, j) => (
                  <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, background: V.fill2, borderRadius: 10, padding: '7px 10px', marginBottom: 5 }}>
                    <div style={{ fontSize: 16, flexShrink: 0 }}>📦</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: V.lbl1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.tenHang}</div>
                      <div style={{ fontSize: 11, color: V.lbl3, marginTop: 1 }}>{h.khoiLuong?.toLocaleString('vi-VN')} kg</div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: V.green, flexShrink: 0 }}>{fmtMoney(h.thanhTien)}</div>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '6px 2px 0' }}>
                  <span style={{ color: V.lbl3 }}>Tổng cộng</span>
                  <span style={{ color: V.lbl1, fontWeight: 700 }}>
                    {c.tongKL?.toLocaleString('vi-VN')} kg · <span style={{ color: V.green }}>{fmtMoney(c.tongTien)}</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Add trip button */}
      <button
        onClick={() => { setEditId(null); setScreen('add') }}
        style={{
          width: '100%', padding: isMobile ? '16px' : '14px',
          background: 'none', border: `1.5px dashed ${V.sep}`,
          borderRadius: V.r14, color: V.blue, fontSize: 15, fontWeight: 600,
          cursor: 'pointer', marginBottom: 12, fontFamily: 'inherit',
        }}>
        ＋ Thêm chuyến tiếp theo
      </button>

      {/* Daily summary */}
      {chuyens.length > 0 && (
        <div style={{ ...S.card }}>
          <div style={S.cardHdr('var(--label-secondary)')}>📊 Tổng kết ngày</div>
          <div style={{ padding: V.p, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { lbl: 'Tổng km',       val: `${totals.km} km`,                   col: V.blue   },
              { lbl: 'Phút cẩu',      val: `${totals.cau} phút`,               col: V.orange },
              { lbl: 'Tổng KL hàng',  val: `${totals.kl.toLocaleString('vi-VN')} kg`, col: V.lbl1   },
              { lbl: 'Doanh thu',      val: fmtMoney(totals.tien),               col: V.green  },
            ].map(s => (
              <div key={s.lbl} style={{ background: V.fill2, borderRadius: V.r10, padding: '10px 12px' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: s.col }}>{s.val}</div>
                <div style={{ fontSize: 11, color: V.lbl3, marginTop: 3 }}>{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  // ── SCREEN: Add trip ──────────────────────────────────────────────────────
  return <AddTrinhScreen
    user={user} ngay={ngay} bienSoChon={bienSoChon} hasMulti={hasMulti}
    bienSoList={bienSoList} setBienSoChon={setBienSoChon}
    lastKm={chuyens.length > 0 ? chuyens[chuyens.length-1]?.kmKetThuc : null}
    thuTu={chuyens.length + 1}
    isMobile={isMobile} V={V} S={S}
    onCancel={() => setScreen('list')}
    onSaved={() => { loadChuyens(ngay); setScreen('list') }}
  />
}

// ── Add Trip Screen ───────────────────────────────────────────────────────────
function AddTrinhScreen({ user, ngay, bienSoChon, hasMulti, bienSoList, setBienSoChon,
  lastKm, thuTu, isMobile, V, S, onCancel, onSaved }) {

  const [form, setForm] = useState({
    noiDi: '', noiDen: '',
    mucDich: 'ban_ngoai', coTai: true,
    kmBatDau: lastKm ? String(lastKm) : '',
    kmKetThuc: '',
    kmDeoDoc: '', phutCau: '',
    ghiChu: '',
  })
  const [hangHoa, setHangHoa] = useState([{ tenHang: '', khoiLuong: '', thanhTien: '' }])
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [ocrState, setOcrState] = useState(null) // null | 'capturing' | 'processing' | 'done'
  const fileRef = useRef()

  const set = (k, v) => setForm(f => ({...f, [k]: v}))

  // OCR via Claude API
  const handleOCR = async (file) => {
    setOcrState('processing')
    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader()
        r.onload = () => res(r.result.split(',')[1])
        r.onerror = rej
        r.readAsDataURL(file)
      })

      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: file.type || 'image/jpeg', data: base64 } },
              { type: 'text', text: `Đây là phiếu bán hàng của công ty vật liệu xây dựng. Hãy đọc và trả về JSON theo format sau (KHÔNG có markdown, chỉ JSON thuần):
{"items":[{"tenHang":"tên đầy đủ sản phẩm","khoiLuong":số_kg_hoặc_0,"thanhTien":số_tiền_vnd_hoặc_0}]}
Chỉ lấy các hàng có sản phẩm thực sự. Khối lượng tính bằng kg (nếu là cây thì tỷ trọng × số lượng). Thành tiền là số thực (VD: 29023781).` }
            ]
          }]
        })
      })

      const data = await resp.json()
      const text = data.content?.[0]?.text || ''
      const clean = text.replace(/```[a-z]*|```/g,'').trim()
      const parsed = JSON.parse(clean)

      if (parsed.items?.length) {
        setHangHoa(parsed.items.map(it => ({
          tenHang: it.tenHang || '',
          khoiLuong: String(it.khoiLuong || ''),
          thanhTien: String(it.thanhTien || ''),
        })))
        setOcrState('done')
      } else {
        setOcrState(null)
        alert('Không đọc được hàng hóa từ ảnh. Vui lòng nhập tay.')
      }
    } catch (e) {
      console.error('OCR error:', e)
      setOcrState(null)
      alert('Lỗi đọc ảnh. Vui lòng nhập tay.')
    }
  }

  const validate = () => {
    const e = {}
    if (!form.noiDi.trim()) e.noiDi = 'Nhập nơi đi'
    if (!form.noiDen.trim()) e.noiDen = 'Nhập nơi đến'
    if (!form.kmBatDau) e.kmBatDau = 'Nhập km bắt đầu'
    if (form.kmKetThuc && Number(form.kmKetThuc) <= Number(form.kmBatDau))
      e.kmKetThuc = 'Km kết thúc phải lớn hơn km bắt đầu'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const body = {
        ...form,
        bienSoChon,
        ngay,
        mucDich: form.mucDich,
        coTai: form.coTai,
        kmBatDau: Number(form.kmBatDau),
        kmKetThuc: form.kmKetThuc ? Number(form.kmKetThuc) : undefined,
        kmDeoDoc: Number(form.kmDeoDoc) || 0,
        phutCau:  Number(form.phutCau)  || 0,
        hangHoa: form.coTai ? hangHoa
          .filter(h => h.tenHang.trim())
          .map(h => ({ tenHang: h.tenHang, khoiLuong: Number(h.khoiLuong)||0, thanhTien: Number(h.thanhTien)||0 }))
          : [],
      }
      const r = await fetch(`${API}/api/nhat-trinh-ngay`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      onSaved()
    } catch(e) {
      alert('Lỗi: ' + e.message)
    }
    setSaving(false)
  }

  const addHangHoa = () => setHangHoa(h => [...h, { tenHang: '', khoiLuong: '', thanhTien: '' }])
  const setHH = (i, k, v) => setHangHoa(h => h.map((row, idx) => idx === i ? {...row, [k]: v} : row))
  const removeHH = (i) => setHangHoa(h => h.filter((_,idx) => idx !== i))

  return (
    <div style={S.page}>

      {/* Nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', color: V.red, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
          ✕ Huỷ
        </button>
        <div style={{ fontSize: isMobile ? 18 : 20, fontWeight: 700, color: V.lbl1, flex: 1 }}>
          Chuyến #{thuTu} · {ngay}
        </div>
      </div>

      {/* Biển số (nếu nhóm) */}
      {hasMulti && (
        <div style={S.card}>
          <div style={S.cardHdr()}>🚛 Biển số xe</div>
          <div style={S.cardBody}>
            <select value={bienSoChon} onChange={e => setBienSoChon(e.target.value)}
              style={{ ...S.inp(false), colorScheme: 'dark' }}>
              {bienSoList.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Hành trình */}
      <div style={S.card}>
        <div style={S.cardHdr()}>📍 Hành trình</div>
        <div style={{ ...S.cardBody, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
          <div>
            <div style={S.label}>Nơi đi *</div>
            <input value={form.noiDi} onChange={e => set('noiDi', e.target.value)}
              placeholder="VD: CH Hương Sơn"
              style={S.inp(errors.noiDi)} />
            {errors.noiDi && <div style={{ fontSize: 11, color: V.red, marginTop: 4 }}>{errors.noiDi}</div>}
          </div>
          <div>
            <div style={S.label}>Nơi đến *</div>
            <input value={form.noiDen} onChange={e => set('noiDen', e.target.value)}
              placeholder="VD: KH Nguyễn Văn A"
              style={S.inp(errors.noiDen)} />
            {errors.noiDen && <div style={{ fontSize: 11, color: V.red, marginTop: 4 }}>{errors.noiDen}</div>}
          </div>
        </div>
      </div>

      {/* Mục đích + có tải */}
      <div style={S.card}>
        <div style={S.cardHdr()}>🎯 Mục đích & trạng thái</div>
        <div style={{ ...S.cardBody, display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 12 }}>
          {MUC_DICH.map(m => (
            <button key={m.key} style={S.chip(form.mucDich === m.key)}
              onClick={() => set('mucDich', m.key)}>
              {m.icon} {m.label}
            </button>
          ))}
        </div>
        <div style={{ borderTop: `0.5px solid ${V.sep}`, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 15, color: V.lbl1, fontWeight: 500 }}>Có chở hàng (có tải)</div>
            <div style={{ fontSize: 12, color: V.lbl3, marginTop: 2 }}>{form.coTai ? 'Xe đang chở hàng' : 'Xe chạy không'}</div>
          </div>
          <div style={S.toggle(form.coTai)} onClick={() => set('coTai', !form.coTai)}>
            <div style={S.toggleDot(form.coTai)} />
          </div>
        </div>
      </div>

      {/* Số km */}
      <div style={S.card}>
        <div style={S.cardHdr()}>📏 Số kilometre</div>
        <div style={{ ...S.cardBody }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <div style={S.label}>
                Km bắt đầu *
                {lastKm && <span style={{ color: V.green, marginLeft: 4 }}>↑ tự điền</span>}
              </div>
              <input type="number" value={form.kmBatDau} onChange={e => set('kmBatDau', e.target.value)}
                placeholder="VD: 48241"
                style={{ ...S.inp(errors.kmBatDau), borderColor: lastKm ? `${V.green}66` : undefined }} />
              {errors.kmBatDau && <div style={{ fontSize: 11, color: V.red, marginTop: 4 }}>{errors.kmBatDau}</div>}
            </div>
            <div>
              <div style={S.label}>
                Km kết thúc
                {thuTu > 1 && <span style={{ color: V.lbl3, marginLeft: 4 }}>= Km cuối ngày</span>}
              </div>
              <input type="number" value={form.kmKetThuc} onChange={e => set('kmKetThuc', e.target.value)}
                placeholder="Điền khi về"
                style={S.inp(errors.kmKetThuc)} />
              {errors.kmKetThuc && <div style={{ fontSize: 11, color: V.red, marginTop: 4 }}>{errors.kmKetThuc}</div>}
            </div>
          </div>

          {/* Km đèo và phút cẩu */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={S.label}>Km đèo/dốc/hỏng</div>
              <input type="number" value={form.kmDeoDoc} onChange={e => set('kmDeoDoc', e.target.value)}
                placeholder="0" style={S.inp(false)} />
            </div>
            <div>
              <div style={S.label}>Phút sử dụng cẩu</div>
              <input type="number" value={form.phutCau} onChange={e => set('phutCau', e.target.value)}
                placeholder="0" style={S.inp(false)} />
            </div>
          </div>

          {/* Live total */}
          {form.kmBatDau && form.kmKetThuc && Number(form.kmKetThuc) > Number(form.kmBatDau) && (
            <div style={{ marginTop: 10, padding: '8px 12px', background: `${V.blue}18`, borderRadius: V.r10, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: V.lbl2 }}>Tổng km chuyến này</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: V.blue }}>{(Number(form.kmKetThuc) - Number(form.kmBatDau)).toLocaleString('vi-VN')} km</span>
            </div>
          )}
        </div>
      </div>

      {/* Hàng hóa — chỉ khi có tải */}
      {form.coTai && (
        <div style={S.card}>
          <div style={S.cardHdr()}>📦 Hàng vận chuyển</div>
          <div style={S.cardBody}>

            {/* OCR button */}
            <input ref={fileRef} type="file" accept="image/*" capture="environment"
              style={{ display: 'none' }}
              onChange={e => { if (e.target.files?.[0]) handleOCR(e.target.files[0]) }} />

            {ocrState === 'processing' ? (
              <div style={{ background: V.fill2, borderRadius: V.r10, padding: 16, marginBottom: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: V.blue, fontWeight: 600, marginBottom: 8 }}>⚡ AI đang đọc phiếu...</div>
                <div style={{ height: 4, background: V.sep, borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '60%', background: `linear-gradient(90deg,${V.blue},${V.green})`, borderRadius: 2, animation: 'pulse 1.5s ease infinite' }} />
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: V.r10, cursor: 'pointer',
                  background: V.fill2, border: `0.5px dashed ${V.blue}66`,
                  display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, fontFamily: 'inherit',
                }}>
                <span style={{ fontSize: 24 }}>📷</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 13, color: V.blue, fontWeight: 600 }}>
                    {ocrState === 'done' ? '📷 Chụp lại phiếu' : '📷 Chụp phiếu bán hàng'}
                  </div>
                  <div style={{ fontSize: 11, color: V.lbl3, marginTop: 2 }}>AI tự đọc tên hàng · khối lượng · thành tiền</div>
                </div>
              </button>
            )}

            {/* Hàng hóa rows */}
            {hangHoa.map((h, i) => (
              <div key={i} style={{ background: V.fill2, borderRadius: V.r10, padding: '10px 12px', marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: V.lbl3 }}>Hàng #{i+1}</div>
                  {hangHoa.length > 1 && (
                    <button onClick={() => removeHH(i)} style={{ background: 'none', border: 'none', color: V.red, cursor: 'pointer', fontSize: 14, padding: 0 }}>✕</button>
                  )}
                </div>
                <div style={{ marginBottom: 7 }}>
                  <div style={{ ...S.label, marginBottom: 4 }}>Tên hàng</div>
                  <input value={h.tenHang} onChange={e => setHH(i, 'tenHang', e.target.value)}
                    placeholder="VD: Thép hộp mạ kẽm Z120..." style={S.inp(false)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <div style={{ ...S.label, marginBottom: 4 }}>Khối lượng (kg)</div>
                    <input type="number" value={h.khoiLuong} onChange={e => setHH(i, 'khoiLuong', e.target.value)}
                      placeholder="0" style={S.inp(false)} />
                  </div>
                  <div>
                    <div style={{ ...S.label, marginBottom: 4 }}>Thành tiền (đ)</div>
                    <input type="number" value={h.thanhTien} onChange={e => setHH(i, 'thanhTien', e.target.value)}
                      placeholder="0" style={S.inp(false)} />
                  </div>
                </div>
              </div>
            ))}

            <button onClick={addHangHoa}
              style={{ width: '100%', padding: '10px', background: 'none', border: `1px dashed ${V.sep}`, borderRadius: V.r10, color: V.blue, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              ＋ Thêm hàng hóa
            </button>

            {/* Subtotal */}
            {hangHoa.some(h => h.khoiLuong || h.thanhTien) && (
              <div style={{ marginTop: 10, padding: '8px 12px', background: `${V.green}10`, borderRadius: V.r10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: V.lbl2 }}>Tổng</span>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: V.lbl1 }}>
                    {hangHoa.reduce((s,h) => s+(Number(h.khoiLuong)||0), 0).toLocaleString('vi-VN')} kg
                  </span>
                  <span style={{ fontSize: 13, color: V.green, fontWeight: 700, marginLeft: 10 }}>
                    {fmtMoney(hangHoa.reduce((s,h) => s+(Number(h.thanhTien)||0), 0))}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ghi chú */}
      <div style={S.card}>
        <div style={S.cardHdr()}>📝 Ghi chú</div>
        <div style={S.cardBody}>
          <textarea value={form.ghiChu} onChange={e => set('ghiChu', e.target.value)}
            placeholder="Ghi chú thêm nếu có..." rows={3}
            style={{ ...S.inp(false), resize: 'vertical' }} />
        </div>
      </div>

      {/* Save button */}
      <button onClick={handleSave} disabled={saving}
        style={{ ...S.btn(), width: '100%', opacity: saving ? 0.6 : 1 }}>
        {saving ? '⏳ Đang lưu...' : '✓ Lưu chuyến này'}
      </button>

      <style>{`@keyframes pulse { 0%,100%{width:20%} 50%{width:80%} }`}</style>
    </div>
  )
}
