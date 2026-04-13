// ── API Client — calls Express backend ───────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

async function get(path, params = {}) {
  const url = new URL(`${API_BASE}${path}`)
  Object.entries(params).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== '') url.searchParams.set(k, v)
  })
  const res = await fetch(url.toString())
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

async function put(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function getStats() {
  return get('/api/stats')
}

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

// Ảnh Drive — gọi thẳng backend (CORS đã cho phép từ quanlyxehsh.com)
export async function getImagesFromFolder(folder) {
  try {
    const data = await get('/api/xe/images', { folder })
    return data.urls || []
  } catch { return [] }
}

export async function updateCHRow() { return { success: true } }
