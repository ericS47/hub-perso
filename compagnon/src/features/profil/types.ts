import type { ProfileSectionId } from '../../db'

// Contenu typé de chaque rubrique du profil (champ data de db.profile).
// Tous les champs sont facultatifs : toute question peut être passée.

// ───── Emploi du temps (travail, enfants, parents) ─────
export interface TimeSlot {
  day: number // 0 = lundi … 6 = dimanche
  start: string // 'HH:MM'
  end: string // 'HH:MM' ; si end < start, la plage déborde sur le lendemain (travail de nuit)
}

// standard : même planning chaque semaine ; alterne : deux semaines qui alternent ;
// aleatoire : pas de planning fixe, le patient ajuste chaque semaine dans l'agenda.
export type ScheduleFormat = 'standard' | 'alterne' | 'aleatoire'

export interface Schedule {
  format?: ScheduleFormat
  slots?: TimeSlot[] // semaine standard, ou 1re semaine de l'alternance (petite semaine)
  slotsAlt?: TimeSlot[] // 2e semaine de l'alternance (grande semaine)
  // Lettre de semaine (A = semaine ISO paire, B = impaire) de la 1re semaine de l'alternance.
  firstWeekType?: 'A' | 'B'
  note?: string
}

// ───── Qui je suis ─────
export interface IdentiteData {
  birthDate?: string // 'YYYY-MM-DD'
  birthPlace?: string
  heightCm?: number
  weightKg?: number
}

export interface ClubSport {
  id: string
  sport: string
  from?: string // année ou période libre
  to?: string
  stopReason?: string
}

export type Since = 'moins3mois' | '3a12mois' | '1a3ans' | 'plus3ans'
export type Regularity = 'rarement' | 'mois' | 'semaine1' | 'semaine2-3' | 'semaine4' | 'variable'

export interface CurrentActivity {
  id: string
  what: string
  since?: Since
  regularity?: Regularity
}

export interface SportData {
  schoolLiked?: boolean
  schoolWhy?: string
  club?: boolean
  clubSports?: ClubSport[]
  autonomy?: boolean
  autonomyWhat?: string
  sportyNow?: boolean
  current?: CurrentActivity[]
}

// Questionnaire d'activité physique et de sédentarité (inspiré de l'ONAPS-PAQ).
export interface ActivityBlock {
  yes?: boolean
  days?: number // jours par semaine (0-7)
  minPerDay?: number
}

export interface OnapsData {
  workVigorous?: ActivityBlock
  workModerate?: ActivityBlock
  travelActive?: ActivityBlock
  leisureVigorous?: ActivityBlock
  leisureModerate?: ActivityBlock
  homeModerate?: ActivityBlock
  sittingHoursPerDay?: number
  screenHoursPerDay?: number
}

export type Couple = 'celibataire' | 'couple' | 'marie' | 'separe' | 'veuf' | 'nsp'
export type Custody = 'totale' | 'alternee' | 'partielle' | 'non'

export interface FoyerData {
  couple?: Couple
  children?: boolean
  childrenCount?: number
  childrenAges?: string
  custody?: Custody
  childSchedule?: Schedule
  parents?: boolean
  parentsLoad?: number // 0-10 : à quel point c'est prenant
  parentsNote?: string
  parentsSchedule?: Schedule
}

export type WorkStatus = 'retraite' | 'recherche' | 'arret' | 'etudes' | 'foyer' | 'autre'

// Un emploi : on peut en cumuler plusieurs, chacun avec sa structure et ses horaires.
export interface Emploi {
  id: string
  employer: string // nom de la structure (entreprise, association, particulier…)
  job?: string
  schedule?: Schedule
}

export interface TravailData {
  works?: boolean
  jobs?: Emploi[]
  status?: WorkStatus
  // Ancien format (un seul emploi) : relu par travailJobs() puis remplacé par jobs.
  job?: string
  schedule?: Schedule
}

// ───── Ma santé ─────
export interface Pathology {
  id: string
  name: string
  treatment?: boolean
  treatmentDetail?: string
}

export interface SanteData {
  hasPathologies?: boolean
  pathologies?: Pathology[]
  familyMother?: string[]
  familyFather?: string[]
  familyNote?: string
}

export type ZoneId =
  | 'tete'
  | 'nuque'
  | 'epaules'
  | 'poitrine'
  | 'haut-dos'
  | 'bas-dos'
  | 'ventre'
  | 'coudes'
  | 'mains'
  | 'hanches'
  | 'genoux'
  | 'pieds'
  | 'autre'

export interface PainZone {
  zone: ZoneId
  repos?: number
  effort?: number
  nuit?: number
  note?: string
}

export interface DouleursData {
  hasPain?: boolean
  zones?: PainZone[]
  otherZone?: string
}

// ───── Mon alimentation ─────
export type MealKind = 'petit-dejeuner' | 'dejeuner' | 'diner' | 'collation'

export interface MealExtra {
  on?: boolean
  detail?: string
}

// Proportions de l'assiette, en pourcentage (total 100).
export interface PlateShares {
  feculents: number
  legumes: number
  proteines: number
}

export interface Meal {
  id: string
  kind: MealKind
  skipped?: boolean
  entree?: MealExtra
  plate?: PlateShares
  plateNote?: string
  fromage?: MealExtra
  dessert?: MealExtra
  // Collation : ce qu'elle contient et le moment.
  items?: string[]
  time?: string
  note?: string
}

export type Often = 'oui' | 'parfois' | 'non'

// Où se prend un repas (plusieurs réponses possibles : ça peut changer selon les jours).
export type MealPlace = 'maison' | 'emporte' | 'restaurant' | 'cantine' | 'achat'
export type RestaurantWhy = 'plaisir' | 'travail'

export interface MealHabit {
  places?: MealPlace[]
  restaurantPerWeek?: number // fois par semaine au restaurant pour ce repas
  restaurantWhy?: RestaurantWhy[]
}

export interface AlimentationData {
  lunch?: MealHabit
  dinner?: MealHabit
  // Ancien format (restaurant sans distinguer midi et soir), conservé tel quel.
  restaurant?: 'jamais' | 'parfois' | 'souvent'
  restaurantPerWeek?: number
  restaurantWhy?: RestaurantWhy[]
  allergies?: boolean
  allergiesDetail?: string
  aversions?: string
  meals?: Meal[]
  compulsions?: boolean
  compulsionEmotions?: string[]
  compulsionContexts?: string[]
  compulsionNote?: string
  mindful?: Often
  seated?: Often
  screens?: ('telephone' | 'tv' | 'aucun')[]
  pleasant?: Often
  lookForward?: Often
}

// ───── Mon hydratation ─────
export type WaterAmount = 'moins05' | '05a1' | '1a15' | '15a2' | 'plus2'
export type AlcoholFreq = 'jamais' | 'occasion' | 'semaine1-2' | 'semaine3-5' | 'quotidien'

export interface HydratationData {
  coffee?: boolean
  coffeeCups?: number
  tea?: boolean
  teaCups?: number
  otherDrinks?: string
  water?: WaterAmount
  sodas?: boolean
  sodaTypes?: ('normal' | 'zero')[]
  sodaFreq?: 'rarement' | 'semaine' | 'quotidien'
  sodaAmount?: string
  alcohol?: AlcoholFreq
  alcoholContexts?: string[]
  alcoholQty?: number // verres par occasion
  alcoholWhy?: string[]
  alcoholNote?: string
}

// ───── Mon moral ─────
export interface MoralData {
  moral?: number
  moralBefore?: number
  epanoui?: number
  fatigue?: number
  stress?: number
  bodyImage?: number
  note?: string
}

// ───── Mes attentes ─────
export interface AttentesData {
  reasons?: string[]
  why?: string
  expectations?: string
}

export interface SectionDataMap {
  identite: IdentiteData
  sport: SportData
  onaps: OnapsData
  foyer: FoyerData
  travail: TravailData
  sante: SanteData
  douleurs: DouleursData
  alimentation: AlimentationData
  hydratation: HydratationData
  moral: MoralData
  attentes: AttentesData
}

// Vérifie à la compilation que toutes les rubriques de db.ts sont couvertes.
export type AssertAllSections = SectionDataMap[ProfileSectionId]

export type SectionStatus = 'todo' | 'progress' | 'done'
