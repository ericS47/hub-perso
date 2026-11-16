import type { CompanionKind, CompanionSettings } from '../../db'

// Petites aides de formulation partagées par tous les écrans du compagnon.

// Choisit la formule selon le tutoiement / vouvoiement.
export type T = (tu: string, vous: string) => string

export function makeT(tutoiement: boolean): T {
  return (tu, vous) => (tutoiement ? tu : vous)
}

// Tire une formulation au sort (pour éviter les répétitions).
export function pick<V>(variants: readonly V[]): V {
  return variants[Math.floor(Math.random() * variants.length)]
}

// Met une majuscule à la première lettre.
export function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s
}

// Liste lisible : « a, b et c ».
export function joinFr(items: string[]): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} et ${items[items.length - 1]}`
}

export interface KindInfo {
  kind: CompanionKind
  label: string
  description: string
  // Nom proposé par défaut quand on choisit ce personnage.
  defaultName: string
}

export const KINDS: KindInfo[] = [
  { kind: 'doudou', label: 'Un doudou', description: 'Une peluche ourson toute douce', defaultName: 'Bondi' },
  { kind: 'robot', label: 'Un robot', description: 'Un petit robot attentif', defaultName: 'Pixel' },
  { kind: 'doc', label: 'Un « doc »', description: 'Un personnage en blouse, pour de faux', defaultName: 'Doc Lou' },
  { kind: 'animal', label: 'Un animal', description: 'Un petit renard curieux', defaultName: 'Filou' },
  { kind: 'bulle', label: 'Une interface', description: 'Une bulle toute simple, sans visage humain', defaultName: 'Plume' },
]

// Palette de couleurs assez foncées pour un texte blanc lisible et des contours nets.
export const PALETTE: { color: string; label: string }[] = [
  { color: '#1f6f6b', label: 'Vert d’eau' },
  { color: '#2f6fa8', label: 'Bleu' },
  { color: '#6a5aa8', label: 'Violet' },
  { color: '#b0457a', label: 'Framboise' },
  { color: '#c0582f', label: 'Terre cuite' },
  { color: '#9a6b1f', label: 'Miel' },
  { color: '#3f7f3a', label: 'Vert' },
  { color: '#55606b', label: 'Ardoise' },
]

export function companionT(companion: CompanionSettings | undefined): T {
  return makeT(companion?.tutoiement ?? true)
}

// Moment de la journée, pour adapter les phrases.
export type DayMoment = 'nuit' | 'matin' | 'midi' | 'apres-midi' | 'soir'

export function dayMoment(d: Date = new Date()): DayMoment {
  const h = d.getHours()
  if (h < 5) return 'nuit'
  if (h < 11) return 'matin'
  if (h < 14) return 'midi'
  if (h < 18) return 'apres-midi'
  if (h < 23) return 'soir'
  return 'nuit'
}

// Éclaircit (amount > 0, vers le blanc) ou fonce (amount < 0, vers le noir) une couleur hex.
export function shade(hex: string, amount: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!m) return hex
  const n = parseInt(m[1], 16)
  const target = amount > 0 ? 255 : 0
  const a = Math.abs(amount)
  const ch = (v: number) => Math.round(v + (target - v) * a)
  const r = ch((n >> 16) & 255)
  const g = ch((n >> 8) & 255)
  const b = ch(n & 255)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}
