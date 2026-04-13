// ── API Client — calls Express backend ───────────────────────────────────────
// Production:  set VITE_API_URL in Netlify env vars
// Development: http://localhost:3000
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

// Stats / KPI
export async function getStats() {
  return get('/api/stats')
}

// All rows for a page (client-side filtering/sort)
export async function getAllRows(page) {
  if (page === 'xe_tai')  return get('/api/xe/all')
  if (page === 'oto_con') return get('/api/oto')
  return []
}

// Xe detail
export async function getXeDetail(maTaiSan) {
  return get(`/api/xe/${encodeURIComponent(maTaiSan)}`)
}

// Update xe field
export async function updateXeRow(maTaiSan, field, value) {
  return put(`/api/xe/${encodeURIComponent(maTaiSan)}`, { field, value })
}

// Images from Drive folder — via Netlify Function
export async function getImagesFromFolder(folder) {
  try {
    const res = await fetch(`/.netlify/functions/images?folder=${encodeURIComponent(folder)}`)
    if (!res.ok) return []
    const data = await res.json()
    return data.urls || []
  } catch { return [] }
}

export async function updateCHRow() { return { success: true } }
