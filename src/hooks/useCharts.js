// Utility functions shared across pages
export function fmtCur(n) {
  n = +n || 0
  if (!n) return '—'
  if (n >= 1e9) return (n / 1e9).toFixed(2) + ' tỷ'
  if (n >= 1e6) return (n / 1e6).toFixed(0) + ' tr'
  return n.toLocaleString('vi-VN')
}

export function obj2arr(o) {
  return Object.entries(o || {}).map(([name, value]) => ({ name, value }))
}

export function sortDesc(arr) {
  return [...arr].sort((a, b) => b.value - a.value)
}

export const COLORS = ['#D4420A','#0E7490','#B45309','#15803D','#6D28D9','#BE185D','#1D4ED8','#047857']
export const PIE_COLORS = ['#D4420A','#F26430','#FBBF24','#34D399','#60A5FA','#A78BFA','#F472B6']
