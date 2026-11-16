// Fournisseur « script » : des dialogues déclaratifs (des données) parcourus nœud par nœud.
// Voir engine/types.ts pour l'interface commune avec un futur fournisseur « IA ».

import { makeT, pick, type T } from '../voice'
import {
  answerText,
  emotionLabel,
  type Answer,
  type ConversationContext,
  type ConversationState,
  type DialogueProvider,
  type Exchange,
  type InputSpec,
  type ScriptId,
  type Turn,
  type TurnAction,
} from './types'

// Outils mis à disposition des scripts pour écrire leurs textes.
export interface ScriptCtx {
  t: T
  // Tire une formulation au sort.
  pick: <V>(variants: readonly V[]) => V
  firstName: string
  name: string
  context: ConversationContext
  // Réponse donnée à un nœud (undefined si pas posée ou passée).
  answer: (nodeId: string) => Answer | undefined
  value: (nodeId: string) => string | undefined
  values: (nodeId: string) => string[]
  text: (nodeId: string) => string | undefined
  num: (nodeId: string) => number | undefined
  // Libellés choisis, en minuscules, pour les reformulations (« la fatigue et le stress »).
  labels: (nodeId: string) => string[]
  // Réponse complète lisible.
  said: (nodeId: string) => string
}

// Une ligne de message : un texte, plusieurs variantes (une tirée au sort), ou rien.
export type Line = string | readonly string[] | null | undefined | false

export interface ScriptNode {
  say: (c: ScriptCtx) => Line[]
  // Réponse attendue. Sans input, le nœud termine la conversation.
  input?: InputSpec | ((c: ScriptCtx) => InputSpec)
  // Libellé stable rangé dans le journal.
  question?: string
  // Nœud suivant (chaîne ou calcul selon la réponse). undefined = nœud 'fin'.
  next?: string | ((c: ScriptCtx, a: Answer) => string | undefined)
  actions?: (c: ScriptCtx) => TurnAction[]
  skippable?: boolean
}

export interface Script {
  id: ScriptId
  start: string
  nodes: Record<string, ScriptNode>
}

export function makeCtx(state: ConversationState): ScriptCtx {
  const { context, exchanges } = state
  const find = (id: string): Exchange | undefined => {
    for (let i = exchanges.length - 1; i >= 0; i--) if (exchanges[i].turnId === id) return exchanges[i]
    return undefined
  }
  const answer = (id: string) => {
    const a = find(id)?.answer
    return a && !a.skipped ? a : undefined
  }
  return {
    t: makeT(context.voice.tutoiement),
    pick,
    firstName: context.voice.firstName,
    name: context.voice.companionName,
    context,
    answer,
    value: (id) => answer(id)?.values?.[0],
    values: (id) => answer(id)?.values ?? [],
    text: (id) => answer(id)?.text?.trim() || undefined,
    num: (id) => answer(id)?.number,
    labels: (id) => {
      const ex = find(id)
      if (!ex || ex.answer.skipped) return []
      const vals = ex.answer.values ?? []
      const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)
      return vals
        .map((v) => (ex.input.kind === 'choice' ? ex.input.options.find((o) => o.value === v)?.label : emotionLabel(v)))
        .filter((s): s is string => !!s)
        .map(lower)
    },
    said: (id) => {
      const ex = find(id)
      return ex ? answerText(ex.input, ex.answer) : ''
    },
  }
}

function renderLines(lines: Line[]): string[] {
  const out: string[] = []
  for (const l of lines) {
    if (!l) continue
    const s = typeof l === 'string' ? l : pick(l)
    if (s) out.push(s)
  }
  return out
}

export function scriptProvider(scripts: Record<ScriptId, Script>): DialogueProvider {
  return {
    nextTurn(state) {
      const script = scripts[state.context.script]
      const ctx = makeCtx(state)
      let nodeId = script.start
      const last = state.exchanges[state.exchanges.length - 1]
      if (last) {
        const node = script.nodes[last.turnId]
        const next = node?.next
        const target = typeof next === 'function' ? next(ctx, last.answer) : next
        nodeId = target ?? 'fin'
      }
      const node = script.nodes[nodeId] ?? script.nodes.fin
      const input = typeof node.input === 'function' ? node.input(ctx) : node.input
      const turn: Turn = {
        id: nodeId,
        messages: renderLines(node.say(ctx)),
        input,
        question: node.question,
        skippable: node.skippable ?? true,
        actions: node.actions?.(ctx),
        end: !input,
      }
      return turn
    },
  }
}
