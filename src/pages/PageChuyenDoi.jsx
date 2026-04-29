// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📁 FRONTEND — quanlyxever3/src/pages/PageChuyenDoi.jsx
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const getToken = () => localStorage.getItem('hsg_token') || ''
const authFetch = (path, opts = {}) => fetch(`${API}${path}`, {
  ...opts,
  headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json', ...(opts.headers||{}) }
})

const ALL_DOTS = ['Đợt 1','Đợt 2','Đợt 3','Đợt 4','Đợt 5','Đợt 6','Đợt 7']

const DOT_TINH = {
  'Đợt 1': 'Vĩnh Long, An Giang, Cần Thơ, TK Miền Tây',
  'Đợt 2': 'TP.HCM, Tây Ninh, Đồng Nai, Lâm Đồng, TK Bình Dương',
  'Đợt 3': 'Gia Lai, Đak Lak, Khánh Hòa, TK Nhơn Hòa, TK Tây Nguyên',
  'Đợt 4': 'Quảng Ngãi, Đà Nẵng, Huế, Quảng Trị, TK Đà Nẵng',
  'Đợt 5': 'Hà Tĩnh, Nghệ An, Thanh Hóa, TK Nghệ An',
  'Đợt 6': 'Ninh Bình, Hà Nội, Hưng Yên, Quảng Ninh, Hải Phòng, Lạng Sơn, Bắc Ninh, TK Hà Nam',
  'Đợt 7': 'Điện Biên, Sơn La, Lai Châu, Lào Cai, Tuyên Quang, Thái Nguyên',
}

function Toast({ msg, err }) {
  return (
    <div style={{ position:'fixed', top:20, right:20, zIndex:9999, padding:'10px 18px',
      borderRadius:10, fontSize:13, fontWeight:500, color:'#fff',
      background: err ? '#FF3B30' : '#34C759', boxShadow:'0 4px 20px rgba(0,0,0,.2)' }}>
      {msg}
    </div>
  )
}

// ── Tab A: Chuyển đổi theo đợt ────────────────────────────
function TabChuyenDot({ dotsDone, dotCount, onSave, onBatchUpdate }) {
  const [selected, setSelected] = useState(new Set(dotsDone))
  const [updating, setUpdating] = useState(null)

  useEffect(() => { setSelected(new Set(dotsDone)) }, [dotsDone])

  const toggle = (dot) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(dot) ? next.delete(dot) : next.add(dot)
      return next
    })
  }

  const countMap = Object.fromEntries(dotCount.map(d => [d._id, d.count]))

  return (
    <div>
      <div style={{ fontSize:13, color:'var(--label-secondary)', marginBottom:16, lineHeight:1.7 }}>
        Đánh dấu đợt đã hoàn tất chuyển đổi → hệ thống sẽ lookup thông tin theo <strong>HSH</strong>.
        Khi batch update, tên CH, mã CH, tỉnh, miền sẽ được cập nhật theo HSH (<strong>không ghi cây điều động</strong>).
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
        {ALL_DOTS.map(dot => {
          const done = selected.has(dot)
          const wasDone = dotsDone.includes(dot)
          const count = countMap[dot] || 0
          return (
            <div key={dot} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px',
              borderRadius:10, border: done ? '1.5px solid #34C759' : '1px solid var(--sep)',
              background: done ? 'rgba(52,199,89,.05)' : 'var(--bg-card)', cursor:'pointer' }}
              onClick={() => toggle(dot)}>
              <div style={{ width:20, height:20, borderRadius:6, border: done ? 'none' : '1.5px solid var(--sep)',
                background: done ? '#34C759' : 'transparent', display:'flex', alignItems:'center',
                justifyContent:'center', flexShrink:0, fontSize:12, color:'#fff' }}>
                {done ? '✓' : ''}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontWeight:600, fontSize:13 }}>{dot}</span>
                  <span style={{ fontSize:11, color:'var(--label-tertiary)' }}>({count} xe)</span>
                  {done && !wasDone && <span style={{ fontSize:10, color:'#FF9500', fontWeight:600 }}>Mới đánh dấu</span>}
                  {wasDone && <span style={{ fontSize:10, color:'#34C759', fontWeight:600 }}>✓ Đã chuyển HSH</span>}
                </div>
                <div style={{ fontSize:11, color:'var(--label-secondary)', marginTop:2 }}>{DOT_TINH[dot]}</div>
              </div>
              {done && (
                <button
                  onClick={e => { e.stopPropagation(); onBatchUpdate(dot, setUpdating) }}
                  disabled={updating === dot}
                  style={{ padding:'5px 12px', borderRadius:7, border:'none',
                    background: updating === dot ? 'var(--sep)' : 'var(--brand)',
                    color:'#fff', cursor: updating === dot ? 'not-allowed' : 'pointer',
                    fontSize:11, fontFamily:'inherit', fontWeight:600, flexShrink:0 }}>
                  {updating === dot ? '⏳' : '⚡ Batch Update'}
                </button>
              )}
            </div>
          )
        })}
      </div>

      <button onClick={() => onSave([...selected])}
        style={{ padding:'9px 24px', borderRadius:8, border:'none', background:'var(--brand)',
          color:'#fff', fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
        💾 Lưu cấu hình đợt
      </button>
    </div>
  )
}

// ── Tab C: Audit / dò lại hệ thống ────────────────────────
function TabAudit() {
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState(null)
  const [fixing, setFixing]     = useState(null)
  const [ignored, setIgnored]   = useState(new Set())
  const [fixed, setFixed]       = useState(new Set())
  const [filterMode, setFilter] = useState('all')

  const runAudit = async () => {
    setLoading(true); setResult(null); setFixed(new Set())
    try {
      const r = await authFetch('/api/cua-hang/audit')
      const d = await r.json()
      setResult(d)
    } catch(e) { alert('Lỗi: ' + e.message) }
    setLoading(false)
  }

  const handleIgnore = async (item) => {
    try {
      await authFetch('/api/cua-hang/ignore', {
        method: 'POST',
        body: JSON.stringify({ bienSo: item.bienSo, tenCH: item.tenCH })
      })
      setIgnored(prev => new Set([...prev, `${item.bienSo}|${item.tenCH}`]))
    } catch(e) { alert('Lỗi: ' + e.message) }
  }

  const fixOne = async (item) => {
    setFixing(item.bienSo)
    try {
      await authFetch('/api/cua-hang/fix-one', {
        method: 'POST',
        body: JSON.stringify({ bienSo: item.bienSo, ...item.suggest })
      })
      setFixed(prev => new Set([...prev, item.bienSo]))
    } catch(e) { alert('Lỗi: ' + e.message) }
    setFixing(null)
  }

  const fixAll = async () => {
    if (!window.confirm(`Sửa tất cả ${result?.data?.length} xe? Không thể hoàn tác.`)) return
    for (const item of (result?.data || [])) {
      if (item.suggest && !fixed.has(item.bienSo)) await fixOne(item)
    }
  }

  const filtered = (result?.data || []).filter(i =>
    !ignored.has(`${i.bienSo}|${i.tenCH}`)
  ).filter(i =>
    filterMode === 'all' ? true :
    filterMode === 'mismatch' ? i.loai === 'MISMATCH' :
    i.loai === 'NOT_FOUND'
  )

  return (
    <div>
      <div style={{ fontSize:13, color:'var(--label-secondary)', marginBottom:16, lineHeight:1.7 }}>
        Dò toàn bộ xe — so sánh tên CH, mã CH, tỉnh, miền với <strong>danhsachcuahang</strong>.
        Hiển thị cảnh báo và gợi ý sửa khi phát hiện sai lệch.
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:16, alignItems:'center' }}>
        <button onClick={runAudit} disabled={loading}
          style={{ padding:'8px 20px', borderRadius:8, border:'none',
            background: loading ? 'var(--sep)' : 'var(--brand)', color:'#fff',
            fontWeight:600, fontSize:13, cursor: loading ? 'not-allowed' : 'pointer', fontFamily:'inherit' }}>
          {loading ? '⏳ Đang dò...' : '🔍 Bắt đầu dò hệ thống'}
        </button>
        {result && (
          <>
            <span style={{ fontSize:12, color:'var(--label-secondary)' }}>
              {result.total} xe · <span style={{ color:'#FF3B30', fontWeight:600 }}>{result.issues} lỗi</span>
            </span>
            {result.issues > 0 && (
              <button onClick={fixAll}
                style={{ padding:'6px 14px', borderRadius:7, border:'1px solid #FF9500',
                  background:'rgba(255,149,0,.08)', color:'#FF9500', fontWeight:600,
                  fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                ⚡ Sửa tất cả
              </button>
            )}
          </>
        )}
      </div>

      {result && (
        <>
          {/* Filter tabs */}
          <div style={{ display:'flex', gap:6, marginBottom:12 }}>
            {[['all','Tất cả lỗi'], ['mismatch','Sai thông tin'], ['not_found','Không tìm thấy']].map(([k,l]) => (
              <button key={k} onClick={() => setFilter(k)}
                style={{ padding:'4px 12px', borderRadius:20, border: filterMode===k ? 'none' : '1px solid var(--sep)',
                  background: filterMode===k ? 'var(--brand)' : 'var(--bg-card)',
                  color: filterMode===k ? '#fff' : 'var(--label-primary)',
                  fontSize:11, cursor:'pointer', fontFamily:'inherit', fontWeight: filterMode===k ? 600 : 400 }}>
                {l}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:40, color:'var(--label-secondary)' }}>
              {result.issues === 0 ? '✅ Không phát hiện sai lệch nào!' : 'Không có lỗi loại này'}
            </div>
          ) : (
            <div style={{ background:'var(--bg-card)', borderRadius:12, border:'0.5px solid var(--sep)', overflow:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead>
                  <tr style={{ background:'var(--bg-secondary)' }}>
                    {['Biển số','Tên CH','Tỉnh','Mã CH','Lỗi phát hiện','Gợi ý sửa',''].map(h => (
                      <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontSize:11,
                        fontWeight:600, color:'var(--label-secondary)', borderBottom:'1px solid var(--sep)',
                        whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item, i) => {
                    const isDone = fixed.has(item.bienSo)
                    return (
                      <tr key={i} style={{ borderBottom:'0.5px solid var(--sep)',
                        background: isDone ? 'rgba(52,199,89,.04)' : 'transparent',
                        opacity: isDone ? 0.6 : 1 }}>
                        <td style={{ padding:'8px 12px', fontWeight:600 }}>{item.bienSo}</td>
                        <td style={{ padding:'8px 12px' }}>{item.tenCH}</td>
                        <td style={{ padding:'8px 12px', color:'var(--label-secondary)' }}>{item.tinhXe}</td>
                        <td style={{ padding:'8px 12px', color:'var(--label-secondary)' }}>{item.maXe}</td>
                        <td style={{ padding:'8px 12px', color:'#FF3B30', fontSize:11 }}>{item.message}</td>
                        <td style={{ padding:'8px 12px', fontSize:11, color:'#34C759' }}>
                          {item.suggest ? (
                            <span>
                              {item.suggest.ma && `Mã: ${item.suggest.ma}`}
                              {item.suggest.tinh && ` · Tỉnh: ${item.suggest.tinh}`}
                              {item.suggest.mien && ` · Miền: ${item.suggest.mien}`}
                            </span>
                          ) : '—'}
                        </td>
                        <td style={{ padding:'8px 12px' }}>
                          {isDone ? (
                            <span style={{ fontSize:11, color:'#34C759', fontWeight:600 }}>✓ Đã sửa</span>
                          ) : (
                            <div style={{ display:'flex', gap:4 }}>
                              {item.suggest && (
                                <button onClick={() => fixOne(item)} disabled={fixing === item.bienSo}
                                  style={{ padding:'3px 10px', borderRadius:6, border:'none',
                                    background: fixing === item.bienSo ? 'var(--sep)' : '#34C759',
                                    color:'#fff', cursor: fixing === item.bienSo ? 'not-allowed' : 'pointer',
                                    fontSize:11, fontFamily:'inherit', fontWeight:600 }}>
                                  {fixing === item.bienSo ? '...' : 'Sửa'}
                                </button>
                              )}
                              <button onClick={() => handleIgnore(item)}
                                style={{ padding:'3px 10px', borderRadius:6, border:'1px solid var(--sep)',
                                  background:'var(--fill-tertiary)', color:'var(--label-secondary)',
                                  cursor:'pointer', fontSize:11, fontFamily:'inherit' }}
                                title="Bỏ qua cảnh báo này">
                                Bỏ qua
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────
export default function PageChuyenDoi() {
  const [tab, setTab]         = useState('dot')
  const [config, setConfig]   = useState({ dotsDone: [], dotCount: [] })
  const [toast, setToast]     = useState(null)

  const showToast = (msg, err) => { setToast({ msg, err }); setTimeout(() => setToast(null), 3500) }

  useEffect(() => {
    authFetch('/api/cua-hang/config').then(r => r.json()).then(d => setConfig(d)).catch(() => {})
  }, [])

  const handleSaveConfig = async (dots) => {
    try {
      const r = await authFetch('/api/cua-hang/config', { method:'POST', body: JSON.stringify({ dots }) })
      const d = await r.json()
      if (d.success) { showToast(`✓ Đã lưu: ${dots.length} đợt đã chuyển đổi`); setConfig(prev => ({ ...prev, dotsDone: dots })) }
    } catch(e) { showToast(e.message, true) }
  }

  const handleBatchUpdate = async (dot, setUpdating) => {
    if (!window.confirm(`Batch update tất cả xe trong ${dot} theo thông tin HSH?\nKhông ghi cây điều động.`)) return
    setUpdating(dot)
    setBatchResult(null)
    try {
      const r = await authFetch('/api/cua-hang/batch-update', { method:'POST', body: JSON.stringify({ dot }) })
      const d = await r.json()
      if (d.error) { showToast(d.error, true) }
      else {
        showToast(`✓ ${d.message}`)
        setBatchResult({ dot, ...d })
      }
    } catch(e) { showToast(e.message, true) }
    setUpdating(null)
  }

  const tabs = [
    { key:'dot',   label:'⚡ Chuyển đổi theo đợt' },
    { key:'audit', label:'🔍 Dò lại hệ thống' },
  ]

  return (
    <div style={{ padding:'20px 24px', fontFamily:'-apple-system,sans-serif', maxWidth:1000 }}>
      {toast && <Toast msg={toast.msg} err={toast.err} />}

      <div style={{ marginBottom:20 }}>
        <h2 style={{ margin:0, fontSize:20, fontWeight:700 }}>🔄 Quản lý chuyển đổi HSG → HSH</h2>
        <div style={{ fontSize:12, color:'var(--label-secondary)', marginTop:4 }}>
          Cập nhật thông tin cửa hàng theo tiến độ bàn giao từng đợt
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display:'flex', gap:4, marginBottom:24, borderBottom:'1px solid var(--sep)', paddingBottom:0 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding:'8px 18px', borderRadius:'8px 8px 0 0', border:'none',
              borderBottom: tab===t.key ? '2px solid var(--brand)' : '2px solid transparent',
              background:'transparent', cursor:'pointer', fontSize:13, fontFamily:'inherit',
              fontWeight: tab===t.key ? 700 : 400,
              color: tab===t.key ? 'var(--brand)' : 'var(--label-secondary)' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'dot' && (
        <>
          <TabChuyenDot dotsDone={config.dotsDone} dotCount={config.dotCount} onSave={handleSaveConfig} onBatchUpdate={handleBatchUpdate} />
          {batchResult && (
            <div style={{ marginTop:24 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                <div style={{ fontWeight:600, fontSize:14 }}>
                  Kết quả Batch Update — {batchResult.dot}
                </div>
                <div style={{ display:'flex', gap:16, fontSize:12 }}>
                  <span style={{ color:'#34C759', fontWeight:600 }}>✅ {batchResult.updated} cập nhật</span>
                  <span style={{ color:'#FF3B30', fontWeight:600 }}>❌ {batchResult.missed} bị miss</span>
                  <span style={{ color:'var(--label-secondary)' }}>Tổng: {batchResult.total}</span>
                </div>
                <button onClick={() => setBatchResult(null)}
                  style={{ border:'none', background:'none', cursor:'pointer', color:'var(--label-tertiary)', fontSize:16 }}>✕</button>
              </div>
              <div style={{ background:'var(--bg-card)', borderRadius:12, border:'0.5px solid var(--sep)', overflow:'auto', maxHeight:400 }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead>
                    <tr style={{ background:'var(--bg-secondary)', position:'sticky', top:0 }}>
                      {['Biển số','Tên CH','Tỉnh','Trạng thái','Chi tiết'].map(h => (
                        <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontSize:11,
                          fontWeight:600, color:'var(--label-secondary)', borderBottom:'1px solid var(--sep)', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {batchResult.results?.map((r, i) => (
                      <tr key={i} style={{ borderBottom:'0.5px solid var(--sep)',
                        background: r.status === 'updated' ? 'rgba(52,199,89,.03)' : 'rgba(255,59,48,.03)' }}>
                        <td style={{ padding:'7px 12px', fontWeight:600 }}>{r.bienSo}</td>
                        <td style={{ padding:'7px 12px', color:'var(--label-secondary)' }}>{r.tenCH || '—'}</td>
                        <td style={{ padding:'7px 12px', color:'var(--label-secondary)' }}>{r.tinh || '—'}</td>
                        <td style={{ padding:'7px 12px' }}>
                          {r.status === 'updated'
                            ? <span style={{ color:'#34C759', fontWeight:600 }}>✅ Đã cập nhật</span>
                            : <span style={{ color:'#FF3B30', fontWeight:600 }}>
                                {r.status === 'not_in_xetai' ? '🚗 Không phải xe tải'
                                  : r.status === 'no_cuahang' ? '⚠️ Thiếu tên CH'
                                  : '❌ Không tìm thấy CH'}
                              </span>
                          }
                        </td>
                        <td style={{ padding:'7px 12px', color:'var(--label-secondary)', fontSize:11 }}>
                          {r.status === 'updated'
                            ? `Mã: ${r.ma} · Tỉnh: ${r.tinhMoi}`
                            : r.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
      {tab === 'audit' && <TabAudit />}
    </div>
  )
}
