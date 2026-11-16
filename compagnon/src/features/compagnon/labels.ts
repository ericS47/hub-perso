import type { JournalEntry, JournalType } from '../../db'
import { BONNE_NOUVELLE_QUESTION } from './scripts/libre'

export const TYPE_INFO: Record<JournalType, { emoji: string; label: string }> = {
  'seance-manquee': { emoji: '🏃', label: 'Séance manquée' },
  grignotage: { emoji: '🍪', label: 'Grignotage' },
  compulsion: { emoji: '🌊', label: 'Compulsion' },
  'coup-de-mou': { emoji: '🌧️', label: 'Coup de mou' },
  libre: { emoji: '✍️', label: 'Écriture libre' },
}

export function isBonneNouvelle(e: JournalEntry): boolean {
  return e.type === 'libre' && e.answers.some((a) => a.question === BONNE_NOUVELLE_QUESTION)
}

export function entryInfo(e: JournalEntry): { emoji: string; label: string } {
  return isBonneNouvelle(e) ? { emoji: '🌟', label: 'Bonne nouvelle' } : TYPE_INFO[e.type]
}
