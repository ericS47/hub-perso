import { db, type Match, type ScoreGame } from '../db'

type Rules = Pick<Match, 'players' | 'rounds' | 'rule' | 'target' | 'overshoot' | 'resetTo'>

// Totaux manche après manche, en appliquant la règle de dépassement du score de fin.
export function totals(match: Pick<Match, 'players' | 'rounds'> & Partial<Rules>) {
  return match.players.map((_, p) =>
    match.rounds.reduce((sum, round) => {
      const next = sum + (round[p] ?? 0)
      if (!match.target || !match.overshoot || next <= match.target) return next
      return match.overshoot === 'reset' ? (match.resetTo ?? 0) : sum
    }, 0),
  )
}

// Joueurs en tête selon la règle du jeu (plusieurs en cas d'égalité).
export function leaders(match: Rules) {
  if (match.rounds.length === 0) return []
  const t = totals(match)
  const best = match.rule === 'high' ? Math.max(...t) : Math.min(...t)
  return match.players.filter((_, i) => t[i] === best)
}

// Vrai quand un joueur a atteint l'objectif (pile, si dépasser est interdit).
export function targetReached(match: Rules) {
  if (!match.target) return false
  return totals(match).some((t) => (match.overshoot ? t === match.target : t >= match.target!))
}

// Points du dernier joueur pour les jeux à total fixe par manche.
export function remainder(roundTotal: number, others: number[]) {
  return roundTotal - others.reduce((a, b) => a + b, 0)
}

export async function startMatch(game: ScoreGame, players: string[]) {
  const now = Date.now()
  return db.matches.add({
    gameId: game.id!,
    gameName: game.name,
    gameIcon: game.icon,
    rule: game.rule,
    target: game.target,
    roundTotal: game.roundTotal,
    overshoot: game.overshoot,
    resetTo: game.resetTo,
    players,
    rounds: [],
    status: 'playing',
    createdAt: now,
    updatedAt: now,
  })
}

// Joueurs proposés d'office : ceux de la dernière partie de ce jeu,
// sinon ceux de la dernière partie tout court.
export async function lastPlayers(gameId: number) {
  const recent = await db.matches.orderBy('updatedAt').reverse().toArray()
  return (recent.find((m) => m.gameId === gameId) ?? recent[0])?.players ?? []
}

export function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}
