import { useState, useEffect, useMemo } from 'react'
import * as XLSX from 'xlsx'
import useIsMobile from '../hooks/useIsMobile'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const getToken = () => localStorage.getItem('hsg_token') || ''

function fmt(v, unit) {
  if (v === null || v === undefined) return '—'
  const n = Number(v); if (isNaN(n)) return '—'
  return n.toLocaleString('vi-VN') + (unit ? '\u00a0' + unit : '')
}
function fmtM(v) {
  if (!v) return '—'
  return (v >= 1e6) ? (v/1e6).toFixed(1).replace('.0','') + 'M' : v.toLocaleString('vi-VN')
}
function pctColor(p) { return p>=80?'#1A7F37':p>=50?'#C45500':'#D70015' }

export default function PageBaoCaoNhatTrinh() {
  const isMobile = useIsMobile()
  const now = new Date()
  const [thang,setThang] = useState(now.getMonth()+1)
  const [nam,  setNam]   = useState(now.getFullYear())
  const [data, setData]  = useState(null)
  const [loading,setLoading] = useState(false)
  const [search,setSearch]   = useState('')
  const [filterTinh,  setFilterTinh]   = useState('all')
  const [filterStatus,setFilterStatus] = useState('all')
  const [tinhExpanded,setTinhExpanded] = useState(true)
  const [sortCol,setSortCol] = useState('tinh')
  const [sortDir,setSortDir] = useState(1)

  const load = async () => {
    setLoading(true)
    try {
      const r = await fetch(`${API}/api/stats/nhat-trinh-report?thang=${thang}&nam=${nam}`,
        { headers: { Authorization: `Bearer ${getToken()}` } })
      setData(await r.json())
    } catch {}
    setLoading(false)
  }
  useEffect(() => { load() }, [thang, nam])

  const filteredXe = useMemo(() => {
    if (!data) return []
    return data.xeList.filter(xe => {
      const q = search.toLowerCase()
      return (!q || [xe.bienSo,xe.ma,xe.cuaHang,xe.tinh].some(s=>s?.toLowerCase().includes(q)))
        && (filterTinh==='all' || xe.tinh===filterTinh)
        && (filterStatus==='all' || (filterStatus==='done'?xe.daNop:!xe.daNop))
    }).sort((a,b)=>{
      let va,vb
      if (sortCol==='km') { va=a.record?.tongKmDiChuyen||-1; vb=b.record?.tongKmDiChuyen||-1 }
      else if (sortCol==='kl') { va=a.record?.tongKLChuyen||-1; vb=b.record?.tongKLChuyen||-1 }
      else { va=a[sortCol]; vb=b[sortCol] }
      return (va>vb?1:-1)*sortDir
    })
  }, [data,search,filterTinh,filterStatus,sortCol,sortDir])

  const toggleSort = (col) => { if(sortCol===col) setSortDir(d=>-d); else{setSortCol(col);setSortDir(1)} }
  const si = col => sortCol===col ? (sortDir===1?' ↑':' ↓') : ''

  const exportExcel = () => {
    if (!data) return
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['Báo cáo nhật trình', `T${thang}/${nam}`],[],
      ['Tổng xe',data.summary.tongXe],['Đã nộp',data.summary.daNop],
      ['Chưa nộp',data.summary.chuaNop],['Tỷ lệ',`${data.summary.phanTram}%`],[],
      ['Tổng km',data.tongHop.tongKm],['Tổng KL (kg)',data.tongHop.tongKL],
      ['Lít dầu',data.tongHop.tongLitDau],['Tiền dầu',data.tongHop.tongTienDau],
    ]), 'Tổng hợp')
    const hdrs=['Tỉnh','Cửa hàng','Biển số','Mã xe','Trạng thái','Km đầu','Km cuối','Tổng km','Km đèo','Chuyến','Phút cẩu','Lít dầu','Tiền dầu','KL (kg)','KL nội bộ','CP thuê','KL thuê','Ghi chú']
    const ws = XLSX.utils.aoa_to_sheet([hdrs,...filteredXe.map(xe=>{const r=xe.record;return[xe.tinh,xe.cuaHang,xe.bienSo,xe.ma,xe.daNop?'Đã nộp':'Chưa nộp',r?.kmDauThang||'',r?.kmCuoiThang||'',r?.tongKmDiChuyen||'',r?.kmDuongDeo||'',r?.soChuyenXe||'',r?.tgSuDungCau||'',r?.tongLitDau||'',r?.tongTienDau||'',r?.tongKLChuyen||'',r?.klNoiBo||'',r?.cpThueNgoai||'',r?.klThueNgoai||'',r?.ghiChu||'']})])
    ws['!cols']=[14,18,12,10,10,10,10,10,8,8,8,8,12,12,12,12,12,25].map(w=>({wch:w}))
    XLSX.utils.book_append_sheet(wb, ws, 'Chi tiết xe')
    XLSX.writeFile(wb, `NhatTrinh_T${thang}_${nam}.xlsx`)
  }

  // ── Styles ──
  const card = { background:'#fff', borderRadius:12, border:'1px solid #E5E7EB', marginBottom:14 }
  const hdrS = { padding:'12px 16px', borderBottom:'1px solid #E5E7EB', fontSize:11.5, fontWeight:700, color:'#374151', textTransform:'uppercase', letterSpacing:'0.06em' }
  const thS  = { padding:'9px 12px', fontWeight:600, fontSize:10.5, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.05em', borderBottom:'1px solid #E5E7EB', background:'#F9FAFB', textAlign:'center', whiteSpace:'nowrap', cursor:'pointer' }
  const tdS  = i => ({ padding:'9px 12px', fontSize:12.5, color:'#374151', borderBottom:'1px solid #F3F4F6', textAlign:'center', background:i%2===0?'#FAFAFA':'#fff' })
  const selS = { padding:'7px 10px', borderRadius:8, border:'1px solid #E5E7EB', fontSize:12.5, color:'#374151', outline:'none', background:'#fff' }
  const btnS = c => ({ padding:'8px 14px', borderRadius:8, border:'none', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', background:c })

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh',flexDirection:'column',gap:12}}>
      <div style={{width:36,height:36,border:'3px solid #E5E7EB',borderTopColor:'#E63200',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>
      <div style={{color:'#6B7280',fontSize:13}}>Đang tải báo cáo...</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{maxWidth:1200,margin:'0 auto',padding:isMobile?'12px 10px 40px':'20px 20px 40px'}}>

      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:10,marginBottom:20}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:800,color:'#111827',letterSpacing:-0.5,margin:0}}>Báo cáo nhật trình xe tải</h1>
          <p style={{fontSize:13,color:'#6B7280',margin:'4px 0 0'}}>Tháng {thang}/{nam}{data?` · ${data.summary.tongXe} xe`:''}</p>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
          <select value={thang} onChange={e=>setThang(+e.target.value)} style={selS}>
            {[...Array(12)].map((_,i)=><option key={i+1} value={i+1}>Tháng {i+1}</option>)}
          </select>
          <select value={nam} onChange={e=>setNam(+e.target.value)} style={selS}>
            {[2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={load} style={btnS('#374151')}>↻ Tải lại</button>
          {data && <button onClick={exportExcel} style={btnS('#1A7F37')}>⬇ Xuất Excel</button>}
        </div>
      </div>

      {data && <>

        {/* KPIs */}
        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr 1fr':'repeat(4,1fr)',gap:12,marginBottom:14}}>
          {/* Progress */}
          <div style={{...card,padding:'18px',display:'flex',alignItems:'center',gap:14,gridColumn:isMobile?'span 2':'span 1',borderTop:'3px solid #E63200',marginBottom:0}}>
            <div style={{position:'relative',width:60,height:60,flexShrink:0}}>
              <svg width={60} height={60} viewBox="0 0 60 60">
                <circle cx={30} cy={30} r={24} fill="none" stroke="#F3F4F6" strokeWidth={6}/>
                <circle cx={30} cy={30} r={24} fill="none"
                  stroke={pctColor(data.summary.phanTram)} strokeWidth={6}
                  strokeDasharray={`${data.summary.phanTram*1.508} 150.8`}
                  strokeLinecap="round" transform="rotate(-90 30 30)"/>
              </svg>
              <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:pctColor(data.summary.phanTram)}}>
                {data.summary.phanTram}%
              </div>
            </div>
            <div>
              <div style={{fontSize:26,fontWeight:800,color:'#111827',lineHeight:1}}>{data.summary.daNop}<span style={{fontSize:13,color:'#9CA3AF',marginLeft:4}}>/ {data.summary.tongXe}</span></div>
              <div style={{fontSize:11.5,color:'#1A7F37',fontWeight:600,marginTop:3}}>✓ {data.summary.daNop} đã nộp</div>
              <div style={{fontSize:11.5,color:'#D70015',marginTop:1}}>✗ {data.summary.chuaNop} chưa nộp</div>
            </div>
          </div>
          {[
            {l:'Tổng km',        v:fmt(data.tongHop.tongKm,'km'),           border:'#0055CC'},
            {l:'Tổng KL chuyên chở', v:fmt(data.tongHop.tongKL,'kg'),       border:'#1A7F37'},
            {l:'Tổng phút cẩu',  v:fmt(data.tongHop.tongPhutCau,'phút'),    border:'#C45500'},
          ].map(k=>(
            <div key={k.l} style={{...card,padding:'18px',borderTop:`3px solid ${k.border}`,marginBottom:0}}>
              <div style={{fontSize:10.5,color:'#6B7280',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8}}>{k.l}</div>
              <div style={{fontSize:22,fontWeight:800,color:'#111827'}}>{k.v}</div>
            </div>
          ))}
        </div>

        {/* Tổng hợp */}
        <div style={card}>
          <div style={hdrS}>Tổng hợp số liệu tháng {thang}/{nam}</div>
          <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr 1fr':'repeat(4,1fr)',gap:0}}>
            {[
              {l:'Tổng lít dầu',        v:fmt(data.tongHop.tongLitDau,'lít')},
              {l:'Tổng tiền dầu',       v:fmtM(data.tongHop.tongTienDau)},
              {l:`TB KL/xe (${data.tongHop.soXeCoKL||0} xe)`, v:fmt(data.tongHop.avgKL,'kg'), col:'#1A7F37'},
              {l:'TB KL nội bộ/xe',     v:fmt(data.tongHop.avgKLNoBo,'kg'), col:'#C45500'},
            ].map((k,i)=>(
              <div key={k.l} style={{padding:'14px 18px',borderRight:i<3&&!isMobile?'1px solid #E5E7EB':'none',borderBottom:isMobile&&i<2?'1px solid #E5E7EB':'none'}}>
                <div style={{fontSize:11,color:'#6B7280',marginBottom:4}}>{k.l}</div>
                <div style={{fontSize:18,fontWeight:700,color:k.col||'#111827'}}>{k.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tiến độ theo tỉnh */}
        <div style={card}>
          <div onClick={()=>setTinhExpanded(v=>!v)}
            style={{...hdrS,cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span>Tiến độ theo tỉnh</span>
            <span style={{fontSize:11,color:'#9CA3AF',display:'inline-block',transform:tinhExpanded?'none':'rotate(-90deg)',transition:'transform .2s'}}>▼</span>
          </div>
          {tinhExpanded && (
            <div style={{padding:'14px 16px',display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(3,1fr)',gap:10}}>
              {data.byTinh.map(t=>{
                const p=Math.round(t.daNop/t.tongXe*100)||0
                return (
                  <div key={t.tinh} onClick={()=>setFilterTinh(x=>x===t.tinh?'all':t.tinh)}
                    style={{padding:'10px 12px',borderRadius:8,cursor:'pointer',
                      border:`1px solid ${filterTinh===t.tinh?'#0055CC':'#E5E7EB'}`,
                      background:filterTinh===t.tinh?'#EFF6FF':'#FAFAFA'}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                      <span style={{fontSize:13,fontWeight:600,color:'#111827'}}>{t.tinh||'Chưa rõ'}</span>
                      <span style={{fontSize:12,fontWeight:700,color:pctColor(p)}}>{t.daNop}/{t.tongXe}</span>
                    </div>
                    <div style={{height:4,background:'#E5E7EB',borderRadius:2,overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${p}%`,background:pctColor(p),borderRadius:2}}/>
                    </div>
                    <div style={{fontSize:11,color:'#9CA3AF',marginTop:3}}>{p}% · {t.mien||''}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Bảng chi tiết */}
        <div style={card}>
          <div style={{padding:'12px 16px',borderBottom:'1px solid #E5E7EB',display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="🔍 Tìm biển số, cửa hàng, tỉnh..."
              style={{flex:1,minWidth:180,padding:'7px 12px',borderRadius:8,border:'1px solid #E5E7EB',fontSize:13,outline:'none',color:'#374151'}}/>
            <select value={filterTinh} onChange={e=>setFilterTinh(e.target.value)} style={selS}>
              <option value="all">Tất cả tỉnh</option>
              {data.byTinh.map(t=><option key={t.tinh} value={t.tinh}>{t.tinh}</option>)}
            </select>
            <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={selS}>
              <option value="all">Tất cả ({data.summary.tongXe})</option>
              <option value="done">✓ Đã nộp ({data.summary.daNop})</option>
              <option value="pending">✗ Chưa nộp ({data.summary.chuaNop})</option>
            </select>
            <span style={{fontSize:11,color:'#9CA3AF'}}>{filteredXe.length} kết quả</span>
          </div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12.5}}>
              <thead>
                <tr>
                  {[{k:'tinh',l:'Tỉnh / Cửa hàng'},{k:'bienSo',l:'Biển số'},{k:'status',l:'Trạng thái'},
                    {k:'km',l:'Tổng km'},{k:'kl',l:'KL (kg)'},{k:'',l:'Lít dầu'},{k:'',l:'Tiền dầu'},
                    {k:'',l:'Phút cẩu'},{k:'',l:'Chuyến'},{k:'',l:'Ghi chú'}].map(col=>(
                    <th key={col.l} style={thS} onClick={()=>col.k&&toggleSort(col.k)}>{col.l}{si(col.k)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredXe.map((xe,i)=>{
                  const r=xe.record
                  return (
                    <tr key={xe.ma+xe.bienSo}>
                      <td style={{...tdS(i),textAlign:'left'}}>
                        <div style={{fontWeight:600,color:'#111827'}}>{xe.tinh||'—'}</div>
                        <div style={{fontSize:11,color:'#9CA3AF',marginTop:1}}>{xe.cuaHang||'—'}</div>
                      </td>
                      <td style={{...tdS(i),fontWeight:700,color:'#0055CC',whiteSpace:'nowrap'}}>{xe.bienSo||xe.ma}</td>
                      <td style={tdS(i)}>
                        {xe.daNop
                          ?<span style={{padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,background:'#DCFCE7',color:'#1A7F37'}}>✓ Đã nộp</span>
                          :<span style={{padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,background:'#FEE2E2',color:'#D70015'}}>✗ Chưa</span>}
                      </td>
                      <td style={{...tdS(i),color:r?'#0055CC':'#D1D5DB',fontWeight:r?700:400}}>{r?fmt(r.tongKmDiChuyen):'—'}</td>
                      <td style={{...tdS(i),color:r?'#1A7F37':'#D1D5DB'}}>{r?fmt(r.tongKLChuyen):'—'}</td>
                      <td style={tdS(i)}>{r?fmt(r.tongLitDau):'—'}</td>
                      <td style={{...tdS(i),color:r?.tongTienDau?'#D70015':'#D1D5DB'}}>{r?fmtM(r.tongTienDau):'—'}</td>
                      <td style={{...tdS(i),color:r?.tgSuDungCau>0?'#C45500':'#D1D5DB'}}>{r?(r.tgSuDungCau||0):'—'}</td>
                      <td style={tdS(i)}>{r?(r.soChuyenXe||0):'—'}</td>
                      <td style={{...tdS(i),maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:'#9CA3AF'}}>{r?.ghiChu||'—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filteredXe.length===0&&<div style={{padding:40,textAlign:'center',color:'#9CA3AF'}}>Không có kết quả</div>}
          </div>
        </div>
      </>}
    </div>
  )
}
