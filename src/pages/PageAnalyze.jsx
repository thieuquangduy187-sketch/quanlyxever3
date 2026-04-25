import { useState, useRef, useCallback } from 'react'
import useIsMobile from '../hooks/useIsMobile'
import { fmtCur } from '../hooks/useCharts'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
function getToken() { return localStorage.getItem('hsg_token') || '' }

async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
    body: JSON.stringify(body)
  })
  return res.json()
}

// Compress + convert to base64 — giảm kích thước trước khi gửi API
function compressAndBase64(file, maxWidth = 1280, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      // Tính kích thước mới giữ tỉ lệ
      let { width, height } = img
      if (width > maxWidth) {
        height = Math.round(height * maxWidth / width)
        width = maxWidth
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      // Export JPEG compressed
      const dataUrl = canvas.toDataURL('image/jpeg', quality)
      resolve(dataUrl.split(',')[1])
    }
    img.onerror = reject
    img.src = url
  })
}

const RISK_STYLE = {
  'cao':       { bg: '#FEE2E2', color: '#B91C1C', icon: '🔴' },
  'trung bình':{ bg: '#FEF3C7', color: '#B45309', icon: '🟡' },
  'thấp':      { bg: '#DCFCE7', color: '#15803D', icon: '🟢' },
}

export default function PageAnalyze() {
  const isMobile = useIsMobile()
  const [images, setImages]     = useState([])   // { file, preview, base64, mediaType }
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState(null)
  const [error, setError]       = useState('')
  const [editData, setEditData]   = useState({})  // { prIndex: { field: value } }
  const [saving, setSaving]       = useState(false)
  const [saveResult, setSaveResult] = useState(null)
  const [drag, setDrag]         = useState(false)
  const inputRef    = useRef()
  const [pasteMode, setPasteMode] = useState(false)  // hiện overlay paste

  const addFiles = useCallback(async (files) => {
    const valid = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (!valid.length) { setError('Chỉ hỗ trợ file ảnh (jpg, png, webp).'); return }
    if (images.length + valid.length > 10) { setError('Tối đa 10 ảnh.'); return }
    setError('')

    const newImgs = await Promise.all(valid.map(async f => ({
      file:      f,
      preview:   URL.createObjectURL(f),
      base64:    await compressAndBase64(f),
      mediaType: 'image/jpeg',
      name:      f.name,
    })))
    setImages(prev => [...prev, ...newImgs])
  }, [images])

  const removeImage = (i) => setImages(prev => prev.filter((_, idx) => idx !== i))

  const doAnalyze = async () => {
    if (!images.length) { setError('Vui lòng chọn ít nhất 1 ảnh.'); return }
    setLoading(true); setError(''); setResult(null); setSaveResult(null)

    try {
      const payload = images.map(img => ({ base64: img.base64, mediaType: img.mediaType }))
      const data = await apiPost('/api/analyze/pr', { images: payload })
      if (data.error) { setError(data.error); setLoading(false); return }
      setResult(data)
    } catch(e) {
      setError('Lỗi phân tích: ' + e.message)
    }
    setLoading(false)
  }

  const doSave = async () => {
    if (!result?.prs?.length) return
    setSaving(true)
    try {
      const data = await apiPost('/api/analyze/save', { prs: getMergedPRs() })
      setSaveResult(data)
    } catch(e) {
      setError('Lỗi lưu: ' + e.message)
    }
    setSaving(false)
  }

  const reset = () => {
    setImages([]); setResult(null); setError(''); setSaveResult(null)
  }

  // ── SCREEN CAPTURE ────────────────────────────────────────────────────────
  const startCapture = () => setPasteMode(true)

  // ── Get field value (edited or original)
  const getVal = (i, field) => editData[i]?.[field] ?? result?.prs?.[i]?.[field] ?? ''

  // Set edited value
  const setVal = (i, field, val) => {
    setEditData(prev => ({
      ...prev,
      [i]: { ...prev[i], [field]: val }
    }))
  }

  // Merge edits into result before saving
  const getMergedPRs = () => result?.prs?.map((pr, i) => ({
    ...pr,
    ...editData[i]
  })) || []

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>🤖 Phân tích PR bằng AI</div>
        <div style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 3 }}>
          Upload ảnh chụp màn hình Oracle EBS → Claude AI tự động trích xuất thông tin và phát hiện bất thường
        </div>
      </div>

      {/* Upload area */}
      {!result && (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: 24, marginBottom: 16 }}>
          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDrag(true) }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files) }}
            onClick={() => inputRef.current?.click()}
            style={{
              border: `2px dashed ${drag ? 'var(--brand)' : 'var(--border)'}`,
              borderRadius: 12, padding: '32px 24px', textAlign: 'center',
              cursor: 'pointer', background: drag ? 'var(--brand-l)' : 'var(--bg)',
              transition: 'all .15s', marginBottom: images.length ? 16 : 0
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 10 }}>📸</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 5 }}>
              Kéo thả ảnh vào đây hoặc click để chọn
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--ink3)' }}>
              Hỗ trợ JPG, PNG, WEBP · Tối đa 10 ảnh
            </div>
            <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
              onChange={e => addFiles(e.target.files)} />
            <div style={{ marginTop:12, display:'flex', gap:8, justifyContent:'center' }}>
              <div style={{ padding:'7px 18px', borderRadius:9, background:'var(--brand)', color:'#fff', fontSize:13, fontWeight:600 }}>
                📁 Chọn file ảnh
              </div>
              <div onClick={e => { e.stopPropagation(); startCapture() }}
                style={{ padding:'7px 18px', borderRadius:9, background:'#1A1A1A', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                ✂️ Snipping Tool
              </div>
            </div>
          </div>

          {/* Preview grid */}
          {images.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
              {images.map((img, i) => (
                <div key={i} style={{ position: 'relative', borderRadius: 9, overflow: 'hidden', border: '1px solid var(--border)', aspectRatio: '16/10' }}>
                  <img src={img.preview} alt={img.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', top: 4, left: 6, background: 'rgba(0,0,0,.55)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4 }}>
                    {i + 1}
                  </div>
                  <button onClick={e => { e.stopPropagation(); removeImage(i) }}
                    style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,.55)', border: 'none', color: '#fff', width: 22, height: 22, borderRadius: '50%', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    ✕
                  </button>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,.55)', color: '#fff', fontSize: 9, padding: '2px 6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {img.name}
                  </div>
                </div>
              ))}
              {/* Add more */}
              <div onClick={() => inputRef.current?.click()}
                style={{ borderRadius: 9, border: '2px dashed var(--border)', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', aspectRatio: '16/10', fontSize: 22, color: 'var(--ink3)' }}>
                <div>+</div>
                <div style={{ fontSize: 10 }}>Thêm</div>
              </div>
            </div>
          )}

          {error && <div style={{ background: 'var(--red-l)', color: 'var(--red)', padding: '9px 14px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>⚠ {error}</div>}

          {images.length > 0 && (
            <button onClick={doAnalyze} disabled={loading}
              style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none',
                background: loading ? '#F0A080' : 'linear-gradient(135deg,#D4420A,#F26430)',
                color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              {loading ? (
                <>
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .65s linear infinite', display: 'inline-block' }} />
                  Đang phân tích {images.length} ảnh...
                </>
              ) : `🤖 Phân tích ${images.length} ảnh bằng Claude AI`}
            </button>
          )}
        </div>
      )}

      {/* Results */}
      {result && (
        <div>
          {/* Summary bar */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                📊 Kết quả phân tích {result.prs?.length || 0} PR
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink3)' }}>{result.tomTat}</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: 'var(--ink3)' }}>Tổng chi phí</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--brand)' }}>
                {fmtCur(result.tongChiPhi)}
              </div>
            </div>
          </div>

          {/* Warnings */}
          {result.canhBao?.length > 0 && (
            <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 12, padding: '14px 18px', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#B45309', marginBottom: 8 }}>⚠ Cảnh báo quan trọng</div>
              {result.canhBao.map((w, i) => (
                <div key={i} style={{ fontSize: 13, color: '#92400E', marginTop: 4 }}>• {w}</div>
              ))}
            </div>
          )}

          {/* PR cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            {result.prs?.map((pr, i) => {
              const risk = RISK_STYLE[pr.mucDoRuiRo] || RISK_STYLE['thấp']
              return (
                <div key={i} style={{ background: '#fff', border: `1px solid ${pr.batThuong?.length ? '#FCA5A5' : 'var(--border)'}`, borderRadius: 12, overflow: 'hidden' }}>
                  {/* Card header */}
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, flex: 1 }}>
                      PR #{pr.prNumber}
                    </div>
                    <span style={{ ...risk, fontSize: 11.5, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>
                      {risk.icon} Rủi ro {pr.mucDoRuiRo}
                    </span>
                    {pr.trangThai && (
                      <span style={{ background: pr.trangThai === 'Pending' ? 'var(--amber-l)' : 'var(--teal-l)', color: pr.trangThai === 'Pending' ? 'var(--amber)' : 'var(--teal)', fontSize: 11.5, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>
                        {pr.trangThai}
                      </span>
                    )}
                  </div>

                  {/* Edit hint */}
                  {Object.keys(editData[i] || {}).length > 0 && (
                    <div style={{ padding:'4px 16px', background:'var(--brand-l)', fontSize:11, color:'var(--brand)', fontWeight:600 }}>
                      ✏️ Đã chỉnh sửa {Object.keys(editData[i]).length} trường — nhớ lưu vào MongoDB
                    </div>
                  )}
                  {/* Card body */}
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 0 }}>
                    <div style={{ padding: '12px 16px', borderRight: isMobile ? 'none' : '1px solid var(--border)' }}>
                      {[
                        ['🏪 Cửa hàng', 'cuaHang'],
                        ['🚛 Biển số',  'bienSo'],
                        ['🔧 Hạng mục', 'hangMuc'],
                        ['📅 Ngày gửi', 'ngayGui'],
                        ['👤 Người gửi', 'nguoiGui'],
                        ['🛣️ Số KM',    'kmHienTai'],
                      ].map(([label, field]) => {
                        const val = getVal(i, field)
                        const isEditing = editData[i]?.[field] !== undefined
                        return (
                          <div key={field} style={{ display:'flex', gap:8, marginBottom:6, alignItems:'center' }}>
                            <div style={{ fontSize:12, color:'var(--ink3)', minWidth:110, flexShrink:0 }}>{label}</div>
                            <input
                              value={val}
                              onChange={e => setVal(i, field, e.target.value)}
                              style={{
                                fontSize:12.5, fontWeight:500, flex:1,
                                border: isEditing ? '1.5px solid var(--brand)' : '1.5px solid transparent',
                                borderRadius:6, padding:'2px 6px',
                                background: isEditing ? 'var(--brand-l)' : 'transparent',
                                outline:'none', fontFamily:'inherit',
                                cursor:'text', minWidth:0,
                                transition:'all .12s'
                              }}
                              onFocus={e => e.target.style.border='1.5px solid var(--brand)'}
                              onBlur={e => {
                                if (!editData[i]?.[field]) e.target.style.border='1.5px solid transparent'
                              }}
                              placeholder="—"
                            />
                            {isEditing && (
                              <button onClick={() => {
                                setEditData(prev => {
                                  const next = { ...prev }
                                  if (next[i]) { delete next[i][field]; if (!Object.keys(next[i]).length) delete next[i] }
                                  return next
                                })
                              }} style={{ border:'none', background:'none', cursor:'pointer', color:'var(--ink3)', fontSize:14, padding:'0 2px', flexShrink:0 }} title="Hoàn tác">↺</button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    <div style={{ padding: '12px 16px' }}>
                      {/* Chi phí */}
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 3 }}>CHI PHÍ (click để sửa)</div>
                        <input
                          value={getVal(i, 'chiPhi')}
                          onChange={e => setVal(i, 'chiPhi', e.target.value)}
                          style={{
                            fontSize:22, fontWeight:700, color:'var(--brand)',
                            border: editData[i]?.chiPhi !== undefined ? '1.5px solid var(--brand)' : '1.5px solid transparent',
                            borderRadius:8, padding:'2px 6px', background:'transparent',
                            outline:'none', fontFamily:'inherit', width:'100%',
                            transition:'all .12s'
                          }}
                          onFocus={e => e.target.style.border='1.5px solid var(--brand)'}
                          onBlur={e => { if (editData[i]?.chiPhi === undefined) e.target.style.border='1.5px solid transparent' }}
                        />
                      </div>

                      {/* Bất thường */}
                      {pr.batThuong?.length > 0 && (
                        <div style={{ background: '#FEE2E2', borderRadius: 8, padding: '10px 12px' }}>
                          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#B91C1C', marginBottom: 5 }}>⚠ Điểm bất thường</div>
                          {pr.batThuong.map((b, j) => (
                            <div key={j} style={{ fontSize: 12, color: '#991B1B', marginTop: 3 }}>• {b}</div>
                          ))}
                        </div>
                      )}

                      {/* Ghi chú */}
                      {pr.ghiChu && (
                        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--ink3)', fontStyle: 'italic', lineHeight: 1.5 }}>
                          💬 {pr.ghiChu}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Action buttons */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, fontSize: 13, color: 'var(--ink3)' }}>
              Lưu kết quả vào collection <b>sua_chua</b> trong MongoDB để theo dõi lịch sử sửa chữa.
            </div>
            {saveResult ? (
              <div style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>
                ✓ {saveResult.message}
              </div>
            ) : (
              <button onClick={doSave} disabled={saving}
                style={{ padding: '9px 20px', borderRadius: 9, border: 'none', background: saving ? '#ccc' : 'var(--green)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
                {saving ? '⟳ Đang lưu...' : '💾 Lưu vào MongoDB'}
              </button>
            )}
            <button onClick={reset}
              style={{ padding: '9px 16px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--bg)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              ↺ Phân tích ảnh mới
            </button>
          </div>
        </div>
      )}

      {/* ── PASTE OVERLAY ── */}
      {pasteMode && (
        <div
          style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,.88)',
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20 }}
          onPaste={async e => {
            const items = e.clipboardData?.items
            if (!items) return
            for (const item of items) {
              if (item.type.startsWith('image/')) {
                const file = item.getAsFile()
                const base64 = await compressAndBase64(file)
                const preview = URL.createObjectURL(file)
                setImages(prev => [...prev, {
                  file, preview, base64,
                  mediaType: 'image/jpeg',
                  name: 'snip_' + Date.now() + '.jpg'
                }])
                setPasteMode(false)
                break
              }
            }
          }}
          tabIndex={0}
          ref={el => el?.focus()}
          onClick={e => { if(e.target===e.currentTarget) setPasteMode(false) }}
        >
          <div style={{ fontSize:56 }}>📋</div>
          <div style={{ color:'#fff', fontSize:20, fontWeight:700 }}>Nhấn Ctrl+V để dán ảnh</div>
          <div style={{ color:'rgba(255,255,255,.55)', fontSize:14, textAlign:'center', lineHeight:2 }}>
            Dùng <b style={{color:'#fff'}}>Snipping Tool</b> (Win+Shift+S) chụp vùng PR trên Oracle EBS<br/>
            Sau đó quay lại đây và nhấn <kbd style={{background:'rgba(255,255,255,.15)',padding:'3px 10px',borderRadius:5,fontFamily:'monospace',fontSize:13}}>Ctrl + V</kbd>
          </div>
          <div style={{ color:'rgba(255,255,255,.3)', fontSize:12 }}>Click ra ngoài hoặc ESC để huỷ</div>
        </div>
      )}

            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
