import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Match } from '../db'
import { ruleLabel } from '../scores/catalog'
import { formatDate, leaders, progression, ranking, targetReached, totals } from '../scores/logic'
import RoundSheet from '../components/scores/RoundSheet'
import Podium from '../components/scores/Podium'
import ScoreChart from '../components/scores/ScoreChart'

// Feuille de score d'une partie : une colonne par joueur, une ligne par manche.
export default function MatchPage() {
  const { matchId } = useParams()
  const navigate = useNavigate()
  const match = useLiveQuery(async () => (await db.matches.get(Number(matchId))) ?? null, [matchId])
  const [round, setRound] = useState<number | 'new'>()

  if (match === undefined) return null
  if (match === null) {
    return (
      <section className="card">
        <h1>Partie introuvable</h1>
        <Link to="/culture/jeux/scores">Retour à la feuille de route</Link>
      </section>
    )
  }

  const m = match
  const t = totals(m)
  const top = leaders(m)
  const over = targetReached(m)
  const finished = m.status === 'finished'
  const winners = finished ? (m.winners ?? top) : over ? top : []

  async function save(changes: Partial<Match>) {
    await db.matches.update(m.id!, { ...changes, updatedAt: Date.now() })
  }

  function saveRound(points: number[]) {
    if (round === 'new' || round === undefined) save({ rounds: [...m.rounds, points] })
    else save({ rounds: m.rounds.map((r, i) => (i === round ? points : r)) })
  }

  async function finish() {
    if (m.rounds.length === 0) return
    await save({ status: 'finished', winners: top })
  }

  async function replay() {
    const now = Date.now()
    const { id: _old, ...rest } = m
    void _old
    const id = await db.matches.add({ ...rest, rounds: [], status: 'playing', winners: undefined, createdAt: now, updatedAt: now })
    navigate(`/culture/jeux/partie/${id}`)
  }

  async function remove() {
    if (!window.confirm('Supprimer cette partie ?')) return
    await db.matches.delete(m.id!)
    navigate('/culture/jeux/scores')
  }

  return (
    <div>
      <Link to="/culture/jeux/scores" className="back-link">← Feuille de route</Link>
      <header className="page-head">
        <h1>
          <span aria-hidden="true">{m.gameIcon} </span>
          {m.gameName}
        </h1>
        <p className="muted">
          {ruleLabel(m)} · {formatDate(m.createdAt)}
        </p>
      </header>

      {winners.length > 0 && (
        <div className={finished ? 'winner-banner' : 'winner-banner pending'} role="status">
          🏆 {winners.join(' et ')} {winners.length > 1 ? 'gagnent' : 'gagne'} !
          {!finished && (
            <button type="button" className="btn" onClick={finish}>
              Terminer la partie
            </button>
          )}
        </div>
      )}

      {/* Partie terminée : récapitulatif (podium et évolution) à la place des totaux. */}
      {finished && m.rounds.length > 0 && (
        <>
          <Podium ranked={ranking(m)} />
          <ScoreChart players={m.players} series={progression(m)} target={m.target} />
        </>
      )}

      {!finished && (
        <div className="score-totals">
          {m.players.map((p, i) => {
            const lead = m.rounds.length > 0 && top.includes(p)
            return (
              <div key={p} className={lead ? 'total-card lead' : 'total-card'}>
                <span className="total-name">
                  {lead && <span aria-label="en tête">👑 </span>}
                  {p}
                </span>
                <span className="total-value">{t[i]}</span>
                {m.target && (
                  <span className="total-bar" aria-hidden="true">
                    <span style={{ width: `${Math.min(100, Math.max(0, (t[i] / m.target) * 100))}%` }} />
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="score-table-wrap">
        <table className="score-table">
          <thead>
            <tr>
              <th scope="col">#</th>
              {m.players.map((p) => (
                <th key={p} scope="col">
                  {p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {m.rounds.map((r, ri) => (
              <tr
                key={ri}
                onClick={() => !finished && setRound(ri)}
                className={finished ? undefined : 'editable'}
                aria-label={finished ? undefined : `Modifier la manche ${ri + 1}`}
              >
                <th scope="row">{ri + 1}</th>
                {m.players.map((p, pi) => (
                  <td key={p} className={(r[pi] ?? 0) < 0 ? 'neg' : undefined}>
                    {r[pi] ?? 0}
                  </td>
                ))}
              </tr>
            ))}
            {m.rounds.length === 0 && (
              <tr>
                <td colSpan={m.players.length + 1} className="muted small-text empty-row">
                  Aucune manche : touche « + Manche » pour noter les premiers points.
                </td>
              </tr>
            )}
          </tbody>
          {m.rounds.length > 0 && (
            <tfoot>
              <tr>
                <th scope="row">Σ</th>
                {t.map((v, i) => (
                  <td key={i}>{v}</td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="match-actions">
        {finished ? (
          <>
            <button type="button" className="btn" onClick={replay}>
              🔁 Rejouer (mêmes joueurs)
            </button>
            <button type="button" className="btn ghost" onClick={() => save({ status: 'playing', winners: undefined })}>
              Reprendre la partie
            </button>
          </>
        ) : (
          <>
            <button type="button" className="btn big" onClick={() => setRound('new')}>
              + Manche
            </button>
            {!over && m.rounds.length > 0 && (
              <button type="button" className="btn ghost" onClick={finish}>
                Terminer la partie
              </button>
            )}
          </>
        )}
        <button type="button" className="link-btn small-link danger" onClick={remove}>
          Supprimer la partie
        </button>
      </div>

      {round !== undefined && (
        <RoundSheet
          key={String(round)}
          players={m.players}
          roundTotal={m.roundTotal}
          round={round === 'new' ? undefined : { index: round, points: m.rounds[round] }}
          onSave={saveRound}
          onDelete={round === 'new' ? undefined : () => save({ rounds: m.rounds.filter((_, i) => i !== round) })}
          onClose={() => setRound(undefined)}
        />
      )}
    </div>
  )
}
