import type { Watch } from '../db'

export const MAX_WATCHES = 6

export const euros = (n: number) =>
  n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: n % 1 ? 2 : 0 })

// « 12,5 » ou « 12.50 € » → 12.5
export function parsePrice(s: string) {
  const n = Number(s.replace(/[^\d,.]/g, '').replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : undefined
}

export function summary(w: Watch) {
  const sorted = [...w.prices].sort((a, b) => a.date - b.date)
  const last = sorted[sorted.length - 1]
  const best = sorted.reduce<(typeof sorted)[number] | undefined>((b, p) => (!b || p.price < b.price ? p : b), undefined)
  const deal = !!(last && w.target && last.price <= w.target)
  return { sorted, last, best, deal }
}
