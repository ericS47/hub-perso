import Dexie, { type Table } from 'dexie'

// ───────────── Réglages (clé / valeur) ─────────────
// Clés connues : voir SettingsMap. Lire et écrire avec getSetting / setSetting / useSetting (lib/settings).
export interface Setting {
  key: string
  value: unknown
}

export type CompanionKind = 'doudou' | 'robot' | 'doc' | 'animal' | 'bulle'

export interface CompanionSettings {
  kind: CompanionKind
  name: string
  // Couleur principale de l'avatar (hex).
  color: string
  // Façon de s'adresser au patient.
  tutoiement: boolean
}

export interface ReminderSettings {
  enabled: boolean
  // Jour (0 = lundi … 6 = dimanche) et heure du rendez-vous hebdomadaire de planification.
  planningDay: number
  planningTime: string
  // Minutes avant une séance pour le rappel.
  beforeSessionMin: number
  // Messages d'encouragement (remplacent les SMS dans cette version).
  encouragements: boolean
}

export interface SettingsMap {
  companion: CompanionSettings
  reminders: ReminderSettings
  // Prénom ou surnom du patient, saisi à l'accueil.
  firstName: string
  // Premier lancement terminé (choix du compagnon fait).
  welcomeDone: boolean
  // Formule choisie sur l'écran de démonstration.
  plan: 'gratuite' | 'encouragements' | 'premium'
}

// ───────────── Profil ─────────────
// Une ligne par rubrique du questionnaire. Le contenu (data) est typé par la fonctionnalité
// profil (src/features/profil/types.ts) ; les autres fonctionnalités passent par ses lecteurs.
export type ProfileSectionId =
  | 'identite'
  | 'sport'
  | 'onaps'
  | 'foyer'
  | 'travail'
  | 'sante'
  | 'douleurs'
  | 'alimentation'
  | 'hydratation'
  | 'sommeil'
  | 'moral'
  | 'attentes'

export interface ProfileSection {
  section: ProfileSectionId
  data: unknown
  // Rubrique terminée (toutes les questions parcourues).
  done: boolean
  updatedAt: number
}

// ───────────── Contraintes d'emploi du temps ─────────────
// Créneaux occupés, écrits par le profil (travail, enfants, parents…) et lus par l'agenda
// pour proposer les moments libres. day : 0 = lundi … 6 = dimanche.
export interface Constraint {
  id?: number
  label: string
  source: 'travail' | 'enfants' | 'parents' | 'autre'
  day: number
  start: string // 'HH:MM'
  end: string // 'HH:MM'
  // Semaines concernées : toutes, ou alternance petite (A) / grande (B) semaine.
  weekType: 'toutes' | 'A' | 'B'
}

// ───────────── Séances d'activité physique ─────────────
export type SessionStatus = 'prevue' | 'faite' | 'manquee'

export interface Session {
  id?: number
  date: string // 'YYYY-MM-DD'
  start: string // 'HH:MM'
  durationMin: number
  activity: string
  status: SessionStatus
  // Évaluations de 0 à 10, renseignées après la séance.
  envie?: number
  motivation?: number
  plaisir?: number
  note?: string
  // Si manquée : lien vers l'entrée de journal où le patient explique pourquoi.
  journalId?: number
  createdAt: number
}

// ───────────── Journal du confident ─────────────
export type JournalType = 'seance-manquee' | 'grignotage' | 'compulsion' | 'coup-de-mou' | 'libre'

export interface JournalEntry {
  id?: number
  type: JournalType
  // Réponses du patient aux questions du dialogue, dans l'ordre : { question, reponse }.
  answers: { question: string; answer: string }[]
  emotions: string[]
  // Intensité ressentie de 0 à 10.
  intensity?: number
  sessionId?: number
  createdAt: number
}

// ───────────── Météo intérieure (suivi du moral) ─────────────
export interface MoodCheck {
  id?: number
  date: string // 'YYYY-MM-DD'
  moral: number // 0 à 10
  fatigue: number
  stress: number
  createdAt: number
}

// ───────────── Parties de jeux ─────────────
export interface GameResult {
  id?: number
  game: string
  exercisesDone: number
  durationSec: number
  createdAt: number
}

class CompagnonDB extends Dexie {
  settings!: Table<Setting, string>
  profile!: Table<ProfileSection, ProfileSectionId>
  constraints!: Table<Constraint, number>
  sessions!: Table<Session, number>
  journal!: Table<JournalEntry, number>
  moods!: Table<MoodCheck, number>
  games!: Table<GameResult, number>

  constructor() {
    super('compagnon')
    this.version(1).stores({
      settings: 'key',
      profile: 'section',
      constraints: '++id, source, day',
      sessions: '++id, date, status',
      journal: '++id, type, createdAt, sessionId',
      moods: '++id, date',
      games: '++id, game, createdAt',
    })
  }
}

// Base locale uniquement : aucune donnée de santé ne quitte l'appareil.
export const db = new CompagnonDB()
