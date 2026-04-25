import { useState } from 'react'
const LOGO_URL = 'https://lh3.googleusercontent.com/d/1gnI72gZVm9cegVnbAWjRInk3_3Ouigqm'

export default function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const submit = async () => {
    if (!username.trim() || !password) { setError('Vui lòng nhập đầy đủ thông tin.'); return }
    setLoading(true); setError('')
    try {
      const API = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      const res  = await fetch(`${API}/api/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Đăng nhập thất bại.'); setLoading(false); return }
      localStorage.setItem('hsg_token', data.token)
      localStorage.setItem('hsg_user',  JSON.stringify(data.user))
      onLogin(data.user, data.token)
    } catch {
      setError('Không thể kết nối server.')
      setLoading(false)
    }
  }

  const inp = (extra = {}) => ({
    width: '100%', padding: '12px 14px',
    background: 'var(--fill-tertiary)',
    border: '0.5px solid var(--sep)',
    borderRadius: 10, fontSize: 16,
    color: 'var(--label-primary)',
    outline: 'none', fontFamily: 'inherit',
    boxSizing: 'border-box', transition: 'border-color .15s',
    ...extra,
  })

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'var(--bg-grouped)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, zIndex: 9999,
      fontFamily: '-apple-system,"SF Pro Text","Helvetica Neue",sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: 360 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: 'var(--bg-secondary)', margin: '0 auto 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
            overflow: 'hidden', padding: 8,
          }}>
            <img src={LOGO_URL} alt="HSG"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={e => { e.target.style.display='none'; e.target.parentElement.innerHTML='<span style="font-size:22px;font-weight:700;color:#FF3B30">HSG</span>' }}
            />
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, color: 'var(--label-primary)' }}>
            Danh sách xe
          </div>
          <div style={{ fontSize: 13, color: 'var(--label-secondary)', marginTop: 3 }}>
            Hoa Sen Home
          </div>
        </div>

        {/* Form card */}
        <div style={{
          background: 'var(--bg-card)',
          border: '0.5px solid var(--sep)',
          borderRadius: 18, padding: '24px 22px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
        }}>

          {/* Username */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--label-secondary)', marginBottom: 6 }}>
              Tên đăng nhập
            </label>
            <input
              value={username}
              onChange={e => { setUsername(e.target.value); setError('') }}
              onKeyDown={e => e.key==='Enter' && submit()}
              placeholder="Nhập tên đăng nhập"
              autoFocus autoComplete="username"
              style={inp()}
              onFocus={e => e.target.style.borderColor='var(--apple-blue)'}
              onBlur={e  => e.target.style.borderColor='var(--sep)'}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--label-secondary)', marginBottom: 6 }}>
              Mật khẩu
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                onKeyDown={e => e.key==='Enter' && submit()}
                placeholder="Nhập mật khẩu"
                autoComplete="current-password"
                style={inp({ paddingRight: 44 })}
                onFocus={e => e.target.style.borderColor='var(--apple-blue)'}
                onBlur={e  => e.target.style.borderColor='var(--sep)'}
              />
              <button onClick={() => setShowPw(s=>!s)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  border: 'none', background: 'none', cursor: 'pointer',
                  color: 'var(--label-tertiary)', fontSize: 15, padding: 2,
                }}>
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: 'rgba(255,59,48,0.08)',
              border: '0.5px solid rgba(255,59,48,0.3)',
              color: 'var(--apple-red)', fontSize: 13,
              padding: '10px 12px', borderRadius: 10, marginBottom: 14,
            }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button onClick={submit} disabled={loading}
            style={{
              width: '100%', padding: '13px', borderRadius: 12,
              border: 'none',
              background: loading ? 'rgba(0,122,255,0.5)' : 'var(--apple-blue)',
              color: '#fff', fontSize: 16, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', letterSpacing: -0.2,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background .15s, transform .1s',
            }}
            onMouseDown={e => { if (!loading) e.currentTarget.style.transform='scale(0.98)' }}
            onMouseUp={e   => e.currentTarget.style.transform='scale(1)'}
          >
            {loading ? (
              <>
                <span style={{
                  width: 14, height: 14,
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff', borderRadius: '50%',
                  animation: 'spin .65s linear infinite',
                }} />
                Đang xác thực...
              </>
            ) : 'Đăng nhập'}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--label-tertiary)' }}>
          Hoa Sen Group · Hệ thống quản lý phương tiện
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
