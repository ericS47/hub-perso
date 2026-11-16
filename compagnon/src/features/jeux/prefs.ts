// Derniers réglages de partie, gardés dans le navigateur (simple confort, jamais indispensable).
import type { Reglages } from './exercices'

const CLE = 'jeux.reglages'
export const REGLAGES_DEFAUT: Reglages = { niveau: 'doux', zones: [], detente: false }

export function lireReglages(): Reglages {
  try {
    const brut = localStorage.getItem(CLE)
    if (!brut) return REGLAGES_DEFAUT
    const r = JSON.parse(brut) as Partial<Reglages>
    return {
      niveau: r.niveau === 'assis' || r.niveau === 'dynamique' ? r.niveau : 'doux',
      zones: Array.isArray(r.zones) ? r.zones : [],
      detente: r.detente === true,
    }
  } catch {
    return REGLAGES_DEFAUT
  }
}

export function ecrireReglages(r: Reglages): void {
  try {
    localStorage.setItem(CLE, JSON.stringify(r))
  } catch {
    // Stockage indisponible : tant pis, on garde les réglages pour cette partie.
  }
}

// Prénoms des joueurs utilisés la dernière fois.
export function lireNoms(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem('jeux.noms') ?? '[]') as unknown
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

export function ecrireNoms(noms: string[]): void {
  try {
    localStorage.setItem('jeux.noms', JSON.stringify(noms))
  } catch {
    // ignoré
  }
}
