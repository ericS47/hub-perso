// Bibliothèque d'exercices doux pour les jeux : aucun saut, rien au sol, toujours un appui possible.
import type { PoseId } from './poses'

export type Categorie = 'cardio' | 'renfo' | 'equilibre' | 'souplesse' | 'respiration'
export type Niveau = 'assis' | 'doux' | 'dynamique'
export type Zone = 'genoux' | 'dos' | 'epaules' | 'hanches'

export interface Exercice {
  id: string
  nom: string
  consigne: string
  categorie: Categorie
  niveau: Niveau
  // Zones surtout sollicitées : l'exercice est écarté si l'une d'elles est à ménager.
  zones: Zone[]
  // Durée en secondes (minuteur) ou nombre de répétitions (compteur).
  duree?: number
  reps?: number
  // La durée ou les répétitions s'entendent pour chaque côté.
  parCote?: boolean
  pose: PoseId
}

export const CATEGORIES: Record<Categorie, { label: string; emoji: string; couleur: string; fond: string }> = {
  cardio: { label: 'Cardio doux', emoji: '❤️', couleur: '#b4532a', fond: '#fbe6dc' },
  renfo: { label: 'Renforcement', emoji: '💪', couleur: '#1f6f6b', fond: '#d9ece9' },
  equilibre: { label: 'Équilibre', emoji: '🦩', couleur: '#8a6212', fond: '#fbefd2' },
  souplesse: { label: 'Souplesse', emoji: '🌿', couleur: '#3a7a4f', fond: '#e1f0e4' },
  respiration: { label: 'Respiration', emoji: '🌬️', couleur: '#3e6590', fond: '#e1eaf4' },
}

export const NIVEAUX: { value: Niveau; label: string; detail: string }[] = [
  { value: 'assis', label: 'Assis', detail: 'Tout se fait sur une chaise stable.' },
  { value: 'doux', label: 'Debout tranquille', detail: 'Debout, à côté d’une chaise pour se tenir.' },
  { value: 'dynamique', label: 'Debout dynamique', detail: 'Un peu plus d’entrain, toujours sans sauter.' },
]

export const ZONES: { value: Zone; label: string }[] = [
  { value: 'genoux', label: 'Genoux' },
  { value: 'dos', label: 'Dos' },
  { value: 'epaules', label: 'Épaules' },
  { value: 'hanches', label: 'Hanches' },
]

export const EXERCICES: Exercice[] = [
  // ── Assis ──
  { id: 'ballon', nom: 'Le ballon', consigne: 'Mains sur le ventre, inspire par le nez en gonflant le ventre, souffle doucement par la bouche.', categorie: 'respiration', niveau: 'assis', zones: [], reps: 6, pose: 'assis-respire' },
  { id: 'carree', nom: 'Respiration carrée', consigne: 'Inspire en comptant 4, garde 4, souffle 4, attends 4. Sans forcer.', categorie: 'respiration', niveau: 'assis', zones: [], reps: 4, pose: 'assis-respire' },
  { id: 'soupir', nom: 'Le grand soupir', consigne: 'Inspire profondément, puis relâche tout en soufflant « ahhh », épaules qui tombent.', categorie: 'respiration', niveau: 'assis', zones: [], reps: 5, pose: 'assis-respire' },
  { id: 'marche-assise', nom: 'Marche assise', consigne: 'Assis au bord de la chaise, lève un genou puis l’autre, comme si tu marchais.', categorie: 'cardio', niveau: 'assis', zones: ['hanches'], duree: 45, pose: 'assis-genou' },
  { id: 'boxe-assise', nom: 'Boxe assise', consigne: 'Dos droit, pousse un poing devant toi puis l’autre, sans tendre le coude à fond.', categorie: 'cardio', niveau: 'assis', zones: ['epaules'], duree: 30, pose: 'assis-boxe' },
  { id: 'applaudir', nom: 'Bravo rythmé', consigne: 'Applaudis devant toi, puis au-dessus de la tête si c’est confortable. Garde le rythme !', categorie: 'cardio', niveau: 'assis', zones: ['epaules'], duree: 30, pose: 'assis-mains' },
  { id: 'pointes-talons', nom: 'Pointes et talons', consigne: 'Pieds à plat, lève les talons, repose, puis lève les pointes. Enchaîne tranquillement.', categorie: 'cardio', niveau: 'assis', zones: [], duree: 40, pose: 'assis-pointes' },
  { id: 'extension-jambe', nom: 'Jambe tendue', consigne: 'Assis bien au fond, tends une jambe devant toi, tiens 2 secondes, repose.', categorie: 'renfo', niveau: 'assis', zones: ['genoux'], reps: 8, parCote: true, pose: 'assis-jambe' },
  { id: 'presse-paumes', nom: 'Presse des paumes', consigne: 'Paumes l’une contre l’autre devant la poitrine, pousse 5 secondes, relâche.', categorie: 'renfo', niveau: 'assis', zones: ['epaules'], reps: 6, pose: 'assis-mains' },
  { id: 'genou-serre', nom: 'Genoux serrés', consigne: 'Un coussin ou le poing entre les genoux : serre 5 secondes, relâche.', categorie: 'renfo', niveau: 'assis', zones: [], reps: 8, pose: 'assis' },
  { id: 'rotation-buste', nom: 'Regard derrière', consigne: 'Assis bien droit, tourne doucement le buste vers la droite, reviens, puis à gauche.', categorie: 'souplesse', niveau: 'assis', zones: ['dos'], reps: 5, parCote: true, pose: 'assis-tourne' },
  { id: 'bras-ciel', nom: 'Bras vers le ciel', consigne: 'Inspire en montant les bras aussi haut que confortable, souffle en les redescendant.', categorie: 'souplesse', niveau: 'assis', zones: ['epaules'], reps: 6, pose: 'assis-bras-haut' },
  { id: 'epaules', nom: 'Épaules aux oreilles', consigne: 'Monte les épaules vers les oreilles, puis laisse-les tomber en soufflant.', categorie: 'souplesse', niveau: 'assis', zones: [], reps: 8, pose: 'assis-epaules' },
  { id: 'chevilles', nom: 'Cercles de chevilles', consigne: 'Un pied décollé du sol, dessine des cercles avec la pointe, puis change de pied.', categorie: 'souplesse', niveau: 'assis', zones: [], reps: 8, parCote: true, pose: 'assis-jambe' },
  { id: 'inclinaison', nom: 'Le roseau', consigne: 'Un bras au-dessus de la tête, penche-toi doucement sur le côté, reviens au centre.', categorie: 'souplesse', niveau: 'assis', zones: ['dos'], reps: 4, parCote: true, pose: 'assis-incline' },
  { id: 'regard', nom: 'Oui et non', consigne: 'Tourne lentement la tête à droite, puis à gauche, puis fais un petit « oui ». Tout en douceur.', categorie: 'souplesse', niveau: 'assis', zones: [], reps: 5, pose: 'assis-cou' },
  { id: 'moulin', nom: 'Petits moulins', consigne: 'Bras légèrement écartés, dessine des petits cercles vers l’avant, puis vers l’arrière.', categorie: 'souplesse', niveau: 'assis', zones: ['epaules'], duree: 30, pose: 'assis-cercles' },
  { id: 'assis-debout', nom: 'Lever de chaise', consigne: 'Pieds à plat, penche-toi un peu en avant et lève-toi, puis rassieds-toi lentement. Mains sur les cuisses si besoin.', categorie: 'renfo', niveau: 'assis', zones: ['genoux', 'hanches'], reps: 5, pose: 'leve-chaise' },
  // ── Debout tranquille ──
  { id: 'marche-place', nom: 'Marche sur place', consigne: 'Marche sur place à ton rythme, en balançant les bras.', categorie: 'cardio', niveau: 'doux', zones: ['genoux'], duree: 60, pose: 'marche' },
  { id: 'pas-cote', nom: 'Pas de côté', consigne: 'Un pas sur le côté, ramène le pied, puis de l’autre côté. Comme une petite danse.', categorie: 'cardio', niveau: 'doux', zones: ['hanches'], duree: 45, pose: 'pas-cote' },
  { id: 'balancier', nom: 'Balancier', consigne: 'Debout, balance les bras d’avant en arrière en pliant un peu les genoux.', categorie: 'cardio', niveau: 'doux', zones: ['epaules'], duree: 30, pose: 'balancier' },
  { id: 'pointes', nom: 'Sur la pointe des pieds', consigne: 'Une main sur le dossier d’une chaise, monte sur la pointe des pieds, redescends lentement.', categorie: 'renfo', niveau: 'doux', zones: [], reps: 10, pose: 'pointes' },
  { id: 'pompes-mur', nom: 'Pompes contre le mur', consigne: 'Mains au mur à hauteur d’épaules, plie les coudes pour approcher le buste, repousse.', categorie: 'renfo', niveau: 'doux', zones: ['epaules'], reps: 8, pose: 'mur' },
  { id: 'jambe-arriere', nom: 'Jambe en arrière', consigne: 'Tiens le dossier d’une chaise, emmène une jambe tendue vers l’arrière, sans creuser le dos.', categorie: 'renfo', niveau: 'doux', zones: ['hanches', 'dos'], reps: 8, parCote: true, pose: 'jambe-arriere' },
  { id: 'jambe-cote', nom: 'Jambe sur le côté', consigne: 'Tiens la chaise, écarte une jambe sur le côté, pied pointé devant, et reviens.', categorie: 'renfo', niveau: 'doux', zones: ['hanches'], reps: 8, parCote: true, pose: 'jambe-cote' },
  { id: 'flamant', nom: 'Le flamant rose', consigne: 'Une main sur la chaise, décolle un pied du sol et tiens. Repose-le dès que tu veux.', categorie: 'equilibre', niveau: 'doux', zones: [], duree: 15, parCote: true, pose: 'un-pied' },
  { id: 'funambule', nom: 'Le funambule', consigne: 'Le long d’un mur, marche en posant le talon juste devant la pointe de l’autre pied.', categorie: 'equilibre', niveau: 'doux', zones: [], reps: 10, pose: 'funambule' },
  { id: 'mollet', nom: 'Étirement du mollet', consigne: 'Mains au mur, une jambe en arrière talon au sol, plie la jambe avant. Respire.', categorie: 'souplesse', niveau: 'doux', zones: [], duree: 20, parCote: true, pose: 'mollet' },
  { id: 'ouverture', nom: 'Ouvre la poitrine', consigne: 'Bras devant toi, ouvre-les en grand sur les côtés en inspirant, referme en soufflant.', categorie: 'souplesse', niveau: 'doux', zones: ['epaules'], reps: 6, pose: 'ouverture' },
  { id: 'soleil', nom: 'Le soleil', consigne: 'Debout, inspire en levant les bras sur les côtés, souffle en les redescendant lentement.', categorie: 'respiration', niveau: 'doux', zones: [], reps: 5, pose: 'bras-haut' },
  // ── Debout dynamique ──
  { id: 'genoux-hauts', nom: 'Genoux en l’air', consigne: 'Marche sur place en montant les genoux un peu plus haut. Sans sauter.', categorie: 'cardio', niveau: 'dynamique', zones: ['genoux', 'hanches'], duree: 30, pose: 'genoux-haut' },
  { id: 'talons-fesses', nom: 'Talons vers l’arrière', consigne: 'Sur place, ramène un talon vers l’arrière puis l’autre, en marchant, sans sauter.', categorie: 'cardio', niveau: 'dynamique', zones: ['genoux'], duree: 30, pose: 'talons-fesses' },
  { id: 'pas-chasses', nom: 'Pas chassés', consigne: 'Deux pas sur le côté, deux pas de l’autre côté, bras qui accompagnent.', categorie: 'cardio', niveau: 'dynamique', zones: ['hanches'], duree: 40, pose: 'pas-chasses' },
  { id: 'boxe', nom: 'Boxe debout', consigne: 'Pieds écartés, genoux souples, enchaîne des coups de poing devant toi.', categorie: 'cardio', niveau: 'dynamique', zones: ['epaules'], duree: 40, pose: 'boxe' },
  { id: 'genou-coude', nom: 'Genou-coude', consigne: 'Lève un genou et approche le coude opposé, puis change. Sans forcer la torsion.', categorie: 'cardio', niveau: 'dynamique', zones: ['hanches', 'dos'], duree: 30, pose: 'genou-coude' },
  { id: 'squat-chaise', nom: 'Frôle la chaise', consigne: 'Une chaise derrière toi : descends les fesses jusqu’à la frôler, puis remonte.', categorie: 'renfo', niveau: 'dynamique', zones: ['genoux', 'hanches', 'dos'], reps: 8, pose: 'squat' },
  { id: 'marche-active', nom: 'Marche énergique', consigne: 'Marche sur place d’un bon pas, en poussant les bras vers le haut à chaque pas.', categorie: 'cardio', niveau: 'dynamique', zones: ['epaules'], duree: 45, pose: 'bras-haut' },
  { id: 'flamant-bras', nom: 'Flamant voyageur', consigne: 'Près de la chaise, tiens sur un pied et tends les bras sur les côtés, si tu te sens stable.', categorie: 'equilibre', niveau: 'dynamique', zones: ['hanches'], duree: 15, parCote: true, pose: 'funambule' },
]

const RANG: Record<Niveau, number> = { assis: 0, doux: 1, dynamique: 2 }

export interface Reglages {
  niveau: Niveau
  zones: Zone[]
  // Mode détente : on joue sans exercice.
  detente: boolean
}

// Exercices compatibles avec le niveau (et les niveaux plus doux) et les zones à ménager.
export function filtrerExercices(r: Pick<Reglages, 'niveau' | 'zones'>): Exercice[] {
  const pool = EXERCICES.filter(
    (e) => RANG[e.niveau] <= RANG[r.niveau] && !e.zones.some((z) => r.zones.includes(z)),
  )
  return pool.length > 0 ? pool : EXERCICES.filter((e) => e.categorie === 'respiration')
}

// Durée estimée d'un exercice, pour les minutes d'activité.
export function dureeEstimee(e: Exercice): number {
  const base = e.duree ?? (e.reps ?? 6) * 4
  return e.parCote ? base * 2 : base
}

export function libelleQuantite(e: Exercice): string {
  const cote = e.parCote ? ' de chaque côté' : ''
  if (e.duree) return `${e.duree} secondes${cote}`
  return `${e.reps} fois${cote}`
}

export type Rng = () => number

// Tire un exercice : préfère la catégorie demandée et le niveau choisi, évite les derniers tirés.
export function choisirExercice(
  pool: Exercice[],
  opts: { categorie?: Categorie; niveau?: Niveau; eviter?: string[] },
  rng: Rng = Math.random,
): Exercice {
  let candidats = opts.categorie ? pool.filter((e) => e.categorie === opts.categorie) : pool
  if (candidats.length === 0) candidats = pool
  const frais = candidats.filter((e) => !opts.eviter?.includes(e.id))
  if (frais.length > 0) candidats = frais
  // Pondération : l'exercice du niveau choisi compte triple.
  const poids = candidats.map((e) => (opts.niveau && e.niveau === opts.niveau ? 3 : 1))
  const total = poids.reduce((a, b) => a + b, 0)
  let t = rng() * total
  for (let i = 0; i < candidats.length; i++) {
    t -= poids[i]
    if (t < 0) return candidats[i]
  }
  return candidats[candidats.length - 1]
}

// Mélange de Fisher-Yates, pur (renvoie une copie).
export function melanger<T>(items: T[], rng: Rng = Math.random): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
