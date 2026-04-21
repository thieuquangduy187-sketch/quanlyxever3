// ── API Client — JWT auth + Express backend ───────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Lấy token từ localStorage
function getToken() {
  return localStorage.getItem('hsg_token') || ''
}

// Xử lý 401 — xóa token và redirect về login KHÔNG reload
function handle401() {
  localStorage.removeItem('hsg_token')
  localStorage.removeItem('hsg_user')
  // Dispatch custom event để App.jsx bắt và set user=null
  window.dispatchEvent(new Event('hsg_logout'))
}

async function get(path, params = {}) {
  const url = new URL(`${API_BASE}${path}`)
  Object.entries(params).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== '') url.searchParams.set(k, v)
  })
  const res = await fetch(url.toString(), {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
  if (res.status === 401) { handle401(); throw new Error('Phiên đăng nhập hết hạn.') }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

async function put(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
    body:    JSON.stringify(body)
  })
  if (res.status === 401) { handle401(); throw new Error('Phiên đăng nhập hết hạn.') }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export async function login(username, password) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ username, password })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Đăng nhập thất bại.')
  return data // { token, user }
}

export async function logout() {
  try {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${getToken()}` }
    })
  } catch {}
  localStorage.removeItem('hsg_token')
  localStorage.removeItem('hsg_user')
}

// ── Stats / KPI ───────────────────────────────────────────────────────────────
export async function getStats() {
  return get('/api/stats')
}

// ── Xe tải ────────────────────────────────────────────────────────────────────
export async function getAllRows(page) {
  if (page === 'xe_tai')  return get('/api/xe/all')
  if (page === 'oto_con') return get('/api/oto')
  return []
}

export async function getXeDetail(maTaiSan) {
  return get(`/api/xe/${encodeURIComponent(maTaiSan)}`)
}

export async function updateXeRow(maTaiSan, field, value) {
  return put(`/api/xe/${encodeURIComponent(maTaiSan)}`, { field, value })
}

// ── Images ────────────────────────────────────────────────────────────────────
export async function getImagesFromFolder(folder) {
  try {
    const data = await get('/api/xe/images', { folder })
    return data.urls || []
  } catch { return [] }
}

export async function updateCHRow() { return { success: true } }
