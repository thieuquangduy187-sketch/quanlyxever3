import { useState, useMemo } from 'react'
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { obj2arr, sortDesc, COLORS } from '../hooks/useCharts'
import { updateCHRow } from '../api'

const PAGE_SIZE = 50
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1y5WZ0IP0uRtrjD71_I3bpFQZcKRcDNJoD4Rv6a5xMDw/edit'

export default function PageCuaHang({ data, rowsLoaded }) {
  const s = data?.cuaHang?.stats || {}
  const rows = data?.cuaHang?.rows || []
  const [search, setSearch] = useState('')
  const [filterVung, setFilterVung] = useState('')
  const [sortCol, setSortCol] = useState(-1)
  const [sortDir, setSortDir] = useState(1)
  const [pg, setPg] = useState(0)
  const [editCell, setEditCell] = useState(null)
  const [toast, setToast] = useState(null)
  const isLoading = !rowsLoaded?.cua_hang && rows.length === 0

  const vArr = sortDesc(obj2arr(s.byVung || {}))
  const mhArr = sortDesc(obj2arr(s.byMoHinh || {}))

  const COLS = [
    { k:'stt',    l:'STT',         sort:false },
    { k:'maCH',   l:'Mã CH',       sort:true },
    { k:'tenCH',  l:'Tên cửa hàng',sort:true, edit:true },
    { k:'vung',   l:'Vùng',        sort:true, edit:true },
    { k:'moHinh', l:'Mô hình',     sort:true, edit:true },
    { k:'cnt',    l:'CNT',         sort:true, edit:true },
    { k:'tenCHT', l:'CH Trưởng',   sort:true, edit:true },
    { k:'sdt',    l:'SĐT',         sort:true, edit:true },
    { k:'diaChi', l:'Địa chỉ',     sort:false, edit:true },
  ]

  const showToast = (msg, err) => { setToast({msg,err}); setTimeout(()=>setToast(null),2800) }

  const filtered = useMemo(() => {
    let r = rows.filter(row => {
      const s2 = search.toLowerCase()
      return (!s2 || (row.tenCH||'').toLowerCase().includes(s2) || (row.maCH||'').toLowerCase().includes(s2)) &&
             (!filterVung || row.vung === filterVung)
    })
    if (sortCol >= 0 && COLS[sortCol]) {
      const col = COLS[sortCol]
      r = [...r].sort((a,b) => String(a[col.k]||'').localeCompare(String(b[col.k]||''),'vi') * sortDir)
    }
    return r
  }, [rows, search, filterVung, sortCol, sortDir])

  const totalPg = Math.ceil(filtered.length / PAGE_SIZE)
  const pgRows = filtered.slice(pg*PAGE_SIZE, (pg+1)*PAGE_SIZE)

  const handleEdit = async (rowIdx, field, newVal) => {
    const row = filtered[rowIdx]
    if (!row || String(row[field]) === String(newVal)) return
    row[field] = newVal
    try {
      showToast('💾 Đang lưu...')
      await updateCHRow(row.maCH, field, newVal)
      showToast('✓ Đã lưu')
    } catch(e) { showToast('✗ Lỗi: ' + e.message, true) }
  }

  const exportExcel = () => {
    const cols = COLS.filter(c => c.k !== 'stt')
    const html = '<html><head><meta charset="UTF-8"><style>th{background:#0E7490;color:#fff;padding:6px 10px;border:1px solid #ccc}td{padding:5px 10px;border:1px solid #ddd}tr:nth-child(even)td{background:#F0FAFB}</style></head><body><table><thead><tr><th>#</th>'+cols.map(c=>`<th>${c.l}</th>`).join('')+'</tr></thead><tbody>'+
      filtered.map((r,i)=>'<tr><td style="text-align:center">'+(i+1)+'</td>'+cols.map(c=>`<td>${r[c.k]||''}</td>`).join('')+'</tr>').join('')+'</tbody></table></body></html>'
    const blob = new Blob([html],{type:'application/vnd.ms-excel;charset=utf-8'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href=url; a.download=`HSG_CuaHang_${new Date().toISOString().slice(0,10)}.xls`
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
  }

  return (
    <div>
      {toast && <div style={{position:'fixed',bottom:24,right:24,background:toast.err?'var(--red)':'#1A1A1A',color:'#fff',padding:'10px 18px',borderRadius:9,fontSize:13,zIndex:9999}}>{toast.msg}</div>}

      {/* KPI */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
        {[
          {icon:'🏪',label:'Tổng cửa hàng',value:s.total||0,sub:'Toàn quốc',bar:'var(--brand)',bg:'var(--brand-l)'},
          {icon:'🗺️',label:'Số vùng',value:Object.keys(s.byVung||{}).length,sub:'Vùng hoạt động',bar:'var(--teal)',bg:'var(--teal-l)'},
          {icon:'📊',label:'Mô hình 2B',value:(s.byMoHinh||{})['2B']||0,sub:'Cửa hàng',bar:'var(--purple)',bg:'var(--purple-l)'},
          {icon:'📊',label:'Mô hình 2A',value:(s.byMoHinh||{})['2A']||0,sub:'Cửa hàng',bar:'var(--green)',bg:'var(--green-l)'},
        ].map((kpi,i)=>(
          <div key={i} style={{background:'#fff',border:'1px solid var(--border)',borderRadius:12,padding:'16px 18px',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:kpi.bar}}/>
            <div style={{width:34,height:34,borderRadius:8,background:kpi.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,marginBottom:10}}>{kpi.icon}</div>
            <div style={{fontSize:10.5,fontWeight:700,color:'var(--ink3)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:3}}>{kpi.label}</div>
            <div style={{fontSize:24,fontWeight:700,lineHeight:1}}>{kpi.value}</div>
            <div style={{fontSize:11,color:'var(--ink3)',marginTop:3}}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
        <div style={{background:'#fff',border:'1px solid var(--border)',borderRadius:12,padding:'15px 18px'}}>
          <div style={{fontSize:12.5,fontWeight:600,color:'var(--ink2)',marginBottom:12}}>Theo vùng</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={vArr} barSize={50}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
              <XAxis dataKey="name" tick={{fontSize:12}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:11,fill:'var(--ink3)'}} axisLine={false} tickLine={false}/>
              <Tooltip formatter={v=>v.toLocaleString('vi-VN')}/>
              <Bar dataKey="value" radius={[6,6,0,0]}>{vArr.map((_,i)=><Cell key={i} fill={COLORS[i]}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:'#fff',border:'1px solid var(--border)',borderRadius:12,padding:'15px 18px'}}>
          <div style={{fontSize:12.5,fontWeight:600,color:'var(--ink2)',marginBottom:12}}>Theo mô hình hoạt động</div>
          {mhArr.map((d,i)=>{
            const max=Math.max(...mhArr.map(x=>x.value),1)
            return(
              <div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:9}}>
                <div style={{fontSize:12,color:'var(--ink2)',minWidth:40}}>{d.name}</div>
                <div style={{flex:1,height:7,background:'var(--bg)',borderRadius:4,overflow:'hidden'}}>
                  <div style={{height:'100%',borderRadius:4,background:COLORS[i%COLORS.length],width:`${d.value/max*100}%`}}/>
                </div>
                <b style={{fontSize:12,minWidth:28,textAlign:'right'}}>{d.value}</b>
                <span style={{fontSize:11,color:'var(--ink3)',minWidth:32}}>{s.total?Math.round(d.value/s.total*100):0}%</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Table */}
      <div style={{background:'#fff',border:'1px solid var(--border)',borderRadius:12,overflow:'hidden'}}>
        <div style={{display:'flex',alignItems:'center',gap:8,padding:'12px 16px',borderBottom:'1px solid var(--border)',flexWrap:'wrap'}}>
          <span style={{fontSize:11,fontWeight:600,color:'var(--ink3)'}}>Lọc:</span>
          <input placeholder="Tên hoặc mã CH..." value={search} onChange={e=>{setSearch(e.target.value);setPg(0)}}
            style={{border:'1px solid var(--border)',background:'var(--bg)',borderRadius:7,padding:'5px 9px',fontSize:12,outline:'none',minWidth:180}}/>
          <select value={filterVung} onChange={e=>{setFilterVung(e.target.value);setPg(0)}}
            style={{border:'1px solid var(--border)',background:'var(--bg)',borderRadius:7,padding:'5px 9px',fontSize:12}}>
            <option value="">Tất cả vùng</option>
            {['Vùng 1','Vùng 2','Vùng 3','Vùng 4'].map(v=><option key={v} value={v}>{v}</option>)}
          </select>
          <span style={{fontSize:11,color:'var(--ink3)'}}>{filtered.length} / {rows.length} cửa hàng</span>
          <div style={{marginLeft:'auto',display:'flex',gap:6}}>
            <button onClick={()=>window.open(SHEET_URL,'_blank')} style={{padding:'5px 11px',borderRadius:7,border:'1px solid var(--border)',background:'var(--card)',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>📊 Mở Sheet</button>
            <button onClick={exportExcel} style={{padding:'5px 11px',borderRadius:7,border:'none',background:'var(--teal)',color:'#fff',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>⬇ Tải Excel</button>
          </div>
        </div>

        {isLoading ? <div style={{textAlign:'center',padding:40,color:'var(--ink3)'}}>Đang tải dữ liệu...</div> : (
          <div style={{overflowX:'auto',maxHeight:520,overflowY:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead style={{position:'sticky',top:0,zIndex:10}}>
                <tr>
                  {COLS.map((col,i)=>(
                    <th key={col.k} onClick={()=>col.sort&&(sortCol===i?setSortDir(d=>d*-1):(setSortCol(i),setSortDir(1)))}
                      style={{padding:'9px 10px',background:'var(--bg)',borderBottom:'2px solid var(--border)',fontWeight:600,fontSize:10.5,color:'var(--ink3)',textTransform:'uppercase',letterSpacing:'.05em',whiteSpace:'nowrap',cursor:col.sort?'pointer':'default',textAlign:'left'}}>
                      {col.l}{col.sort&&<span style={{marginLeft:3,opacity:.5,fontSize:10}}>{sortCol===i?(sortDir===1?'▲':'▼'):'⇅'}</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pgRows.map((r,idx)=>{
                  const globalIdx=pg*PAGE_SIZE+idx
                  return(
                    <tr key={r.maCH||idx} style={{borderBottom:'1px solid var(--border)'}}>
                      {COLS.map(col=>{
                        if(col.k==='stt') return <td key="stt" style={{padding:'8px 10px',color:'var(--ink3)',fontSize:11,textAlign:'center'}}>{globalIdx+1}</td>
                        if(col.k==='maCH') return <td key="maCH" style={{padding:'8px 10px'}}><b>{r.maCH}</b></td>
                        const isEditing=editCell?.rowIdx===globalIdx&&editCell?.field===col.k
                        return(
                          <td key={col.k} style={{padding:isEditing?0:'8px 10px',color:'var(--ink2)',whiteSpace:'nowrap',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',cursor:col.edit?'text':'default'}}
                            onDoubleClick={()=>col.edit&&setEditCell({rowIdx:globalIdx,field:col.k,value:r[col.k]||''})}>
                            {isEditing?(
                              <input autoFocus value={editCell.value} onChange={e=>setEditCell(ec=>({...ec,value:e.target.value}))}
                                onBlur={()=>{handleEdit(globalIdx,col.k,editCell.value);setEditCell(null)}}
                                onKeyDown={e=>{if(e.key==='Enter'){handleEdit(globalIdx,col.k,editCell.value);setEditCell(null)}if(e.key==='Escape')setEditCell(null)}}
                                style={{width:'100%',padding:'7px 10px',border:'2px solid var(--brand)',outline:'none',fontFamily:'inherit',fontSize:12}}/>
                            ):(r[col.k]||'')}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > PAGE_SIZE && (
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderTop:'1px solid var(--border)',background:'var(--bg)'}}>
            <div style={{fontSize:12,color:'var(--ink3)'}}>Hiển thị {pg*PAGE_SIZE+1}–{Math.min((pg+1)*PAGE_SIZE,filtered.length)} trong {filtered.length}</div>
            <div style={{display:'flex',gap:6}}>
              <button disabled={pg===0} onClick={()=>setPg(0)} style={{padding:'5px 10px',borderRadius:7,border:'1px solid var(--border)',background:'#fff',cursor:'pointer'}}>«</button>
              <button disabled={pg===0} onClick={()=>setPg(p=>p-1)} style={{padding:'5px 10px',borderRadius:7,border:'1px solid var(--border)',background:'#fff',cursor:'pointer'}}>‹</button>
              {Array.from({length:Math.min(5,totalPg)},(_,i)=>{
                const start=Math.max(0,Math.min(pg-2,totalPg-5)); const pi=start+i
                return <button key={pi} onClick={()=>setPg(pi)} style={{padding:'5px 10px',borderRadius:7,border:'1px solid var(--border)',background:pi===pg?'var(--brand)':'#fff',color:pi===pg?'#fff':'inherit',cursor:'pointer'}}>{pi+1}</button>
              })}
              <button disabled={pg>=totalPg-1} onClick={()=>setPg(p=>p+1)} style={{padding:'5px 10px',borderRadius:7,border:'1px solid var(--border)',background:'#fff',cursor:'pointer'}}>›</button>
              <button disabled={pg>=totalPg-1} onClick={()=>setPg(totalPg-1)} style={{padding:'5px 10px',borderRadius:7,border:'1px solid var(--border)',background:'#fff',cursor:'pointer'}}>»</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
