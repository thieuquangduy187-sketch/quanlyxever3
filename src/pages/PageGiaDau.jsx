import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const getToken = () => localStorage.getItem('hsg_token') || ''

// Fallback dùng trong PageNhatTrinh — copy để so sánh
const PRICE_FALLBACK = {
  '1/2026': { soLanDieuChinh: 3,  min: 17850, max: 20200, avg: 18700 },
  '2/2026': { soLanDieuChinh: 3,  min: 19500, max: 21500, avg: 20300 },
  '3/2026': { soLanDieuChinh: 10, min: 26900, max: 39860, avg: 32144 },
  '4/2026': { soLanDieuChinh: 6,  min: 29110, max: 44980, avg: 37397 },
}

// URL thông cáo Petrolimex để đối chiếu
const PETROLIMEX_URL = 'https://www.petrolimex.com.vn/ndi/thong-cao-bao-chi.html'
const GIAXANG_URL    = 'https://giaxanghomnay.com/lich-su-gia-xang'

export default function PageGiaDau() {
  const now = new Date()
  const [thang, setThang] = useState(now.getMonth() + 1)
  const [nam,   setNam]   = useState(now.getFullYear())
  const [data,  setData]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [cacheMsg, setCacheMsg] = useState(null)

  const fetchData = () => {
    setLoading(true)
    setError(null)
    setData(null)
    fetch(`${API}/api/gia-dau?thang=${thang}&nam=${nam}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }

  const clearCache = async () => {
    setCacheMsg(null)
    const r = await fetch(`${API}/api/gia-dau/cache?thang=${thang}&nam=${nam}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${getToken()}` }
    })
    const d = await r.json()
    setCacheMsg(d.success ? '✓ Đã xóa cache — bấm Tải lại để fetch mới' : '✗ Lỗi')
  }

  useEffect(() => { fetchData() }, [thang, nam])

  const fallback = PRICE_FALLBACK[`${thang}/${nam}`]

  // styles
  const card = {
    background: 'var(--bg-card)', borderRadius: 14, padding: '16px 18px',
    border: '0.5px solid var(--sep)', marginBottom: 14,
  }
  const th = { padding: '8px 12px', textAlign: 'left', fontSize: 12,
    color: 'var(--label-secondary)', borderBottom: '0.5px solid var(--sep)', fontWeight: 500 }
  const td = { padding: '8px 12px', fontSize: 13, borderBottom: '0.5px solid var(--fill-tertiary)' }
  const badge = (color) => ({
    display: 'inline-block', padding: '2px 8px', borderRadius: 6,
    fontSize: 11, fontWeight: 600, background: color + '22', color: color,
  })

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '20px 16px' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--label-primary)', marginBottom: 4 }}>
        🛢 Quản lý giá dầu diesel
      </h2>
      <p style={{ fontSize: 13, color: 'var(--label-tertiary)', marginBottom: 20 }}>
        Kiểm tra số kỳ điều chỉnh giá trong tháng. Đối chiếu với{' '}
        <a href={PETROLIMEX_URL} target="_blank" rel="noreferrer"
          style={{ color: 'var(--apple-blue)' }}>Petrolimex</a>{' '}và{' '}
        <a href={GIAXANG_URL} target="_blank" rel="noreferrer"
          style={{ color: 'var(--apple-blue)' }}>giaxanghomnay.com</a>
      </p>

      {/* Chọn tháng/năm */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <select value={thang} onChange={e => setThang(+e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--fill-secondary)',
            border: '0.5px solid var(--sep)', color: 'var(--label-primary)', fontSize: 14 }}>
          {[...Array(12)].map((_,i) => (
            <option key={i+1} value={i+1}>Tháng {i+1}</option>
          ))}
        </select>
        <select value={nam} onChange={e => setNam(+e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--fill-secondary)',
            border: '0.5px solid var(--sep)', color: 'var(--label-primary)', fontSize: 14 }}>
          {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <button onClick={fetchData}
          style={{ padding: '8px 16px', borderRadius: 8, background: 'var(--apple-blue)',
            border: 'none', color: '#fff', fontSize: 14, cursor: 'pointer' }}>
          🔄 Tải lại
        </button>
        <button onClick={clearCache}
          style={{ padding: '8px 16px', borderRadius: 8, background: 'var(--fill-secondary)',
            border: '0.5px solid var(--sep)', color: 'var(--label-secondary)', fontSize: 14, cursor: 'pointer' }}>
          🗑 Xóa cache
        </button>
      </div>
      {cacheMsg && (
        <div style={{ fontSize: 12, color: 'var(--apple-green)', marginBottom: 10 }}>{cacheMsg}</div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', color: 'var(--label-tertiary)', padding: 40 }}>
          Đang fetch từ giaxanghomnay.com...
        </div>
      )}

      {error && (
        <div style={{ ...card, borderColor: 'var(--apple-red)', color: 'var(--apple-red)' }}>
          ✗ Lỗi: {error}
        </div>
      )}

      {data && (
        <>
          {/* Tóm tắt */}
          <div style={card}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--label-primary)' }}>
                Tháng {thang}/{nam}
              </span>
              {data.available ? (
                <span style={badge('var(--apple-green)')}>✓ Có dữ liệu</span>
              ) : (
                <span style={badge('var(--apple-red)')}>✗ Không có dữ liệu</span>
              )}
              {data.cached && (
                <span style={badge('var(--label-quaternary)')}>
                  Cache lúc {new Date(data.fetchedAt).toLocaleString('vi-VN')}
                </span>
              )}
            </div>

            {data.available && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10 }}>
                {[
                  { label: 'Số kỳ điều chỉnh', value: data.soLanDieuChinh, color: 'var(--apple-blue)' },
                  { label: 'Giá thấp nhất', value: data.min?.toLocaleString('vi-VN') + 'đ', color: 'var(--apple-green)' },
                  { label: 'Giá cao nhất', value: data.max?.toLocaleString('vi-VN') + 'đ', color: 'var(--apple-red)' },
                  { label: 'Bình quân 4 mức', value: data.avg?.toLocaleString('vi-VN') + 'đ', color: 'var(--label-primary)' },
                ].map(item => (
                  <div key={item.label} style={{ background: 'var(--fill-tertiary)', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontSize: 11, color: 'var(--label-tertiary)', marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: item.color }}>{item.value ?? '—'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* So sánh với fallback hardcode */}
          {fallback && data.available && (
            <div style={card}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--label-secondary)', marginBottom: 10 }}>
                📊 So sánh Backend vs Hardcode trong app
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={th}>Chỉ số</th>
                    <th style={th}>Backend (giaxanghomnay)</th>
                    <th style={th}>Hardcode trong app</th>
                    <th style={th}>Chênh lệch</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Số kỳ', be: data.soLanDieuChinh, hc: fallback.soLanDieuChinh },
                    { label: 'Min (đ)', be: data.min, hc: fallback.min },
                    { label: 'Max (đ)', be: data.max, hc: fallback.max },
                    { label: 'Avg (đ)', be: data.avg, hc: fallback.avg },
                  ].map(row => {
                    const diff = row.be - row.hc
                    const ok = diff === 0
                    return (
                      <tr key={row.label}>
                        <td style={td}>{row.label}</td>
                        <td style={{ ...td, color: 'var(--apple-blue)', fontWeight: 600 }}>
                          {row.be?.toLocaleString('vi-VN')}
                        </td>
                        <td style={{ ...td, color: 'var(--label-secondary)' }}>
                          {row.hc?.toLocaleString('vi-VN')}
                        </td>
                        <td style={{ ...td }}>
                          {ok ? (
                            <span style={{ color: 'var(--apple-green)' }}>✓ Khớp</span>
                          ) : (
                            <span style={{ color: 'var(--apple-red)', fontWeight: 600 }}>
                              {diff > 0 ? '+' : ''}{diff.toLocaleString('vi-VN')} ⚠
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {/* Cảnh báo nếu số kỳ lệch */}
              {data.soLanDieuChinh !== fallback.soLanDieuChinh && (
                <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8,
                  background: 'var(--apple-red)22', color: 'var(--apple-red)', fontSize: 12 }}>
                  ⚠ Số kỳ điều chỉnh lệch nhau! Backend thấy {data.soLanDieuChinh} kỳ,
                  hardcode chỉ có {fallback.soLanDieuChinh} kỳ.
                  Cần cập nhật lại PRICE_FALLBACK trong PageNhatTrinh.jsx.
                </div>
              )}
            </div>
          )}

          {/* Chi tiết từng kỳ */}
          {data.chiTiet?.length > 0 && (
            <div style={card}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--label-secondary)', marginBottom: 10 }}>
                📋 Chi tiết {data.chiTiet.length} kỳ điều chỉnh
                <a href={GIAXANG_URL} target="_blank" rel="noreferrer"
                  style={{ fontSize: 11, color: 'var(--apple-blue)', marginLeft: 8 }}>
                  Xem nguồn ↗
                </a>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={th}>Ngày</th>
                    <th style={th}>DO 0,001S-V (đ/lít)</th>
                    <th style={th}>DO 0,05S-II (đ/lít)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.chiTiet.map((row, i) => (
                    <tr key={i}>
                      <td style={td}>{row.ngay}</td>
                      <td style={{ ...td, fontWeight: 600, color: 'var(--label-primary)' }}>
                        {row.do001?.toLocaleString('vi-VN') ?? '—'}
                      </td>
                      <td style={{ ...td, color: 'var(--label-secondary)' }}>
                        {row.do05?.toLocaleString('vi-VN') ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!data.available && (
            <div style={{ ...card, textAlign: 'center', color: 'var(--label-tertiary)', padding: 30 }}>
              Chưa có dữ liệu tháng {thang}/{nam}.<br/>
              Backend sẽ tự fetch khi có kỳ điều chỉnh đầu tiên trong tháng.
            </div>
          )}
        </>
      )}

      {/* Hướng dẫn */}
      <div style={{ ...card, background: 'var(--fill-tertiary)' }}>
        <div style={{ fontSize: 12, color: 'var(--label-tertiary)', lineHeight: 1.8 }}>
          <strong style={{ color: 'var(--label-secondary)' }}>Cách kiểm tra bỏ sót kỳ điều chỉnh:</strong><br/>
          1. Bấm <strong>Tải lại</strong> → Backend fetch từ giaxanghomnay.com<br/>
          2. Xem <strong>Số kỳ điều chỉnh</strong> có khớp với trang{' '}
          <a href={PETROLIMEX_URL} target="_blank" rel="noreferrer"
            style={{ color: 'var(--apple-blue)' }}>Petrolimex thông cáo báo chí</a> không<br/>
          3. Nếu lệch → bảng "So sánh" sẽ hiện cảnh báo đỏ ⚠<br/>
          4. Bấm <strong>Xóa cache</strong> rồi <strong>Tải lại</strong> để force fetch dữ liệu mới nhất
        </div>
      </div>
    </div>
  )
}
