import { useState } from 'react'
import { remainder } from '../../scores/logic'
import Sheet from '../Sheet'

interface Props {
  players: string[]
  // Points distribués à chaque manche (Papayoo 250, Belote 162, Tarot 0).
  roundTotal?: number
  // Manche à modifier (son numéro et ses points) ; absente pour une nouvelle.
  round?: { index: number; points: number[] }
  onSave: (points: number[]) => void
  onDelete?: () => void
  onClose: () => void
}

// Saisie des points d'une manche. Le clavier numérique de l'iPhone n'a pas
// de signe moins : un bouton ± par joueur le remplace.
export default function RoundSheet({ players, roundTotal, round, onSave, onDelete, onClose }: Props) {
  const [values, setValues] = useState(players.map((_, i) => (round ? String(Math.abs(round.points[i] ?? 0)) : '')))
  const [negative, setNegative] = useState(players.map((_, i) => (round?.points[i] ?? 0) < 0))

  const points = values.map((v, i) => (Number(v) || 0) * (negative[i] ? -1 : 1))
  const empty = values.map((v, i) => (v === '' ? i : -1)).filter((i) => i >= 0)
  // Jeu à total fixe : quand il ne reste qu'un joueur à saisir, sa part est proposée.
  const suggestIndex = roundTotal !== undefined && players.length > 1 && empty.length === 1 ? empty[0] : -1
  const suggestion =
    suggestIndex >= 0 ? remainder(roundTotal!, points.filter((_, i) => i !== suggestIndex)) : undefined
  const sum = points.reduce((a, b) => a + b, 0)
  const mismatch = roundTotal !== undefined && empty.length === 0 && sum !== roundTotal

  function setValue(i: number, v: string) {
    setValues((vs) => vs.map((x, j) => (j === i ? v.replace(/[^\d]/g, '') : x)))
  }

  function toggleSign(i: number) {
    setNegative((ns) => ns.map((x, j) => (j === i ? !x : x)))
  }

  function save(e: React.FormEvent) {
    e.preventDefault()
    onSave(points.map((p, i) => (i === suggestIndex ? suggestion! : p)))
    onClose()
  }

  const fmt = (n: number) => (n < 0 ? `−${Math.abs(n)}` : String(n))

  return (
    <Sheet title={round ? `Manche ${round.index + 1}` : 'Nouvelle manche'} onClose={onClose}>
      <form className="item-form" onSubmit={save}>
        {players.map((p, i) => (
          <label key={p} className="round-input">
            <span className="round-name">{p}</span>
            <button
              type="button"
              className={negative[i] ? 'sign on' : 'sign'}
              aria-pressed={negative[i]}
              aria-label={`Points négatifs pour ${p}`}
              onClick={() => toggleSign(i)}
            >
              ±
            </button>
            <input
              className={i === suggestIndex ? 'field round-field suggested' : 'field round-field'}
              value={(negative[i] && values[i] ? '−' : '') + values[i]}
              onChange={(e) => setValue(i, e.target.value)}
              inputMode="numeric"
              placeholder={i === suggestIndex ? fmt(suggestion!) : '0'}
              autoFocus={i === 0}
              aria-label={`Points de ${p}`}
              onFocus={(e) => e.target.select()}
            />
          </label>
        ))}

        {roundTotal !== undefined && (
          <p className={mismatch ? 'round-hint warn' : 'round-hint'} role="status">
            {suggestIndex >= 0
              ? `Proposé pour ${players[suggestIndex]} : ${fmt(suggestion!)} (Valider pour l'accepter)`
              : mismatch
                ? `⚠️ Total de la manche : ${fmt(sum)} au lieu de ${fmt(roundTotal)}`
                : empty.length > 1
                  ? `${roundTotal === 0 ? 'Somme nulle' : `${roundTotal} points par manche`} : la part du dernier joueur sera proposée`
                  : `✓ Total de la manche : ${fmt(sum)}`}
          </p>
        )}

        <div className="form-actions">
          <button type="submit" className="btn">
            Valider
          </button>
          {onDelete && (
            <button
              type="button"
              className="link-btn danger"
              onClick={() => {
                if (window.confirm('Supprimer cette manche ?')) {
                  onDelete()
                  onClose()
                }
              }}
            >
              Supprimer la manche
            </button>
          )}
        </div>
      </form>
    </Sheet>
  )
}
