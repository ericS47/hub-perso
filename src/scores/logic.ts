import { db, type Match, type ScoreGame } from '../db'

export function totals(match: Pick<Match, 'players' | 'rounds'>) {
  return match.players.map((_, p) => match.rounds.reduce((sum, round) => sum + (round[p] ?? 0), 0))
}

// Joueurs en tête selon la règle du jeu (plusieurs en cas d'égalité).
export function leaders(match: Pick<Match, 'players' | 'rounds' | 'rule'>) {
  if (match.rounds.length === 0) return []
  const t = totals(match)
  const best = match.rule === 'high' ? Math.max(...t) : Math.min(...t)
  return match.players.filter((_, i) => t[i] === best)
}

// Vrai quand un joueur a atteint l'objectif : la partie peut se terminer.
export function targetReached(match: Pick<Match, 'players' | 'rounds' | 'target'>) {
  return !!match.target && totals(match).some((t) => t >= match.target!)
}

export async function startMatch(game: ScoreGame, players: string[]) {
  const now = Date.now()
  return db.matches.add({
    gameId: game.id!,
    gameName: game.name,
    gameIcon: game.icon,
    rule: game.rule,
    target: game.target,
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
