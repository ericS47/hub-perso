import type { CultureCategory } from '../db'

export const CATEGORIES: { id: CultureCategory; label: string; icon: string }[] = [
  { id: 'films', label: 'Films', icon: '🎞️' },
  { id: 'series', label: 'Séries', icon: '📺' },
  { id: 'jeux-societe', label: 'Jeux de société', icon: '🎲' },
  { id: 'jeux-video', label: 'Jeux vidéo', icon: '🎮' },
  { id: 'livres', label: 'Livres', icon: '📚' },
  { id: 'spectacles', label: 'Spectacles', icon: '🎭' },
]

export function categoryOf(id: string | undefined) {
  return CATEGORIES.find((c) => c.id === id)
}
