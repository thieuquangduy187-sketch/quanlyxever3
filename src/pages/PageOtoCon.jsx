import useIsMobile from '../hooks/useIsMobile'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { obj2arr, sortDesc, fmtCur, PIE_COLORS, COLORS } from '../hooks/useCharts'

export default function PageOtoCon({ data, rowsLoaded }) {
  const s = data?.otocon?.stats || {}
  const rows = data?.otocon?.rows || []
  const isMobile = useIsMobile()
  const nhArr = sortDesc(obj2arr(s.byNhanHieu || s.byNhanHieu || {}))
  const dvArr = sortDesc(obj2arr(s.byDonVi || {}))
  const isLoading = !rowsLoaded?.oto_con && rows.length === 0

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap:12, marginBottom:16 }}>
        {[
          { icon:'🚗', label:'Tổng ô tô con', value:s.total||0, sub:'Xe đang quản lý', bg:'var(--purple-l)', bar:'var(--purple)' },
          { icon:'💰', label:'GTCL tổng', value:fmtCur(s.tongGTCL||0), sub:'Giá trị còn lại', bg:'var(--teal-l)', bar:'var(--teal)' },
          { icon:'🏢', label:'Đơn vị SD', value:Object.keys(s.byDonVi||{}).length, sub:'Số tỉnh/đơn vị', bg:'var(--green-l)', bar:'var(--green)' },
          { icon:'🏷️', label:'Nhãn hiệu', value:Object.keys(s.byNhanHieu||{}).length, sub:'Loại xe', bg:'var(--amber-l)', bar:'var(--amber)' },
        ].map((kpi, i) => (
          <div key={i} style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:12, padding:'16px 18px', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:kpi.bar }} />
            <div style={{ width:34, height:34, borderRadius:8, background:kpi.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, marginBottom:10 }}>{kpi.icon}</div>
            <div style={{ fontSize:10.5, fontWeight:700, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:3 }}>{kpi.label}</div>
            <div style={{ fontSize:24, fontWeight:700, lineHeight:1 }}>{kpi.value}</div>
            <div style={{ fontSize:11, color:'var(--ink3)', marginTop:3 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:12, marginBottom:12 }}>
        <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:12, padding:'15px 18px' }}>
          <div style={{ fontSize:12.5, fontWeight:600, color:'var(--ink2)', marginBottom:8 }}>Theo nhãn hiệu</div>
          <ResponsiveContainer width="100%" height={isMobile ? 160 : 180}>
            <PieChart>
              <Pie data={nhArr} dataKey="value" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={3}>
                {nhArr.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          {nhArr.slice(0,6).map((d, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:6, marginTop:5, fontSize:11.5 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:PIE_COLORS[i], flexShrink:0 }} />
              <span style={{ flex:1 }}>{d.name}</span>
              <b>{d.value}</b>
              <span style={{ color:'var(--ink3)', minWidth:30 }}>{s.total ? Math.round(d.value/s.total*100) : 0}%</span>
            </div>
          ))}
        </div>
        <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:12, padding:'15px 18px' }}>
          <div style={{ fontSize:12.5, fontWeight:600, color:'var(--ink2)', marginBottom:12 }}>Theo đơn vị sử dụng</div>
          {dvArr.slice(0,12).map((d, i) => {
            const max = Math.max(...dvArr.map(x => x.value), 1)
            return (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                <div style={{ fontSize:12, color:'var(--ink2)', minWidth:80, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.name}</div>
                <div style={{ flex:1, height:7, background:'var(--bg)', borderRadius:4, overflow:'hidden' }}>
                  <div style={{ height:'100%', borderRadius:4, background:COLORS[i%COLORS.length], width:`${d.value/max*100}%` }} />
                </div>
                <b style={{ fontSize:12, minWidth:24, textAlign:'right' }}>{d.value}</b>
              </div>
            )
          })}
        </div>
      </div>

      {rows.length > 0 && (
        <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
          <div style={{ padding:'15px 18px 10px', fontSize:12.5, fontWeight:600, color:'var(--ink2)' }}>Danh sách ô tô con</div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr>
                  {['STT','Biển số','Nhãn hiệu','Đơn vị SD','Pháp nhân','Số chỗ','Năm SX','GTCL','Nhân sự'].map(h => (
                    <th key={h} style={{ padding:'9px 12px', background:'var(--bg)', borderBottom:'1px solid var(--border)', fontWeight:600, fontSize:10.5, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:'.05em', whiteSpace:'nowrap', textAlign:'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} style={{ borderBottom:'1px solid var(--border)' }}>
                    <td style={{ padding:'8px 12px', color:'var(--ink3)', fontSize:11, textAlign:'center' }}>{i+1}</td>
                    <td style={{ padding:'8px 12px' }}><b>{r.bks}</b></td>
                    <td style={{ padding:'8px 12px' }}>{r.nhanHieu}</td>
                    <td style={{ padding:'8px 12px' }}>{r.donViSD}</td>
                    <td style={{ padding:'8px 12px' }}>{r.phapNhan}</td>
                    <td style={{ padding:'8px 12px', textAlign:'right' }}>{r.soCho}</td>
                    <td style={{ padding:'8px 12px' }}>{r.namSX||'—'}</td>
                    <td style={{ padding:'8px 12px', textAlign:'right' }}>{r.gtcl ? fmtCur(r.gtcl) : '—'}</td>
                    <td style={{ padding:'8px 12px' }}>{r.nhanSu}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {isLoading && <div style={{ textAlign:'center', padding:40, color:'var(--ink3)' }}>Đang tải dữ liệu...</div>}
    </div>
  )
}
