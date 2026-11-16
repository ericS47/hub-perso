// « Cap au phare » : jeu de cartes original. On pioche pour avancer pas à pas jusqu'au phare.
import { melanger, type Categorie, type Rng } from '../exercices'

export type SorteCarte = 'pas' | 'elan' | 'pause' | 'vue'

export interface CartePhare {
  id: number
  sorte: SorteCarte
  pas: number
  categorie: Categorie
}

export const SORTES: Record<SorteCarte, { nom: string; emoji: string; texte: string }> = {
  pas: { nom: 'En chemin', emoji: '👣', texte: 'Un mouvement, et tu avances.' },
  elan: { nom: 'Élan', emoji: '⚡', texte: 'Un mouvement tonique qui te fait filer !' },
  pause: { nom: 'Pause', emoji: '🍃', texte: 'On respire, on savoure, on repart tranquillement.' },
  vue: { nom: 'Belle vue', emoji: '🌅', texte: 'On s’étire en admirant le paysage.' },
}

export const DISTANCE = 20

export const ETAPES: { pas: number; nom: string; emoji: string }[] = [
  { pas: 0, nom: 'Le portail', emoji: '🏡' },
  { pas: 4, nom: 'Le jardin', emoji: '🌻' },
  { pas: 8, nom: 'Le pont de bois', emoji: '🌉' },
  { pas: 12, nom: 'La forêt', emoji: '🌲' },
  { pas: 16, nom: 'La dune', emoji: '🏖️' },
  { pas: DISTANCE, nom: 'Le phare', emoji: '🌊' },
]

export function etapeAtteinte(pas: number) {
  return [...ETAPES].reverse().find((e) => pas >= e.pas) ?? ETAPES[0]
}

// 30 cartes : assez pour arriver au phare même en ne tirant que des « 1 pas ».
export function creerPaquetPhare(rng: Rng = Math.random): CartePhare[] {
  const modeles: Omit<CartePhare, 'id'>[] = []
  const ajoute = (n: number, c: Omit<CartePhare, 'id'>) => {
    for (let i = 0; i < n; i++) modeles.push(c)
  }
  ajoute(3, { sorte: 'pas', pas: 1, categorie: 'equilibre' })
  ajoute(3, { sorte: 'pas', pas: 1, categorie: 'souplesse' })
  ajoute(4, { sorte: 'pas', pas: 2, categorie: 'renfo' })
  ajoute(4, { sorte: 'pas', pas: 2, categorie: 'cardio' })
  ajoute(4, { sorte: 'pas', pas: 3, categorie: 'cardio' })
  ajoute(4, { sorte: 'elan', pas: 4, categorie: 'cardio' })
  ajoute(4, { sorte: 'pause', pas: 1, categorie: 'respiration' })
  ajoute(4, { sorte: 'vue', pas: 2, categorie: 'souplesse' })
  return melanger(modeles, rng).map((c, id) => ({ ...c, id }))
}

export interface EtatPhare {
  pioche: CartePhare[]
  carte: CartePhare | null
  pas: number
  tirages: number
  phase: 'piocher' | 'carte' | 'fin'
}

export type ActionPhare = { type: 'piocher' } | { type: 'avancer' }

export function etatInitialPhare(paquet: CartePhare[]): EtatPhare {
  return { pioche: paquet, carte: null, pas: 0, tirages: 0, phase: 'piocher' }
}

export function phareReducer(e: EtatPhare, a: ActionPhare): EtatPhare {
  switch (a.type) {
    case 'piocher': {
      if (e.phase !== 'piocher' || e.pioche.length === 0) return e
      const [carte, ...pioche] = e.pioche
      return { ...e, carte, pioche, tirages: e.tirages + 1, phase: 'carte' }
    }
    case 'avancer': {
      // On avance que le mouvement soit fait ou passé : passer n'est jamais pénalisé.
      if (e.phase !== 'carte' || !e.carte) return e
      const pas = Math.min(DISTANCE, e.pas + e.carte.pas)
      return { ...e, pas, carte: null, phase: pas >= DISTANCE || e.pioche.length === 0 ? 'fin' : 'piocher' }
    }
  }
}
