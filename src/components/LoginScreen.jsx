import { useState } from 'react'

const LOGO_URL = 'https://lh3.googleusercontent.com/d/1gnI72gZVm9cegVnbAWjRInk3_3Ouigqm'
const USERS = [
  { username: 'thieuquangduy', password: 'duy2061997', display: 'Thiều Quang Duy' }
]

export default function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = () => {
    if (!username || !password) { setError('Vui lòng nhập đầy đủ thông tin.'); return }
    setLoading(true)
    setError('')
    setTimeout(() => {
      const user = USERS.find(u => u.username === username.trim() && u.password === password)
      if (user) {
        sessionStorage.setItem('hsg_user', JSON.stringify({ username: user.username, display: user.display }))
        onLogin(user)
      } else {
        setError('Tên đăng nhập hoặc mật khẩu không đúng.')
        setLoading(false)
      }
    }, 600)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#F5F3EF',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Be Vietnam Pro', sans-serif", padding: 20, zIndex: 9999
    }}>
      {/* Background pattern */}
      <div style={{
        position: 'absolute', inset: 0, opacity: .04,
        backgroundImage: 'radial-gradient(#D4420A 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }} />

      <div style={{
        background: '#fff', borderRadius: 18, width: '100%', maxWidth: 400,
        boxShadow: '0 20px 60px rgba(0,0,0,.12)', overflow: 'hidden',
        position: 'relative', animation: 'loginSlide .3s ease'
      }}>
        {/* Header bar */}
        <div style={{ height: 5, background: 'linear-gradient(90deg,#D4420A,#F26430)' }} />

        <div style={{ padding: '32px 32px 28px' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#F5F3EF', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 4, flexShrink: 0 }}>
              <img src={LOGO_URL} alt="HSG"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onError={e => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<span style="font-size:14px;font-weight:700;color:#D4420A">HSG</span>' }}
              />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1C1C1C', lineHeight: 1.3 }}>Danh sách xe</div>
              <div style={{ fontSize: 11, color: '#909090' }}>Hoa Sen Home</div>
            </div>
          </div>

          <div style={{ fontSize: 20, fontWeight: 700, color: '#1C1C1C', marginBottom: 4 }}>Đăng nhập</div>
          <div style={{ fontSize: 13, color: '#909090', marginBottom: 24 }}>Vui lòng đăng nhập để tiếp tục.</div>

          {/* Username */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4A4A4A', marginBottom: 6 }}>Tên đăng nhập</label>
            <input
              value={username}
              onChange={e => { setUsername(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="Nhập tên đăng nhập"
              autoFocus
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 9,
                border: `1.5px solid ${error ? '#FCA5A5' : '#E6E2DC'}`,
                fontSize: 13, outline: 'none', fontFamily: 'inherit',
                background: '#FAFAF8', transition: 'border .15s',
                boxSizing: 'border-box'
              }}
              onFocus={e => e.target.style.borderColor = '#D4420A'}
              onBlur={e => e.target.style.borderColor = error ? '#FCA5A5' : '#E6E2DC'}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4A4A4A', marginBottom: 6 }}>Mật khẩu</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="Nhập mật khẩu"
                style={{
                  width: '100%', padding: '11px 42px 11px 14px', borderRadius: 9,
                  border: `1.5px solid ${error ? '#FCA5A5' : '#E6E2DC'}`,
                  fontSize: 13, outline: 'none', fontFamily: 'inherit',
                  background: '#FAFAF8', transition: 'border .15s',
                  boxSizing: 'border-box'
                }}
                onFocus={e => e.target.style.borderColor = '#D4420A'}
                onBlur={e => e.target.style.borderColor = error ? '#FCA5A5' : '#E6E2DC'}
              />
              <button onClick={() => setShowPw(s => !s)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: '#909090', fontSize: 16, padding: 2 }}>
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: '#FEE2E2', color: '#B91C1C', fontSize: 12.5, padding: '9px 12px', borderRadius: 8, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
              ⚠ {error}
            </div>
          )}

          {/* Submit */}
          <button onClick={handleSubmit} disabled={loading}
            style={{
              width: '100%', padding: '12px', borderRadius: 10, border: 'none',
              background: loading ? '#F0A080' : 'linear-gradient(135deg,#D4420A,#F26430)',
              color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', transition: 'all .15s', letterSpacing: .3,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
            }}>
            {loading ? (
              <>
                <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .65s linear infinite', display: 'inline-block' }} />
                Đang xác thực...
              </>
            ) : 'Đăng nhập →'}
          </button>
        </div>

        <div style={{ padding: '12px 32px 20px', background: '#FAFAF8', borderTop: '1px solid #F0EDE8', textAlign: 'center', fontSize: 11.5, color: '#C0B8B0' }}>
          Hoa Sen Group © 2025 · Hệ thống quản lý phương tiện
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap');
        @keyframes loginSlide { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}
