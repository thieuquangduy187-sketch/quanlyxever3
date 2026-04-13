import { useState, useRef, useCallback } from 'react'
import * as XLSX from 'xlsx'
import useIsMobile from '../hooks/useIsMobile'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function getToken() { return localStorage.getItem('hsg_token') || '' }

async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify(body)
  })
  return res.json()
}

// ── Step indicator ────────────────────────────────────────────────────────────
function Steps({ current }) {
  const steps = ['Chọn file', 'Xem trước', 'Import']
  return (
    <div style={{ display:'flex', alignItems:'center', gap:0, marginBottom:28 }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', flex: i < steps.length-1 ? 1 : 'none' }}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
            <div style={{
              width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:13, fontWeight:700,
              background: i < current ? 'var(--green)' : i === current ? 'var(--brand)' : 'var(--border)',
              color: i <= current ? '#fff' : 'var(--ink3)',
              transition:'all .2s'
            }}>
              {i < current ? '✓' : i + 1}
            </div>
            <div style={{ fontSize:11, fontWeight: i === current ? 600 : 400, color: i === current ? 'var(--brand)' : 'var(--ink3)', whiteSpace:'nowrap' }}>
              {s}
            </div>
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex:1, height:2, background: i < current ? 'var(--green)' : 'var(--border)', margin:'0 8px', marginBottom:18, transition:'all .2s' }} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function PageImport() {
  const isMobile = useIsMobile()
  const [step, setStep]         = useState(0) // 0=upload, 1=preview, 2=done
  const [file, setFile]         = useState(null)
  const [rows, setRows]         = useState([])
  const [preview, setPreview]   = useState([])
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState(null)
  const [error, setError]       = useState('')
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef()

  // ── Parse Excel file ────────────────────────────────────────────────────────
  const parseFile = useCallback((f) => {
    if (!f) return
    const ext = f.name.split('.').pop().toLowerCase()
    if (!['xlsx','xls','csv'].includes(ext)) {
      setError('Chỉ hỗ trợ file .xlsx, .xls, .csv')
      return
    }
    setError('')
    setFile(f)
    setLoading(true)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'binary' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const data = XLSX.utils.sheet_to_json(ws, { defval: '' })

        if (!data.length) {
          setError('File không có dữ liệu hoặc format không đúng.')
          setLoading(false)
          return
        }

        setRows(data)
        setPreview(data.slice(0, 8))
        setStep(1)
      } catch(err) {
        setError('Không đọc được file: ' + err.message)
      }
      setLoading(false)
    }
    reader.readAsBinaryString(f)
  }, [])

  // ── Drag & drop ─────────────────────────────────────────────────────────────
  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) parseFile(f)
  }, [parseFile])

  // ── Import ──────────────────────────────────────────────────────────────────
  const doImport = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await apiPost('/api/import/xe', { rows })
      if (res.error) { setError(res.error); setLoading(false); return }
      setResult(res)
      setStep(2)
    } catch(e) {
      setError('Lỗi import: ' + e.message)
    }
    setLoading(false)
  }

  const reset = () => {
    setStep(0); setFile(null); setRows([]); setPreview([])
    setResult(null); setError('')
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  const colStyle = { padding:'8px 12px', fontSize:11.5, borderBottom:'1px solid var(--border)', whiteSpace:'nowrap', maxWidth:140, overflow:'hidden', textOverflow:'ellipsis' }
  const thStyle  = { ...colStyle, background:'var(--bg)', fontWeight:700, fontSize:11, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:'.04em', position:'sticky', top:0 }

  return (
    <div style={{ maxWidth:1000, margin:'0 auto' }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:18, fontWeight:700 }}>📥 Import dữ liệu từ Excel</div>
        <div style={{ fontSize:13, color:'var(--ink3)', marginTop:4 }}>
          Upload file Excel (.xlsx/.xls) — hệ thống tự động thêm mới hoặc cập nhật dữ liệu
        </div>
      </div>

      <Steps current={step} />

      {/* ── STEP 0: Upload ── */}
      {step === 0 && (
        <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:14, padding:32 }}>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? 'var(--brand)' : 'var(--border)'}`,
              borderRadius:12, padding:'48px 24px', textAlign:'center',
              cursor:'pointer', transition:'all .15s',
              background: dragOver ? 'var(--brand-l)' : 'var(--bg)',
            }}
          >
            <div style={{ fontSize:40, marginBottom:12 }}>📊</div>
            <div style={{ fontSize:15, fontWeight:600, marginBottom:6 }}>
              Kéo thả file vào đây hoặc click để chọn
            </div>
            <div style={{ fontSize:13, color:'var(--ink3)', marginBottom:16 }}>
              Hỗ trợ: .xlsx, .xls, .csv
            </div>
            <div style={{
              display:'inline-block', padding:'9px 22px', borderRadius:9,
              background:'var(--brand)', color:'#fff', fontSize:13, fontWeight:600
            }}>
              {loading ? '⟳ Đang đọc file...' : 'Chọn file Excel'}
            </div>
            <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display:'none' }}
              onChange={e => parseFile(e.target.files[0])} />
          </div>

          {error && (
            <div style={{ marginTop:16, background:'var(--red-l)', color:'var(--red)', padding:'10px 14px', borderRadius:9, fontSize:13 }}>
              ⚠ {error}
            </div>
          )}

          {/* Template download hint */}
          <div style={{ marginTop:20, padding:'14px 16px', background:'var(--bg)', borderRadius:10, fontSize:12.5, color:'var(--ink3)', lineHeight:1.7 }}>
            <b style={{ color:'var(--ink2)' }}>💡 Lưu ý về format file:</b><br />
            • Dòng đầu tiên phải là tên cột (header)<br />
            • Cột bắt buộc: <b>Mã TS kế toán</b> hoặc <b>BIỂN SỐ</b><br />
            • Nếu đã có xe (trùng Mã TS) → tự động cập nhật, không tạo trùng<br />
            • Có thể export file hiện tại từ tab Xe tải → Tải Excel → dùng làm template
          </div>
        </div>
      )}

      {/* ── STEP 1: Preview ── */}
      {step === 1 && (
        <div>
          <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:14, overflow:'hidden', marginBottom:16 }}>
            <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
              <div>
                <span style={{ fontSize:14, fontWeight:600 }}>Xem trước dữ liệu</span>
                <span style={{ marginLeft:10, fontSize:12.5, color:'var(--ink3)' }}>
                  {file?.name} · <b>{rows.length}</b> dòng · hiển thị 8 dòng đầu
                </span>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={reset}
                  style={{ padding:'7px 14px', borderRadius:8, border:'1px solid var(--border)', background:'#fff', fontSize:12.5, cursor:'pointer', fontFamily:'inherit' }}>
                  ← Chọn lại
                </button>
                <button onClick={doImport} disabled={loading}
                  style={{ padding:'7px 18px', borderRadius:8, border:'none', background: loading?'#F0A080':'var(--brand)', color:'#fff', fontSize:12.5, fontWeight:600, cursor: loading?'not-allowed':'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:6 }}>
                  {loading ? (
                    <><span style={{ width:12, height:12, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin .65s linear infinite', display:'inline-block' }} /> Đang import...</>
                  ) : `✓ Import ${rows.length} dòng`}
                </button>
              </div>
            </div>

            <div style={{ overflowX:'auto', maxHeight:400, overflowY:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead>
                  <tr>
                    {preview[0] && Object.keys(preview[0]).slice(0,10).map(k => (
                      <th key={k} style={thStyle}>{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} style={{ background: i%2===0?'#fff':'#FAFAF8' }}>
                      {Object.values(row).slice(0,10).map((v, j) => (
                        <td key={j} style={colStyle} title={String(v)}>{String(v).substring(0,30)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {error && (
            <div style={{ background:'var(--red-l)', color:'var(--red)', padding:'10px 14px', borderRadius:9, fontSize:13 }}>
              ⚠ {error}
            </div>
          )}
        </div>
      )}

      {/* ── STEP 2: Done ── */}
      {step === 2 && result && (
        <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:14, padding:40, textAlign:'center' }}>
          <div style={{ fontSize:52, marginBottom:16 }}>🎉</div>
          <div style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>Import hoàn tất!</div>
          <div style={{ fontSize:13, color:'var(--ink3)', marginBottom:28 }}>{result.message}</div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, maxWidth:400, margin:'0 auto 28px' }}>
            {[
              { label:'Thêm mới', value:result.added,   color:'var(--green)', bg:'var(--green-l)' },
              { label:'Cập nhật', value:result.updated, color:'var(--teal)',  bg:'var(--teal-l)' },
              { label:'Bỏ qua',   value:result.skipped, color:'var(--ink3)', bg:'var(--bg)' },
            ].map((s,i) => (
              <div key={i} style={{ background:s.bg, borderRadius:10, padding:'14px 8px' }}>
                <div style={{ fontSize:24, fontWeight:700, color:s.color }}>{s.value}</div>
                <div style={{ fontSize:11.5, color:s.color }}>{s.label}</div>
              </div>
            ))}
          </div>

          {result.errors?.length > 0 && (
            <div style={{ background:'var(--red-l)', borderRadius:10, padding:'12px 16px', marginBottom:20, textAlign:'left', fontSize:12.5, color:'var(--red)' }}>
              <b>⚠ {result.errors.length} dòng lỗi:</b>
              {result.errors.slice(0,5).map((e,i) => (
                <div key={i} style={{ marginTop:4 }}>· Mã TS {e.row}: {e.error}</div>
              ))}
            </div>
          )}

          <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
            <button onClick={reset}
              style={{ padding:'10px 22px', borderRadius:9, border:'1px solid var(--border)', background:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
              Import thêm file khác
            </button>
            <button onClick={() => window.location.reload()}
              style={{ padding:'10px 22px', borderRadius:9, border:'none', background:'var(--brand)', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
              Xem danh sách xe →
            </button>
          </div>
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
