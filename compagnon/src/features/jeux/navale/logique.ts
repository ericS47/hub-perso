// Bataille navale : logique pure (placement, tirs, adversaire, tours).
import type { Rng } from '../exercices'

export type Taille = 8 | 10

export interface ModeleBateau {
  id: string
  nom: string
  longueur: number
}

export const FLOTTES: Record<Taille, ModeleBateau[]> = {
  8: [
    { id: 'croiseur', nom: 'Croiseur', longueur: 4 },
    { id: 'voilier', nom: 'Voilier', longueur: 3 },
    { id: 'barque', nom: 'Barque', longueur: 2 },
    { id: 'pedalo', nom: 'Pédalo', longueur: 2 },
  ],
  10: [
    { id: 'paquebot', nom: 'Paquebot', longueur: 5 },
    { id: 'croiseur', nom: 'Croiseur', longueur: 4 },
    { id: 'voilier', nom: 'Voilier', longueur: 3 },
    { id: 'ferry', nom: 'Ferry', longueur: 3 },
    { id: 'barque', nom: 'Barque', longueur: 2 },
  ],
}

export interface Bateau extends ModeleBateau {
  cases: number[] // indices y * taille + x
}

export type Resultat = 'eau' | 'touche' | 'coule'

export interface Camp {
  nom: string
  ia: boolean
  bateaux: Bateau[]
  // Tirs reçus par ce camp : null = pas encore visé.
  tirs: (Resultat | null)[]
}

export const LETTRES = 'ABCDEFGHIJ'
export function nomCase(index: number, taille: number): string {
  return `${LETTRES[index % taille]}${Math.floor(index / taille) + 1}`
}

export function casesBateau(taille: number, longueur: number, x: number, y: number, horizontal: boolean): number[] | null {
  const cases: number[] = []
  for (let k = 0; k < longueur; k++) {
    const cx = horizontal ? x + k : x
    const cy = horizontal ? y : y + k
    if (cx >= taille || cy >= taille) return null
    cases.push(cy * taille + cx)
  }
  return cases
}

// Peut-on poser ces cases ? (pas de chevauchement ; avec `espace`, pas de contact non plus)
export function placementLibre(taille: number, bateaux: Bateau[], cases: number[], espace = false): boolean {
  const occupees = new Set(bateaux.flatMap((b) => b.cases))
  return cases.every((c) => {
    if (occupees.has(c)) return false
    if (!espace) return true
    return voisins(c, taille, true).every((v) => !occupees.has(v))
  })
}

export function voisins(index: number, taille: number, diagonales = false): number[] {
  const x = index % taille
  const y = Math.floor(index / taille)
  const res: number[] = []
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue
      if (!diagonales && dx !== 0 && dy !== 0) continue
      const nx = x + dx
      const ny = y + dy
      if (nx >= 0 && ny >= 0 && nx < taille && ny < taille) res.push(ny * taille + nx)
    }
  }
  return res
}

// Flotte placée au hasard, bateaux sans contact entre eux (repli : contact permis).
export function flotteAleatoire(taille: Taille, rng: Rng = Math.random): Bateau[] {
  for (let essai = 0; essai < 50; essai++) {
    const bateaux: Bateau[] = []
    let ok = true
    for (const m of FLOTTES[taille]) {
      let pose = false
      for (let t = 0; t < 200 && !pose; t++) {
        const horizontal = rng() < 0.5
        const x = Math.floor(rng() * taille)
        const y = Math.floor(rng() * taille)
        const cases = casesBateau(taille, m.longueur, x, y, horizontal)
        if (cases && placementLibre(taille, bateaux, cases, essai < 40)) {
          bateaux.push({ ...m, cases })
          pose = true
        }
      }
      if (!pose) {
        ok = false
        break
      }
    }
    if (ok) return bateaux
  }
  throw new Error('Placement impossible')
}

export function bateauEn(camp: Camp, index: number): Bateau | undefined {
  return camp.bateaux.find((b) => b.cases.includes(index))
}

export function estCoule(camp: Camp, b: Bateau): boolean {
  return b.cases.every((c) => camp.tirs[c] !== null && camp.tirs[c] !== 'eau')
}

export function flotteCoulee(camp: Camp): boolean {
  return camp.bateaux.every((b) => estCoule(camp, b))
}

// Tir sur un camp : renvoie le camp mis à jour et le résultat.
export function tirer(camp: Camp, index: number): { camp: Camp; resultat: Resultat; bateau?: Bateau } {
  const b = bateauEn(camp, index)
  const tirs = [...camp.tirs]
  if (!b) {
    tirs[index] = 'eau'
    return { camp: { ...camp, tirs }, resultat: 'eau' }
  }
  tirs[index] = 'touche'
  const apres = { ...camp, tirs }
  if (estCoule(apres, b)) {
    // Toutes les cases du bateau passent en « coulé ».
    for (const c of b.cases) tirs[c] = 'coule'
    return { camp: apres, resultat: 'coule', bateau: b }
  }
  return { camp: apres, resultat: 'touche', bateau: b }
}

// Adversaire : chasse en damier, puis vise autour des touches et suit l'alignement.
export function choixIA(tirs: (Resultat | null)[], taille: number, rng: Rng = Math.random): number {
  const libres = (cases: number[]) => cases.filter((c) => tirs[c] === null)
  const touches = tirs.flatMap((t, i) => (t === 'touche' ? [i] : []))
  const hasard = (l: number[]) => l[Math.floor(rng() * l.length)]

  if (touches.length > 0) {
    // Deux touches alignées : on prolonge la ligne.
    const alignees: number[] = []
    for (const t of touches) {
      const x = t % taille
      const y = Math.floor(t / taille)
      for (const [dx, dy] of [
        [1, 0],
        [0, 1],
      ]) {
        const nx = x + dx
        const ny = y + dy
        if (nx < taille && ny < taille && tirs[ny * taille + nx] === 'touche') {
          // Remonte la ligne dans les deux sens jusqu'à une case libre.
          for (const sens of [-1, 1]) {
            let k = sens === 1 ? 1 : 0
            for (;;) {
              const cx = x + dx * k * (sens === 1 ? 1 : -1) + (sens === -1 ? -dx : 0)
              const cy = y + dy * k * (sens === 1 ? 1 : -1) + (sens === -1 ? -dy : 0)
              if (cx < 0 || cy < 0 || cx >= taille || cy >= taille) break
              const c = cy * taille + cx
              if (tirs[c] === 'touche') {
                k++
                continue
              }
              if (tirs[c] === null) alignees.push(c)
              break
            }
          }
        }
      }
    }
    const ligne = libres(alignees)
    if (ligne.length > 0) return hasard(ligne)
    const autour = libres(touches.flatMap((t) => voisins(t, taille)))
    if (autour.length > 0) return hasard(autour)
  }

  // Chasse : une case sur deux suffit (le plus petit bateau fait 2 cases).
  const toutes = libres(tirs.map((_, i) => i))
  const damier = toutes.filter((c) => ((c % taille) + Math.floor(c / taille)) % 2 === 0)
  return hasard(damier.length > 0 ? damier : toutes)
}

// ───────────── État de partie ─────────────
export type ModeNavale = 'ia' | 'ami'
// 'touche' : on bouge quand un de ses bateaux est touché ; 'coule' : quand on coule un bateau adverse.
export type RegleExercice = 'touche' | 'coule'

export type PhaseNavale = 'placement' | 'passage' | 'exercice' | 'tir' | 'resultat' | 'fin'

export interface DernierTir {
  par: number
  index: number
  resultat: Resultat
  bateau?: string
}

export interface EtatNavale {
  taille: Taille
  mode: ModeNavale
  regle: RegleExercice
  camps: [Camp, Camp]
  places: [boolean, boolean]
  tour: 0 | 1
  phase: PhaseNavale
  dernier: DernierTir | null
  // Exercice à faire : par qui, et s'il vient après son propre tir (on change de tour ensuite).
  exo: { pour: 0 | 1; apresTir: boolean } | null
  gagnant: 0 | 1 | null
  tirsJoues: [number, number]
}

export type ActionNavale =
  | { type: 'placer'; bateaux: Bateau[] }
  | { type: 'pret' }
  | { type: 'tirer'; index: number }
  | { type: 'continuer' }
  | { type: 'exercice-fini' }

function campVide(nom: string, ia: boolean, taille: number, bateaux: Bateau[] = []): Camp {
  return { nom, ia, bateaux, tirs: Array<Resultat | null>(taille * taille).fill(null) }
}

export function etatInitialNavale(
  taille: Taille,
  mode: ModeNavale,
  regle: RegleExercice,
  noms: [string, string],
  rng: Rng = Math.random,
): EtatNavale {
  const ia = mode === 'ia'
  return {
    taille,
    mode,
    regle,
    camps: [campVide(noms[0], false, taille), campVide(ia ? 'L’appli' : noms[1], ia, taille, ia ? flotteAleatoire(taille, rng) : [])],
    places: [false, ia],
    tour: 0,
    phase: 'placement',
    dernier: null,
    exo: null,
    gagnant: null,
    tirsJoues: [0, 0],
  }
}

const autre = (t: 0 | 1): 0 | 1 => (t === 0 ? 1 : 0)

// Après « prêt » ou un changement de tour : placement, exercice en attente, ou tir.
function entrer(e: EtatNavale): EtatNavale {
  if (!e.places[e.tour]) return { ...e, phase: 'placement' }
  if (e.exo && e.exo.pour === e.tour && !e.exo.apresTir) return { ...e, phase: 'exercice' }
  return { ...e, phase: 'tir' }
}

function changerTour(e: EtatNavale): EtatNavale {
  const suite = { ...e, tour: autre(e.tour) }
  // À deux sur le même téléphone, on passe par l'écran « Passe le téléphone ».
  if (e.mode === 'ami') return { ...suite, phase: 'passage' }
  return entrer(suite)
}

export function navaleReducer(e: EtatNavale, a: ActionNavale): EtatNavale {
  switch (a.type) {
    case 'placer': {
      if (e.phase !== 'placement') return e
      const camps: [Camp, Camp] = [...e.camps]
      camps[e.tour] = { ...camps[e.tour], bateaux: a.bateaux }
      const places: [boolean, boolean] = [...e.places]
      places[e.tour] = true
      const suite = { ...e, camps, places }
      if (!places[autre(e.tour)]) return { ...suite, tour: autre(e.tour), phase: 'passage' }
      // Tout le monde a placé : le joueur 1 commence.
      if (e.mode === 'ami') return { ...suite, tour: 0, phase: 'passage' }
      return { ...suite, tour: 0, phase: 'tir' }
    }
    case 'pret': {
      if (e.phase !== 'passage') return e
      return entrer(e)
    }
    case 'tirer': {
      if (e.phase !== 'tir') return e
      const cible = autre(e.tour)
      if (e.camps[cible].tirs[a.index] !== null) return e
      const r = tirer(e.camps[cible], a.index)
      const camps: [Camp, Camp] = [...e.camps]
      camps[cible] = r.camp
      const tirsJoues: [number, number] = [...e.tirsJoues]
      tirsJoues[e.tour]++
      let exo: EtatNavale['exo'] = null
      if (e.regle === 'touche' && r.resultat !== 'eau' && !camps[cible].ia) exo = { pour: cible, apresTir: false }
      if (e.regle === 'coule' && r.resultat === 'coule' && !camps[e.tour].ia) exo = { pour: e.tour, apresTir: true }
      const gagnant = flotteCoulee(r.camp) ? e.tour : null
      return {
        ...e,
        camps,
        tirsJoues,
        exo,
        gagnant,
        phase: 'resultat',
        dernier: { par: e.tour, index: a.index, resultat: r.resultat, bateau: r.bateau?.nom },
      }
    }
    case 'continuer': {
      if (e.phase !== 'resultat') return e
      // Un exercice « de victoire » se fait avant de clore la partie.
      if (e.exo && e.exo.pour === e.tour && e.exo.apresTir) return { ...e, phase: 'exercice' }
      if (e.gagnant !== null) return { ...e, phase: 'fin', exo: null }
      return changerTour(e)
    }
    case 'exercice-fini': {
      if (e.phase !== 'exercice' || !e.exo) return e
      const apresTir = e.exo.apresTir
      const suite = { ...e, exo: null }
      if (e.gagnant !== null) return { ...suite, phase: 'fin' }
      return apresTir ? changerTour(suite) : { ...suite, phase: 'tir' }
    }
  }
}
