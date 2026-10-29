import type { CultureCategory, Ownership } from '../db'

export const CATEGORIES: { id: CultureCategory; label: string; icon: string; done: string }[] = [
  { id: 'films', label: 'Films', icon: '🎞️', done: 'Vu' },
  { id: 'series', label: 'Séries', icon: '📺', done: 'Vu' },
  { id: 'jeux-societe', label: 'Jeux de société', icon: '🎲', done: 'Joué' },
  { id: 'jeux-video', label: 'Jeux vidéo', icon: '🎮', done: 'Joué' },
  { id: 'livres', label: 'Livres', icon: '📚', done: 'Lu' },
  { id: 'spectacles', label: 'Spectacles', icon: '🎭', done: 'Vu' },
]

export const OWNERSHIP: { id: Ownership; label: string }[] = [
  { id: 'owned', label: "Je l'ai" },
  { id: 'wish', label: 'Envie' },
  { id: 'none', label: 'Ni l’un ni l’autre' },
]

export function categoryOf(id: string | undefined) {
  return CATEGORIES.find((c) => c.id === id)
}

export function doneLabel(id: CultureCategory) {
  return categoryOf(id)?.done ?? 'Fait'
}

// « thriller, SF ,  » → ['Thriller', 'SF'] : saisie libre, doublons ignorés.
export function parseGenres(text: string) {
  const out: string[] = []
  for (const raw of text.split(',')) {
    const g = raw.trim()
    if (!g) continue
    const clean = g.charAt(0).toUpperCase() + g.slice(1)
    if (!out.some((o) => o.toLowerCase() === clean.toLowerCase())) out.push(clean)
  }
  return out
}
