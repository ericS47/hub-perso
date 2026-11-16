// Jeu des paires (mémoire) : logique pure.
import { melanger, type Exercice, type Rng } from '../exercices'

export type Grille = '3x4' | '4x4' | '4x5'

export const GRILLES: Record<Grille, { cols: number; lignes: number; paires: number }> = {
  '3x4': { cols: 3, lignes: 4, paires: 6 },
  '4x4': { cols: 4, lignes: 4, paires: 8 },
  '4x5': { cols: 4, lignes: 5, paires: 10 },
}

export interface CartePaire {
  id: number
  exercice: Exercice
  trouvee: boolean
  // Joueur qui a trouvé la paire.
  par?: number
}

export interface EtatPaires {
  cartes: CartePaire[]
  // Indices des cartes retournées ce tour-ci (0, 1 ou 2).
  retournees: number[]
  joueurs: { nom: string; paires: number }[]
  tour: number
  coups: number
  // Paire qui vient d'être trouvée : l'exercice est en attente.
  paireEnAttente: Exercice | null
  phase: 'jeu' | 'non-paire' | 'exercice' | 'fin'
}

export type ActionPaires = { type: 'retourner'; index: number } | { type: 'cacher' } | { type: 'exercice-fini' }

// Paquet mélangé : chaque exercice en double. Si le choix est trop petit, on réutilise des exercices.
export function creerPaquet(pool: Exercice[], paires: number, rng: Rng = Math.random): CartePaire[] {
  const choisis: Exercice[] = []
  let source = melanger(pool, rng)
  while (choisis.length < paires) {
    if (source.length === 0) source = melanger(pool, rng)
    choisis.push(source.shift() as Exercice)
  }
  const cartes = choisis.flatMap((exercice) => [exercice, exercice])
  return melanger(cartes, rng).map((exercice, id) => ({ id, exercice, trouvee: false }))
}

export function etatInitialPaires(cartes: CartePaire[], noms: string[]): EtatPaires {
  return {
    cartes,
    retournees: [],
    joueurs: noms.map((nom) => ({ nom, paires: 0 })),
    tour: 0,
    coups: 0,
    paireEnAttente: null,
    phase: 'jeu',
  }
}

export function pairesReducer(e: EtatPaires, a: ActionPaires): EtatPaires {
  switch (a.type) {
    case 'retourner': {
      if (e.phase !== 'jeu') return e
      const c = e.cartes[a.index]
      if (!c || c.trouvee || e.retournees.includes(a.index) || e.retournees.length >= 2) return e
      const retournees = [...e.retournees, a.index]
      if (retournees.length < 2) return { ...e, retournees }
      const [i, j] = retournees
      const coups = e.coups + 1
      // Deux cartes du même exercice : c'est une paire.
      if (e.cartes[i].exercice.id === e.cartes[j].exercice.id) {
        const cartes = e.cartes.map((x, k) => (k === i || k === j ? { ...x, trouvee: true, par: e.tour } : x))
        const joueurs = e.joueurs.map((p, k) => (k === e.tour ? { ...p, paires: p.paires + 1 } : p))
        return { ...e, cartes, joueurs, retournees, coups, paireEnAttente: e.cartes[i].exercice, phase: 'exercice' }
      }
      return { ...e, retournees, coups, phase: 'non-paire' }
    }
    case 'cacher': {
      if (e.phase !== 'non-paire') return e
      // Raté : la main passe à l'autre joueur.
      return { ...e, retournees: [], phase: 'jeu', tour: (e.tour + 1) % e.joueurs.length }
    }
    case 'exercice-fini': {
      if (e.phase !== 'exercice') return e
      const fini = e.cartes.every((c) => c.trouvee)
      // Paire trouvée : le même joueur rejoue.
      return { ...e, retournees: [], paireEnAttente: null, phase: fini ? 'fin' : 'jeu' }
    }
  }
}
