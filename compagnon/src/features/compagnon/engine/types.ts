// ═══════════════════════════════════════════════════════════════════════════
//  Moteur de conversation du compagnon — types communs
// ═══════════════════════════════════════════════════════════════════════════
//
//  POINT D'EXTENSION « IA »
//  L'écran de conversation (pages/Talk.tsx) ne connaît qu'une chose :
//
//      provider.nextTurn(state)  →  le tour suivant du compagnon
//
//  - `state` contient tout ce qui a été dit (échanges) et le contexte (prénom,
//    tutoiement, séance concernée, raisons notées dans le profil…).
//  - Le `Turn` renvoyé contient les messages du compagnon, la forme de réponse
//    attendue (pastilles, texte, échelle, émotions) et d'éventuelles actions.
//
//  Aujourd'hui, le fournisseur est `scriptProvider` (dialogues écrits à l'avance,
//  dossier scripts/). Demain, un fournisseur « IA » pourra implémenter la même
//  interface `DialogueProvider` (en asynchrone : nextTurn peut renvoyer une
//  Promise) sans changer l'écran. Il devra :
//    - garder le filet de sécurité : envelopper le fournisseur avec `withSafety`
//      (engine/withSafety.ts), qui passe AVANT lui ;
//    - respecter les mêmes règles : ne jamais se présenter comme un humain ni
//      comme un soignant, aucun diagnostic, aucun conseil médical ou nutritionnel ;
//    - renvoyer un tour `end: true` avec un court résumé pour clore la conversation.
// ═══════════════════════════════════════════════════════════════════════════

import type { JournalType, Session } from '../../../db'

// Les scripts disponibles : un par type de journal, plus « bonne nouvelle » (rangée en 'libre').
export type ScriptId = JournalType | 'bonne-nouvelle'

export interface Option {
  value: string
  label: string
}

// Forme de réponse attendue.
export type InputSpec =
  | {
      kind: 'choice'
      options: Option[]
      multiple?: boolean
      // Champ texte en plus des pastilles (« autre chose… »).
      allowText?: boolean
      placeholder?: string
    }
  | { kind: 'text'; placeholder?: string; long?: boolean }
  | {
      kind: 'scale'
      minLabel?: string
      maxLabel?: string
      // Ce que mesure l'échelle : 'moral' déclenche la vérification de sécurité,
      // 'intensity' est rangée dans JournalEntry.intensity.
      measure?: 'moral' | 'intensity' | 'faim' | 'autre'
    }
  | { kind: 'emotions'; allowText?: boolean }

export interface Answer {
  values?: string[]
  text?: string
  number?: number
  skipped?: boolean
}

// Une question posée et la réponse donnée.
export interface Exchange {
  turnId: string
  // Libellé court et stable, rangé dans le journal (ex. « Émotions avant »).
  question: string
  input: InputSpec
  answer: Answer
}

export type TurnAction =
  | { kind: 'link'; to: string; label: string }
  | { kind: 'tel'; number: string; label: string; detail?: string }
  | { kind: 'breathing'; label: string }
  | { kind: 'share'; label: string; text: string }

export interface Turn {
  // Identifiant du tour (pour le script : l'id du nœud).
  id: string
  // Bulles du compagnon, dans l'ordre.
  messages: string[]
  // Réponse attendue ; absente sur le dernier tour.
  input?: InputSpec
  question?: string
  // Peut-on passer la question ? (oui par défaut)
  skippable?: boolean
  actions?: TurnAction[]
  // Ton particulier (message de sécurité).
  tone?: 'safety'
  // Fin de conversation : l'écran enregistre l'entrée du journal.
  end?: boolean
}

export interface Voice {
  tutoiement: boolean
  companionName: string
  firstName: string
}

export interface ConversationContext {
  script: ScriptId
  voice: Voice
  // Séance manquée concernée (lien depuis l'agenda).
  session?: Session
  // Phrases tirées de la rubrique « attentes » du profil (peut être vide).
  attentes: string[]
  // Nombre d'entrées récentes (14 jours) par type, pour orienter si besoin.
  recent: Partial<Record<JournalType, number>>
}

export interface ConversationState {
  context: ConversationContext
  exchanges: Exchange[]
}

export interface DialogueProvider {
  nextTurn(state: ConversationState): Turn | Promise<Turn>
}

// Texte lisible d'une réponse (pour les bulles et le journal).
export function answerText(input: InputSpec, answer: Answer): string {
  if (answer.skipped) return ''
  const parts: string[] = []
  if (input.kind === 'choice' && answer.values) {
    for (const v of answer.values) {
      const o = input.options.find((x) => x.value === v)
      if (o) parts.push(o.label)
    }
  }
  if (input.kind === 'emotions' && answer.values) {
    for (const v of answer.values) parts.push(emotionLabel(v))
  }
  if (input.kind === 'scale' && answer.number !== undefined) parts.push(`${answer.number}/10`)
  if (answer.text?.trim()) parts.push(answer.text.trim())
  return parts.join(', ')
}

// Émotions proposées (sélecteur d'émotions).
export const EMOTIONS: { value: string; label: string; emoji: string }[] = [
  { value: 'ennui', label: 'Ennui', emoji: '😶' },
  { value: 'stress', label: 'Stress', emoji: '😬' },
  { value: 'tristesse', label: 'Tristesse', emoji: '😢' },
  { value: 'colere', label: 'Colère', emoji: '😠' },
  { value: 'solitude', label: 'Solitude', emoji: '🫥' },
  { value: 'fatigue', label: 'Fatigue', emoji: '😴' },
  { value: 'anxiete', label: 'Anxiété', emoji: '😟' },
  { value: 'frustration', label: 'Frustration', emoji: '😤' },
  { value: 'joie', label: 'Joie', emoji: '😊' },
]

export function emotionLabel(value: string): string {
  return EMOTIONS.find((e) => e.value === value)?.label ?? value
}
