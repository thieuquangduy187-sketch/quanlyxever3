// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📁 FRONTEND — quanlyxever3/src/pages/PageAdminUsers.jsx
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { useState, useEffect, useCallback } from 'react'
import useIsMobile from '../hooks/useIsMobile'

const API = import.meta.env.VITE_API_URL || 'https://hsg-backend.onrender.com'
const tok = () => localStorage.getItem('hsg_token') || ''

const ROLE_LABEL = { admin: '👑 Admin', viewer: '👁 Viewer', xe: '🚛 Xe' }
const ROLE_COLOR = { admin: '#E63200', viewer: '#0055CC', xe: '#1A7F37' }
const PAGE_LABELS = {
  overview: 'Tổng quan', xe_tai: 'Xe tải', oto_con: 'Ô tô con',
  nhat_trinh: 'Nhật trình tháng', nhat_trinh_ngay: 'Nhật trình ngày',
  gia_dau: 'Giá dầu', gps: 'Giám sát GPS', chuyen_doi: 'Chuyển đổi HSG',
  bao_cao_nhat_trinh: 'Báo cáo nhật trình', hieu_qua: 'Hiệu quả xe',
  analyze: 'Phân tích AI', import: 'Import dữ liệu',
}
const PERM_GROUPS = [
  { label: 'Tổng quan', perms: ['view_overview'] },
  { label: 'Xe tải', perms: ['view_xe_tai', 'edit_xe_tai'] },
  { label: 'Ô tô con', perms: ['view_oto_con'] },
  { label: 'Nhật trình', perms: ['view_nhat_trinh', 'submit_nhat_trinh'] },
  { label: 'Giá dầu', perms: ['view_gia_dau', 'edit_gia_dau'] },
  { label: 'GPS', perms: ['view_gps'] },
  { label: 'Chuyển đổi', perms: ['view_chuyen_doi', 'edit_chuyen_doi'] },
  { label: 'Báo cáo', perms: ['view_bao_cao', 'view_hieu_qua', 'edit_hieu_qua', 'view_analyze'] },
  { label: 'Hệ thống', perms: ['admin_users'] },
]
const PERM_LABEL = {
  view_overview: 'Xem', view_xe_tai: 'Xem', edit_xe_tai: 'Sửa',
  view_oto_con: 'Xem', view_nhat_trinh: 'Xem', submit_nhat_trinh: 'Nộp nhật trình',
  view_gia_dau: 'Xem', edit_gia_dau: 'Sửa',
  view_gps: 'Xem', view_chuyen_doi: 'Xem', edit_chuyen_doi: 'Batch Update',
  view_bao_cao: 'Xem báo cáo', view_hieu_qua: 'Xem hiệu quả', edit_hieu_qua: 'Sửa hiệu quả',
  view_analyze: 'Phân tích AI', admin_users: 'Quản lý Users',
}

// ── Helpers ───────────────────────────────────────────────
const h = { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` }
const authH = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` })

function timeSince(d) {
  if (!d) return '—'
  const s = Math.floor((Date.now() - new Date(d)) / 1000)
  if (s < 60) return 'vừa xong'
  if (s < 3600) return `${Math.floor(s/60)} phút trước`
  if (s < 86400) return `${Math.floor(s/3600)} giờ trước`
  return `${Math.floor(s/86400)} ngày trước`
}
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
}

// ── Badge ─────────────────────────────────────────────────
function Badge({ text, color, bg }) {
  return (
    <span style={{
      display:'inline-block', padding:'2px 8px', borderRadius:20,
      fontSize:11, fontWeight:600, color, background: bg,
    }}>{text}</span>
  )
}

// ── Status badge ──────────────────────────────────────────
function StatusBadge({ user }) {
  if (!user.active) return <Badge text="Vô hiệu hóa" color="var(--apple-red)" bg="var(--red-l)" />
  if (user.isLockedNow) return <Badge text="Tạm khóa" color="var(--apple-orange)" bg="var(--amber-l)" />
  return <Badge text="Hoạt động" color="var(--apple-green)" bg="var(--green-l)" />
}

// ── Permission Matrix component ───────────────────────────
function PermMatrix({ permissions, allowedPages, allPerms, allPages, onChange }) {
  const perms = permissions || []
  const pages = allowedPages || []

  const togglePerm = (p) => {
    const next = perms.includes(p) ? perms.filter(x => x !== p) : [...perms, p]
    onChange({ permissions: next, allowedPages: pages })
  }
  const togglePage = (p) => {
    const next = pages.includes(p) ? pages.filter(x => x !== p) : [...pages, p]
    onChange({ permissions: perms, allowedPages: next })
  }

  return (
    <div>
      {/* Permissions */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink2)', marginBottom: 8, textTransform:'uppercase', letterSpacing:'0.06em' }}>
          Quyền chức năng
        </div>
        {PERM_GROUPS.map(g => (
          <div key={g.label} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 5, fontWeight: 600 }}>{g.label}</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap: 6 }}>
              {g.perms.filter(p => allPerms.includes(p)).map(p => {
                const on = perms.includes(p)
                return (
                  <button key={p} onClick={() => togglePerm(p)} style={{
                    padding: '4px 10px', borderRadius: 16, fontSize: 12,
                    cursor: 'pointer', fontWeight: on ? 600 : 400,
                    background: on ? 'var(--brand)' : 'var(--bg-secondary)',
                    color: on ? '#fff' : 'var(--ink2)',
                    border: `1px solid ${on ? 'var(--brand)' : 'var(--sep)'}`,
                    transition: 'all 0.12s',
                  }}>
                    {on ? '✓ ' : ''}{PERM_LABEL[p] || p}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Pages */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink2)', marginBottom: 8, textTransform:'uppercase', letterSpacing:'0.06em' }}>
          Trang được phép truy cập
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap: 6 }}>
          {allPages.map(p => {
            const on = pages.includes(p)
            return (
              <button key={p} onClick={() => togglePage(p)} style={{
                padding: '4px 10px', borderRadius: 16, fontSize: 12,
                cursor: 'pointer', fontWeight: on ? 600 : 400,
                background: on ? 'var(--apple-blue)' : 'var(--bg-secondary)',
                color: on ? '#fff' : 'var(--ink2)',
                border: `1px solid ${on ? 'var(--apple-blue)' : 'var(--sep)'}`,
                transition: 'all 0.12s',
              }}>
                {on ? '✓ ' : ''}{PAGE_LABELS[p] || p}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── User Detail / Edit Modal ──────────────────────────────
function UserModal({ user, meta, onClose, onSaved, mode }) {
  const isNew = mode === 'create'
  const [form, setForm] = useState({
    username:     user?.username || '',
    password:     '',
    displayName:  user?.displayName || '',
    role:         user?.role || 'viewer',
    permissions:  user?.permissions || null,
    allowedPages: user?.allowedPages || null,
    active:       user?.active ?? true,
  })
  const [useCustomPerms, setUseCustomPerms] = useState(
    !isNew && (user?.permissions !== null || user?.allowedPages !== null)
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // When role changes, reset permissions to null (use default)
  const handleRoleChange = (role) => {
    setForm(f => ({ ...f, role, permissions: null, allowedPages: null }))
    setUseCustomPerms(false)
  }

  const effectivePerms = useCustomPerms
    ? (form.permissions || meta?.DEFAULT_PERMISSIONS?.[form.role] || [])
    : (meta?.DEFAULT_PERMISSIONS?.[form.role] || [])
  const effectivePages = useCustomPerms
    ? (form.allowedPages || meta?.DEFAULT_PAGES?.[form.role] || [])
    : (meta?.DEFAULT_PAGES?.[form.role] || [])

  const handleSave = async () => {
    if (!form.displayName.trim()) return setError('Thiếu tên hiển thị.')
    if (isNew && !form.username.trim()) return setError('Thiếu username.')
    if (isNew && form.password.length < 6) return setError('Mật khẩu ≥ 6 ký tự.')

    setLoading(true); setError('')
    try {
      const body = {
        ...form,
        permissions:  useCustomPerms ? effectivePerms : null,
        allowedPages: useCustomPerms ? effectivePages : null,
      }
      if (!isNew) { delete body.username; delete body.password }

      const url  = isNew ? `${API}/api/admin/users` : `${API}/api/admin/users/${user._id}`
      const meth = isNew ? 'POST' : 'PUT'
      const r    = await fetch(url, { method: meth, headers: authH(), body: JSON.stringify(body) })
      const d    = await r.json()
      if (!r.ok) return setError(d.error || 'Lỗi lưu.')
      onSaved(d.user)
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

  const inputS = {
    width: '100%', padding: '8px 12px', borderRadius: 8,
    border: '1px solid var(--sep)', background: 'var(--bg-card)',
    color: 'var(--ink)', fontSize: 13, outline: 'none', boxSizing: 'border-box',
  }
  const labelS = { fontSize: 12, color: 'var(--ink2)', display:'block', marginBottom: 4, fontWeight: 600 }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
      <div style={{
        background:'var(--bg-card)', borderRadius:16, padding:24,
        width:'90%', maxWidth:560, maxHeight:'90vh', overflowY:'auto',
        border:'1px solid var(--sep)'
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <span style={{ fontWeight:700, fontSize:16, color:'var(--ink)' }}>
            {isNew ? '➕ Tạo user mới' : `✏️ ${user.displayName}`}
          </span>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:18, cursor:'pointer', color:'var(--ink3)' }}>✕</button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
          {isNew && (
            <>
              <div>
                <label style={labelS}>Username *</label>
                <input style={inputS} value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  placeholder="vd: nguyen.van.a" />
              </div>
              <div>
                <label style={labelS}>Mật khẩu *</label>
                <input style={inputS} type="password" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Ít nhất 6 ký tự" />
              </div>
            </>
          )}
          <div>
            <label style={labelS}>Tên hiển thị *</label>
            <input style={inputS} value={form.displayName}
              onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} />
          </div>
          <div>
            <label style={labelS}>Role</label>
            <select style={inputS} value={form.role} onChange={e => handleRoleChange(e.target.value)}>
              <option value="admin">👑 Admin</option>
              <option value="viewer">👁 Viewer</option>
              <option value="xe">🚛 Xe (nhật trình)</option>
            </select>
          </div>
        </div>

        {/* Active toggle */}
        {!isNew && (
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, padding:'10px 12px', background:'var(--bg-secondary)', borderRadius:8 }}>
            <span style={{ fontSize:13, color:'var(--ink2)', flex:1 }}>Trạng thái tài khoản</span>
            <button onClick={() => setForm(f => ({ ...f, active: !f.active }))} style={{
              padding:'5px 14px', borderRadius:20, border:'none', cursor:'pointer', fontSize:12, fontWeight:600,
              background: form.active ? 'var(--green-l)' : 'var(--red-l)',
              color: form.active ? 'var(--apple-green)' : 'var(--apple-red)',
            }}>
              {form.active ? '✅ Hoạt động' : '🚫 Vô hiệu hóa'}
            </button>
          </div>
        )}

        {/* Custom permissions */}
        <div style={{ marginBottom:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
            <span style={{ fontSize:13, color:'var(--ink)', flex:1, fontWeight:600 }}>Phân quyền tùy chỉnh</span>
            <button onClick={() => {
              setUseCustomPerms(v => {
                if (!v) setForm(f => ({
                  ...f,
                  permissions:  [...(meta?.DEFAULT_PERMISSIONS?.[form.role] || [])],
                  allowedPages: [...(meta?.DEFAULT_PAGES?.[form.role] || [])],
                }))
                else setForm(f => ({ ...f, permissions: null, allowedPages: null }))
                return !v
              })
            }} style={{
              padding:'5px 14px', borderRadius:20, border:'none', cursor:'pointer', fontSize:12, fontWeight:600,
              background: useCustomPerms ? 'var(--brand-l)' : 'var(--bg-secondary)',
              color: useCustomPerms ? 'var(--brand)' : 'var(--ink3)',
              border: `1px solid ${useCustomPerms ? 'var(--brand)' : 'var(--sep)'}`,
            }}>
              {useCustomPerms ? '✓ Đang tùy chỉnh' : 'Dùng mặc định theo role'}
            </button>
          </div>
          {useCustomPerms && meta ? (
            <PermMatrix
              permissions={effectivePerms}
              allowedPages={effectivePages}
              allPerms={meta.ALL_PERMISSIONS}
              allPages={meta.ALL_PAGES}
              onChange={({ permissions, allowedPages }) =>
                setForm(f => ({ ...f, permissions, allowedPages }))
              }
            />
          ) : (
            <div style={{ padding:'10px 12px', background:'var(--bg-secondary)', borderRadius:8, fontSize:12, color:'var(--ink3)' }}>
              Sử dụng quyền mặc định của role <b style={{ color:'var(--ink)' }}>{form.role}</b>:{' '}
              {(meta?.DEFAULT_PAGES?.[form.role] || []).map(p => PAGE_LABELS[p]).join(', ')}
            </div>
          )}
        </div>

        {error && (
          <div style={{ background:'var(--red-l)', color:'var(--apple-red)', borderRadius:8, padding:'8px 12px', fontSize:13, marginBottom:12 }}>
            ❌ {error}
          </div>
        )}

        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'8px 18px', borderRadius:8, border:'1px solid var(--sep)', background:'none', color:'var(--ink2)', cursor:'pointer' }}>
            Huỷ
          </button>
          <button onClick={handleSave} disabled={loading} style={{
            padding:'8px 18px', borderRadius:8, border:'none',
            background: loading ? 'var(--sep)' : 'var(--brand)',
            color: loading ? 'var(--ink3)' : '#fff',
            fontWeight:600, cursor: loading ? 'default' : 'pointer',
          }}>
            {loading ? 'Đang lưu...' : isNew ? 'Tạo user' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Reset Password Modal ──────────────────────────────────
function ResetPwModal({ user, onClose }) {
  const [pw, setPw] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handle = async () => {
    if (pw.length < 6) return setResult({ err: 'Mật khẩu phải ≥ 6 ký tự.' })
    setLoading(true)
    const r = await fetch(`${API}/api/admin/users/${user._id}/reset-password`, {
      method: 'POST', headers: authH(),
      body: JSON.stringify({ newPassword: pw })
    })
    const d = await r.json()
    setResult(r.ok ? { ok: d.message } : { err: d.error })
    setLoading(false)
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1001 }}>
      <div style={{ background:'var(--bg-card)', borderRadius:14, padding:24, width:360, border:'1px solid var(--sep)' }}>
        <div style={{ fontWeight:700, fontSize:15, marginBottom:14, color:'var(--ink)' }}>
          🔑 Đặt lại mật khẩu — {user.username}
        </div>
        <input
          type="password" placeholder="Mật khẩu mới (≥ 6 ký tự)"
          value={pw} onChange={e => setPw(e.target.value)}
          style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:'1px solid var(--sep)', background:'var(--bg-card)', color:'var(--ink)', fontSize:13, boxSizing:'border-box', marginBottom:10 }}
        />
        {result && (
          <div style={{ padding:'7px 10px', borderRadius:8, marginBottom:10, fontSize:13,
            background: result.ok ? 'var(--green-l)' : 'var(--red-l)',
            color: result.ok ? 'var(--apple-green)' : 'var(--apple-red)',
          }}>
            {result.ok ? '✅ ' : '❌ '}{result.ok || result.err}
          </div>
        )}
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'7px 16px', borderRadius:8, border:'1px solid var(--sep)', background:'none', color:'var(--ink2)', cursor:'pointer' }}>Đóng</button>
          <button onClick={handle} disabled={loading} style={{ padding:'7px 16px', borderRadius:8, border:'none', background:'var(--apple-orange)', color:'#fff', fontWeight:600, cursor:'pointer' }}>
            {loading ? '...' : 'Đặt lại'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Lock Modal ────────────────────────────────────────────
function LockModal({ user, onClose, onDone }) {
  const isLocked = user.isLockedNow
  const [reason, setReason] = useState(user.lockedReason || '')
  const [duration, setDuration] = useState('60')
  const [loading, setLoading] = useState(false)

  const handle = async () => {
    setLoading(true)
    const r = await fetch(`${API}/api/admin/users/${user._id}/lock`, {
      method: 'POST', headers: authH(),
      body: JSON.stringify({
        lock: !isLocked,
        reason: reason || undefined,
        durationMinutes: duration ? parseInt(duration) : undefined,
      })
    })
    const d = await r.json()
    if (r.ok) { onDone(d.user); onClose() }
    setLoading(false)
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1001 }}>
      <div style={{ background:'var(--bg-card)', borderRadius:14, padding:24, width:380, border:'1px solid var(--sep)' }}>
        <div style={{ fontWeight:700, fontSize:15, marginBottom:14, color:'var(--ink)' }}>
          {isLocked ? '🔓 Mở khóa' : '🔒 Tạm khóa'} — {user.username}
        </div>
        {!isLocked && (
          <>
            <div style={{ marginBottom:10 }}>
              <label style={{ fontSize:12, color:'var(--ink2)', display:'block', marginBottom:4 }}>Lý do khóa</label>
              <input value={reason} onChange={e => setReason(e.target.value)}
                style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:'1px solid var(--sep)', background:'var(--bg-card)', color:'var(--ink)', fontSize:13, boxSizing:'border-box' }}
                placeholder="vd: Vi phạm quy định..." />
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12, color:'var(--ink2)', display:'block', marginBottom:4 }}>Thời hạn</label>
              <select value={duration} onChange={e => setDuration(e.target.value)}
                style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:'1px solid var(--sep)', background:'var(--bg-card)', color:'var(--ink)', fontSize:13 }}>
                <option value="30">30 phút</option>
                <option value="60">1 giờ</option>
                <option value="360">6 giờ</option>
                <option value="1440">1 ngày</option>
                <option value="10080">1 tuần</option>
                <option value="">Vô thời hạn</option>
              </select>
            </div>
          </>
        )}
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'7px 16px', borderRadius:8, border:'1px solid var(--sep)', background:'none', color:'var(--ink2)', cursor:'pointer' }}>Huỷ</button>
          <button onClick={handle} disabled={loading} style={{
            padding:'7px 16px', borderRadius:8, border:'none', fontWeight:600, cursor:'pointer',
            background: isLocked ? 'var(--apple-green)' : 'var(--apple-orange)', color:'#fff',
          }}>
            {loading ? '...' : isLocked ? 'Mở khóa' : 'Khóa tài khoản'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Sessions tab ──────────────────────────────────────────
function SessionsTab() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const r = await fetch(`${API}/api/admin/sessions`, { headers: authH() })
    const d = await r.json()
    setSessions(d.sessions || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const revoke = async (userId, sessionId) => {
    if (!confirm('Thu hồi phiên đăng nhập này?')) return
    await fetch(`${API}/api/admin/sessions/${userId}/${sessionId}`, { method:'DELETE', headers: authH() })
    load()
  }

  const revokeAll = async (userId, username) => {
    if (!confirm(`Thu hồi TẤT CẢ phiên của ${username}?`)) return
    await fetch(`${API}/api/admin/sessions/${userId}`, { method:'DELETE', headers: authH() })
    load()
  }

  if (loading) return <div style={{ padding:40, textAlign:'center', color:'var(--ink3)' }}>Đang tải...</div>

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <span style={{ fontSize:14, fontWeight:600, color:'var(--ink)' }}>
          {sessions.length} phiên đang hoạt động
        </span>
        <button onClick={load} style={{ padding:'6px 12px', borderRadius:8, border:'1px solid var(--sep)', background:'none', color:'var(--ink2)', fontSize:12, cursor:'pointer' }}>
          🔄 Tải lại
        </button>
      </div>
      {sessions.length === 0 ? (
        <div style={{ textAlign:'center', padding:48, color:'var(--ink3)', fontSize:13 }}>Không có phiên nào đang hoạt động</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {sessions.map(s => (
            <div key={String(s.sessionId)} style={{
              background:'var(--bg-secondary)', borderRadius:10, padding:'12px 14px',
              border:'1px solid var(--sep)', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap'
            }}>
              <div style={{ flex:1, minWidth:160 }}>
                <div style={{ fontWeight:600, fontSize:13, color:'var(--ink)', marginBottom:2 }}>
                  {s.displayName}
                  <span style={{ fontSize:11, marginLeft:6, color: ROLE_COLOR[s.role], fontWeight:400 }}>
                    {ROLE_LABEL[s.role]}
                  </span>
                </div>
                <div style={{ fontSize:11, color:'var(--ink3)' }}>@{s.username}</div>
              </div>
              <div style={{ fontSize:12, color:'var(--ink2)', minWidth:100 }}>
                <div>{s.device} · {s.ip || '—'}</div>
                <div style={{ color:'var(--ink3)' }}>Hoạt động {timeSince(s.lastSeenAt)}</div>
              </div>
              <div style={{ fontSize:11, color:'var(--ink3)', minWidth:90 }}>
                Tạo: {fmtDate(s.createdAt)}
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={() => revoke(s.userId, s.sessionId)}
                  style={{ padding:'4px 10px', borderRadius:6, border:'1px solid var(--sep)', background:'none', color:'var(--apple-red)', fontSize:12, cursor:'pointer' }}>
                  Thu hồi
                </button>
                <button onClick={() => revokeAll(s.userId, s.username)}
                  style={{ padding:'4px 10px', borderRadius:6, border:'none', background:'var(--red-l)', color:'var(--apple-red)', fontSize:12, cursor:'pointer', fontWeight:600 }}>
                  Tất cả
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── MAIN PAGE ─────────────────────────────────────────────
export default function PageAdminUsers() {
  const isMobile = useIsMobile()

  const [tab, setTab]           = useState('users') // 'users' | 'sessions'
  const [users, setUsers]       = useState([])
  const [meta, setMeta]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [q, setQ]               = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [editUser, setEditUser] = useState(null)
  const [editMode, setEditMode] = useState('edit') // 'create' | 'edit'
  const [resetUser, setResetUser] = useState(null)
  const [lockUser, setLockUser] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: 200 })
      if (q) params.append('q', q)
      if (filterRole !== 'all') params.append('role', filterRole)
      if (filterStatus !== 'all') params.append('active', filterStatus === 'active' ? 'true' : 'false')
      const r = await fetch(`${API}/api/admin/users?${params}`, { headers: authH() })
      const d = await r.json()
      setUsers(d.users || [])
    } catch {}
    setLoading(false)
  }, [q, filterRole, filterStatus])

  const loadMeta = useCallback(async () => {
    const r = await fetch(`${API}/api/admin/meta`, { headers: authH() })
    const d = await r.json()
    setMeta(d)
  }, [])

  useEffect(() => { loadMeta() }, [])
  useEffect(() => {
    const t = setTimeout(loadUsers, 300)
    return () => clearTimeout(t)
  }, [loadUsers])

  const handleDelete = async (u) => {
    if (!confirm(`Xóa user "${u.username}"? Hành động này không thể hoàn tác.`)) return
    const r = await fetch(`${API}/api/admin/users/${u._id}`, { method:'DELETE', headers: authH() })
    const d = await r.json()
    if (r.ok) { showToast(d.message); loadUsers() }
    else showToast(d.error, 'err')
  }

  const cols_m = ['bienSo', 'username', 'role', 'status']
  const byRole = { admin: [], viewer: [], xe: [] }
  users.forEach(u => byRole[u.role]?.push(u))

  const selS = { padding:'7px 10px', borderRadius:8, border:'1px solid var(--sep)', background:'var(--bg-card)', color:'var(--ink)', fontSize:13, outline:'none' }
  const btnS = (bg, c='#fff') => ({ padding:'7px 14px', borderRadius:8, border:'none', background:bg, color:c, fontSize:12, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' })

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:10, marginBottom:18 }}>
        <div>
          <h2 style={{ margin:0, fontSize:18, fontWeight:700, color:'var(--ink)' }}>👥 Quản lý Users</h2>
          <div style={{ fontSize:12, color:'var(--ink3)', marginTop:2 }}>{users.length} tài khoản</div>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:8, flexWrap:'wrap' }}>
          <button style={btnS('var(--brand)')} onClick={() => { setEditMode('create'); setEditUser({}); }}>
            ➕ Tạo user mới
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:0, marginBottom:18, borderBottom:'2px solid var(--sep)' }}>
        {[{ id:'users', label:'👥 Danh sách user' }, { id:'sessions', label:'🔐 Phiên đăng nhập' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding:'10px 18px', background:'none', border:'none', cursor:'pointer',
            borderBottom: tab === t.id ? '2px solid var(--brand)' : '2px solid transparent',
            color: tab === t.id ? 'var(--brand)' : 'var(--ink2)',
            fontWeight: tab === t.id ? 700 : 400, fontSize:13, marginBottom:-2,
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'sessions' ? <SessionsTab /> : (
        <>
          {/* Filters */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14, alignItems:'center' }}>
            <input
              placeholder="🔍 Tìm username, tên, biển số..."
              value={q} onChange={e => setQ(e.target.value)}
              style={{ ...selS, minWidth:220, flex:1 }}
            />
            <select value={filterRole} onChange={e => setFilterRole(e.target.value)} style={selS}>
              <option value="all">Tất cả role</option>
              <option value="admin">👑 Admin</option>
              <option value="viewer">👁 Viewer</option>
              <option value="xe">🚛 Xe</option>
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={selS}>
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Vô hiệu hóa</option>
            </select>
            <button onClick={loadUsers} style={{ ...btnS('var(--apple-blue)'), padding:'7px 12px' }}>
              🔄
            </button>
          </div>

          {/* Summary cards */}
          <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
            {[
              { label:'Admin', count: byRole.admin.length, color:'#E63200', bg:'var(--red-l)' },
              { label:'Viewer', count: byRole.viewer.length, color:'var(--apple-blue)', bg:'var(--teal-l)' },
              { label:'Xe', count: byRole.xe.length, color:'var(--apple-green)', bg:'var(--green-l)' },
              { label:'Tạm khóa', count: users.filter(u => u.isLockedNow).length, color:'var(--apple-orange)', bg:'var(--amber-l)' },
            ].map(s => (
              <div key={s.label} style={{
                flex:'1 0 90px', padding:'10px 14px', borderRadius:10,
                background: s.bg, border:`1px solid ${s.color}33`,
              }}>
                <div style={{ fontSize:11, color: s.color, fontWeight:700 }}>{s.label}</div>
                <div style={{ fontSize:22, fontWeight:700, color: s.color }}>{s.count}</div>
              </div>
            ))}
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ textAlign:'center', padding:48, color:'var(--ink3)' }}>Đang tải...</div>
          ) : users.length === 0 ? (
            <div style={{ textAlign:'center', padding:48, color:'var(--ink3)', fontSize:13 }}>Không có user nào</div>
          ) : (
            <div style={{ borderRadius:12, border:'1px solid var(--sep)', overflow:'hidden' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ background:'var(--bg-secondary)', borderBottom:'1px solid var(--sep)' }}>
                    {['User', 'Role', 'Quyền / Trang', 'Trạng thái', 'Hoạt động', ''].map(h => (
                      <th key={h} style={{ padding:'10px 12px', textAlign:'left', fontSize:11, fontWeight:700, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u._id} style={{
                      borderBottom:'1px solid var(--sep)',
                      background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)',
                    }}>
                      <td style={{ padding:'10px 12px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{
                            width:32, height:32, borderRadius:'50%',
                            background: ROLE_COLOR[u.role] + '22',
                            color: ROLE_COLOR[u.role],
                            display:'flex', alignItems:'center', justifyContent:'center',
                            fontSize:13, fontWeight:700, flexShrink:0,
                          }}>
                            {(u.displayName||u.username)[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight:600, color:'var(--ink)' }}>{u.displayName}</div>
                            <div style={{ fontSize:11, color:'var(--ink3)' }}>@{u.username}</div>
                            {u.bienSo && <div style={{ fontSize:10, color:'var(--ink3)' }}>🚛 {u.bienSo}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding:'10px 12px' }}>
                        <span style={{ color: ROLE_COLOR[u.role], fontWeight:600, fontSize:12 }}>
                          {ROLE_LABEL[u.role]}
                        </span>
                      </td>
                      <td style={{ padding:'10px 12px', maxWidth:220 }}>
                        <div style={{ fontSize:11, color:'var(--ink3)', lineHeight:1.6 }}>
                          {u.permissions?.slice(0,3).map(p => PERM_LABEL[p] || p).join(', ')}
                          {(u.permissions?.length || 0) > 3 && ` +${u.permissions.length - 3} nữa`}
                        </div>
                        <div style={{ fontSize:10, color:'var(--ink3)', marginTop:2 }}>
                          📄 {(u.allowedPages||[]).length} trang
                        </div>
                      </td>
                      <td style={{ padding:'10px 12px' }}>
                        <StatusBadge user={u} />
                        {u.loginAttempts > 0 && u.loginAttempts < 5 && (
                          <div style={{ fontSize:10, color:'var(--apple-orange)', marginTop:3 }}>
                            ⚠️ {u.loginAttempts} lần sai mật khẩu
                          </div>
                        )}
                      </td>
                      <td style={{ padding:'10px 12px', whiteSpace:'nowrap' }}>
                        <div style={{ fontSize:12, color:'var(--ink2)' }}>{timeSince(u.lastActive)}</div>
                        <div style={{ fontSize:10, color:'var(--ink3)' }}>{fmtDate(u.lastLogin)}</div>
                      </td>
                      <td style={{ padding:'10px 12px' }}>
                        <div style={{ display:'flex', gap:4', flexWrap:'wrap', justifyContent:'flex-end' }}>
                          <button onClick={() => { setEditMode('edit'); setEditUser(u) }}
                            style={{ padding:'4px 8px', borderRadius:6, border:'1px solid var(--sep)', background:'none', color:'var(--apple-blue)', fontSize:11, cursor:'pointer' }}>
                            ✏️ Sửa
                          </button>
                          <button onClick={() => setResetUser(u)}
                            style={{ padding:'4px 8px', borderRadius:6, border:'1px solid var(--sep)', background:'none', color:'var(--apple-orange)', fontSize:11, cursor:'pointer' }}>
                            🔑 MK
                          </button>
                          <button onClick={() => setLockUser(u)}
                            style={{ padding:'4px 8px', borderRadius:6, border:'1px solid var(--sep)', background:'none', color: u.isLockedNow ? 'var(--apple-green)' : 'var(--apple-orange)', fontSize:11, cursor:'pointer' }}>
                            {u.isLockedNow ? '🔓' : '🔒'}
                          </button>
                          <button onClick={() => handleDelete(u)}
                            style={{ padding:'4px 8px', borderRadius:6, border:'none', background:'var(--red-l)', color:'var(--apple-red)', fontSize:11, cursor:'pointer' }}>
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {editUser && (
        <UserModal
          user={editMode === 'create' ? null : editUser}
          meta={meta}
          mode={editMode}
          onClose={() => setEditUser(null)}
          onSaved={(u) => {
            setEditUser(null)
            showToast(editMode === 'create' ? `Đã tạo user ${u.username}` : 'Đã lưu thay đổi')
            loadUsers()
          }}
        />
      )}
      {resetUser && <ResetPwModal user={resetUser} onClose={() => setResetUser(null)} />}
      {lockUser && (
        <LockModal
          user={lockUser}
          onClose={() => setLockUser(null)}
          onDone={() => { setLockUser(null); loadUsers() }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position:'fixed', bottom:24, right:24, padding:'12px 18px', borderRadius:10,
          background: toast.type === 'err' ? 'var(--red-l)' : 'var(--bg-card)',
          border: `1px solid ${toast.type === 'err' ? 'var(--apple-red)' : 'var(--sep)'}`,
          color: toast.type === 'err' ? 'var(--apple-red)' : 'var(--ink)',
          fontSize:13, fontWeight:500, zIndex:9999,
          boxShadow:'0 4px 20px rgba(0,0,0,0.15)',
        }}>
          {toast.type === 'err' ? '❌ ' : '✅ '}{toast.msg}
        </div>
      )}
    </div>
  )
}
