import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const getToken = () => localStorage.getItem('hsg_token') || ''

const PETROLIMEX_URL = 'https://www.petrolimex.com.vn/ndi/thong-cao-bao-chi.html'
const GIAXANG_URL    = 'https://giaxanghomnay.com/lich-su-gia-xang'

export default function PageGiaDau() {
  const now = new Date()
  const [thang, setThang] = useState(now.getMonth() + 1)
  const [nam,   setNam]   = useState(now.getFullYear())
  const [data,  setData]  = useState(null)
  const [allMonths, setAllMonths] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)

  // Form nhập kỳ mới
  const [showForm, setShowForm] = useState(false)
  const [rows, setRows] = useState([{ ngay: '', do001: '', do05: '' }])

  const S = {
    card: { background:'var(--bg-card)', borderRadius:14, padding:'16px 18px',
      border:'0.5px solid var(--sep)', marginBottom:14 },
    btn: (color='var(--apple-blue)') => ({
      padding:'8px 16px', borderRadius:8, background:color, border:'none',
      color:color==='var(--fill-secondary)'?'var(--label-secondary)':'#fff',
      fontSize:13, cursor:'pointer', fontFamily:'inherit' }),
    th: { padding:'8px 12px', textAlign:'left', fontSize:12,
      color:'var(--label-secondary)', borderBottom:'0.5px solid var(--sep)', fontWeight:500 },
    td: { padding:'8px 12px', fontSize:13, borderBottom:'0.5px solid var(--fill-tertiary)' },
    inp: { padding:'6px 10px', borderRadius:8, background:'var(--fill-secondary)',
      border:'0.5px solid var(--sep)', color:'var(--label-primary)',
      fontSize:13, fontFamily:'inherit', width:'100%', boxSizing:'border-box' },
  }

  const fetchMonth = () => {
    setLoading(true); setData(null); setMsg(null)
    fetch(`${API}/api/gia-dau?thang=${thang}&nam=${nam}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    }).then(r=>r.json()).then(d=>{ setData(d); setLoading(false) })
      .catch(e=>{ setMsg({ type:'err', text: e.message }); setLoading(false) })
  }

  const fetchAll = () => {
    fetch(`${API}/api/gia-dau/all`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    }).then(r=>r.json()).then(setAllMonths).catch(()=>{})
  }

  useEffect(() => { fetchMonth(); fetchAll() }, [thang, nam])

  const deleteCache = async () => {
    await fetch(`${API}/api/gia-dau/cache?thang=${thang}&nam=${nam}`, {
      method:'DELETE', headers:{ 'Authorization': `Bearer ${getToken()}` }
    })
    setMsg({ type:'ok', text:'✓ Đã xóa DB record — về lại hardcode' })
    setTimeout(() => { fetchMonth(); fetchAll() }, 500)
  }

  const submitKy = async () => {
    const chiTiet = rows
      .filter(r => r.ngay && r.do001)
      .map(r => ({ ngay: r.ngay, do001: +r.do001, do05: r.do05 ? +r.do05 : null }))

    if (!chiTiet.length) return setMsg({ type:'err', text:'Vui lòng nhập ít nhất 1 kỳ' })

    const res = await fetch(`${API}/api/gia-dau`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ thang, nam, chiTiet, nguon: 'admin nhập tay' }),
    })
    const d = await res.json()
    if (d.success) {
      setMsg({ type:'ok', text:`✓ Đã lưu ${chiTiet.length} kỳ. Avg: ${d.avg?.toLocaleString('vi-VN')}đ` })
      setShowForm(false)
      setRows([{ ngay: '', do001: '', do05: '' }])
      setTimeout(() => { fetchMonth(); fetchAll() }, 300)
    } else {
      setMsg({ type:'err', text: d.error })
    }
  }

  const addRow = () => setRows(r => [...r, { ngay:'', do001:'', do05:'' }])
  const updateRow = (i, field, val) => setRows(r => r.map((row,idx) => idx===i ? {...row,[field]:val} : row))
  const removeRow = (i) => setRows(r => r.filter((_,idx) => idx !== i))

  const sourceColor = (s) => s==='db' ? 'var(--apple-blue)' : s==='hardcode' ? 'var(--apple-green)' : 'var(--label-tertiary)'
  const sourceLabel = (s) => s==='db' ? 'DB (admin)' : s==='hardcode' ? 'Hardcode' : '—'

  return (
    <div style={{ maxWidth:780, margin:'0 auto', padding:'20px 16px' }}>
      <h2 style={{ fontSize:20, fontWeight:700, color:'var(--label-primary)', marginBottom:4 }}>
        🛢 Quản lý giá dầu diesel
      </h2>
      <p style={{ fontSize:12, color:'var(--label-tertiary)', marginBottom:16 }}>
        Đối chiếu:{' '}
        <a href={PETROLIMEX_URL} target="_blank" rel="noreferrer" style={{ color:'var(--apple-blue)' }}>Petrolimex TCBC</a>
        {' · '}
        <a href={GIAXANG_URL} target="_blank" rel="noreferrer" style={{ color:'var(--apple-blue)' }}>giaxanghomnay.com</a>
      </p>

      {/* Tổng hợp tất cả tháng */}
      {allMonths.length > 0 && (
        <div style={S.card}>
          <div style={{ fontSize:13, fontWeight:600, color:'var(--label-secondary)', marginBottom:10 }}>
            📅 Tổng hợp các tháng đã có dữ liệu
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr>
              <th style={S.th}>Tháng</th>
              <th style={S.th}>Số kỳ</th>
              <th style={S.th}>Min (đ)</th>
              <th style={S.th}>Max (đ)</th>
              <th style={S.th}>Bình quân (đ)</th>
              <th style={S.th}>Nguồn</th>
            </tr></thead>
            <tbody>
              {allMonths.map(m => (
                <tr key={m.key} style={{ cursor:'pointer', background: m.key===`${thang}/${nam}` ? 'var(--fill-tertiary)' : '' }}
                  onClick={() => { setThang(m.thang); setNam(m.nam) }}>
                  <td style={{ ...S.td, fontWeight:600 }}>T{m.thang}/{m.nam}</td>
                  <td style={{ ...S.td, color:'var(--apple-blue)', fontWeight:700 }}>{m.soLanDieuChinh}</td>
                  <td style={{ ...S.td, color:'var(--apple-green)' }}>{m.min?.toLocaleString('vi-VN')}</td>
                  <td style={{ ...S.td, color:'var(--apple-red)' }}>{m.max?.toLocaleString('vi-VN')}</td>
                  <td style={S.td}>{m.avg?.toLocaleString('vi-VN')}</td>
                  <td style={{ ...S.td, fontSize:11 }}>
                    <span style={{ color: sourceColor(m.source), fontWeight:600 }}>{sourceLabel(m.source)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Chọn tháng + actions */}
      <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap', alignItems:'center' }}>
        <select value={thang} onChange={e=>setThang(+e.target.value)}
          style={{ padding:'8px 12px', borderRadius:8, background:'var(--fill-secondary)',
            border:'0.5px solid var(--sep)', color:'var(--label-primary)', fontSize:13 }}>
          {[...Array(12)].map((_,i) => <option key={i+1} value={i+1}>Tháng {i+1}</option>)}
        </select>
        <select value={nam} onChange={e=>setNam(+e.target.value)}
          style={{ padding:'8px 12px', borderRadius:8, background:'var(--fill-secondary)',
            border:'0.5px solid var(--sep)', color:'var(--label-primary)', fontSize:13 }}>
          {[2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <button style={S.btn()} onClick={fetchMonth}>🔄 Tải lại</button>
        <button style={S.btn('var(--fill-secondary)')} onClick={deleteCache}>🗑 Xóa DB</button>
        <button style={S.btn('var(--apple-green)')} onClick={() => setShowForm(v=>!v)}>
          {showForm ? '✕ Đóng' : '＋ Nhập kỳ mới'}
        </button>
      </div>

      {msg && (
        <div style={{ fontSize:12, color: msg.type==='ok' ? 'var(--apple-green)' : 'var(--apple-red)',
          marginBottom:10, padding:'6px 10px', borderRadius:8, background: msg.type==='ok' ? '#30d15822' : '#ff453a22' }}>
          {msg.text}
        </div>
      )}

      {/* Form nhập kỳ mới */}
      {showForm && (
        <div style={{ ...S.card, border:'0.5px solid var(--apple-green)' }}>
          <div style={{ fontSize:13, fontWeight:600, color:'var(--apple-green)', marginBottom:12 }}>
            ＋ Nhập kỳ điều chỉnh giá tháng {thang}/{nam}
          </div>
          <div style={{ fontSize:11, color:'var(--label-tertiary)', marginBottom:10 }}>
            Tra giá tại: <a href={GIAXANG_URL} target="_blank" rel="noreferrer" style={{color:'var(--apple-blue)'}}>giaxanghomnay.com/lich-su-gia-xang</a>
            {' '}→ chọn đúng tháng → nhập từng kỳ điều chỉnh vào bảng dưới.
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:10 }}>
            <thead><tr>
              <th style={S.th}>Ngày (vd: 1/5/2026)</th>
              <th style={S.th}>DO 0,001S-V (đ)</th>
              <th style={S.th}>DO 0,05S-II (đ) — tùy chọn</th>
              <th style={S.th}></th>
            </tr></thead>
            <tbody>
              {rows.map((row,i) => (
                <tr key={i}>
                  <td style={S.td}><input value={row.ngay} onChange={e=>updateRow(i,'ngay',e.target.value)}
                    placeholder="vd: 1/5/2026" style={S.inp} /></td>
                  <td style={S.td}><input type="number" value={row.do001} onChange={e=>updateRow(i,'do001',e.target.value)}
                    placeholder="vd: 31500" style={S.inp} /></td>
                  <td style={S.td}><input type="number" value={row.do05} onChange={e=>updateRow(i,'do05',e.target.value)}
                    placeholder="vd: 30100" style={S.inp} /></td>
                  <td style={{ ...S.td, width:40 }}>
                    {rows.length > 1 && (
                      <button onClick={()=>removeRow(i)}
                        style={{ background:'none', border:'none', color:'var(--apple-red)', cursor:'pointer', fontSize:16 }}>✕</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display:'flex', gap:8 }}>
            <button style={S.btn('var(--fill-secondary)')} onClick={addRow}>＋ Thêm kỳ</button>
            <button style={S.btn()} onClick={submitKy}>💾 Lưu tháng {thang}/{nam}</button>
          </div>
        </div>
      )}

      {/* Chi tiết tháng đang chọn */}
      {loading && <div style={{ textAlign:'center', color:'var(--label-tertiary)', padding:30 }}>Đang tải...</div>}
      {data && !loading && (
        <div style={S.card}>
          <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:12, flexWrap:'wrap' }}>
            <span style={{ fontSize:16, fontWeight:700, color:'var(--label-primary)' }}>
              Tháng {thang}/{nam}
            </span>
            {data.available ? (
              <span style={{ fontSize:11, padding:'2px 8px', borderRadius:6,
                background:'var(--apple-green)22', color:'var(--apple-green)', fontWeight:600 }}>✓ Có dữ liệu</span>
            ) : (
              <span style={{ fontSize:11, padding:'2px 8px', borderRadius:6,
                background:'var(--apple-red)22', color:'var(--apple-red)', fontWeight:600 }}>✗ Chưa có — nhấn ＋ Nhập kỳ mới</span>
            )}
            <span style={{ fontSize:11, color: sourceColor(data.source) }}>
              [{sourceLabel(data.source)}]
            </span>
          </div>

          {data.available && (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:8, marginBottom:14 }}>
                {[
                  { label:'Số kỳ điều chỉnh', value: data.soLanDieuChinh, color:'var(--apple-blue)' },
                  { label:'Giá thấp nhất',     value: data.min?.toLocaleString('vi-VN')+'đ', color:'var(--apple-green)' },
                  { label:'Giá cao nhất',       value: data.max?.toLocaleString('vi-VN')+'đ', color:'var(--apple-red)' },
                  { label:'Bình quân 4 mức',    value: data.avg?.toLocaleString('vi-VN')+'đ', color:'var(--label-primary)' },
                ].map(item => (
                  <div key={item.label} style={{ background:'var(--fill-tertiary)', borderRadius:10, padding:'10px 12px' }}>
                    <div style={{ fontSize:10, color:'var(--label-tertiary)', marginBottom:3 }}>{item.label}</div>
                    <div style={{ fontSize:15, fontWeight:700, color:item.color }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {data.chiTiet?.length > 0 && (
                <>
                  <div style={{ fontSize:12, color:'var(--label-secondary)', marginBottom:8, fontWeight:600 }}>
                    Chi tiết {data.chiTiet.length} kỳ:
                  </div>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead><tr>
                      <th style={S.th}>Ngày</th>
                      <th style={S.th}>DO 0,001S-V (đ/lít)</th>
                      <th style={S.th}>DO 0,05S-II (đ/lít)</th>
                    </tr></thead>
                    <tbody>
                      {data.chiTiet.map((row,i) => (
                        <tr key={i}>
                          <td style={S.td}>{row.ngay}</td>
                          <td style={{ ...S.td, fontWeight:600, color:'var(--label-primary)' }}>
                            {row.do001?.toLocaleString('vi-VN')}
                          </td>
                          <td style={{ ...S.td, color:'var(--label-secondary)' }}>
                            {row.do05?.toLocaleString('vi-VN') ?? '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
              {data.nguon && (
                <div style={{ fontSize:11, color:'var(--label-quaternary)', marginTop:8 }}>
                  Nguồn: {data.nguon}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Hướng dẫn */}
      <div style={{ ...S.card, background:'var(--fill-tertiary)', fontSize:12, color:'var(--label-tertiary)', lineHeight:1.8 }}>
        <strong style={{ color:'var(--label-secondary)' }}>Quy trình cập nhật tháng mới:</strong><br/>
        1. Mở <a href={GIAXANG_URL} target="_blank" rel="noreferrer" style={{color:'var(--apple-blue)'}}>giaxanghomnay.com/lich-su-gia-xang</a>
        {' '}→ cuộn xuống tìm tháng cần cập nhật<br/>
        2. Chọn đúng tháng/năm ở trên → bấm <strong>＋ Nhập kỳ mới</strong><br/>
        3. Nhập từng kỳ điều chỉnh (ngày + DO 0,001S-V + DO 0,05S-II)<br/>
        4. Bấm <strong>Lưu</strong> → app tự tính bình quân, min, max<br/>
        5. Cảnh báo giá dầu trong form nhật trình sẽ tự dùng dữ liệu mới
      </div>
    </div>
  )
}
