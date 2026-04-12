// ── API Client ────────────────────────────────────────────────────────────────
const IS_DEV = import.meta.env.DEV
const GAS_URL = import.meta.env.VITE_GAS_URL || ''
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

export async function getStats() {
  return get({ action: 'stats' })
}

// ── getAllRows: fetch ALL chunks in PARALLEL ───────────────────────────────────
// Old: sequential (chunk0 → chunk1 → chunk2...) = N × latency
// New: parallel (chunk0, chunk1, chunk2... simultaneously) = 1 × latency
export async function getAllRows(page, onProgress) {
  // Step 1: get metadata (chunk count)
  const meta = await get({ action: 'rows', page })
  const { chunks } = meta

  if (chunks === 0) return []
  if (chunks === 1) return get({ action: 'rows', page, chunk: 0 })

  // Step 2: fire ALL chunk requests simultaneously
  const promises = Array.from({ length: chunks }, (_, i) =>
    get({ action: 'rows', page, chunk: i })
  )

  // Wait for all in parallel
  const results = await Promise.all(promises)

  if (onProgress) onProgress(chunks, chunks)

  // Flatten in correct order
  return results.flat()
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
