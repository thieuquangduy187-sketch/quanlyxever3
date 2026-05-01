// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📁 FRONTEND — quanlyxever3/src/components/LoadingScreen.jsx
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function LoadingScreen() {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--bg-grouped)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 24, zIndex: 9999,
    }}>
      {/* Logo */}
      <div style={{
        width: 44, height: 44, borderRadius: 12, background: 'var(--brand)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
          <path d="M1 3h15v13H1V3zM16 8h4l3 3v5h-7V8z"/>
          <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
        </svg>
      </div>

      {/* Truck + road animation */}
      <div style={{ width: 280, height: 56, position: 'relative', overflow: 'hidden' }}>
        {/* Road surface */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 16,
          background: 'var(--fill-secondary)', borderRadius: 4,
        }} />
        {/* Road lines (animated) */}
        {[0, 1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} style={{
            position: 'absolute', bottom: 6, height: 3, width: 36,
            background: 'var(--fill-primary)', borderRadius: 2,
            animation: `roadLine 0.65s linear infinite`,
            animationDelay: `${-i * 0.65 / 7 * 7}s`,
            left: 280,
          }} />
        ))}
        {/* Truck (static, centered) */}
        <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)' }}>
          <svg width="86" height="36" viewBox="0 0 86 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Cabin body */}
            <rect x="1" y="6" width="55" height="23" rx="3" fill="var(--brand)"/>
            {/* Window */}
            <rect x="4" y="9" width="20" height="13" rx="2" fill="rgba(255,255,255,0.2)"/>
            {/* Cargo box */}
            <rect x="56" y="13" width="28" height="16" rx="2" fill="var(--brand-dark, #B82800)"/>
            <rect x="56" y="7" width="28" height="6" rx="2" fill="var(--brand)"/>
            {/* Cab top detail */}
            <path d="M56 13 L62 7 L84 7 L84 13" fill="var(--brand)"/>
            <rect x="64" y="8" width="14" height="6" rx="1" fill="rgba(255,255,255,0.25)"/>
            {/* Wheels */}
            <circle cx="16" cy="32" r="5" fill="var(--ink)" opacity="0.7"/>
            <circle cx="16" cy="32" r="2" fill="var(--fill-primary)"/>
            <circle cx="44" cy="32" r="5" fill="var(--ink)" opacity="0.7"/>
            <circle cx="44" cy="32" r="2" fill="var(--fill-primary)"/>
            <circle cx="72" cy="32" r="5" fill="var(--ink)" opacity="0.7"/>
            <circle cx="72" cy="32" r="2" fill="var(--fill-primary)"/>
          </svg>
        </div>
      </div>

      {/* Loading text */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink2)', marginBottom: 4 }}>
          Đang tải dữ liệu
          <span style={{ display: 'inline-block', width: 24 }}>
            <span style={{ animation: 'dot 1.2s infinite', animationDelay: '0s' }}>.</span>
            <span style={{ animation: 'dot 1.2s infinite', animationDelay: '0.2s' }}>.</span>
            <span style={{ animation: 'dot 1.2s infinite', animationDelay: '0.4s' }}>.</span>
          </span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--label-quaternary)' }}>HSG Fleet Management</div>
      </div>

      <style>{`
        @keyframes roadLine {
          from { left: 280px; }
          to   { left: -36px; }
        }
        @keyframes dot {
          0%, 80%, 100% { opacity: 0.2; }
          40%            { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
