// ── API Client ────────────────────────────────────────────────────────────────
// In production (Netlify): calls /.netlify/functions/api (server-side proxy)
// In development: calls VITE_GAS_URL directly (needs CORS or browser extension)

const IS_DEV = import.meta.env.DEV
const GAS_URL = import.meta.env.VITE_GAS_URL || ''
// In prod, use Netlify Function as proxy to avoid CORS
const API_BASE = IS_DEV ? GAS_URL : '/.netlify/functions/api'

async function get(params) {
  const url = new URL(API_BASE, window.location.origin)
  Object.entries(params).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== '') url.searchParams.set(k, v)
  })
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data
}

async function post(body) {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getStats() {
  return get({ action: 'stats' })
}

export async function getPageRowsMeta(page) {
  return get({ action: 'rows', page })
}

export async function getPageRowsChunk(page, chunk) {
  return get({ action: 'rows', page, chunk })
}

export async function getAllRows(page, onProgress) {
  const meta = await getPageRowsMeta(page)
  const { chunks } = meta
  let rows = []
  for (let i = 0; i < chunks; i++) {
    const chunk = await getPageRowsChunk(page, i)
    rows = rows.concat(chunk || [])
    if (onProgress) onProgress(i + 1, chunks)
  }
  return rows
}

export async function getXeDetail(maTaiSan) {
  return get({ action: 'xe_detail', id: maTaiSan })
}

export async function getImagesFromFolder(folder) {
  const data = await get({ action: 'images', folder })
  return data.urls || []
}

export async function updateXeRow(maTaiSan, field, value) {
  return post({ action: 'update_xe', maTaiSan, field, value })
}

export async function updateCHRow(maCH, field, value) {
  return post({ action: 'update_ch', maCH, field, value })
}
