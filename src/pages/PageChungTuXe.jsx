// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📁 FRONTEND — quanlyxever3/src/pages/PageChungTuXe.jsx
// Dashboard theo dõi đăng kiểm + phù hiệu
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { useState, useEffect, useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const apiFetch = (path, opts = {}) => fetch(`${API}${path}`, {
  ...opts,
  headers: { Authorization: `Bearer ${localStorage.getItem('hsg_token') || ''}`, 'Content-Type': 'application/json', ...(opts.headers||{}) }
})

// ── Alert config ──────────────────────────────────────────
const ALERT = {
  red:    { label: 'Hết hạn',       bg: 'rgba(215,0,21,.1)',   color: '#D70015',  border: 'rgba(215,0,21,.3)'  },
  orange: { label: 'Sắp hết (<7 ngày LV)', bg: 'rgba(255,100,0,.1)', color: '#E05000', border: 'rgba(255,100,0,.3)' },
  yellow: { label: 'Chú ý (<30 ngày)',  bg: 'rgba(196,140,0,.1)', color: '#7D5700', border: 'rgba(196,140,0,.3)' },
  green:  { label: 'An toàn',       bg: 'rgba(26,127,55,.08)', color: '#1A7F37',  border: 'rgba(26,127,55,.25)' },
  none:   { label: 'Chưa có',       bg: 'var(--bg-grouped)',   color: 'var(--label-secondary)', border: 'var(--sep)' },
}

const TABS = [
  { id: 'dashboard',   label: '📊 Dashboard'        },
  { id: 'dang_kiem',   label: '🔍 Đăng kiểm'         },
  { id: 'phu_hieu',    label: '🏷 Phù hiệu'           },
  { id: 'dung_hd',     label: '🚫 Xe dừng hoạt động'  },
]

function AlertBadge({ level, small }) {
  const a = ALERT[level] || ALERT.none
  return (
    <span style={{ padding: small ? '2px 8px' : '3px 10px', borderRadius: 20, fontSize: small ? 10 : 11,
      fontWeight: 600, background: a.bg, color: a.color, border: `0.5px solid ${a.border}`,
      whiteSpace: 'nowrap' }}>
      {a.label}
    </span>
  )
}

function StatCard({ label, value, color, sub }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--sep)', borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ fontSize: 11, color: 'var(--label-secondary)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--label-secondary)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

// ── Edit drawer cho 1 xe ─────────────────────────────────
function EditDrawer({ xe, onClose, onSaved }) {
  const [form, setForm] = useState({
    thoiHanPhuHieu: xe.thoiHanPhuHieu || '',
    thoiHanKDHienTai: xe.thoiHanKDHienTai || '',
    ghiChuTreTre:   xe.ghiChuTreTre   || '',
    tienDoXuLy:     xe.tienDoXuLy     || '',
    trangThaiXe:    xe.trangThaiXe    || 'hoatDong',
  })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    const r = await apiFetch(`/api/dang-kiem/${xe.bienSo}`, { method: 'PUT', body: JSON.stringify(form) })
    if (r.ok) { onSaved(await r.json()); onClose() }
    else alert('Lỗi lưu')
    setSaving(false)
  }

  const inp = { width: '100%', padding: '8px 10px', border: '0.5px solid var(--sep)', borderRadius: 8,
    background: 'var(--bg-grouped)', color: 'var(--label-primary)', fontSize: 13, fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 300,
      display: 'flex', alignItems: 'flex-end' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: '100%', maxWidth: 520, margin: '0 auto', background: 'var(--bg-card)',
        borderRadius: '16px 16px 0 0', padding: '20px 20px 32px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{xe.bienSo}</div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--label-secondary)' }}>✕</button>
        </div>

        {[
          { k: 'thoiHanKDHienTai', label: 'Thời hạn đăng kiểm (dd/mm/yyyy)', placeholder: '28/05/2026' },
          { k: 'thoiHanPhuHieu',   label: 'Thời hạn phù hiệu (dd/mm/yyyy)',  placeholder: '01/09/2026' },
        ].map(({ k, label, placeholder }) => (
          <div key={k} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--label-secondary)', marginBottom: 4 }}>{label}</div>
            <input style={inp} value={form[k]} placeholder={placeholder}
              onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} />
          </div>
        ))}

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--label-secondary)', marginBottom: 4 }}>Trạng thái xe</div>
          <select style={inp} value={form.trangThaiXe} onChange={e => setForm(p => ({ ...p, trangThaiXe: e.target.value }))}>
            <option value="hoatDong">🟢 Đang hoạt động</option>
            <option value="choXuLy">🟡 Đang xử lý / chờ đăng kiểm</option>
            <option value="dungHoatDong">🔴 Dừng hoạt động</option>
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--label-secondary)', marginBottom: 4 }}>Lý do trễ hạn / vướng mắc</div>
          <textarea style={{ ...inp, height: 72, resize: 'vertical' }} value={form.ghiChuTreTre}
            onChange={e => setForm(p => ({ ...p, ghiChuTreTre: e.target.value }))}
            placeholder="VD: Xe đang sửa chữa tại gara, chờ thay phụ tùng..." />
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: 'var(--label-secondary)', marginBottom: 4 }}>Tiến độ xử lý</div>
          <textarea style={{ ...inp, height: 60, resize: 'vertical' }} value={form.tienDoXuLy}
            onChange={e => setForm(p => ({ ...p, tienDoXuLy: e.target.value }))}
            placeholder="VD: Dự kiến đăng kiểm ngày 10/06/2026..." />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', border: '0.5px solid var(--sep)', borderRadius: 10,
            background: 'transparent', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Huỷ</button>
          <button onClick={save} disabled={saving} style={{ flex: 2, padding: '10px', border: 'none', borderRadius: 10,
            background: '#1A7F37', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>
            {saving ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Bảng xe ───────────────────────────────────────────────
function XeTable({ rows, type, onEdit }) {
  const [search, setSearch] = useState('')
  const filtered = rows.filter(r => !search || r.bienSo.includes(search.toUpperCase().replace(/[-.\s]/g,'')))

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Tìm biển số..." style={{ padding: '7px 12px', border: '0.5px solid var(--sep)',
            borderRadius: 8, fontSize: 13, background: 'var(--bg-grouped)', color: 'var(--label-primary)',
            outline: 'none', width: 180, fontFamily: 'inherit' }} />
        <span style={{ fontSize: 12, color: 'var(--label-secondary)' }}>{filtered.length} xe</span>
      </div>

      {filtered.length === 0
        ? <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--label-secondary)', fontSize: 13 }}>
            Không có xe nào trong danh sách này ✅
          </div>
        : filtered.map(r => {
          const alert = type === 'kd' ? r.alertKD : r.alertPH
          const A     = ALERT[alert?.level] || ALERT.none
          return (
            <div key={r.bienSo} style={{ background: A.bg, border: `0.5px solid ${A.border}`,
              borderRadius: 10, padding: '10px 14px', marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{r.bienSo}</span>
                    <AlertBadge level={alert?.level} small />
                    {r.trangThaiXe === 'dungHoatDong' && <AlertBadge level="red" small />}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--label-secondary)' }}>
                    {r.nhanHieu && `${r.nhanHieu} · `}
                    {type === 'kd' ? (
                      <>Hạn KĐ: <strong style={{ color: A.color }}>{r.thoiHanKDHienTai || '-'}</strong>
                        {alert?.daysLeft != null && ` · ${alert.daysLeft < 0 ? `Hết hạn ${Math.abs(alert.daysLeft)} ngày` : `Còn ${alert.daysLeft} ngày lịch / ${alert.workingDaysLeft} ngày LV`}`}
                      </>
                    ) : (
                      <>Hạn PH: <strong style={{ color: A.color }}>{r.thoiHanPhuHieu || 'Chưa nhập'}</strong>
                        {alert?.daysLeft != null && ` · ${alert.daysLeft < 0 ? `Hết hạn ${Math.abs(alert.daysLeft)} ngày` : `Còn ${alert.daysLeft} ngày`}`}
                      </>
                    )}
                  </div>
                  {r.ghiChuTreTre && (
                    <div style={{ fontSize: 11, color: 'var(--label-secondary)', marginTop: 4, fontStyle: 'italic' }}>
                      📝 {r.ghiChuTreTre}
                    </div>
                  )}
                  {r.tienDoXuLy && (
                    <div style={{ fontSize: 11, color: '#1A7F37', marginTop: 2 }}>
                      ▶ {r.tienDoXuLy}
                    </div>
                  )}
                </div>
                <button onClick={() => onEdit(r)} style={{ padding: '5px 12px', border: '0.5px solid var(--sep)',
                  borderRadius: 7, background: 'var(--bg-card)', cursor: 'pointer', fontSize: 11,
                  color: 'var(--label-secondary)', fontFamily: 'inherit', flexShrink: 0, marginLeft: 10 }}>
                  Cập nhật
                </button>
              </div>
            </div>
          )
        })
      }
    </div>
  )
}

// ── MAIN ─────────────────────────────────────────────────
export default function PageChungTuXe() {
  const [tab,     setTab]     = useState('dashboard')
  const [data,    setData]    = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)

  const load = () => {
    setLoading(true)
    apiFetch('/api/dang-kiem/alerts').then(r => r.json())
      .then(d => setData(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const handleSaved = (updated) => {
    setData(prev => prev.map(d => d.bienSo === updated.bienSo ? { ...d, ...updated } : d))
  }

  // ── Stats ─────────────────────────────────────────────
  const stats = useMemo(() => {
    const kd = { red: 0, orange: 0, yellow: 0, green: 0, none: 0 }
    const ph = { red: 0, yellow: 0, green: 0, none: 0 }
    let dungHD = 0
    data.forEach(d => {
      kd[d.alertKD?.level || 'none']++
      ph[d.alertPH?.level === 'orange' ? 'yellow' : (d.alertPH?.level || 'none')]++
      if (d.trangThaiXe === 'dungHoatDong') dungHD++
    })
    return { kd, ph, dungHD, total: data.length }
  }, [data])

  const kdChart = [
    { name: 'Hết hạn',        value: stats.kd.red,    fill: '#D70015' },
    { name: 'Sắp hết (<7 LV)',  value: stats.kd.orange, fill: '#E05000' },
    { name: 'Chú ý (<30 ngày)', value: stats.kd.yellow, fill: '#B07800' },
    { name: 'An toàn',         value: stats.kd.green,  fill: '#1A7F37' },
  ].filter(d => d.value > 0)

  const phChart = [
    { name: 'Hết hạn',         value: stats.ph.red,    fill: '#D70015' },
    { name: 'Sắp hết (<30 ng)', value: stats.ph.yellow, fill: '#B07800' },
    { name: 'An toàn',         value: stats.ph.green,  fill: '#1A7F37' },
    { name: 'Chưa nhập',       value: stats.ph.none,   fill: '#ABABAB' },
  ].filter(d => d.value > 0)

  // Sorted lists
  const kdAlerts = useMemo(() => [...data].sort((a,b) => {
    const order = { red:0, orange:1, yellow:2, green:3, none:4 }
    return (order[a.alertKD?.level]??4) - (order[b.alertKD?.level]??4)
  }), [data])

  const phAlerts = useMemo(() => [...data].sort((a,b) => {
    const order = { red:0, yellow:1, green:2, none:3 }
    return (order[a.alertPH?.level]??3) - (order[b.alertPH?.level]??3)
  }), [data])

  const dungHD = useMemo(() => data.filter(d =>
    d.trangThaiXe === 'dungHoatDong' ||
    (d.alertKD?.level === 'red' && d.trangThaiXe !== 'hoatDong')
  ), [data])

  const downloadExcel = async () => {
    const resp = await apiFetch('/api/dang-kiem/export/excel')
    if (!resp.ok) { alert('Lỗi tải Excel'); return }
    const blob = await resp.blob()
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `ChungTuXe_${new Date().toISOString().slice(0,10)}.xlsx`
    document.body.appendChild(a); a.click()
    document.body.removeChild(a); URL.revokeObjectURL(url)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200,
      color: 'var(--label-secondary)', fontSize: 13 }}>Đang tải dữ liệu...</div>
  )

  return (
    <div style={{ padding: '14px 16px 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>Chứng từ xe</div>
          <div style={{ fontSize: 12, color: 'var(--label-secondary)', marginTop: 3 }}>
            {stats.total} xe · Đăng kiểm + Phù hiệu
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={load} style={{ padding: '7px 14px', border: '0.5px solid var(--sep)', borderRadius: 8,
            background: 'transparent', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', color: 'var(--label-secondary)' }}>
            ↻ Làm mới
          </button>
          <button onClick={downloadExcel} style={{ padding: '7px 14px', border: 'none', borderRadius: 8,
            background: '#1A7F37', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>
            ↓ Excel
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '0.5px solid var(--sep)', marginBottom: 16, gap: 0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '8px 16px', fontSize: 12.5, fontWeight: tab === t.id ? 600 : 400,
            border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
            borderBottom: `2px solid ${tab === t.id ? '#1A7F37' : 'transparent'}`,
            color: tab === t.id ? '#1A7F37' : 'var(--label-secondary)', marginBottom: -1,
          }}>{t.label}</button>
        ))}
      </div>

      {/* ══ DASHBOARD ══ */}
      {tab === 'dashboard' && (
        <div>
          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
            <StatCard label="Tổng xe theo dõi"       value={stats.total}       color="var(--label-primary)" />
            <StatCard label="KĐ hết hạn"              value={stats.kd.red}      color="#D70015"
              sub={`Sắp hết: ${stats.kd.orange + stats.kd.yellow} xe`} />
            <StatCard label="Phù hiệu hết hạn"        value={stats.ph.red}      color="#D70015"
              sub={`Sắp hết: ${stats.ph.yellow} xe`} />
            <StatCard label="Xe dừng hoạt động"       value={stats.dungHD}      color="#D70015" />
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            {[
              { title: 'Trạng thái đăng kiểm', chart: kdChart },
              { title: 'Trạng thái phù hiệu',  chart: phChart },
            ].map(({ title, chart }) => (
              <div key={title} style={{ background: 'var(--bg-card)', border: '0.5px solid var(--sep)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--label-secondary)', marginBottom: 10,
                  textTransform: 'uppercase', letterSpacing: '.05em' }}>{title}</div>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={chart} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2} dataKey="value">
                      {chart.map((c, i) => <Cell key={i} fill={c.fill} />)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [`${v} xe`, n]} />
                    <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>

          {/* Bar chart theo tháng hết hạn KĐ */}
          {(() => {
            const byMonth = {}
            data.forEach(d => {
              const [dd,mm,yy] = (d.thoiHanKDHienTai||'').split('/')
              if (!mm||!yy) return
              const key = `T${mm}/${yy}`
              byMonth[key] = (byMonth[key]||0) + 1
            })
            const barData = Object.entries(byMonth).sort().map(([k,v]) => ({ name: k, value: v }))
            return barData.length > 0 ? (
              <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--sep)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--label-secondary)', marginBottom: 10,
                  textTransform: 'uppercase', letterSpacing: '.05em' }}>Phân bổ hạn đăng kiểm theo tháng</div>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={barData} margin={{ top:0, right:10, bottom:0, left:0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#1A7F37" radius={[4,4,0,0]} name="Số xe" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : null
          })()}

          {/* Urgent list */}
          {(stats.kd.red + stats.kd.orange) > 0 && (
            <div style={{ background: 'rgba(215,0,21,.06)', border: '0.5px solid rgba(215,0,21,.25)', borderRadius: 12, padding: '14px 16px', marginTop: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#D70015', marginBottom: 10 }}>
                ⚠ Cần xử lý ngay — {stats.kd.red + stats.kd.orange} xe
              </div>
              {kdAlerts.filter(r => ['red','orange'].includes(r.alertKD?.level)).map(r => (
                <div key={r.bienSo} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '6px 0', borderBottom: '0.5px solid rgba(215,0,21,.15)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <AlertBadge level={r.alertKD?.level} small />
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{r.bienSo}</span>
                    <span style={{ fontSize: 12, color: 'var(--label-secondary)' }}>Hạn: {r.thoiHanKDHienTai || '-'}</span>
                  </div>
                  <button onClick={() => setEditing(r)} style={{ padding: '4px 10px', border: '0.5px solid rgba(215,0,21,.3)',
                    borderRadius: 6, background: 'transparent', cursor: 'pointer', fontSize: 11, color: '#D70015', fontFamily: 'inherit' }}>
                    Cập nhật
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ ĐĂNG KIỂM ══ */}
      {tab === 'dang_kiem' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 14 }}>
            {Object.entries({ red: 'Hết hạn', orange: 'Sắp hết (<7 LV)', yellow: 'Chú ý (<30 ng)', green: 'An toàn' }).map(([k, label]) => (
              <div key={k} style={{ background: ALERT[k].bg, border: `0.5px solid ${ALERT[k].border}`, borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: ALERT[k].color }}>{stats.kd[k]}</div>
                <div style={{ fontSize: 11, color: ALERT[k].color, marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
          <XeTable rows={kdAlerts} type="kd" onEdit={setEditing} />
        </div>
      )}

      {/* ══ PHÙ HIỆU ══ */}
      {tab === 'phu_hieu' && (
        <div>
          <div style={{ background: 'rgba(0,85,204,.06)', border: '0.5px solid rgba(0,85,204,.2)', borderRadius: 10,
            padding: '10px 14px', marginBottom: 14, fontSize: 12, color: 'var(--label-secondary)' }}>
            💡 Ngày hết hạn phù hiệu nhập tay. Click <strong>Cập nhật</strong> trên từng xe để nhập. Cảnh báo vàng khi còn ≤30 ngày.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 14 }}>
            {[
              { k: 'red',    label: 'Hết hạn',     v: stats.ph.red    },
              { k: 'yellow', label: 'Sắp hết',      v: stats.ph.yellow },
              { k: 'green',  label: 'An toàn',      v: stats.ph.green  },
              { k: 'none',   label: 'Chưa nhập',    v: stats.ph.none   },
            ].map(({ k, label, v }) => (
              <div key={k} style={{ background: ALERT[k].bg, border: `0.5px solid ${ALERT[k].border}`, borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: ALERT[k].color }}>{v}</div>
                <div style={{ fontSize: 11, color: ALERT[k].color, marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
          <XeTable rows={phAlerts} type="ph" onEdit={setEditing} />
        </div>
      )}

      {/* ══ XE DỪNG HOẠT ĐỘNG ══ */}
      {tab === 'dung_hd' && (
        <div>
          <div style={{ fontSize: 12, color: 'var(--label-secondary)', marginBottom: 12, lineHeight: 1.7 }}>
            Danh sách xe dừng hoạt động bao gồm: xe <strong>hết hạn đăng kiểm</strong>, hết hạn phù hiệu,
            hoặc xe được đánh dấu <strong>dừng hoạt động / đang xử lý</strong> thủ công.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
            <StatCard label="Dừng vì hết hạn KĐ"     value={data.filter(d=>d.alertKD?.level==='red').length}  color="#D70015" />
            <StatCard label="Dừng vì hết hạn PH"     value={data.filter(d=>d.alertPH?.level==='red').length}  color="#D70015" />
            <StatCard label="Đánh dấu dừng thủ công" value={data.filter(d=>d.trangThaiXe==='dungHoatDong').length} color="#D70015" />
          </div>

          {dungHD.length === 0
            ? <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--label-secondary)' }}>
                <div style={{ fontSize: 32 }}>✅</div>
                <div style={{ marginTop: 10, fontSize: 14 }}>Không có xe dừng hoạt động</div>
              </div>
            : dungHD.map(r => (
              <div key={r.bienSo} style={{ background: 'rgba(215,0,21,.07)', border: '0.5px solid rgba(215,0,21,.25)',
                borderRadius: 10, padding: '12px 14px', marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{r.bienSo}</span>
                      {r.alertKD?.level === 'red' && <AlertBadge level="red" small />}
                      {r.trangThaiXe === 'choXuLy'      && <span style={{ fontSize: 11, padding: '2px 8px', background: 'rgba(196,140,0,.15)', color: '#7D5700', borderRadius: 20 }}>🟡 Đang xử lý</span>}
                      {r.trangThaiXe === 'dungHoatDong' && <span style={{ fontSize: 11, padding: '2px 8px', background: 'rgba(215,0,21,.15)', color: '#D70015', borderRadius: 20 }}>🔴 Dừng HĐ</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--label-secondary)' }}>
                      KĐ: <strong>{r.thoiHanKDHienTai || '-'}</strong>
                      {r.thoiHanPhuHieu && <> · PH: <strong>{r.thoiHanPhuHieu}</strong></>}
                    </div>
                    {r.ghiChuTreTre && (
                      <div style={{ fontSize: 11, color: 'var(--label-secondary)', marginTop: 5, fontStyle: 'italic' }}>
                        📝 {r.ghiChuTreTre}
                      </div>
                    )}
                    {r.tienDoXuLy && (
                      <div style={{ fontSize: 11, color: '#1A7F37', marginTop: 3 }}>
                        ▶ {r.tienDoXuLy}
                      </div>
                    )}
                  </div>
                  <button onClick={() => setEditing(r)} style={{ padding: '5px 12px', border: '0.5px solid rgba(215,0,21,.3)',
                    borderRadius: 7, background: 'rgba(215,0,21,.07)', cursor: 'pointer', fontSize: 11,
                    color: '#D70015', fontFamily: 'inherit', flexShrink: 0, marginLeft: 10 }}>
                    Cập nhật
                  </button>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* Edit drawer */}
      {editing && (
        <EditDrawer xe={editing} onClose={() => setEditing(null)} onSaved={handleSaved} />
      )}
    </div>
  )
}
