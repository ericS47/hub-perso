import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Match, type ScoreGame } from '../db'
import { SCORE_CATEGORIES, ruleLabel, type ScoreCategory } from '../scores/catalog'
import { formatDate, leaders, totals } from '../scores/logic'
import NewMatchSheet from '../components/scores/NewMatchSheet'
import GameFormSheet from '../components/scores/GameFormSheet'

const MAX_FAVORITES = 6

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

// Feuille de route : favoris, parties en cours, jeux par catégorie, historique.
export default function ScoreBoard() {
  const games = useLiveQuery(() => db.scoreGames.orderBy('name').toArray(), [], [] as ScoreGame[])
  const matches = useLiveQuery(() => db.matches.orderBy('updatedAt').reverse().toArray(), [], [] as Match[])
  const [tab, setTab] = useState<ScoreCategory>('societe')
  const [query, setQuery] = useState('')
  const [starting, setStarting] = useState<ScoreGame>()
  const [form, setForm] = useState<ScoreGame | 'new'>()
  const [showHistory, setShowHistory] = useState(false)

  const favorites = games.filter((g) => g.favorite).slice(0, MAX_FAVORITES)
  const playing = matches.filter((m) => m.status === 'playing')
  const finished = matches.filter((m) => m.status === 'finished')
  const plays = (g: ScoreGame) => matches.filter((m) => m.gameId === g.id).length
  const q = norm(query.trim())
  const listed = q ? games.filter((g) => norm(g.name).includes(q)) : games.filter((g) => g.category === tab)

  async function toggleFavorite(g: ScoreGame) {
    if (!g.favorite && favorites.length >= MAX_FAVORITES) {
      window.alert(`${MAX_FAVORITES} favoris maximum : retire d'abord une étoile.`)
      return
    }
    await db.scoreGames.update(g.id!, { favorite: !g.favorite })
  }

  function openForm(g: ScoreGame) {
    setStarting(undefined)
    setForm(g)
  }

  return (
    <div>
      <Link to="/culture/jeux" className="back-link">← Jeux de société</Link>
      <header className="page-head culture-head">
        <div>
          <h1>
            <span aria-hidden="true">📝 </span>Feuille de route
          </h1>
          <p className="muted">Choisis un jeu pour compter les points</p>
        </div>
      </header>

      <section aria-label="Favoris">
        <h2 className="section-title">★ Favoris</h2>
        <div className="fav-grid">
          {Array.from({ length: MAX_FAVORITES }, (_, i) => favorites[i]).map((g, i) =>
            g ? (
              <button key={g.id} type="button" className="fav-tile" onClick={() => setStarting(g)}>
                <span className="fav-icon" aria-hidden="true">{g.icon}</span>
                <span className="fav-name">{g.name}</span>
              </button>
            ) : (
              <div key={`vide-${i}`} className="fav-tile empty" aria-hidden="true">
                <span className="fav-icon">☆</span>
                <span className="fav-name">Touche ☆ sur un jeu</span>
              </div>
            ),
          )}
        </div>
      </section>

      {playing.length > 0 && (
        <section aria-label="Parties en cours">
          <h2 className="section-title">▶️ En cours</h2>
          <ul className="match-list">
            {playing.map((m) => (
              <li key={m.id}>
                <Link to={`/culture/jeux/partie/${m.id}`} className="match-row">
                  <span className="match-icon" aria-hidden="true">{m.gameIcon}</span>
                  <span className="match-text">
                    <strong>{m.gameName}</strong>
                    <span className="muted small-text">
                      {m.players.join(', ')} · manche {m.rounds.length}
                    </span>
                  </span>
                  <span className="match-go">Reprendre ›</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-label="Jeux">
        <h2 className="section-title">Jeux</h2>
        <input
          className="search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un jeu"
          aria-label="Rechercher un jeu"
        />
        {!q && (
          <div className="segmented score-tabs" role="tablist" aria-label="Catégories">
            {SCORE_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={tab === c.id}
                className={tab === c.id ? 'chip active' : 'chip'}
                onClick={() => setTab(c.id)}
              >
                {c.icon} {c.label} <span className="tab-count">{games.filter((g) => g.category === c.id).length}</span>
              </button>
            ))}
          </div>
        )}
        <ul className="game-list">
          {listed.map((g) => (
            <li key={g.id} className="game-row">
              <button type="button" className="game-main" onClick={() => setStarting(g)}>
                <span className="game-icon" aria-hidden="true">{g.icon}</span>
                <span className="match-text">
                  <strong>{g.name}</strong>
                  <span className="muted small-text">
                    {ruleLabel(g.rule, g.target)}
                    {plays(g) > 0 && ` · ${plays(g)} partie(s)`}
                  </span>
                </span>
              </button>
              <button
                type="button"
                className={g.favorite ? 'star on' : 'star'}
                aria-pressed={g.favorite}
                aria-label={g.favorite ? `Retirer ${g.name} des favoris` : `Mettre ${g.name} en favori`}
                onClick={() => toggleFavorite(g)}
              >
                {g.favorite ? '★' : '☆'}
              </button>
            </li>
          ))}
          {listed.length === 0 && <li className="muted small-text">Aucun jeu trouvé.</li>}
        </ul>
        <button type="button" className="btn ghost add-game" onClick={() => setForm('new')}>
          + Ajouter un jeu
        </button>
      </section>

      {finished.length > 0 && (
        <section aria-label="Historique">
          <button type="button" className="section-title section-toggle" onClick={() => setShowHistory((v) => !v)}>
            🕓 Historique ({finished.length}) {showHistory ? '▾' : '▸'}
          </button>
          {showHistory && (
            <ul className="match-list">
              {finished.map((m) => {
                const winners = m.winners ?? leaders(m)
                const score = totals(m)[m.players.indexOf(winners[0])]
                return (
                  <li key={m.id}>
                    <Link to={`/culture/jeux/partie/${m.id}`} className="match-row">
                      <span className="match-icon" aria-hidden="true">{m.gameIcon}</span>
                      <span className="match-text">
                        <strong>{m.gameName}</strong>
                        <span className="muted small-text">
                          {formatDate(m.updatedAt)} · 🏆 {winners.join(', ')} ({score} pts)
                        </span>
                      </span>
                      <span className="match-go">›</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      )}

      {starting && <NewMatchSheet game={starting} onClose={() => setStarting(undefined)} onEdit={() => openForm(starting)} />}
      {form && (
        <GameFormSheet
          game={form === 'new' ? undefined : form}
          defaultCategory={tab}
          onClose={() => setForm(undefined)}
        />
      )}
    </div>
  )
}
