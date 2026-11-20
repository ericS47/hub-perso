import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Match } from '../db'
import { leaders } from '../scores/logic'

const ME_KEY = 'scores-me'

function readMe() {
  try {
    return localStorage.getItem(ME_KEY) ?? undefined
  } catch {
    return undefined
  }
}

function ranking(counts: Map<string, number>) {
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'fr'))
}

function Bars({ rows, unit, extra }: { rows: [string, number][]; unit: string; extra?: (name: string) => string }) {
  const max = Math.max(1, ...rows.map((r) => r[1]))
  if (rows.length === 0) return <p className="muted small-text">Pas encore de données.</p>
  return (
    <ol className="stat-bars">
      {rows.map(([name, n], i) => (
        <li key={name}>
          <span className="stat-rank">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</span>
          <span className="stat-body">
            <span className="stat-line">
              <strong>{name}</strong>
              <span className="muted small-text">
                {n} {unit}
                {extra ? ` · ${extra(name)}` : ''}
              </span>
            </span>
            <span className="stat-bar" aria-hidden="true">
              <span style={{ width: `${(n / max) * 100}%` }} />
            </span>
          </span>
        </li>
      ))}
    </ol>
  )
}

// Statistiques des parties terminées : victoires, partenaires, jeux.
export default function ScoreStats() {
  const all = useLiveQuery(() => db.matches.where('status').equals('finished').toArray(), [], [] as Match[])
  const [gameId, setGameId] = useState<number>()
  const [me, setMe] = useState<string | undefined>(readMe)

  const games = [...new Map(all.map((m) => [m.gameId, { id: m.gameId, name: m.gameName, icon: m.gameIcon }])).values()].sort(
    (a, b) => a.name.localeCompare(b.name, 'fr'),
  )
  const matches = all.filter((m) => gameId === undefined || m.gameId === gameId)

  const played = new Map<string, number>()
  const wins = new Map<string, number>()
  const byGame = new Map<string, number>()
  for (const m of matches) {
    for (const p of m.players) played.set(p, (played.get(p) ?? 0) + 1)
    for (const w of m.winners ?? leaders(m)) wins.set(w, (wins.get(w) ?? 0) + 1)
    const label = `${m.gameIcon} ${m.gameName}`
    byGame.set(label, (byGame.get(label) ?? 0) + 1)
  }

  // « Moi » : le nom choisi, sinon le plus présent dans les parties.
  const players = ranking(played).map(([p]) => p)
  const self = me && played.has(me) ? me : players[0]
  const partners = new Map<string, number>()
  for (const m of matches) {
    if (!self || !m.players.includes(self)) continue
    for (const p of m.players) if (p !== self) partners.set(p, (partners.get(p) ?? 0) + 1)
  }
  const myGames = matches.filter((m) => self && m.players.includes(self)).length
  const myWins = self ? (wins.get(self) ?? 0) : 0

  function chooseMe(name: string) {
    setMe(name)
    try {
      localStorage.setItem(ME_KEY, name)
    } catch {
      // Stockage indisponible : le choix vaut pour cette visite.
    }
  }

  const rate = (name: string) => `${Math.round(((wins.get(name) ?? 0) / (played.get(name) ?? 1)) * 100)} % de victoires`

  return (
    <div>
      <Link to="/culture/jeux" className="back-link">← Jeux de société</Link>
      <header className="page-head">
        <h1>
          <span aria-hidden="true">📊 </span>Statistiques
        </h1>
        <p className="muted">
          {matches.length} partie(s) terminée(s){gameId !== undefined ? '' : ` · ${games.length} jeu(x)`}
        </p>
      </header>

      {all.length === 0 ? (
        <section className="card empty">
          <p className="muted">Termine une première partie dans la feuille de route pour voir tes statistiques.</p>
          <Link to="/culture/jeux/scores" className="btn">
            Aller à la feuille de route
          </Link>
        </section>
      ) : (
        <>
          <div className="filters scroll-row" role="group" aria-label="Filtrer par jeu">
            <button
              type="button"
              className={gameId === undefined ? 'chip small active' : 'chip small'}
              onClick={() => setGameId(undefined)}
            >
              Tous les jeux
            </button>
            {games.map((g) => (
              <button
                key={g.id}
                type="button"
                className={gameId === g.id ? 'chip small active' : 'chip small'}
                aria-pressed={gameId === g.id}
                onClick={() => setGameId(g.id)}
              >
                {g.icon} {g.name}
              </button>
            ))}
          </div>

          {self && (
            <section className="card stat-me">
              <div className="players-head">
                <h2 className="section-title no-margin">👤 {self}</h2>
                <label className="small-text muted">
                  C'est moi :{' '}
                  <select className="me-select" value={self} onChange={(e) => chooseMe(e.target.value)}>
                    {players.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="stat-kpis">
                <span>
                  <strong>{myGames}</strong>
                  <span className="muted small-text">parties</span>
                </span>
                <span>
                  <strong>{myWins}</strong>
                  <span className="muted small-text">victoires</span>
                </span>
                <span>
                  <strong>{myGames ? Math.round((myWins / myGames) * 100) : 0} %</strong>
                  <span className="muted small-text">de réussite</span>
                </span>
              </div>
            </section>
          )}

          <section>
            <h2 className="section-title">🏆 Qui a le plus gagné</h2>
            <Bars rows={ranking(wins)} unit="victoire(s)" extra={rate} />
          </section>

          <section>
            <h2 className="section-title">🤝 Avec qui {self} a le plus joué</h2>
            <Bars rows={ranking(partners)} unit="partie(s) ensemble" />
          </section>

          {gameId === undefined && (
            <section>
              <h2 className="section-title">🎲 Jeux les plus joués</h2>
              <Bars rows={ranking(byGame)} unit="partie(s)" />
            </section>
          )}
        </>
      )}
    </div>
  )
}
