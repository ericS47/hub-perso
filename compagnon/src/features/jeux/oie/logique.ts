// Jeu de l'oie de l'activité : logique pure (plateau, coups, tours).
import type { Categorie } from '../exercices'

export type TypeCase =
  | 'depart'
  | 'exercice'
  | 'oie'
  | 'pont'
  | 'fontaine'
  | 'puits'
  | 'labyrinthe'
  | 'banc'
  | 'averse'
  | 'arrivee'

export interface CaseOie {
  n: number
  type: TypeCase
  categorie?: Categorie
  // Case d'arrivée pour le pont, le labyrinthe et l'averse.
  cible?: number
}

export const INFOS_CASES: Record<TypeCase, { emoji: string; nom: string }> = {
  depart: { emoji: '🚩', nom: 'Départ' },
  exercice: { emoji: '', nom: 'Exercice' },
  oie: { emoji: '🪿', nom: 'Oie' },
  pont: { emoji: '🌉', nom: 'Pont' },
  fontaine: { emoji: '⛲', nom: 'Fontaine' },
  puits: { emoji: '🪣', nom: 'Puits' },
  labyrinthe: { emoji: '🌀', nom: 'Labyrinthe' },
  banc: { emoji: '🪑', nom: 'Banc' },
  averse: { emoji: '🌧️', nom: 'Averse' },
  arrivee: { emoji: '🏁', nom: 'Arrivée' },
}

const CYCLE: Categorie[] = ['cardio', 'renfo', 'souplesse', 'cardio', 'equilibre', 'renfo', 'respiration']

export type Longueur = 42 | 63

// Plateau de 0 (départ) à longueur (arrivée). Les cases spéciales suivent la tradition
// (sur 63 : oies tous les 9, pont 6, auberge 19, puits 31, labyrinthe 42, prison 52, mort 58), revisitées.
export function creerPlateau(longueur: Longueur): CaseOie[] {
  const cases: CaseOie[] = []
  for (let n = 0; n <= longueur; n++) {
    cases.push({ n, type: 'exercice', categorie: CYCLE[n % CYCLE.length] })
  }
  cases[0] = { n: 0, type: 'depart' }
  cases[longueur] = { n: longueur, type: 'arrivee' }
  for (let n = 9; n < longueur - 4; n += 9) cases[n] = { n, type: 'oie' }

  const pris = new Set(cases.filter((c) => c.type !== 'exercice').map((c) => c.n))
  pris.add(12) // arrivée du pont
  const libre = (n: number, sens: 1 | -1 = 1) => {
    while (pris.has(n)) n += sens
    pris.add(n)
    return n
  }
  const place = (frac: number, type: TypeCase, cibleFrac?: number) => {
    const n = libre(Math.round(frac * longueur))
    const c: CaseOie = { n, type }
    if (cibleFrac !== undefined) c.cible = libre(Math.round(cibleFrac * longueur), -1)
    cases[n] = c // la cible, elle, reste une case exercice
  }
  cases[6] = { n: 6, type: 'pont', cible: 12 }
  pris.add(6)
  place(0.3, 'fontaine')
  place(0.49, 'puits')
  place(0.67, 'labyrinthe', 0.48)
  place(0.83, 'banc')
  place(0.92, 'averse', 0.75)
  return cases
}

export interface Coup {
  joueur: number
  de: number
  depart: number
  // Toutes les positions traversées, pour animer le pion.
  chemin: number[]
  final: number
  messages: string[]
  // Exercice à faire sur la case d'arrivée (catégorie conseillée).
  exercice?: Categorie
  passeTour: boolean
  gagne: boolean
}

// Avance pas à pas, avec rebond si l'on dépasse l'arrivée (il faut tomber pile).
function avancer(depart: number, pas: number, fin: number, chemin: number[], messages: string[]): number {
  let pos = depart
  let sens = 1
  for (let i = 0; i < pas; i++) {
    if (pos === fin) sens = -1
    pos += sens
    chemin.push(pos)
  }
  if (sens === -1) messages.push(`Il faut tomber pile sur l’arrivée : tu rebondis jusqu’à la case ${pos}.`)
  return pos
}

export function jouerCoup(plateau: CaseOie[], joueur: number, depart: number, de: number): Coup {
  const fin = plateau.length - 1
  const chemin = [depart]
  const messages: string[] = []
  let pos = avancer(depart, de, fin, chemin, messages)
  let exercice: Categorie | undefined
  let passeTour = false

  // Les effets peuvent s'enchaîner (une oie peut mener à une autre) : on borne par sécurité.
  for (let i = 0; i < 8; i++) {
    const c = plateau[pos]
    if (c.type === 'oie') {
      messages.push(`Une oie ! Elle t’emporte encore de ${de} case${de > 1 ? 's' : ''}.`)
      pos = avancer(pos, de, fin, chemin, messages)
      continue
    }
    if (c.type === 'pont' && c.cible !== undefined) {
      messages.push(`Le pont : tu le traverses jusqu’à la case ${c.cible}.`)
      pos = c.cible
      chemin.push(pos)
      continue
    }
    if (c.type === 'labyrinthe' && c.cible !== undefined) {
      messages.push(`Le labyrinthe : petit détour, tu ressors case ${c.cible}.`)
      pos = c.cible
      chemin.push(pos)
      continue
    }
    if (c.type === 'averse' && c.cible !== undefined) {
      messages.push(`Une averse ! Tu retournes t’abriter case ${c.cible}.`)
      pos = c.cible
      chemin.push(pos)
      continue
    }
    break
  }

  const c = plateau[pos]
  if (c.type === 'exercice') exercice = c.categorie
  if (c.type === 'puits') {
    messages.push('Le puits : on prend le temps de respirer avant de remonter.')
    exercice = 'respiration'
  }
  if (c.type === 'fontaine') {
    messages.push('La fontaine : pause eau ! Bois quelques gorgées, tu passes ton prochain tour.')
    passeTour = true
  }
  if (c.type === 'banc') {
    messages.push('Le banc : assieds-toi un instant et profite, tu passes ton prochain tour.')
    passeTour = true
  }
  const gagne = c.type === 'arrivee'
  if (gagne) messages.push('Arrivée ! Bravo, tu as bouclé le parcours !')
  return { joueur, de, depart, chemin, final: pos, messages, exercice, passeTour, gagne }
}

// ───────────── État de partie ─────────────
export interface JoueurOie {
  nom: string
  couleur: string
  pos: number
  repos: number // tours à passer
}

export type PhaseOie = 'lancer' | 'deplacement' | 'evenement' | 'repos' | 'fin'

export interface EtatOie {
  plateau: CaseOie[]
  joueurs: JoueurOie[]
  tour: number
  phase: PhaseOie
  coup: Coup | null
  gagnant: number | null
  lancers: number
}

export type ActionOie =
  | { type: 'lancer'; de: number }
  | { type: 'arrive' }
  | { type: 'suivant' }
  | { type: 'fin-repos' }

export const COULEURS_PIONS = ['#e07a4d', '#1f6f6b', '#7a5cc2', '#c99a14']

export function etatInitialOie(noms: string[], longueur: Longueur): EtatOie {
  return {
    plateau: creerPlateau(longueur),
    joueurs: noms.map((nom, i) => ({ nom, couleur: COULEURS_PIONS[i % 4], pos: 0, repos: 0 })),
    tour: 0,
    phase: 'lancer',
    coup: null,
    gagnant: null,
    lancers: 0,
  }
}

// Passe au joueur suivant ; s'il doit se reposer, on l'annonce d'abord.
function tourSuivant(e: EtatOie): EtatOie {
  const tour = (e.tour + 1) % e.joueurs.length
  const phase: PhaseOie = e.joueurs[tour].repos > 0 ? 'repos' : 'lancer'
  return { ...e, tour, phase, coup: null }
}

export function oieReducer(e: EtatOie, a: ActionOie): EtatOie {
  switch (a.type) {
    case 'lancer': {
      if (e.phase !== 'lancer') return e
      const j = e.joueurs[e.tour]
      const coup = jouerCoup(e.plateau, e.tour, j.pos, a.de)
      const joueurs = e.joueurs.map((x, i) =>
        i === e.tour ? { ...x, pos: coup.final, repos: coup.passeTour ? 1 : 0 } : x,
      )
      return { ...e, joueurs, coup, phase: 'deplacement', lancers: e.lancers + 1 }
    }
    case 'arrive': {
      if (e.phase !== 'deplacement' || !e.coup) return e
      return { ...e, phase: 'evenement' }
    }
    case 'suivant': {
      if (e.phase !== 'evenement' || !e.coup) return e
      if (e.coup.gagne) return { ...e, phase: 'fin', gagnant: e.coup.joueur }
      return tourSuivant(e)
    }
    case 'fin-repos': {
      if (e.phase !== 'repos') return e
      const joueurs = e.joueurs.map((x, i) => (i === e.tour ? { ...x, repos: x.repos - 1 } : x))
      return tourSuivant({ ...e, joueurs })
    }
  }
}

// Position (colonne, ligne) d'une case sur un plateau en serpentin de `cols` colonnes.
export function coordCase(n: number, cols: number): { col: number; ligne: number } {
  const ligne = Math.floor(n / cols)
  const r = n % cols
  return { ligne, col: ligne % 2 === 0 ? r : cols - 1 - r }
}
