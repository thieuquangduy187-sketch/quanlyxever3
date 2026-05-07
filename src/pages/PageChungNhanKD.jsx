// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📁 FRONTEND — quanlyxever3/src/pages/PageChungNhanKD.jsx
// Trang chứng nhận kiểm định — tìm kiếm theo biển số
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { useState, useEffect, useRef } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const authFetch = (path) => fetch(`${API}${path}`, {
  headers: { Authorization: `Bearer ${localStorage.getItem('hsg_token') || ''}` }
})

// ── Style helpers ─────────────────────────────────────────
const S = {
  label: { fontSize:11, color:'var(--label-secondary)', marginBottom:2 },
  labelEn: { fontSize:9.5, color:'#ABABAB', fontStyle:'italic' },
  value: { fontSize:12.5, fontWeight:500 },
  sep: { borderBottom:'0.5px solid var(--sep)', padding:'5px 0' },
  grid2: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' },
}

function FieldRow({ label, labelEn, value }) {
  const val = value && String(value).trim() ? String(value).trim() : '-'
  return (
    <div style={{ display:'grid', gridTemplateColumns:'190px 1fr', gap:4, padding:'5px 0', borderBottom:'0.5px solid var(--sep)', alignItems:'center' }}>
      <div>
        <div style={S.label}>{label}</div>
        {labelEn && <div style={S.labelEn}>{labelEn}</div>}
      </div>
      <div style={{ ...S.value, color: val === '-' ? '#C0C0C0' : 'var(--label-primary)' }}>{val}</div>
    </div>
  )
}

function Certificate({ dk }) {
  const parseDate = s => { const p=(s||'').split('/'); return p.length===3?new Date(`${p[2]}-${p[1]}-${p[0]}`):null }
  const hanDate   = parseDate(dk.thoiHanKDHienTai)
  const daysLeft  = hanDate ? Math.ceil((hanDate - new Date()) / 86400000) : null
  const hanColor  = daysLeft === null ? 'var(--label-secondary)'
    : daysLeft < 0 ? 'var(--apple-red)' : daysLeft < 30 ? 'var(--apple-orange)' : 'var(--apple-green)'
  const hanBg     = daysLeft === null ? 'var(--bg-card)'
    : daysLeft < 0 ? 'rgba(215,0,21,.06)' : daysLeft < 30 ? 'rgba(196,85,0,.06)' : 'rgba(52,199,89,.06)'

  const currentKD = (dk.lichSuKD || []).find(l => l.ngayKD === dk.ngayKDGanNhat) || dk.lichSuKD?.[0]

  // Chips lốp: "2;4" + "7.00-16;7.00-16" → [{cau, so, co}]
  const lopChips = () => {
    const so = (dk.soLop || '').split(';').map(s=>s.trim()).filter(Boolean)
    const co = (dk.coLop || '').split(';').map(s=>s.trim()).filter(Boolean)
    const len = Math.max(so.length, co.length)
    if (!len) return null
    return Array.from({length:len}, (_,i) => ({ cau:`Cầu ${i+1}`, so:so[i]||'?', co:co[i]||'?' }))
  }
  const chips = lopChips()

  return (
    <div style={{ background:'var(--bg-card)', border:'0.5px solid var(--sep)', borderRadius:14, overflow:'hidden', maxWidth:760, margin:'0 auto' }}>

      {/* Header trạm */}
      <div style={{ background:'var(--bg-grouped)', padding:'12px 16px', borderBottom:'0.5px solid var(--sep)',
        display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <div style={{ fontWeight:600, fontSize:14 }}>Cơ sở đăng kiểm {currentKD?.tramKD || dk.donViThuPhi || '-'}</div>
          <div style={{ fontSize:10.5, color:'var(--label-secondary)', fontStyle:'italic', marginTop:1 }}>
            Periodical Technical Inspection Station
          </div>
        </div>
        <div style={{ textAlign:'right', fontSize:11.5, color:'var(--label-secondary)', lineHeight:1.8 }}>
          <div>Ngày KĐ: <strong style={{ color:'var(--label-primary)' }}>{currentKD?.ngayKD || '-'}</strong></div>
          <div>Số phiếu KĐ: <strong style={{ color:'var(--label-primary)' }}>{currentKD?.soPhieu || '-'}</strong></div>
        </div>
      </div>

      {/* Tiêu đề */}
      <div style={{ padding:'12px 16px', textAlign:'center', borderBottom:'0.5px solid var(--sep)' }}>
        <div style={{ fontWeight:700, fontSize:14, color:'var(--apple-blue)', lineHeight:1.5 }}>
          CHỨNG NHẬN KIỂM ĐỊNH AN TOÀN KỸ THUẬT VÀ BẢO VỆ MÔI TRƯỜNG XE CƠ GIỚI
        </div>
        <div style={{ fontSize:10, color:'var(--label-secondary)', fontStyle:'italic', marginTop:3, lineHeight:1.5 }}>
          Periodical Inspection Certificate of Motor Vehicle for Compliance with Technical Safety and Environmental Protection Requirements
        </div>
      </div>

      {/* Biển số + số quản lý */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', padding:'10px 16px', borderBottom:'0.5px solid var(--sep)', gap:12 }}>
        <div>
          <div style={{ fontSize:10.5, color:'var(--label-secondary)' }}>Biển đăng ký <span style={{ fontStyle:'italic' }}>(Registration plate)</span></div>
          <div style={{ fontSize:22, fontWeight:700, letterSpacing:'.04em', color:'var(--apple-blue)', marginTop:3 }}>{dk.bienSo || '-'}</div>
        </div>
        <div>
          <div style={{ fontSize:10.5, color:'var(--label-secondary)' }}>Số quản lý phương tiện <span style={{ fontStyle:'italic' }}>(Vehicle inspection No.)</span></div>
          <div style={{ fontSize:14, fontWeight:600, marginTop:3 }}>{dk.soSoQuanLy || '-'}</div>
        </div>
      </div>

      <div style={{ padding:'10px 16px' }}>
        {/* Section header */}
        <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--label-secondary)', marginBottom:8 }}>
          Thông số kỹ thuật — Specifications
        </div>

        <div style={S.grid2}>
          <div>
            <FieldRow label="Loại phương tiện" labelEn="Vehicle type"      value={dk.loaiPhuongTien} />
            <FieldRow label="Nhãn hiệu"         labelEn="Trademark"        value={dk.nhanHieu} />
            <FieldRow label="Số loại / Model"   labelEn="Model code"       value={dk.soLoai} />
            <FieldRow label="Số khung"          labelEn="Chassis No."      value={dk.soKhung} />
            <FieldRow label="Số máy"            labelEn="Engine No."       value={dk.soMay} />
            <FieldRow label="Năm sản xuất"      labelEn="Production year"  value={dk.namSanXuat} />
            <FieldRow label="Nơi sản xuất"      labelEn="Production country" value={dk.noiSanXuat} />
          </div>
          <div>
            <FieldRow label="KL toàn bộ TK/CPLN (kg)" labelEn="Max. total mass: Designed/Authorized" value={dk.taiTrongThietKe ? `${dk.taiTrongThietKe} / ${dk.taiTrongThietKe}` : '-'} />
            <FieldRow label="KL bản thân (kg)"   labelEn="Kerb mass"                value={dk.trongLuongBanThan} />
            <FieldRow label="Tải trọng TK (kg)"  labelEn="Max. cargo payload"       value={dk.taiTrongThietKe} />
            <FieldRow label="Số người chở"       labelEn="Passenger capacity"       value={dk.soNguoi} />
            <FieldRow label="Kích thước bao (mm)" labelEn="Overall dimensions"      value={dk.kichThuocBao} />
            <FieldRow label="Kích thước thùng (mm)" labelEn="Cargo dimensions"      value={dk.kichThuocThung} />
            <FieldRow label="Chiều dài cơ sở (mm)" labelEn="Wheel space"            value={dk.chieuDaiCoSo} />
          </div>
        </div>

        {/* Động cơ */}
        <div style={{ marginTop:6, ...S.grid2 }}>
          <div>
            <FieldRow label="Kiểu động cơ"   labelEn="Engine type"    value={dk.kieuDC} />
            <FieldRow label="Loại nhiên liệu" labelEn="Fuel"           value={dk.nhienLieu} />
          </div>
          <div>
            <FieldRow label="Dung tích (cm³)" labelEn="Displacement"   value={dk.dungTich} />
            <FieldRow label="Công suất / Vòng quay" labelEn="Max.output/rpm" value={dk.congSuat} />
          </div>
        </div>

        <div style={{ marginTop:6, ...S.grid2 }}>
          <FieldRow label="Công thức bánh xe" labelEn="Drive configuration" value={dk.congThucBanhXe} />
          <FieldRow label="Vết bánh xe (mm)"  labelEn="Tire tread"         value={dk.vetBanhXe} />
        </div>

        {/* Lốp */}
        {chips && (
          <div style={{ marginTop:8 }}>
            <div style={{ fontSize:10.5, color:'var(--label-secondary)', marginBottom:5 }}>
              Số lượng lốp / cỡ lốp / trục — <span style={{ fontStyle:'italic' }}>The number of tires / tire size / axle</span>
            </div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {chips.map((c,i) => (
                <span key={i} style={{ padding:'3px 12px', background:'var(--bg-grouped)', border:'0.5px solid var(--sep)', borderRadius:20, fontSize:11.5 }}>
                  <strong>{c.cau}</strong> · {c.so} lốp · {c.co}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Phí KĐ */}
        <div style={{ marginTop:10, padding:'8px 0', borderTop:'0.5px solid var(--sep)' }}>
          <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--label-secondary)', marginBottom:6 }}>
            Phí sử dụng đường bộ
          </div>
          <div style={S.grid2}>
            <div>
              <FieldRow label="Ngày nộp phí"   value={dk.ngayNopPhi} />
              <FieldRow label="Số biên lai"     value={dk.soBienLai} />
            </div>
            <div>
              <FieldRow label="Đơn vị thu phí" value={dk.donViThuPhi} />
              <FieldRow label="Phí đến hết ngày" value={dk.phiDenHetNgay} />
            </div>
          </div>
        </div>

        {/* Lịch sử KĐ */}
        <div style={{ marginTop:10, padding:'8px 0', borderTop:'0.5px solid var(--sep)' }}>
          <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--label-secondary)', marginBottom:6 }}>
            Lịch sử kiểm định
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr>
                {['Trạm KĐ','Số phiếu','Ngày KĐ','Lần KĐ','Số tem GCN','Thời hạn KĐ'].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'4px 8px', fontSize:10, textTransform:'uppercase',
                    letterSpacing:'.05em', color:'var(--label-secondary)', borderBottom:'0.5px solid var(--sep)', fontWeight:600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(dk.lichSuKD || []).length === 0
                ? <tr><td colSpan={6} style={{ padding:'10px 8px', color:'#C0C0C0', fontStyle:'italic', fontSize:12 }}>Chưa có lịch sử</td></tr>
                : (dk.lichSuKD || []).map((l, i) => {
                  const isCurrent = l.ngayKD === dk.ngayKDGanNhat
                  return (
                    <tr key={i} style={{ background:isCurrent?hanBg:undefined }}>
                      {[l.tramKD, l.soPhieu, l.ngayKD, l.lanKD||'-', l.soTem||'-', l.thoiHanKD||'-'].map((v,j) => (
                        <td key={j} style={{ padding:'6px 8px', borderBottom:'0.5px solid var(--sep)',
                          fontWeight:isCurrent&&j===5?700:400, color:isCurrent&&j===5?hanColor:undefined }}>{v}</td>
                      ))}
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding:'10px 16px', background:hanBg, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <span style={{ fontSize:12, color:'var(--label-secondary)' }}>Chứng nhận có hiệu lực đến hết ngày </span>
          <strong style={{ fontSize:14, color:hanColor }}>{dk.thoiHanKDHienTai || '-'}</strong>
          {daysLeft !== null && (
            <span style={{ fontSize:11.5, color:hanColor, marginLeft:8 }}>
              ({daysLeft < 0 ? `Hết hạn ${Math.abs(daysLeft)} ngày` : `Còn ${daysLeft} ngày`})
            </span>
          )}
        </div>
        {currentKD?.soTem && (
          <span style={{ fontSize:11, color:'var(--label-secondary)' }}>
            Số tem: <strong style={{ color:'var(--label-primary)' }}>{currentKD.soTem}</strong>
          </span>
        )}
      </div>
    </div>
  )
}

// ── MAIN PAGE ─────────────────────────────────────────────
export default function PageChungNhanKD() {
  const [allVe,   setAllVe]   = useState([])   // list biển số để dropdown
  const [search,  setSearch]  = useState('')
  const [selBS,   setSelBS]   = useState('')
  const [dk,      setDk]      = useState(null)
  const [loading, setLoading] = useState(false)
  const [err,     setErr]     = useState('')
  const [showDrop, setShowDrop] = useState(false)
  const inputRef = useRef()

  // Load danh sách biển số
  useEffect(() => {
    authFetch('/api/dang-kiem')
      .then(r => r.ok ? r.json() : [])
      .then(d => setAllVe(Array.isArray(d) ? d.map(x => x.bienSo).filter(Boolean).sort() : []))
      .catch(() => {})
  }, [])

  const filtered = search.length >= 1
    ? allVe.filter(b => b.toUpperCase().includes(search.toUpperCase().replace(/[-.\s]/g,'')))
    : allVe

  const loadDK = async (bs) => {
    if (!bs) return
    setLoading(true); setErr(''); setDk(null)
    try {
      const r = await authFetch(`/api/dang-kiem/${encodeURIComponent(bs)}`)
      if (!r.ok) { setErr('Không tìm thấy dữ liệu đăng kiểm cho xe ' + bs); setLoading(false); return }
      setDk(await r.json())
    } catch(e) { setErr(e.message) }
    setLoading(false)
  }

  const handleSelect = (bs) => {
    setSelBS(bs); setSearch(bs); setShowDrop(false); loadDK(bs)
  }

  const downloadDK = async () => {
    try {
      const resp = await fetch(`${API}/api/dang-kiem/export/excel`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('hsg_token') || ''}` }
      })
      if (!resp.ok) { alert('Lỗi tải Excel'); return }
      const blob = await resp.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url; a.download = `DangKiem_290xe_${new Date().toISOString().slice(0,10)}.xlsx`
      document.body.appendChild(a); a.click()
      document.body.removeChild(a); URL.revokeObjectURL(url)
    } catch(e) { alert('Lỗi: ' + e.message) }
  }

  return (
    <div style={{ padding:'16px', maxWidth:900, margin:'0 auto', paddingBottom:40 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:700, color:'var(--label-primary)' }}>Chứng nhận kiểm định</div>
          <div style={{ fontSize:12, color:'var(--label-secondary)', marginTop:3 }}>
            {allVe.length} xe trong hệ thống
          </div>
        </div>
        <button onClick={downloadDK} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px',
          border:'none', borderRadius:9, background:'var(--apple-green)', color:'#fff',
          fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
          ↓ Excel 290 xe
        </button>
      </div>

      {/* Search box */}
      <div style={{ position:'relative', marginBottom:20 }}>
        <input
          ref={inputRef}
          value={search}
          onChange={e => { setSearch(e.target.value); setShowDrop(true) }}
          onFocus={() => setShowDrop(true)}
          onKeyDown={e => {
            if (e.key === 'Enter' && filtered.length > 0) handleSelect(filtered[0])
            if (e.key === 'Escape') setShowDrop(false)
          }}
          placeholder="Nhập biển số xe (VD: 61C23334)..."
          style={{ width:'100%', padding:'12px 16px', fontSize:14, fontWeight:500,
            border:'1px solid var(--sep)', borderRadius:10, background:'var(--bg-card)',
            color:'var(--label-primary)', outline:'none', boxSizing:'border-box',
            fontFamily:'inherit' }}
        />
        {search && (
          <button onClick={() => { setSearch(''); setSelBS(''); setDk(null); setErr(''); inputRef.current?.focus() }}
            style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
              border:'none', background:'none', cursor:'pointer', color:'var(--label-secondary)', fontSize:18 }}>✕</button>
        )}
        {showDrop && filtered.length > 0 && (
          <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'var(--bg-card)',
            border:'1px solid var(--sep)', borderRadius:10, zIndex:100, maxHeight:240,
            overflowY:'auto', boxShadow:'0 4px 24px rgba(0,0,0,.12)', marginTop:4 }}>
            {filtered.slice(0, 30).map(bs => (
              <div key={bs} onMouseDown={() => handleSelect(bs)}
                style={{ padding:'10px 16px', cursor:'pointer', fontSize:13, fontWeight:500,
                  borderBottom:'0.5px solid var(--sep)', color:'var(--label-primary)',
                  background: bs === selBS ? 'var(--bg-grouped)' : undefined }}
                onMouseEnter={e => e.currentTarget.style.background='var(--bg-grouped)'}
                onMouseLeave={e => e.currentTarget.style.background = bs===selBS?'var(--bg-grouped)':''}>
                {bs}
              </div>
            ))}
            {filtered.length > 30 && (
              <div style={{ padding:'8px 16px', fontSize:11, color:'var(--label-secondary)', textAlign:'center' }}>
                ... và {filtered.length - 30} xe khác
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {loading && (
        <div style={{ textAlign:'center', padding:40, color:'var(--label-secondary)', fontSize:13 }}>
          Đang tải...
        </div>
      )}
      {err && !loading && (
        <div style={{ padding:16, background:'rgba(215,0,21,.06)', border:'0.5px solid rgba(215,0,21,.2)',
          borderRadius:10, color:'var(--apple-red)', fontSize:13 }}>{err}</div>
      )}
      {!loading && !err && !dk && (
        <div style={{ textAlign:'center', padding:60, color:'var(--label-secondary)' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🔍</div>
          <div style={{ fontSize:14, fontWeight:600, color:'var(--label-primary)', marginBottom:8 }}>
            Tìm kiếm theo biển số
          </div>
          <div style={{ fontSize:13 }}>Nhập biển số xe để xem chứng nhận kiểm định</div>
        </div>
      )}
      {!loading && dk && <Certificate dk={dk} />}
    </div>
  )
}
