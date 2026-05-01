import { useState, useRef, useCallback, useEffect } from 'react'
import * as XLSX from 'xlsx'
import useIsMobile from '../hooks/useIsMobile'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
function getToken() { return localStorage.getItem('hsg_token') || '' }
async function api(method, path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method, headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${getToken()}` },
    body: body ? JSON.stringify(body) : undefined
  })
  return res.json()
}

function Steps({ current }) {
  const steps = ['Chọn file', 'Cấu hình', 'Xem trước', 'Kết quả']
  return (
    <div style={{ display:'flex', alignItems:'center', marginBottom:28 }}>
      {steps.map((s,i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', flex: i<steps.length-1?1:'none' }}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
            <div style={{ width:30, height:30, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700,
              background: i<current?'var(--green)':i===current?'var(--brand)':'var(--border)',
              color: i<=current?'#fff':'var(--ink3)' }}>
              {i<current?'✓':i+1}
            </div>
            <div style={{ fontSize:11, fontWeight:i===current?600:400, color:i===current?'var(--brand)':'var(--ink3)', whiteSpace:'nowrap' }}>{s}</div>
          </div>
          {i<steps.length-1&&<div style={{ flex:1, height:2, background:i<current?'var(--green)':'var(--border)', margin:'0 6px', marginBottom:18 }}/>}
        </div>
      ))}
    </div>
  )
}

const MODE_INFO = {
  upsert:  { label:'Thêm mới + Cập nhật', desc:'Trùng key → cập nhật. Chưa có → thêm mới.', color:'var(--teal)', icon:'🔄' },
  append:  { label:'Thêm mới tất cả',     desc:'Thêm tất cả dòng, không kiểm tra trùng.',    color:'var(--green)', icon:'➕' },
  replace: { label:'Thay thế toàn bộ',    desc:'⚠ Xóa hết data cũ rồi import lại.',          color:'var(--red)', icon:'♻️' },
}

export default function PageImport() {
  const isMobile = useIsMobile()
  const [step, setStep]           = useState(0)
  const [file, setFile]           = useState(null)
  const [rows, setRows]           = useState([])
  const [cols, setCols]           = useState([])
  const [collections, setCollections] = useState([])
  const [colName, setColName]     = useState('xetai')
  const [newColName, setNewColName] = useState('')
  const [isNewCol, setIsNewCol]   = useState(false)
  const [mode, setMode]           = useState('upsert')
  const [keyField, setKeyField]   = useState('Mã TS kế toán')
  const [loading, setLoading]     = useState(false)
  const [result, setResult]       = useState(null)
  const [error, setError]         = useState('')
  const [drag, setDrag]           = useState(false)
  const inputRef = useRef()

  // Load collections từ backend
  useEffect(() => {
    api('GET', '/api/import/collections')
      .then(d => { if (d.collections) setCollections(d.collections) })
      .catch(() => {})
  }, [])

  const parseFile = useCallback((f) => {
    if (!f) return
    const ext = f.name.split('.').pop().toLowerCase()
    if (!['xlsx','xls','csv'].includes(ext)) { setError('Chỉ hỗ trợ .xlsx, .xls, .csv'); return }
    setError(''); setFile(f); setLoading(true)
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const wb = XLSX.read(e.target.result, { type:'binary' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const data = XLSX.utils.sheet_to_json(ws, { defval:'' })
        if (!data.length) { setError('File không có dữ liệu.'); setLoading(false); return }
        setRows(data)
        const columns = Object.keys(data[0] || {})
        setCols(columns)
        // Auto-detect key field
        const autoKey = columns.find(c => c.toLowerCase().includes('mã ts') || c.toLowerCase().includes('ma ts')) || columns[0]
        setKeyField(autoKey)
        setStep(1)
      } catch(err) { setError('Lỗi đọc file: ' + err.message) }
      setLoading(false)
    }
    reader.readAsBinaryString(f)
  }, [])

  const doImport = async () => {
    const targetCol = isNewCol ? newColName.trim() : colName
    if (!targetCol) { setError('Vui lòng nhập tên collection.'); return }
    setLoading(true); setError('')
    try {
      const res = await api('POST', '/api/import/xe', { rows, collection: targetCol, mode, keyField })
      if (res.error) { setError(res.error); setLoading(false); return }
      setResult(res)
      // Refresh collections list
      api('GET', '/api/import/collections').then(d => { if(d.collections) setCollections(d.collections) })
      setStep(3)
    } catch(e) { setError('Lỗi: ' + e.message) }
    setLoading(false)
  }

  const reset = () => { setStep(0); setFile(null); setRows([]); setCols([]); setResult(null); setError('') }

  const card = { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:24, marginBottom:16 }
  const btn  = (bg='var(--brand)', extra={}) => ({ padding:'8px 18px', borderRadius:9, border:'none', background:bg, color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', ...extra })

  return (
    <div style={{ maxWidth:860, margin:'0 auto' }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:18, fontWeight:700 }}>📥 Import dữ liệu từ Excel</div>
        <div style={{ fontSize:13, color:'var(--ink3)', marginTop:3 }}>Upload file Excel → chọn collection → import vào MongoDB</div>
      </div>
      <Steps current={step} />

      {/* ── STEP 0: Upload file ── */}
      {step === 0 && (
        <div style={card}>
          <div onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)}
            onDrop={e=>{e.preventDefault();setDrag(false);parseFile(e.dataTransfer.files[0])}}
            onClick={()=>inputRef.current?.click()}
            style={{ border:`2px dashed ${drag?'var(--brand)':'var(--border)'}`, borderRadius:12,
              padding:'44px 24px', textAlign:'center', cursor:'pointer',
              background:drag?'var(--brand-l)':'var(--bg)', transition:'all .15s' }}>
            <div style={{ fontSize:44, marginBottom:10 }}>📊</div>
            <div style={{ fontSize:15, fontWeight:600, marginBottom:5 }}>Kéo thả hoặc click để chọn file</div>
            <div style={{ fontSize:12.5, color:'var(--ink3)', marginBottom:14 }}>Hỗ trợ: .xlsx · .xls · .csv</div>
            <div style={{ display:'inline-block', padding:'8px 20px', borderRadius:9, background:'var(--brand)', color:'#fff', fontSize:13, fontWeight:600 }}>
              {loading ? '⟳ Đang đọc...' : 'Chọn file'}
            </div>
            <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display:'none' }}
              onChange={e=>parseFile(e.target.files[0])} />
          </div>
          {error && <div style={{ marginTop:12, background:'var(--red-l)', color:'var(--red)', padding:'9px 14px', borderRadius:8, fontSize:13 }}>⚠ {error}</div>}
          <div style={{ marginTop:16, padding:'12px 14px', background:'var(--bg)', borderRadius:9, fontSize:12, color:'var(--ink3)', lineHeight:1.7 }}>
            <b style={{ color:'var(--ink2)' }}>💡 Lưu ý:</b> Dòng đầu phải là tên cột. Có thể export từ tab Xe tải → Tải Excel → sửa → import lại.
          </div>
        </div>
      )}

      {/* ── STEP 1: Cấu hình ── */}
      {step === 1 && (
        <div>
          <div style={card}>
            <div style={{ fontSize:14, fontWeight:700, marginBottom:16 }}>1. Chọn collection đích</div>

            {/* Toggle: collection có sẵn vs tạo mới */}
            <div style={{ display:'flex', gap:8, marginBottom:14 }}>
              {[false, true].map(isNew => (
                <button key={isNew} onClick={()=>setIsNewCol(isNew)}
                  style={{ padding:'7px 16px', borderRadius:8, border:`1.5px solid ${isNewCol===isNew?'var(--brand)':'var(--border)'}`,
                    background: isNewCol===isNew?'var(--brand-l)':'#fff',
                    color: isNewCol===isNew?'var(--brand)':'var(--ink3)',
                    fontSize:12.5, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                  {isNew ? '✚ Tạo collection mới' : '📂 Dùng collection có sẵn'}
                </button>
              ))}
            </div>

            {!isNewCol ? (
              <div>
                <div style={{ fontSize:12, color:'var(--ink3)', marginBottom:7 }}>Chọn collection ({collections.length} có sẵn):</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {collections.map(c => (
                    <button key={c} onClick={()=>setColName(c)}
                      style={{ padding:'7px 14px', borderRadius:8,
                        border:`1.5px solid ${colName===c?'var(--brand)':'var(--border)'}`,
                        background: colName===c?'var(--brand)':'var(--bg)',
                        color: colName===c?'#fff':'var(--ink2)',
                        fontSize:12.5, fontWeight:500, cursor:'pointer', fontFamily:'inherit' }}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize:12, color:'var(--ink3)', marginBottom:7 }}>Tên collection mới:</div>
                <input value={newColName} onChange={e=>setNewColName(e.target.value)}
                  placeholder="vd: nhat_trinh, bao_cao, oto_con..."
                  style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1.5px solid var(--border)',
                    fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }}
                  onFocus={e=>e.target.style.borderColor='var(--brand)'}
                  onBlur={e=>e.target.style.borderColor='var(--border)'}
                />
                <div style={{ fontSize:11, color:'var(--ink3)', marginTop:5 }}>
                  Chỉ dùng chữ cái, số, dấu _ hoặc - (không dấu cách)
                </div>
              </div>
            )}
          </div>

          <div style={card}>
            <div style={{ fontSize:14, fontWeight:700, marginBottom:14 }}>2. Chọn mode import</div>
            <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'repeat(3,1fr)', gap:10 }}>
              {Object.entries(MODE_INFO).map(([k,v]) => (
                <div key={k} onClick={()=>setMode(k)}
                  style={{ padding:'14px', borderRadius:10, cursor:'pointer',
                    border:`2px solid ${mode===k?v.color:'var(--border)'}`,
                    background: mode===k?`${v.color}10`:'var(--bg)',
                    transition:'all .12s' }}>
                  <div style={{ fontSize:18, marginBottom:6 }}>{v.icon}</div>
                  <div style={{ fontSize:13, fontWeight:700, color: mode===k?v.color:'var(--ink)', marginBottom:4 }}>{v.label}</div>
                  <div style={{ fontSize:11.5, color:'var(--ink3)', lineHeight:1.55 }}>{v.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {mode === 'upsert' && (
            <div style={card}>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:12 }}>3. Chọn field xác định trùng (Key)</div>
              <div style={{ fontSize:12.5, color:'var(--ink3)', marginBottom:10 }}>
                Dùng field nào để xác định 2 dòng là cùng 1 xe?
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
                {cols.map(c => (
                  <button key={c} onClick={()=>setKeyField(c)}
                    style={{ padding:'6px 12px', borderRadius:7,
                      border:`1.5px solid ${keyField===c?'var(--brand)':'var(--border)'}`,
                      background: keyField===c?'var(--brand-l)':'var(--bg)',
                      color: keyField===c?'var(--brand)':'var(--ink3)',
                      fontSize:12, fontWeight: keyField===c?600:400,
                      cursor:'pointer', fontFamily:'inherit' }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Summary + buttons */}
          <div style={{ ...card, background:'var(--bg)' }}>
            <div style={{ fontSize:13, marginBottom:14, lineHeight:1.8 }}>
              <b>File:</b> {file?.name} · <b>{rows.length}</b> dòng · <b>{cols.length}</b> cột<br/>
              <b>Collection:</b> <span style={{ color:'var(--brand)', fontWeight:600 }}>{isNewCol ? newColName||'(chưa nhập)' : colName}</span>
              {isNewCol && <span style={{ fontSize:11, color:'var(--green)', marginLeft:6 }}>✚ Tạo mới</span>}<br/>
              <b>Mode:</b> {MODE_INFO[mode].icon} {MODE_INFO[mode].label}<br/>
              {mode==='upsert' && <><b>Key field:</b> {keyField}</>}
            </div>
            {error && <div style={{ background:'var(--red-l)', color:'var(--red)', padding:'9px 12px', borderRadius:8, fontSize:13, marginBottom:12 }}>⚠ {error}</div>}
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>setStep(0)} style={{ ...btn('var(--bg)'), color:'var(--ink2)', border:'1px solid var(--border)' }}>← Chọn lại file</button>
              <button onClick={()=>setStep(2)} style={btn()}>Xem trước →</button>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 2: Preview ── */}
      {step === 2 && (
        <div>
          <div style={card}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, flexWrap:'wrap', gap:10 }}>
              <div>
                <span style={{ fontSize:14, fontWeight:700 }}>Xem trước dữ liệu</span>
                <span style={{ fontSize:12.5, color:'var(--ink3)', marginLeft:10 }}>5 dòng đầu / tổng {rows.length} dòng</span>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={()=>setStep(1)} style={{ ...btn('var(--bg)'), color:'var(--ink2)', border:'1px solid var(--border)' }}>← Sửa cấu hình</button>
                <button onClick={doImport} disabled={loading} style={{ ...btn(loading?'#F0A080':'var(--brand)'), cursor:loading?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:6 }}>
                  {loading ? <><span style={{ width:12, height:12, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin .65s linear infinite', display:'inline-block' }}/> Đang import...</> : `✓ Import ${rows.length} dòng`}
                </button>
              </div>
            </div>
            <div style={{ overflowX:'auto', maxHeight:360, overflowY:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead>
                  <tr>{cols.slice(0,8).map(c=><th key={c} style={{ padding:'8px 10px', background:'var(--bg)', borderBottom:'2px solid var(--border)', fontWeight:700, fontSize:10.5, color:'var(--ink3)', textTransform:'uppercase', whiteSpace:'nowrap', textAlign:'left' }}>{c}</th>)}</tr>
                </thead>
                <tbody>
                  {rows.slice(0,5).map((r,i)=>(
                    <tr key={i} style={{ background:i%2?'var(--bg)':'#fff' }}>
                      {cols.slice(0,8).map(c=><td key={c} style={{ padding:'7px 10px', borderBottom:'1px solid var(--border)', whiteSpace:'nowrap', maxWidth:120, overflow:'hidden', textOverflow:'ellipsis' }} title={String(r[c])}>{String(r[c]).substring(0,25)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {error && <div style={{ background:'var(--red-l)', color:'var(--red)', padding:'9px 14px', borderRadius:8, fontSize:13 }}>⚠ {error}</div>}
        </div>
      )}

      {/* ── STEP 3: Kết quả ── */}
      {step === 3 && result && (
        <div style={{ ...card, textAlign:'center', padding:40 }}>
          <div style={{ fontSize:52, marginBottom:14 }}>🎉</div>
          <div style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>Import hoàn tất!</div>
          <div style={{ fontSize:13, color:'var(--ink3)', marginBottom:24 }}>{result.message}</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, maxWidth:360, margin:'0 auto 24px' }}>
            {[
              { l:'Thêm mới', v:result.added,   c:'var(--green)', bg:'var(--green-l)' },
              { l:'Cập nhật', v:result.updated, c:'var(--teal)',  bg:'var(--teal-l)'  },
              { l:'Bỏ qua',   v:result.skipped, c:'var(--ink3)', bg:'var(--bg)'       },
            ].map((s,i)=>(
              <div key={i} style={{ background:s.bg, borderRadius:10, padding:'14px 8px' }}>
                <div style={{ fontSize:26, fontWeight:700, color:s.c }}>{s.v}</div>
                <div style={{ fontSize:12, color:s.c }}>{s.l}</div>
              </div>
            ))}
          </div>
          {result.errors?.length > 0 && (
            <div style={{ background:'var(--red-l)', borderRadius:10, padding:'12px 16px', marginBottom:20, textAlign:'left', fontSize:12.5, color:'var(--red)' }}>
              <b>⚠ {result.errors.length} dòng lỗi:</b>
              {result.errors.slice(0,5).map((e,i)=><div key={i} style={{ marginTop:3 }}>· {e.row}: {e.error}</div>)}
            </div>
          )}
          <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
            <button onClick={reset} style={{ ...btn('var(--bg)'), color:'var(--ink2)', border:'1px solid var(--border)' }}>Import file khác</button>
            <button onClick={()=>window.location.reload()} style={btn()}>Xem danh sách xe →</button>
          </div>
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
