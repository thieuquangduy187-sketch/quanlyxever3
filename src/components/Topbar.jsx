const TITLES = { overview:'Tổng quan', xe_tai:'Xe tải', oto_con:'Ô tô con', cua_hang:'Cửa hàng' }

export default function Topbar({ page, refreshing, loadProgress = {} }) {
  const isLoadingRows = Object.values(loadProgress).some(v => v === 'loading')
  return (
    <header style={{ height:54, background:'#fff', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', padding:'0 22px', gap:12, position:'sticky', top:0, zIndex:50 }}>
      <div style={{ fontSize:15, fontWeight:600, flex:1 }}>{TITLES[page] || page}</div>
      {(refreshing || isLoadingRows) && (
        <span style={{ fontSize:11, color:'var(--ink3)', display:'flex', alignItems:'center', gap:5 }}>
          <span style={{ width:10, height:10, border:'2px solid var(--border)', borderTopColor:'var(--brand)', borderRadius:'50%', animation:'spin .65s linear infinite', display:'inline-block' }} />
          {refreshing ? 'Đang làm mới...' : 'Đang tải dữ liệu...'}
        </span>
      )}
      <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:'var(--brand-l)', color:'var(--brand)', fontSize:11, fontWeight:600, padding:'4px 10px', borderRadius:20 }}>
        <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--green)', animation:'pulse 2s infinite' }} />
        Live
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </header>
  )
}
