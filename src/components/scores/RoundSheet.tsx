import { useState } from 'react'
import Sheet from '../Sheet'

interface Props {
  players: string[]
  // Manche à modifier (son numéro et ses points) ; absente pour une nouvelle.
  round?: { index: number; points: number[] }
  onSave: (points: number[]) => void
  onDelete?: () => void
  onClose: () => void
}

// Saisie des points d'une manche. Le clavier numérique de l'iPhone n'a pas
// de signe moins : un bouton ± par joueur le remplace.
export default function RoundSheet({ players, round, onSave, onDelete, onClose }: Props) {
  const [values, setValues] = useState(players.map((_, i) => (round ? String(Math.abs(round.points[i] ?? 0) || '') : '')))
  const [negative, setNegative] = useState(players.map((_, i) => (round?.points[i] ?? 0) < 0))

  function setValue(i: number, v: string) {
    setValues((vs) => vs.map((x, j) => (j === i ? v.replace(/[^\d]/g, '') : x)))
  }

  function toggleSign(i: number) {
    setNegative((ns) => ns.map((x, j) => (j === i ? !x : x)))
  }

  function save(e: React.FormEvent) {
    e.preventDefault()
    onSave(values.map((v, i) => (Number(v) || 0) * (negative[i] ? -1 : 1)))
    onClose()
  }

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
              className="field round-field"
              value={(negative[i] && values[i] ? '−' : '') + values[i]}
              onChange={(e) => setValue(i, e.target.value)}
              inputMode="numeric"
              placeholder="0"
              autoFocus={i === 0}
              aria-label={`Points de ${p}`}
              onFocus={(e) => e.target.select()}
            />
          </label>
        ))}
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
