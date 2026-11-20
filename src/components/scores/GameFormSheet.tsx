import { useState } from 'react'
import { db, type ScoreGame } from '../../db'
import { SCORE_CATEGORIES, type ScoreCategory, type ScoreRule } from '../../scores/catalog'
import Sheet from '../Sheet'

interface Props {
  // Jeu à modifier ; absent pour un ajout.
  game?: ScoreGame
  defaultCategory: ScoreCategory
  onClose: () => void
}

export default function GameFormSheet({ game, defaultCategory, onClose }: Props) {
  const [name, setName] = useState(game?.name ?? '')
  const [category, setCategory] = useState<ScoreCategory>(game?.category ?? defaultCategory)
  const [icon, setIcon] = useState(game?.icon ?? '')
  const [rule, setRule] = useState<ScoreRule>(game?.rule ?? 'high')
  const [target, setTarget] = useState(game?.target ? String(game.target) : '')

  async function save(e: React.FormEvent) {
    e.preventDefault()
    const clean = name.trim()
    if (!clean) return
    const data = {
      name: clean,
      category,
      icon: icon.trim() || SCORE_CATEGORIES.find((c) => c.id === category)!.icon,
      rule,
      target: Number(target) > 0 ? Number(target) : undefined,
    }
    if (game?.id !== undefined) await db.scoreGames.update(game.id, data)
    else await db.scoreGames.add({ ...data, favorite: false, createdAt: Date.now() })
    onClose()
  }

  async function remove() {
    if (!game?.id) return
    if (!window.confirm(`Supprimer « ${game.name} » de la feuille de route ? Les parties jouées restent dans l'historique.`)) return
    await db.scoreGames.delete(game.id)
    onClose()
  }

  return (
    <Sheet title={game ? 'Modifier le jeu' : 'Ajouter un jeu'} onClose={onClose}>
      <form className="item-form" onSubmit={save}>
        <label className="field-label">
          Nom du jeu
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} required autoFocus={!game} />
        </label>
        <div className="field-label">
          Catégorie
          <div className="segmented">
            {SCORE_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                className={category === c.id ? 'chip active' : 'chip'}
                aria-pressed={category === c.id}
                onClick={() => setCategory(c.id)}
              >
                {c.icon} {c.label}
              </button>
            ))}
          </div>
        </div>
        <div className="field-label">
          Qui gagne ?
          <div className="segmented">
            <button
              type="button"
              className={rule === 'high' ? 'chip active' : 'chip'}
              aria-pressed={rule === 'high'}
              onClick={() => setRule('high')}
            >
              Le plus de points
            </button>
            <button
              type="button"
              className={rule === 'low' ? 'chip active' : 'chip'}
              aria-pressed={rule === 'low'}
              onClick={() => setRule('low')}
            >
              Le moins de points
            </button>
          </div>
        </div>
        <label className="field-label">
          Score de fin de partie (facultatif)
          <input
            className="field"
            value={target}
            onChange={(e) => setTarget(e.target.value.replace(/\D/g, ''))}
            inputMode="numeric"
            placeholder={rule === 'high' ? 'ex. 50 pour le Mölkky' : 'ex. 100 pour le Skyjo'}
          />
        </label>
        <label className="field-label">
          Icône (un émoji, facultatif)
          <input className="field" value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="🎲" maxLength={4} />
        </label>
        <div className="form-actions">
          <button type="submit" className="btn">
            {game ? 'Enregistrer' : 'Ajouter'}
          </button>
          {game && (
            <button type="button" className="link-btn danger" onClick={remove}>
              Supprimer
            </button>
          )}
        </div>
      </form>
    </Sheet>
  )
}
