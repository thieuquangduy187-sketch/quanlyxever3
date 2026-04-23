import { useEffect, useRef, useState, useMemo } from 'react'
import useIsMobile from '../hooks/useIsMobile'

// ── Build graph data from xe rows ─────────────────────────────────────────────
function buildGraphData(xeRows, statsData) {
  if (!xeRows?.length && !statsData) return { nodes: [], edges: [] }

  const nodes = []
  const edges = []
  const nodeMap = {}
  let id = 0

  const addNode = (key, label, group, size = 10, meta = {}) => {
    if (!nodeMap[key]) {
      const n = { id: String(id++), key, label, group, size, ...meta }
      nodes.push(n)
      nodeMap[key] = n
    }
    return nodeMap[key]
  }

  const addEdge = (a, b) => {
    if (nodeMap[a] && nodeMap[b]) {
      edges.push({ sourceKey: a, targetKey: b })
    }
  }

  if (xeRows?.length) {
    // Build from actual xe data
    const mienMap = {}, loaiXeMap = {}, loaiThungMap = {}, cuaHangMap = {}

    xeRows.forEach(xe => {
      const mien      = xe.mien      || 'Không xác định'
      const loaiXe    = xe.loaiXe    || 'Khác'
      const loaiThung = xe.loaiThung || 'Khác'
      const cuaHang   = xe.cuaHang   || 'Khác'

      mienMap[mien]           = (mienMap[mien] || 0) + 1
      loaiXeMap[loaiXe]       = (loaiXeMap[loaiXe] || 0) + 1
      loaiThungMap[loaiThung] = (loaiThungMap[loaiThung] || 0) + 1
      cuaHangMap[cuaHang]     = (cuaHangMap[cuaHang] || 0) + 1
    })

    // Center node
    addNode('root', 'Đội xe HSG', 'root', 28)

    // Miền nodes
    Object.entries(mienMap).forEach(([m, cnt]) => {
      addNode(`mien:${m}`, m, 'mien', 14 + Math.sqrt(cnt) * 1.5, { count: cnt })
      addEdge('root', `mien:${m}`)
    })

    // Loại xe nodes
    Object.entries(loaiXeMap).slice(0, 12).forEach(([lx, cnt]) => {
      addNode(`lx:${lx}`, lx, 'loaiXe', 10 + Math.sqrt(cnt), { count: cnt })
    })

    // Loại thùng nodes
    Object.entries(loaiThungMap).slice(0, 8).forEach(([lt, cnt]) => {
      addNode(`lt:${lt}`, lt.length > 20 ? lt.slice(0, 20) + '…' : lt, 'loaiThung', 10 + Math.sqrt(cnt), { count: cnt })
    })

    // Top cửa hàng nodes (top 15 by count)
    Object.entries(cuaHangMap)
      .sort((a, b) => b[1] - a[1]).slice(0, 15)
      .forEach(([ch, cnt]) => {
        addNode(`ch:${ch}`, ch, 'cuaHang', 8 + Math.sqrt(cnt), { count: cnt })
      })

    // Connect xe to groups
    xeRows.forEach(xe => {
      const mKey  = `mien:${xe.mien || 'Không xác định'}`
      const lxKey = `lx:${xe.loaiXe || 'Khác'}`
      const ltKey = `lt:${xe.loaiThung || 'Khác'}`
      const chKey = `ch:${xe.cuaHang || 'Khác'}`

      // mien → loaiXe
      const edgeKey1 = `${mKey}|${lxKey}`
      if (!edges.find(e => e.sourceKey===mKey && e.targetKey===lxKey) &&
          !edges.find(e => e.sourceKey===lxKey && e.targetKey===mKey)) {
        addEdge(mKey, lxKey)
      }

      // loaiXe → loaiThung
      if (!edges.find(e => (e.sourceKey===lxKey&&e.targetKey===ltKey)||(e.sourceKey===ltKey&&e.targetKey===lxKey))) {
        addEdge(lxKey, ltKey)
      }

      // loaiThung → cuaHang (sample, not all)
      if (Math.random() < 0.15) {
        if (!edges.find(e => (e.sourceKey===ltKey&&e.targetKey===chKey)||(e.sourceKey===chKey&&e.targetKey===ltKey))) {
          addEdge(ltKey, chKey)
        }
      }
    })

  } else if (statsData) {
    // Fallback: use stats only
    addNode('root', 'Đội xe HSG', 'root', 28)
    const xs = statsData.xeTai?.stats || {}
    Object.entries(xs.byMien || {}).forEach(([m, cnt]) => {
      addNode(`m:${m}`, m, 'mien', 12 + Math.sqrt(cnt) * 1.5, { count: cnt })
      addEdge('root', `m:${m}`)
    })
    Object.entries(xs.byLoaiXe || {}).slice(0,10).forEach(([lx, cnt]) => {
      addNode(`lx:${lx}`, lx, 'loaiXe', 9 + Math.sqrt(cnt), { count: cnt })
    })
    Object.entries(xs.byLoaiThung || {}).forEach(([lt, cnt]) => {
      addNode(`lt:${lt}`, lt.slice(0, 20), 'loaiThung', 9 + Math.sqrt(cnt), { count: cnt })
    })
  }

  // Resolve edges to node refs
  const resolvedEdges = edges
    .map(e => ({ source: nodeMap[e.sourceKey], target: nodeMap[e.targetKey] }))
    .filter(e => e.source && e.target)

  // Count degree
  nodes.forEach(n => {
    n.degree = resolvedEdges.filter(e => e.source.key===n.key || e.target.key===n.key).length
  })

  return { nodes, edges: resolvedEdges }
}

// ── Colors ────────────────────────────────────────────────────────────────────
const COLORS = {
  root:      '#D4420A',
  mien:      '#60a5fa',
  loaiXe:    '#a78bfa',
  loaiThung: '#34d399',
  cuaHang:   '#fbbf24',
}

const GROUP_LABELS = {
  root: 'Trung tâm', mien: 'Miền', loaiXe: 'Loại xe',
  loaiThung: 'Loại thùng', cuaHang: 'Cửa hàng',
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function PageGraph({ data, rowsLoaded }) {
  const canvasRef   = useRef(null)
  const simRef      = useRef(null)
  const rafRef      = useRef(null)
  const isMobile    = useIsMobile()

  const [hovered,  setHovered]  = useState(null)
  const [selected, setSelected] = useState(null)
  const [search,   setSearch]   = useState('')
  const [tooltip,  setTooltip]  = useState({ show: false, x: 0, y: 0 })

  const xeRows = data?.xeTai?.rows || []
  const { nodes, edges } = useMemo(
    () => buildGraphData(xeRows, data),
    [xeRows.length, !!data]
  )

  // Physics simulation ref
  const stateRef = useRef({
    nodes: [], edges: [], cam: { x: 0, y: 0, zoom: 1 },
    alpha: 1, hoveredNode: null, selectedNode: null,
    searchQuery: '', W: 800, H: 600,
    isDragging: false, dragNode: null,
    isPanning: false, panStart: {x:0,y:0}, panCamStart: {x:0,y:0},
    mouseDownPos: {x:0,y:0},
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !nodes.length) return

    const ctx = canvas.getContext('2d')
    const S   = stateRef.current
    const dpr = window.devicePixelRatio || 1

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect()
      S.W = rect.width; S.H = rect.height
      canvas.width  = S.W * dpr; canvas.height = S.H * dpr
      canvas.style.width = S.W + 'px'; canvas.style.height = S.H + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    // Init node positions
    S.nodes = nodes.map(n => ({
      ...n,
      x: S.W/2 + (Math.random()-.5)*400,
      y: S.H/2 + (Math.random()-.5)*300,
      vx: 0, vy: 0, fx: null, fy: null,
    }))
    S.edges = edges.map(e => ({
      source: S.nodes.find(n => n.key === e.source.key),
      target: S.nodes.find(n => n.key === e.target.key),
    })).filter(e => e.source && e.target)

    S.cam = { x: 0, y: 0, zoom: 1 }
    S.alpha = 1

    // Rebuild nodeMap for O(1) lookup
    const nodeMap = {}
    S.nodes.forEach(n => nodeMap[n.key] = n)

    function toScreen(wx, wy) { return { x: wx*S.cam.zoom+S.cam.x, y: wy*S.cam.zoom+S.cam.y } }
    function toWorld(sx, sy)  { return { x: (sx-S.cam.x)/S.cam.zoom, y: (sy-S.cam.y)/S.cam.zoom } }

    function simulate() {
      if (S.alpha < 0.001) return
      S.alpha *= 0.985

      // Repulsion
      for (let i = 0; i < S.nodes.length; i++) {
        for (let j = i+1; j < S.nodes.length; j++) {
          const a = S.nodes[i], b = S.nodes[j]
          const dx = b.x-a.x, dy = b.y-a.y
          const d2 = dx*dx+dy*dy+1
          const d  = Math.sqrt(d2)
          const f  = 3000 / d2
          a.vx -= f*dx/d; a.vy -= f*dy/d
          b.vx += f*dx/d; b.vy += f*dy/d
        }
      }

      // Link attraction
      S.edges.forEach(({ source:s, target:t }) => {
        const dx=t.x-s.x, dy=t.y-s.y
        const d=Math.sqrt(dx*dx+dy*dy)||1
        const f=(d-90)*0.25
        s.vx+=f*dx/d; s.vy+=f*dy/d
        t.vx-=f*dx/d; t.vy-=f*dy/d
      })

      // Center gravity
      S.nodes.forEach(n => {
        n.vx += (S.W/2 - n.x) * 0.025
        n.vy += (S.H/2 - n.y) * 0.025
        if (n.fx!==null) { n.x=n.fx; n.y=n.fy; return }
        n.vx *= 0.72; n.vy *= 0.72
        n.x  += n.vx * S.alpha
        n.y  += n.vy * S.alpha
      })
    }

    function getNodeAt(sx, sy) {
      const {x:wx,y:wy} = toWorld(sx,sy)
      let closest=null, minD=Infinity
      S.nodes.forEach(n => {
        const r = (n.size*0.45 + n.degree*0.5)
        const d = Math.sqrt((wx-n.x)**2+(wy-n.y)**2)
        if (d < r*2.5+10 && d < minD) { minD=d; closest=n }
      })
      return closest
    }

    function draw() {
      ctx.clearRect(0, 0, S.W, S.H)

      // BG
      const bg = ctx.createRadialGradient(S.W/2,S.H/2,0,S.W/2,S.H/2,Math.max(S.W,S.H)*0.7)
      bg.addColorStop(0,'#252528'); bg.addColorStop(1,'#111113')
      ctx.fillStyle=bg; ctx.fillRect(0,0,S.W,S.H)

      const sq = S.searchQuery.toLowerCase()

      // Edges
      S.edges.forEach(({ source:s, target:t }) => {
        const sp=toScreen(s.x,s.y), tp=toScreen(t.x,t.y)
        const hiH = S.hoveredNode&&(s===S.hoveredNode||t===S.hoveredNode)
        const hiS = S.selectedNode&&(s===S.selectedNode||t===S.selectedNode)
        ctx.beginPath(); ctx.moveTo(sp.x,sp.y); ctx.lineTo(tp.x,tp.y)
        ctx.strokeStyle = hiS?'rgba(255,255,255,.4)':hiH?'rgba(255,255,255,.2)':'rgba(255,255,255,.05)'
        ctx.lineWidth = hiS?1.5:hiH?1:.6
        ctx.stroke()
      })

      // Nodes
      S.nodes.forEach(n => {
        const {x,y} = toScreen(n.x,n.y)
        const r = (n.size*0.5 + n.degree*0.6) * S.cam.zoom
        const isH = n===S.hoveredNode, isS = n===S.selectedNode
        const color = COLORS[n.group]||'#aaa'
        const matchSq = sq && n.label.toLowerCase().includes(sq)

        ctx.globalAlpha = sq ? (matchSq?1:0.12) : 1

        // Glow
        if (isH||isS||matchSq) {
          const gl=ctx.createRadialGradient(x,y,0,x,y,r*4)
          gl.addColorStop(0,color+'44'); gl.addColorStop(1,'transparent')
          ctx.beginPath(); ctx.arc(x,y,r*4,0,Math.PI*2)
          ctx.fillStyle=gl; ctx.fill()
        }

        // Selected ring
        if (isS) {
          ctx.beginPath(); ctx.arc(x,y,r+4,0,Math.PI*2)
          ctx.strokeStyle=color; ctx.lineWidth=2; ctx.stroke()
        }

        // Node body
        const gr=ctx.createRadialGradient(x-r*.3,y-r*.3,0,x,y,r*1.3)
        gr.addColorStop(0,'#fff'); gr.addColorStop(.45,color); gr.addColorStop(1,color+'99')
        ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2)
        ctx.fillStyle=isH||isS?'#fff':matchSq?color:gr; ctx.fill()
        ctx.globalAlpha=1

        // Label
        if (S.cam.zoom > 0.3) {
          const lAlpha = sq?(matchSq?1:0.08):(isH||isS?1:Math.min(1,(S.cam.zoom-.25)*3)*.75)
          ctx.globalAlpha = lAlpha
          ctx.font = `${isH||isS?600:400} ${Math.max(9,11*S.cam.zoom)}px -apple-system,sans-serif`
          ctx.fillStyle = isH||isS?'#fff':'#ccc'
          ctx.textAlign='center'; ctx.textBaseline='top'
          ctx.shadowColor='rgba(0,0,0,.9)'; ctx.shadowBlur=5
          ctx.fillText(n.label, x, y+r+3*S.cam.zoom)
          if (n.count) ctx.fillText(n.count+' xe', x, y+r+(3+12)*S.cam.zoom)
          ctx.shadowBlur=0; ctx.globalAlpha=1
        }
      })
    }

    function loop() {
      simulate(); draw()
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    // ── Events ────────────────────────────────────────────────────────────────
    function onMouseMove(e) {
      const rect=canvas.getBoundingClientRect()
      const mx=e.clientX-rect.left, my=e.clientY-rect.top

      if (S.isPanning && !S.dragNode) {
        S.cam.x = S.panCamStart.x+(mx-S.panStart.x)
        S.cam.y = S.panCamStart.y+(my-S.panStart.y)
        return
      }
      if (S.dragNode) {
        const {x:wx,y:wy}=toWorld(mx,my)
        S.dragNode.fx=wx; S.dragNode.fy=wy
        S.dragNode.x=wx; S.dragNode.y=wy
        S.alpha=Math.max(S.alpha,.3); return
      }

      const node=getNodeAt(mx,my)
      S.hoveredNode=node
      canvas.style.cursor=node?'pointer':S.isPanning?'grabbing':'grab'

      if (node) {
        setTooltip({ show:true, x:mx+14, y:my-10 })
        setHovered(node)
      } else {
        setTooltip({ show:false, x:0, y:0 })
        setHovered(null)
      }
    }

    function onMouseDown(e) {
      const rect=canvas.getBoundingClientRect()
      const mx=e.clientX-rect.left, my=e.clientY-rect.top
      const node=getNodeAt(mx,my)
      S.mouseDownPos={x:mx,y:my}
      if (node) { S.dragNode=node; S.alpha=Math.max(S.alpha,.5) }
      else { S.isPanning=true; S.panStart={x:mx,y:my}; S.panCamStart={...S.cam} }
    }

    function onMouseUp(e) {
      const rect=canvas.getBoundingClientRect()
      const mx=e.clientX-rect.left, my=e.clientY-rect.top
      const dx=mx-S.mouseDownPos.x, dy=my-S.mouseDownPos.y
      const moved=Math.sqrt(dx*dx+dy*dy)

      if (S.dragNode && moved<5) {
        const nd=S.dragNode
        if (S.selectedNode===nd) {
          S.selectedNode=null; setSelected(null)
        } else {
          S.selectedNode=nd; setSelected({...nd})
        }
      }
      if (S.dragNode) { S.dragNode.fx=null; S.dragNode.fy=null }
      S.dragNode=null; S.isPanning=false
    }

    function onWheel(e) {
      e.preventDefault()
      const rect=canvas.getBoundingClientRect()
      const mx=e.clientX-rect.left, my=e.clientY-rect.top
      const f=e.deltaY>0?.88:1.12
      const nz=Math.max(.1,Math.min(4,S.cam.zoom*f))
      S.cam.x=mx-(mx-S.cam.x)*(nz/S.cam.zoom)
      S.cam.y=my-(my-S.cam.y)*(nz/S.cam.zoom)
      S.cam.zoom=nz
    }

    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mousedown', onMouseDown)
    canvas.addEventListener('mouseup', onMouseUp)
    canvas.addEventListener('wheel', onWheel, { passive:false })

    // Store refs for controls
    simRef.current = {
      fitAll: () => {
        const xs=S.nodes.map(n=>n.x), ys=S.nodes.map(n=>n.y)
        const minX=Math.min(...xs),maxX=Math.max(...xs)
        const minY=Math.min(...ys),maxY=Math.max(...ys)
        const z=Math.min((S.W-80)/(maxX-minX+1),(S.H-80)/(maxY-minY+1),2)
        S.cam.zoom=z; S.cam.x=S.W/2-(minX+maxX)/2*z; S.cam.y=S.H/2-(minY+maxY)/2*z
      },
      zoomIn:  () => { S.cam.zoom=Math.min(4,S.cam.zoom*1.3) },
      zoomOut: () => { S.cam.zoom=Math.max(.1,S.cam.zoom/1.3) },
      shuffle: () => {
        S.nodes.forEach(n => {
          n.x=S.W/2+(Math.random()-.5)*400; n.y=S.H/2+(Math.random()-.5)*300
          n.vx=0; n.vy=0; n.fx=null; n.fy=null
        })
        S.alpha=1
      },
      setSearch: q => { S.searchQuery=q },
      focusNode: key => {
        const n=S.nodes.find(nd=>nd.key===key)
        if (!n) return
        S.selectedNode=n; setSelected({...n})
        S.cam.x=S.W/2-n.x*S.cam.zoom; S.cam.y=S.H/2-n.y*S.cam.zoom
      }
    }

    return () => {
      cancelAnimationFrame(rafRef.current)
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mousedown', onMouseDown)
      canvas.removeEventListener('mouseup', onMouseUp)
      canvas.removeEventListener('wheel', onWheel)
      window.removeEventListener('resize', resize)
    }
  }, [nodes.length])

  // Sync search to sim
  useEffect(() => {
    if (simRef.current) simRef.current.setSearch(search)
  }, [search])

  // Connected nodes for panel
  const connectedNodes = useMemo(() => {
    if (!selected) return []
    return edges
      .filter(e => e.source.key===selected.key || e.target.key===selected.key)
      .map(e => e.source.key===selected.key ? e.target : e.source)
  }, [selected, edges])

  if (!nodes.length) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
      height:'60vh', color:'var(--ink3)', flexDirection:'column', gap:12 }}>
      <div style={{ fontSize:40 }}>🕸️</div>
      <div style={{ fontSize:14 }}>Đang tải dữ liệu để vẽ sơ đồ...</div>
      <div style={{ fontSize:12, color:'var(--ink3)' }}>Vào tab Xe tải trước để load data</div>
    </div>
  )

  return (
    <div style={{ position:'relative', height: isMobile ? 'calc(100vh - 110px)' : 'calc(100vh - 74px)',
      borderRadius:12, overflow:'hidden', background:'#111113' }}>

      <canvas ref={canvasRef} style={{ display:'block' }} />

      {/* Search */}
      <div style={{ position:'absolute', top:16, left:'50%', transform:'translateX(-50%)',
        display:'flex', alignItems:'center', gap:0 }}>
        <span style={{ position:'absolute', left:12, color:'rgba(255,255,255,.35)', fontSize:13, zIndex:1 }}>⌕</span>
        <input value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => {
            if (e.key==='Enter'&&search&&simRef.current) {
              const m=nodes.find(n=>n.label.toLowerCase().includes(search.toLowerCase()))
              if (m) simRef.current.focusNode(m.key)
            }
            if (e.key==='Escape') setSearch('')
          }}
          placeholder="Tìm kiếm node..."
          style={{ paddingLeft:34, paddingRight:14, paddingTop:8, paddingBottom:8,
            background:'rgba(40,40,40,.92)', border:'1px solid rgba(255,255,255,.12)',
            borderRadius:10, color:'#e0e0e0', fontSize:13, outline:'none',
            width: isMobile ? 200 : 240, backdropFilter:'blur(8px)',
            fontFamily:'inherit' }}
        />
      </div>

      {/* Tooltip */}
      {tooltip.show && hovered && (
        <div style={{ position:'absolute', left:tooltip.x, top:tooltip.y, pointerEvents:'none',
          background:'rgba(18,18,20,0.97)', border:'1px solid rgba(255,255,255,.15)',
          borderRadius:9, padding:'9px 13px', color:'#e8e8e8', fontSize:12.5,
          maxWidth:200, backdropFilter:'blur(10px)', boxShadow:'0 8px 30px rgba(0,0,0,.5)',
          zIndex:10 }}>
          <div style={{ fontWeight:600, color:'#fff', marginBottom:3 }}>{hovered.label}</div>
          <div style={{ color:'rgba(255,255,255,.45)', fontSize:11.5 }}>
            {hovered.degree} kết nối · {GROUP_LABELS[hovered.group]||hovered.group}
            {hovered.count ? ` · ${hovered.count} xe` : ''}
          </div>
        </div>
      )}

      {/* Controls */}
      <div style={{ position:'absolute', bottom:20, right: selected && !isMobile ? 280 : 20,
        display:'flex', flexDirection:'column', gap:6, transition:'right .25s' }}>
        {[
          { icon:'+', fn:()=>simRef.current?.zoomIn(), tip:'Zoom in' },
          { icon:'−', fn:()=>simRef.current?.zoomOut(), tip:'Zoom out' },
          { icon:'⊡', fn:()=>simRef.current?.fitAll(), tip:'Fit screen' },
          { icon:'⟳', fn:()=>simRef.current?.shuffle(), tip:'Shuffle' },
        ].map(b => (
          <button key={b.icon} onClick={b.fn} title={b.tip}
            style={{ width:34, height:34, borderRadius:8,
              background:'rgba(40,40,40,.9)', border:'1px solid rgba(255,255,255,.1)',
              color:'rgba(255,255,255,.7)', fontSize:16, cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center',
              backdropFilter:'blur(8px)' }}>
            {b.icon}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div style={{ position:'absolute', bottom:20, left:16,
        color:'rgba(255,255,255,.25)', fontSize:11, lineHeight:1.8, pointerEvents:'none' }}>
        {nodes.length} nodes · {edges.length} kết nối
      </div>

      {/* Legend */}
      <div style={{ position:'absolute', top:16, left:16,
        background:'rgba(18,18,20,0.92)', border:'1px solid rgba(255,255,255,.08)',
        borderRadius:9, padding:'10px 13px', backdropFilter:'blur(8px)' }}>
        {Object.entries(GROUP_LABELS).map(([k, label]) => (
          <div key={k} style={{ display:'flex', alignItems:'center', gap:7,
            marginBottom:5, fontSize:11, color:'rgba(255,255,255,.55)' }}>
            <div style={{ width:8, height:8, borderRadius:'50%',
              background:COLORS[k]||'#aaa', flexShrink:0 }} />
            {label}
          </div>
        ))}
      </div>

      {/* Detail panel */}
      <div style={{
        position:'absolute', right:0, top:0, bottom:0, width: isMobile ? '100%' : 260,
        background:'rgba(22,22,24,.97)', borderLeft:'1px solid rgba(255,255,255,.08)',
        padding:'20px 18px', color:'#d0d0d0', fontSize:13, overflowY:'auto',
        transform: selected ? 'translateX(0)' : 'translateX(100%)',
        transition:'transform .25s cubic-bezier(.4,0,.2,1)',
      }}>
        <button onClick={() => { setSelected(null); stateRef.current.selectedNode=null }}
          style={{ position:'absolute', top:14, right:14, width:28, height:28, borderRadius:6,
            background:'rgba(255,255,255,.06)', border:'none', color:'rgba(255,255,255,.4)',
            cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>
          ✕
        </button>

        {selected && <>
          <div style={{ fontSize:15, fontWeight:700, color:'#fff', marginBottom:6, paddingRight:30 }}>
            {selected.label}
          </div>
          <div style={{ display:'inline-block', background:'rgba(255,255,255,.07)',
            borderRadius:4, padding:'2px 8px', fontSize:11, marginBottom:16,
            color: COLORS[selected.group] || '#aaa' }}>
            {GROUP_LABELS[selected.group] || selected.group}
          </div>
          {selected.count && (
            <div style={{ background:'rgba(255,255,255,.04)', borderRadius:8,
              padding:'10px 12px', marginBottom:14, fontSize:12.5 }}>
              <span style={{ color:'rgba(255,255,255,.4)' }}>Số xe: </span>
              <span style={{ color:'#fff', fontWeight:600 }}>{selected.count}</span>
            </div>
          )}
          <div style={{ fontSize:10.5, fontWeight:700, textTransform:'uppercase',
            letterSpacing:'.08em', color:'rgba(255,255,255,.3)', marginBottom:10 }}>
            {connectedNodes.length} kết nối
          </div>
          {connectedNodes.map((n, i) => (
            <div key={i}
              onClick={() => { setSelected({...n}); simRef.current?.focusNode(n.key) }}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 0',
                borderBottom:'1px solid rgba(255,255,255,.05)', cursor:'pointer',
                color:'rgba(255,255,255,.65)', fontSize:12.5 }}>
              <div style={{ width:7, height:7, borderRadius:'50%',
                background:COLORS[n.group]||'#aaa', flexShrink:0 }} />
              {n.label}
              {n.count && <span style={{ marginLeft:'auto', fontSize:11,
                color:'rgba(255,255,255,.3)' }}>{n.count}</span>}
            </div>
          ))}
        </>}
      </div>
    </div>
  )
}
