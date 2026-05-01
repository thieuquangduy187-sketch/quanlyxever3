// quanlyxever3/src/pages/PageHieuQua.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import useIsMobile from '../hooks/useIsMobile';
import * as XLSX from 'xlsx';

const API = import.meta.env.VITE_API_URL || 'https://hsg-backend.onrender.com';

const token = () => localStorage.getItem('hsg_token');

// ────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────
function fmt(num, dec = 2) {
  if (num === null || num === undefined || isNaN(num)) return '—';
  return Number(num).toFixed(dec);
}
function fmtNum(num) {
  if (!num) return '—';
  return Number(num).toLocaleString('vi-VN');
}

// ────────────────────────────────────────────
// KPI CARD
// ────────────────────────────────────────────
function KpiCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: 12,
      padding: '14px 18px',
      borderLeft: `4px solid ${color || 'var(--brand)'}`,
      flex: 1, minWidth: 140
    }}>
      <div style={{ fontSize: 12, color: 'var(--label-secondary)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--label-tertiary)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ────────────────────────────────────────────
// BADGE
// ────────────────────────────────────────────
function DanhGiaBadge({ val }) {
  const ok = val === 'Đạt';
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 600,
      background: ok ? 'var(--green-l)' : 'var(--red-l)',
      color: ok ? 'var(--apple-green)' : 'var(--apple-red)'
    }}>{val || '—'}</span>
  );
}

// ────────────────────────────────────────────
// ANALYSIS PANEL
// ────────────────────────────────────────────
function AnalysisPanel({ thang, nam, token: tok }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);

  const load = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/hieu-qua/analysis?thang=${thang}&nam=${nam}`, {
        headers: { Authorization: `Bearer ${tok}` }
      });
      const d = await r.json();
      setData(d);
      setOpen(true);
    } catch (e) {
      alert('Lỗi phân tích: ' + e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{
      background: 'var(--bg-card)', borderRadius: 12,
      border: '1px solid var(--sep)', marginBottom: 16, overflow: 'hidden'
    }}>
      <div
        onClick={() => open ? setOpen(false) : (data ? setOpen(true) : load())}
        style={{
          padding: '12px 18px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8,
          background: open ? 'var(--brand-l)' : 'var(--bg-card)',
          userSelect: 'none'
        }}
      >
        <span style={{ fontSize: 18 }}>🤖</span>
        <span style={{ fontWeight: 600, color: 'var(--brand)', fontSize: 14 }}>
          Phân tích xu hướng & Dự báo AI
        </span>
        {loading && <span style={{ fontSize: 12, color: 'var(--label-secondary)' }}>Đang phân tích...</span>}
        {!loading && !data && (
          <span style={{ fontSize: 12, color: 'var(--label-tertiary)' }}>Nhấn để phân tích</span>
        )}
        <span style={{ marginLeft: 'auto', color: 'var(--label-tertiary)' }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && data && (
        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--sep)' }}>
          {/* Chart summary */}
          {data.monthSummaries?.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--label-secondary)', marginBottom: 8 }}>
                Tổng quan {data.monthSummaries.length} tháng gần nhất
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {data.monthSummaries.map(m => (
                  <div key={m.label} style={{
                    flex: '1 0 100px', minWidth: 100,
                    background: 'var(--bg-secondary)', borderRadius: 8, padding: '8px 10px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: 11, color: 'var(--label-secondary)' }}>T.{m.label}</div>
                    <div style={{
                      fontSize: 16, fontWeight: 700,
                      color: parseFloat(m.tyLeDat) >= 70 ? 'var(--apple-green)' : 'var(--apple-red)'
                    }}>{m.tyLeDat}%</div>
                    <div style={{ fontSize: 10, color: 'var(--label-tertiary)' }}>đạt ({m.dat}/{m.totalXe})</div>
                    <div style={{ fontSize: 10, color: 'var(--label-secondary)', marginTop: 2 }}>
                      TB {m.avgSoChuyen} chuyến
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI analysis text */}
          <div style={{
            background: 'var(--bg-secondary)', borderRadius: 8, padding: '12px 14px',
            fontSize: 13, lineHeight: 1.7, color: 'var(--label-primary)',
            whiteSpace: 'pre-wrap'
          }}>
            {data.analysis}
          </div>

          <button
            onClick={load}
            style={{
              marginTop: 10, padding: '6px 14px',
              background: 'transparent', border: '1px solid var(--brand)',
              color: 'var(--brand)', borderRadius: 8, cursor: 'pointer',
              fontSize: 12
            }}
          >
            🔄 Phân tích lại
          </button>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────
// IMPORT MODAL
// ────────────────────────────────────────────
function ImportModal({ onClose, onDone, tok }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef();

  const handleUpload = async () => {
    if (!file) return alert('Chọn file Excel trước');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await fetch(`${API}/api/hieu-qua/import-excel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tok}` },
        body: fd
      });
      const d = await r.json();
      setResult(d);
      if (d.ok) onDone && onDone();
    } catch (e) {
      alert('Lỗi: ' + e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        background: 'var(--bg-card)', borderRadius: 16, padding: 24,
        width: '90%', maxWidth: 480
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>📥 Import dữ liệu lịch sử</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ fontSize: 13, color: 'var(--label-secondary)', marginBottom: 14 }}>
          Upload file Excel hiệu quả xe (định dạng giống file mẫu). Hệ thống sẽ tự động đọc
          dữ liệu Km, SLVC, SLVC nội bộ từng tháng.
        </div>

        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border: '2px dashed var(--sep)', borderRadius: 10,
            padding: '20px', textAlign: 'center', cursor: 'pointer',
            background: file ? 'var(--green-l)' : 'var(--bg-secondary)',
            marginBottom: 14
          }}
        >
          {file ? (
            <span style={{ color: 'var(--apple-green)', fontWeight: 600 }}>✅ {file.name}</span>
          ) : (
            <span style={{ color: 'var(--label-secondary)' }}>Nhấn để chọn file .xlsx</span>
          )}
          <input
            ref={fileRef} type="file" accept=".xlsx,.xls"
            style={{ display: 'none' }}
            onChange={e => { setFile(e.target.files[0]); setResult(null); }}
          />
        </div>

        {result && (
          <div style={{
            background: result.ok ? 'var(--green-l)' : 'var(--red-l)',
            borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13
          }}>
            {result.ok ? (
              <>✅ Đã lưu <b>{result.saved}</b> records | Bỏ qua: {result.skipped}</>
            ) : (
              <>❌ Lỗi: {result.error}</>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            padding: '8px 18px', borderRadius: 8,
            border: '1px solid var(--sep)', background: 'none', cursor: 'pointer'
          }}>Đóng</button>
          <button
            onClick={handleUpload}
            disabled={loading || !file}
            style={{
              padding: '8px 18px', borderRadius: 8,
              background: loading || !file ? '#ccc' : 'var(--brand)',
              color: '#fff', border: 'none', cursor: loading || !file ? 'default' : 'pointer',
              fontWeight: 600
            }}
          >
            {loading ? 'Đang import...' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// SYNC NTXT MODAL
// ────────────────────────────────────────────
function SyncNtxtModal({ thang, nam, onClose, tok }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSync = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/hieu-qua/sync-ntxt`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ thang, nam })
      });
      const d = await r.json();
      setResult(d);
    } catch (e) {
      setResult({ error: e.message });
    }
    setLoading(false);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        background: 'var(--bg-card)', borderRadius: 16, padding: 24,
        width: '90%', maxWidth: 420
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontWeight: 700 }}>🔄 Đồng bộ từ Nhật trình</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>
        <p style={{ fontSize: 13, color: 'var(--label-secondary)', marginBottom: 14 }}>
          Đồng bộ dữ liệu Km + KLVC từ nhật trình tháng {thang}/{nam} vào báo cáo hiệu quả.
        </p>
        {result && (
          <div style={{
            background: result.ok ? 'var(--green-l)' : 'var(--red-l)',
            borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13
          }}>
            {result.ok
              ? `✅ Đồng bộ ${result.synced}/${result.total} xe`
              : `❌ ${result.error || result.message}`}
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            padding: '8px 18px', borderRadius: 8,
            border: '1px solid var(--sep)', background: 'none', cursor: 'pointer'
          }}>Đóng</button>
          <button onClick={handleSync} disabled={loading} style={{
            padding: '8px 18px', borderRadius: 8,
            background: loading ? '#ccc' : 'var(--apple-blue)',
            color: '#fff', border: 'none', cursor: loading ? 'default' : 'pointer', fontWeight: 600
          }}>
            {loading ? 'Đang đồng bộ...' : 'Đồng bộ'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// EDIT ROW MODAL
// ────────────────────────────────────────────
function EditModal({ xe, thang, nam, onClose, onSaved, tok }) {
  const [km, setKm] = useState(xe?.km || 0);
  const [tongKLVC, setTongKLVC] = useState(xe?.tongKLVC || 0);
  const [klvcNoiBo, setKlvcNoiBo] = useState(xe?.klvcNoiBo || 0);
  const [ghiChu, setGhiChu] = useState(xe?.ghiChu || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/hieu-qua/save`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ bienSo: xe.bienSo, thang, nam, km, tongKLVC, klvcNoiBo, ghiChu })
      });
      const d = await r.json();
      if (d.ok) { onSaved(); onClose(); }
      else alert('Lỗi: ' + d.error);
    } catch (e) {
      alert('Lỗi: ' + e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 24, width: '90%', maxWidth: 420 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontWeight: 700 }}>✏️ {xe.bienSo} — T.{thang}/{nam}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>
        {[
          { label: 'Tổng Km di chuyển', val: km, set: setKm },
          { label: 'Tổng KLVC (kg)', val: tongKLVC, set: setTongKLVC },
          { label: 'KLVC nội bộ (kg)', val: klvcNoiBo, set: setKlvcNoiBo }
        ].map(f => (
          <div key={f.label} style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: 'var(--label-secondary)', display: 'block', marginBottom: 4 }}>
              {f.label}
            </label>
            <input
              type="number"
              value={f.val}
              onChange={e => f.set(parseFloat(e.target.value) || 0)}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 8,
                border: '1px solid var(--sep)', fontSize: 14, boxSizing: 'border-box'
              }}
            />
          </div>
        ))}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: 'var(--label-secondary)', display: 'block', marginBottom: 4 }}>
            Ghi chú
          </label>
          <input
            value={ghiChu} onChange={e => setGhiChu(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px', borderRadius: 8,
              border: '1px solid var(--sep)', fontSize: 14, boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Preview metrics */}
        {tongKLVC > 0 && (
          <div style={{
            background: 'var(--bg-secondary)', borderRadius: 8, padding: '10px 12px',
            fontSize: 12, marginBottom: 14, color: 'var(--label-secondary)'
          }}>
            Tỷ lệ nội bộ: <b>{tongKLVC > 0 ? fmt(klvcNoiBo / tongKLVC * 100, 1) : 0}%</b>
            {' | '}
            Số chuyến/ngày: <b>{xe.isTonXop
              ? fmt(tongKLVC / 26 / (3000 * 0.8))
              : (xe.taiTrong > 0 ? fmt(tongKLVC / 26 / (xe.taiTrong * 1000 * 0.7)) : '—')
            }</b>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            padding: '8px 18px', borderRadius: 8,
            border: '1px solid var(--sep)', background: 'none', cursor: 'pointer'
          }}>Huỷ</button>
          <button onClick={handleSave} disabled={loading} style={{
            padding: '8px 18px', borderRadius: 8,
            background: loading ? '#ccc' : 'var(--brand)',
            color: '#fff', border: 'none', cursor: loading ? 'default' : 'pointer', fontWeight: 600
          }}>
            {loading ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// MAIN PAGE
// ────────────────────────────────────────────
// ────────────────────────────────────────────
// ALL_COLS definition (dùng cho cả Export và table)
// ────────────────────────────────────────────
const EXPORT_COLS = [
  { key: 'stt',        label: 'STT',             default: true },
  { key: 'bienSo',     label: 'Biển số',          default: true },
  { key: 'maHienTai',  label: 'Mã hiện tại',      default: true },
  { key: 'cuaHang',    label: 'Cửa hàng sử dụng', default: true },
  { key: 'tinhMoi',    label: 'Tỉnh',             default: true },
  { key: 'tenTaiSan',  label: 'Loại xe',           default: false },
  { key: 'taiTrong',   label: 'Tải trọng (T)',     default: true },
  { key: 'km',         label: 'KM',               default: true },
  { key: 'tongKLVC',   label: 'KLVC (kg)',         default: true },
  { key: 'klvcNoiBo',  label: 'Nội bộ (kg)',       default: true },
  { key: 'tyLeNoiBo',  label: '% Nội bộ',          default: true },
  { key: 'soChuyenNgay', label: 'Số chuyến/ngày',  default: true },
  { key: 'danhGia',    label: 'Đánh giá',          default: true },
]

// ────────────────────────────────────────────
// EXPORT MODAL
// ────────────────────────────────────────────
function ExportModal({ onClose, tok, currentThang, currentNam }) {
  const now = new Date()
  const curYear = currentNam || now.getFullYear()

  // Tháng có thể chọn: 12 tháng gần nhất
  const monthOptions = []
  let t = currentThang || now.getMonth() + 1
  let y = curYear
  for (let i = 0; i < 18; i++) {
    monthOptions.push({ thang: t, nam: y, label: `Tháng ${t}/${y}` })
    t--; if (t === 0) { t = 12; y-- }
  }

  const [selectedMonths, setSelectedMonths] = useState([
    { thang: currentThang, nam: currentNam }
  ])
  const [selectedCols, setSelectedCols] = useState(
    EXPORT_COLS.filter(c => c.default).map(c => c.key)
  )
  const [sheetMode, setSheetMode] = useState('separate') // 'separate' | 'combined'
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')

  const toggleMonth = (m) => {
    const key = `${m.thang}-${m.nam}`
    const exists = selectedMonths.find(x => `${x.thang}-${x.nam}` === key)
    if (exists) {
      if (selectedMonths.length > 1) setSelectedMonths(selectedMonths.filter(x => `${x.thang}-${x.nam}` !== key))
    } else {
      setSelectedMonths([...selectedMonths, m])
    }
  }

  const toggleCol = (key) => {
    if (key === 'stt') return // STT luôn bật
    setSelectedCols(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  const isMonthSelected = (m) =>
    !!selectedMonths.find(x => x.thang === m.thang && x.nam === m.nam)

  const fetchMonth = async (thang, nam) => {
    const r = await fetch(`${API}/api/hieu-qua?thang=${thang}&nam=${nam}`, {
      headers: { Authorization: `Bearer ${tok}` }
    })
    const d = await r.json()
    return d.data || []
  }

  const getCellValue = (row, key, idx) => {
    switch (key) {
      case 'stt':          return idx + 1
      case 'bienSo':       return row.bienSo || ''
      case 'maHienTai':    return row.maHienTai || ''
      case 'cuaHang':      return row.cuaHang || ''
      case 'tinhMoi':      return row.tinhMoi || ''
      case 'tenTaiSan':    return row.tenTaiSan || ''
      case 'taiTrong':     return row.taiTrong || 0
      case 'km':           return row.km || 0
      case 'tongKLVC':     return row.tongKLVC || 0
      case 'klvcNoiBo':    return row.klvcNoiBo || 0
      case 'tyLeNoiBo':    return row.tyLeNoiBo ? +Number(row.tyLeNoiBo).toFixed(1) : 0
      case 'soChuyenNgay': return row.soChuyenNgay ? +Number(row.soChuyenNgay).toFixed(2) : 0
      case 'danhGia':      return row.danhGia || ''
      default:             return ''
    }
  }

  const buildSheet = (rows, monthLabel) => {
    const activeCols = EXPORT_COLS.filter(c => selectedCols.includes(c.key))

    // Header rows
    const titleRow = [`BÁO CÁO HIỆU QUẢ XE TẢI${monthLabel ? ' — ' + monthLabel : ''}`]
    const headerRow = activeCols.map(c => c.label)

    const wsData = [titleRow, [], headerRow]

    rows.forEach((row, i) => {
      wsData.push(activeCols.map(c => getCellValue(row, c.key, i)))
    })

    // Summary row
    wsData.push([])
    wsData.push([
      '', '', '', '', '',
      'Tổng xe:', rows.length,
      'Đạt:', rows.filter(r => r.danhGia === 'Đạt').length,
      'Không đạt:', rows.filter(r => r.danhGia === 'Không đạt').length,
    ])

    const ws = XLSX.utils.aoa_to_sheet(wsData)

    // Column widths
    const colWidths = activeCols.map(c => {
      const w = { stt:6, bienSo:12, maHienTai:12, cuaHang:28, tinhMoi:16,
        tenTaiSan:24, taiTrong:10, km:10, tongKLVC:14, klvcNoiBo:14,
        tyLeNoiBo:10, soChuyenNgay:14, danhGia:12 }
      return { wch: w[c.key] || 12 }
    })
    ws['!cols'] = colWidths

    // Merge title row
    ws['!merges'] = [{ s:{r:0,c:0}, e:{r:0,c:activeCols.length-1} }]

    return ws
  }

  const handleExport = async () => {
    if (selectedMonths.length === 0) return alert('Chọn ít nhất 1 tháng')
    if (selectedCols.length === 0) return alert('Chọn ít nhất 1 cột')
    setLoading(true)

    try {
      const wb = XLSX.utils.book_new()

      // Sort months ascending
      const sorted = [...selectedMonths].sort((a, b) =>
        (a.nam * 12 + a.thang) - (b.nam * 12 + b.thang)
      )

      if (sheetMode === 'separate') {
        // Mỗi tháng 1 sheet riêng
        for (const m of sorted) {
          setProgress(`Đang tải tháng ${m.thang}/${m.nam}...`)
          const rows = await fetchMonth(m.thang, m.nam)
          const ws = buildSheet(rows, `Tháng ${m.thang}/${m.nam}`)
          XLSX.utils.book_append_sheet(wb, ws, `T${m.thang}-${m.nam}`)
        }
      } else {
        // Gộp tất cả vào 1 sheet, thêm cột Tháng
        setProgress('Đang tải dữ liệu...')
        const activeCols = EXPORT_COLS.filter(c => selectedCols.includes(c.key))
        const allRows = []

        for (const m of sorted) {
          const rows = await fetchMonth(m.thang, m.nam)
          rows.forEach(row => allRows.push({ ...row, _thang: `${m.thang}/${m.nam}` }))
        }

        const titleRow = ['BÁO CÁO HIỆU QUẢ XE TẢI — TỔNG HỢP NHIỀU THÁNG']
        const headerRow = ['Tháng', ...activeCols.map(c => c.label)]
        const wsData = [titleRow, [], headerRow]

        let stt = 0
        allRows.forEach(row => {
          stt++
          wsData.push([
            row._thang,
            ...activeCols.map((c, _) => getCellValue(row, c.key, stt - 1))
          ])
        })

        const ws = XLSX.utils.aoa_to_sheet(wsData)
        ws['!cols'] = [{ wch: 10 }, ...activeCols.map(c => {
          const w = { stt:6, bienSo:12, maHienTai:12, cuaHang:28, tinhMoi:16,
            tenTaiSan:24, taiTrong:10, km:10, tongKLVC:14, klvcNoiBo:14,
            tyLeNoiBo:10, soChuyenNgay:14, danhGia:12 }
          return { wch: w[c.key] || 12 }
        })]
        ws['!merges'] = [{ s:{r:0,c:0}, e:{r:0,c:activeCols.length} }]
        XLSX.utils.book_append_sheet(wb, ws, 'Tổng hợp')
      }

      // Filename
      const monthStr = sorted.length === 1
        ? `T${sorted[0].thang}-${sorted[0].nam}`
        : `${sorted.length}-thang`
      const filename = `BaoCaoHieuQua_${monthStr}.xlsx`

      setProgress('Đang tạo file...')
      XLSX.writeFile(wb, filename)
      onClose()
    } catch (e) {
      alert('Lỗi xuất Excel: ' + e.message)
    }
    setLoading(false)
    setProgress('')
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        background: 'var(--bg-card)', borderRadius: 16, padding: 24,
        width: '90%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto',
        border: '1px solid var(--sep)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--ink)' }}>📥 Xuất Excel</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--ink3)' }}>✕</button>
        </div>

        {/* Chọn tháng */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink2)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Chọn tháng ({selectedMonths.length} đã chọn)
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {monthOptions.map(m => {
              const sel = isMonthSelected(m)
              return (
                <button key={`${m.thang}-${m.nam}`} onClick={() => toggleMonth(m)}
                  style={{
                    padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                    fontWeight: sel ? 600 : 400,
                    background: sel ? 'var(--brand)' : 'var(--bg-secondary)',
                    color: sel ? '#fff' : 'var(--ink2)',
                    border: `1px solid ${sel ? 'var(--brand)' : 'var(--sep)'}`,
                    transition: 'all 0.12s',
                  }}>
                  {m.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Chế độ sheet */}
        {selectedMonths.length > 1 && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Cách tổ chức dữ liệu
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { val: 'separate', label: '📋 Mỗi tháng 1 sheet', desc: 'Sheet T4-2026, T3-2026...' },
                { val: 'combined', label: '📊 Gộp 1 sheet', desc: 'Có cột Tháng để phân biệt' },
              ].map(opt => (
                <div key={opt.val} onClick={() => setSheetMode(opt.val)}
                  style={{
                    flex: 1, padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                    border: `2px solid ${sheetMode === opt.val ? 'var(--brand)' : 'var(--sep)'}`,
                    background: sheetMode === opt.val ? 'var(--brand-l)' : 'var(--bg-secondary)',
                  }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)', marginBottom: 3 }}>{opt.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink3)' }}>{opt.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chọn cột */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Chọn cột ({selectedCols.length}/{EXPORT_COLS.length})
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setSelectedCols(EXPORT_COLS.map(c => c.key))}
                style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, border: '1px solid var(--sep)', background: 'none', cursor: 'pointer', color: 'var(--ink2)' }}>
                Chọn tất cả
              </button>
              <button onClick={() => setSelectedCols(['stt', 'bienSo'])}
                style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, border: '1px solid var(--sep)', background: 'none', cursor: 'pointer', color: 'var(--ink2)' }}>
                Bỏ chọn
              </button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
            {EXPORT_COLS.map(col => {
              const active = selectedCols.includes(col.key)
              const locked = col.key === 'stt'
              return (
                <div key={col.key} onClick={() => toggleCol(col.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 10px', borderRadius: 8, cursor: locked ? 'default' : 'pointer',
                    background: active ? 'var(--brand-l)' : 'var(--bg-secondary)',
                    border: `1px solid ${active ? 'var(--brand)' : 'var(--sep)'}`,
                    opacity: locked ? 0.7 : 1,
                  }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                    background: active ? 'var(--brand)' : 'var(--sep)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {active && <span style={{ color: '#fff', fontSize: 10, lineHeight: 1 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--ink)', fontWeight: active ? 500 : 400 }}>
                    {col.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Progress */}
        {progress && (
          <div style={{
            background: 'var(--bg-secondary)', borderRadius: 8, padding: '8px 12px',
            fontSize: 12, color: 'var(--ink2)', marginBottom: 14,
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            <div style={{
              width: 14, height: 14, border: '2px solid var(--sep)',
              borderTopColor: 'var(--brand)', borderRadius: '50%',
              animation: 'spin .6s linear infinite', flexShrink: 0,
            }} />
            {progress}
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            padding: '9px 20px', borderRadius: 9,
            border: '1px solid var(--sep)', background: 'none',
            color: 'var(--ink2)', fontSize: 13, cursor: 'pointer',
          }}>Huỷ</button>
          <button onClick={handleExport} disabled={loading}
            style={{
              padding: '9px 20px', borderRadius: 9, border: 'none',
              background: loading ? 'var(--sep)' : 'var(--apple-green)',
              color: loading ? 'var(--ink3)' : '#fff',
              fontSize: 13, fontWeight: 600, cursor: loading ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
            {loading ? 'Đang xuất...' : `📥 Xuất Excel (${selectedMonths.length} tháng)`}
          </button>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )
}

export default function PageHieuQua() {
  const isMobile = useIsMobile();
  const tok = token();

  const now = new Date();
  const [thang, setThang] = useState(now.getMonth() + 1);
  const [nam, setNam] = useState(now.getFullYear());

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterTinh, setFilterTinh] = useState('');
  const [filterDanhGia, setFilterDanhGia] = useState('');
  const [filterLoai, setFilterLoai] = useState(''); // '', 'tonxop', 'cuahang'
  const [searchBS, setSearchBS] = useState('');
  const [sortKey, setSortKey] = useState('danhGia');
  const [sortAsc, setSortAsc] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [showSync, setShowSync] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [editXe, setEditXe] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/hieu-qua?thang=${thang}&nam=${nam}`, {
        headers: { Authorization: `Bearer ${tok}` }
      });
      const d = await r.json();
      setData(d);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [thang, nam, tok]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Derived data
  const allData = data?.data || [];
  const tinhList = [...new Set(allData.map(r => r.tinhMoi).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'vi')
  );

  const filtered = allData.filter(r => {
    if (filterTinh && r.tinhMoi !== filterTinh) return false;
    if (filterDanhGia && r.danhGia !== filterDanhGia) return false;
    if (filterLoai === 'tonxop' && !r.isTonXop) return false;
    if (filterLoai === 'cuahang' && r.isTonXop) return false;
    if (searchBS && !r.bienSo.includes(searchBS.toUpperCase().replace(/[-.\s]/g, ''))) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let va = a[sortKey], vb = b[sortKey];
    if (typeof va === 'string') va = va.toLowerCase();
    if (typeof vb === 'string') vb = vb.toLowerCase();
    if (va < vb) return sortAsc ? -1 : 1;
    if (va > vb) return sortAsc ? 1 : -1;
    return 0;
  });

  // Cảnh báo: Không đạt VÀ KLVC rất thấp (dưới 50% trung bình)
  const khongDatXe = allData.filter(r => r.danhGia === 'Không đạt');
  const avgKLVC = allData.length > 0
    ? allData.reduce((s, r) => s + r.tongKLVC, 0) / allData.length
    : 0;
  const warnings = allData.filter(r =>
    r.danhGia === 'Không đạt' && r.tongKLVC < avgKLVC * 0.5 && r.tongKLVC > 0
  );

  const handleSort = (key) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const SortTh = ({ col, label, right }) => (
    <th
      onClick={() => handleSort(col)}
      style={{
        padding: '10px 10px', whiteSpace: 'nowrap', cursor: 'pointer',
        textAlign: right ? 'right' : 'left',
        background: sortKey === col ? 'var(--brand-l)' : 'transparent',
        color: sortKey === col ? 'var(--brand)' : 'var(--label-secondary)',
        fontSize: 12, fontWeight: 600,
        userSelect: 'none'
      }}
    >
      {label} {sortKey === col ? (sortAsc ? '↑' : '↓') : ''}
    </th>
  );

  const totalDat = allData.filter(r => r.danhGia === 'Đạt').length;
  const totalKhongDat = allData.filter(r => r.danhGia === 'Không đạt').length;
  const tyLeDat = allData.length > 0 ? ((totalDat / allData.length) * 100).toFixed(1) : 0;
  const avgSoChuyen = allData.length > 0
    ? (allData.reduce((s, r) => s + (r.soChuyenNgay || 0), 0) / allData.length).toFixed(2)
    : 0;

  return (
    <div style={{ padding: isMobile ? '12px 10px' : '18px 22px', maxWidth: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        flexWrap: 'wrap', marginBottom: 16
      }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
          📊 Báo cáo Hiệu quả Xe tải
        </h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={thang}
            onChange={e => setThang(parseInt(e.target.value))}
            style={selStyle}
          >
            {[...Array(12)].map((_, i) => (
              <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
            ))}
          </select>
          <select value={nam} onChange={e => setNam(parseInt(e.target.value))} style={selStyle}>
            {[2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button onClick={fetchData} disabled={loading} style={btnStyle('var(--apple-blue)')}>
            {loading ? '...' : '🔄 Tải'}
          </button>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', flexWrap: 'wrap' }}>
          <button onClick={() => setShowSync(true)} style={btnStyle('var(--apple-blue)')}>
            🔗 Sync nhật trình
          </button>
          <button onClick={() => setShowImport(true)} style={btnStyle('var(--apple-orange)')}>
            📥 Import Excel
          </button>
          <button onClick={() => setShowExport(true)} style={btnStyle('var(--apple-green)')}>
            📤 Xuất Excel
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {data && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          <KpiCard
            label="Tổng xe có số liệu" value={allData.length}
            color="var(--label-primary)"
          />
          <KpiCard
            label="Xe đạt" value={`${totalDat} xe`}
            sub={`${tyLeDat}% tổng số`}
            color="var(--apple-green)"
          />
          <KpiCard
            label="Xe không đạt" value={`${totalKhongDat} xe`}
            sub={`${(100 - parseFloat(tyLeDat)).toFixed(1)}% tổng số`}
            color="var(--apple-red)"
          />
          <KpiCard
            label="TB số chuyến/ngày" value={avgSoChuyen}
            sub="Định mức: ≥ 1.5"
            color={parseFloat(avgSoChuyen) >= 1.5 ? 'var(--apple-green)' : 'var(--apple-orange)'}
          />
        </div>
      )}

      {/* AI Analysis */}
      {data && allData.length > 0 && (
        <AnalysisPanel thang={thang} nam={nam} token={tok} />
      )}

      {/* Cảnh báo */}
      {warnings.length > 0 && (
        <div style={{
          background: 'var(--amber-l)', borderRadius: 12, padding: '12px 16px',
          marginBottom: 16, border: '1px solid #ffd54f'
        }}>
          <div style={{ fontWeight: 700, color: 'var(--apple-orange)', marginBottom: 8, fontSize: 14 }}>
            ⚠️ Cảnh báo: {warnings.length} xe hoạt động kém hiệu quả
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink2)', marginBottom: 6 }}>
            Không đạt định mức VÀ KLVC dưới 50% trung bình đội xe
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {warnings.slice(0, 20).map(w => (
              <span
                key={w.bienSo}
                onClick={() => setEditXe(w)}
                style={{
                  background: '#fce8e6', color: '#c62828', borderRadius: 6,
                  padding: '2px 10px', fontSize: 12, cursor: 'pointer',
                  fontWeight: 600
                }}
                title={`${w.cuaHang} | ${fmt(w.soChuyenNgay)} chuyến/ngày`}
              >
                {w.bienSo}
              </span>
            ))}
            {warnings.length > 20 && (
              <span style={{ fontSize: 12, color: 'var(--ink2)' }}>
                +{warnings.length - 20} xe khác
              </span>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{
        display: 'flex', gap: 8, flexWrap: 'wrap',
        marginBottom: 12, alignItems: 'center'
      }}>
        <input
          placeholder="🔍 Tìm biển số..."
          value={searchBS}
          onChange={e => setSearchBS(e.target.value)}
          style={{ ...selStyle, minWidth: 160 }}
        />
        <select value={filterTinh} onChange={e => setFilterTinh(e.target.value)} style={selStyle}>
          <option value="">Tất cả tỉnh</option>
          {tinhList.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterDanhGia} onChange={e => setFilterDanhGia(e.target.value)} style={selStyle}>
          <option value="">Tất cả đánh giá</option>
          <option value="Đạt">✅ Đạt</option>
          <option value="Không đạt">❌ Không đạt</option>
        </select>
        <select value={filterLoai} onChange={e => setFilterLoai(e.target.value)} style={selStyle}>
          <option value="">Tất cả loại</option>
          <option value="cuahang">🏪 Cửa hàng</option>
          <option value="tonxop">🏭 Tôn xốp</option>
        </select>
        {(filterTinh || filterDanhGia || filterLoai || searchBS) && (
          <button
            onClick={() => { setFilterTinh(''); setFilterDanhGia(''); setFilterLoai(''); setSearchBS(''); }}
            style={btnStyle('#999')}
          >
            ✕ Xoá lọc
          </button>
        )}
        <span style={{ fontSize: 12, color: 'var(--label-secondary)', marginLeft: 4 }}>
          {sorted.length}/{allData.length} xe
        </span>
      </div>

      {/* No data */}
      {!loading && allData.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '48px 24px',
          background: 'var(--bg-card)', borderRadius: 12, color: 'var(--label-secondary)'
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Chưa có dữ liệu tháng {thang}/{nam}</div>
          <div style={{ fontSize: 13 }}>
            Sử dụng "<b>Import Excel</b>" để nạp dữ liệu lịch sử,
            hoặc "<b>Sync nhật trình</b>" nếu đã có dữ liệu nhật trình tháng này.
          </div>
        </div>
      )}

      {/* Table */}
      {sorted.length > 0 && (
        <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--sep)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--sep)' }}>
                <SortTh col="bienSo" label="Biển số" />
                <SortTh col="cuaHang" label="Cửa hàng" />
                <SortTh col="tinhMoi" label="Tỉnh" />
                <SortTh col="taiTrong" label="Tải (T)" right />
                <SortTh col="km" label="Km" right />
                <SortTh col="tongKLVC" label="KLVC (kg)" right />
                <SortTh col="klvcNoiBo" label="Nội bộ (kg)" right />
                <SortTh col="tyLeNoiBo" label="NB %" right />
                <SortTh col="soChuyenNgay" label="Chuyến/ngày" right />
                <SortTh col="danhGia" label="Đánh giá" />
                <th style={{ padding: '10px 10px', fontSize: 12, color: 'var(--label-secondary)' }}></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, i) => (
                <tr
                  key={row.bienSo}
                  style={{
                    borderBottom: '1px solid var(--sep)',
                    background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)',
                    transition: 'background 0.1s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--brand-l)'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)'}
                >
                  <td style={{ padding: '9px 10px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {row.bienSo}
                    {row.isTonXop && (
                      <span style={{
                        marginLeft: 4, fontSize: 10, background: '#e3f2fd',
                        color: '#1565c0', borderRadius: 4, padding: '1px 5px'
                      }}>TX</span>
                    )}
                  </td>
                  <td style={{ padding: '9px 10px', color: 'var(--label-secondary)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {row.cuaHang || '—'}
                  </td>
                  <td style={{ padding: '9px 10px', whiteSpace: 'nowrap' }}>{row.tinhMoi || '—'}</td>
                  <td style={{ padding: '9px 10px', textAlign: 'right' }}>{row.taiTrong || '—'}</td>
                  <td style={{ padding: '9px 10px', textAlign: 'right' }}>{fmtNum(row.km)}</td>
                  <td style={{ padding: '9px 10px', textAlign: 'right' }}>{fmtNum(row.tongKLVC)}</td>
                  <td style={{ padding: '9px 10px', textAlign: 'right' }}>{fmtNum(row.klvcNoiBo)}</td>
                  <td style={{ padding: '9px 10px', textAlign: 'right' }}>
                    <span style={{
                      color: row.tyLeNoiBo > 80 ? 'var(--apple-green)' :
                        row.tyLeNoiBo > 50 ? 'var(--apple-orange)' : 'var(--label-primary)'
                    }}>
                      {fmt(row.tyLeNoiBo, 1)}%
                    </span>
                  </td>
                  <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 600 }}>
                    <span style={{
                      color: row.soChuyenNgay >= 1.5 ? 'var(--apple-green)' :
                        row.soChuyenNgay >= 1.0 ? 'var(--apple-orange)' : 'var(--apple-red)'
                    }}>
                      {fmt(row.soChuyenNgay)}
                    </span>
                  </td>
                  <td style={{ padding: '9px 10px' }}>
                    <DanhGiaBadge val={row.danhGia} />
                  </td>
                  <td style={{ padding: '9px 10px', textAlign: 'center' }}>
                    <button
                      onClick={() => setEditXe(row)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--apple-blue)', fontSize: 14, padding: '2px 6px',
                        borderRadius: 6, transition: 'background 0.1s'
                      }}
                      title="Sửa số liệu"
                    >✏️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {showExport && (
        <ExportModal
          tok={tok}
          currentThang={thang}
          currentNam={nam}
          onClose={() => setShowExport(false)}
        />
      )}
      {showImport && (
        <ImportModal
          tok={tok}
          onClose={() => setShowImport(false)}
          onDone={() => { setShowImport(false); fetchData(); }}
        />
      )}
      {showSync && (
        <SyncNtxtModal
          thang={thang} nam={nam} tok={tok}
          onClose={() => { setShowSync(false); fetchData(); }}
        />
      )}
      {editXe && (
        <EditModal
          xe={editXe} thang={thang} nam={nam} tok={tok}
          onClose={() => setEditXe(null)}
          onSaved={fetchData}
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────
// STYLE UTILS
// ────────────────────────────────────────────
const selStyle = {
  padding: '7px 12px', borderRadius: 8, border: '1px solid var(--sep)',
  background: 'var(--bg-card)', fontSize: 13, outline: 'none', cursor: 'pointer'
};

const btnStyle = (bg) => ({
  padding: '7px 14px', borderRadius: 8, border: 'none',
  background: bg, color: '#fff', fontSize: 13,
  fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap'
});
