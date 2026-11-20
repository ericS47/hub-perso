import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Player, type ScoreGame } from '../../db'
import { ruleLabel } from '../../scores/catalog'
import { lastPlayers, startMatch } from '../../scores/logic'
import Sheet from '../Sheet'

interface Props {
  game: ScoreGame
  onClose: () => void
  onEdit: () => void
}

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()

export default function NewMatchSheet({ game, onClose, onEdit }: Props) {
  const navigate = useNavigate()
  const saved = useLiveQuery(() => db.players.orderBy('name').toArray(), [], [] as Player[])
  // Ordre de sélection = ordre des colonnes sur la feuille.
  const [chosen, setChosen] = useState<string[]>([])
  const [name, setName] = useState('')
  const [remember, setRemember] = useState(true)
  const [editing, setEditing] = useState(false)

  // Les joueurs de la dernière partie sont cochés d'office.
  useEffect(() => {
    let alive = true
    lastPlayers(game.id!).then((names) => alive && setChosen((c) => (c.length ? c : names)))
    return () => {
      alive = false
    }
  }, [game.id])

  // Noms proposés : les enregistrés, plus ceux de la dernière partie s'ils ne le sont pas.
  const names = [...saved.map((p) => p.name), ...chosen.filter((c) => !saved.some((p) => same(p.name, c)))]

  function toggle(n: string) {
    setChosen((c) => (c.includes(n) ? c.filter((x) => x !== n) : [...c, n]))
  }

  async function addPlayer(e?: React.FormEvent) {
    e?.preventDefault()
    const clean = name.trim()
    setName('')
    if (!clean) return
    const existing = names.find((n) => same(n, clean))
    const final = existing ?? clean
    setChosen((c) => (c.includes(final) ? c : [...c, final]))
    if (remember && !saved.some((p) => same(p.name, clean))) {
      await db.players.add({ name: clean, createdAt: Date.now() })
    }
  }

  async function forget(p: Player) {
    if (!window.confirm(`Retirer « ${p.name} » des joueurs enregistrés ?`)) return
    await db.players.delete(p.id!)
  }

  async function start() {
    if (name.trim()) await addPlayer()
    const players = name.trim() ? [...chosen, name.trim()] : chosen
    if (players.length === 0) return
    const id = await startMatch(game, [...new Set(players)])
    onClose()
    navigate(`/culture/jeux/partie/${id}`)
  }

  return (
    <Sheet title={`${game.icon} ${game.name}`} onClose={onClose}>
      <p className="muted small-text sheet-sub">
        {ruleLabel(game)} ·{' '}
        <button type="button" className="link-btn small-link inline" onClick={onEdit}>
          modifier le jeu
        </button>
      </p>

      <div className="field-label">
        <span className="players-head">
          Joueurs ({chosen.length})
          {saved.length > 0 && (
            <button type="button" className="link-btn small-link" onClick={() => setEditing((v) => !v)}>
              {editing ? 'Terminé' : 'Gérer les noms'}
            </button>
          )}
        </span>
        <div className="filters">
          {names.map((n) => {
            const p = saved.find((s) => s.name === n)
            const order = chosen.indexOf(n)
            return editing && p ? (
              <button key={n} type="button" className="chip small" onClick={() => forget(p)}>
                {n} ✕
              </button>
            ) : (
              <button
                key={n}
                type="button"
                className={order >= 0 ? 'chip active' : 'chip'}
                aria-pressed={order >= 0}
                onClick={() => toggle(n)}
              >
                {order >= 0 && <span className="chip-order">{order + 1}</span>}
                {n}
              </button>
            )
          })}
          {names.length === 0 && <span className="muted small-text">Ajoute les joueurs ci-dessous.</span>}
        </div>
      </div>

      <form className="task-form" onSubmit={addPlayer}>
        <input
          className="field"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nouveau joueur"
          aria-label="Nouveau joueur"
          autoCapitalize="words"
        />
        <button type="submit" className="btn ghost">
          Ajouter
        </button>
      </form>
      <label className="check small-text">
        <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
        Enregistrer les nouveaux noms pour les prochaines parties
      </label>

      <div className="form-actions">
        <button type="button" className="btn" onClick={start} disabled={chosen.length === 0 && !name.trim()}>
          Commencer la partie
        </button>
      </div>
    </Sheet>
  )
}
