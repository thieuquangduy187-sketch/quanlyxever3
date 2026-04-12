import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { obj2arr, sortDesc, fmtCur, COLORS, PIE_COLORS } from '../hooks/useCharts'

function KpiCard({ icon, label, value, sub, color }) {
  const colors = {
    or: { bar: 'var(--brand)', bg: 'var(--brand-l)' },
    am: { bar: 'var(--amber)', bg: 'var(--amber-l)' },
    pu: { bar: 'var(--purple)', bg: 'var(--purple-l)' },
    te: { bar: 'var(--teal)', bg: 'var(--teal-l)' },
  }
  const c = colors[color] || colors.or
  return (
    <div style={{
      background: '#fff', border: '1px solid var(--border)', borderRadius: 12,
      padding: '16px 18px', position: 'relative', overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: c.bar }} />
      <div style={{ width: 34, height: 34, borderRadius: 8, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

export default function PageOverview({ data }) {
  const xs = data?.xeTai?.stats || {}
  const os = data?.otocon?.stats || {}
  const cs = data?.cuaHang?.stats || {}
  const tongXe = (xs.total || 0) + (os.total || 0)

  const mArr = sortDesc(obj2arr(xs.byMien || {}))
  const ltArr = sortDesc(obj2arr(xs.byLoaiThung || {}))
  const nArr = obj2arr(xs.byNamSX || {}).sort((a, b) => +a.name - +b.name)
  const pnArr = sortDesc(obj2arr(xs.byPhapNhan || {}))

  return (
    <div>
      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
        <KpiCard icon="🚗" label="Tổng phương tiện" value={tongXe} sub="Xe tải + ô tô con" color="or" />
        <KpiCard icon="🚛" label="Xe tải" value={xs.total || 0} sub="Đang quản lý" color="am" />
        <KpiCard icon="🚗" label="Ô tô con" value={os.total || 0} sub="Đang quản lý" color="pu" />
      </div>

      {/* Charts row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 12, marginBottom: 12 }}>
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '15px 18px' }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink2)', marginBottom: 12 }}>Xe tải theo năm sản xuất</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={nArr} barSize={22}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--ink3)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--ink3)' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={v => v.toLocaleString('vi-VN')} />
              <Bar dataKey="value" fill="#D4420A" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '15px 18px' }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink2)', marginBottom: 8 }}>Loại thùng xe tải</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={ltArr} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={3}>
                {ltArr.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={v => v.toLocaleString('vi-VN')} />
            </PieChart>
          </ResponsiveContainer>
          {ltArr.map((d, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontSize: 11.5 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[i], flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{d.name}</span>
              <b>{d.value}</b>
            </div>
          ))}
        </div>
      </div>

      {/* Charts row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '15px 18px' }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink2)', marginBottom: 12 }}>Xe tải theo miền</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={mArr} barSize={50}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--ink3)' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={v => v.toLocaleString('vi-VN')} />
              <Bar dataKey="value" radius={[6,6,0,0]}>
                {mArr.map((_, i) => <Cell key={i} fill={['#D4420A','#0E7490','#B45309'][i] || '#666'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '15px 18px' }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink2)', marginBottom: 12 }}>Pháp nhân đứng tên</div>
          {pnArr.map((p, i) => {
            const max = Math.max(...pnArr.map(x => x.value), 1)
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--ink2)', minWidth: 40 }}>{p.name}</div>
                <div style={{ flex: 1, height: 7, background: 'var(--bg)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 4, background: COLORS[i % COLORS.length], width: `${p.value / max * 100}%` }} />
                </div>
                <b style={{ fontSize: 12, minWidth: 28, textAlign: 'right' }}>{p.value}</b>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
