import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type CultureCategory, type CultureItem, type CultureTheme } from '../db'
import { deleteTheme, ensureThemes, renameTheme } from '../culture/themes'
import Sheet from './Sheet'

interface Props {
  category: CultureCategory
  items: CultureItem[]
  onClose: () => void
}

export default function ThemeManager({ category, items, onClose }: Props) {
  const themes = useLiveQuery(
    () => db.themes.where('category').equals(category).sortBy('name'),
    [category],
    [] as CultureTheme[],
  )
  const [name, setName] = useState('')

  const count = (t: CultureTheme) => items.filter((i) => i.genres.includes(t.name)).length

  async function add(e: React.FormEvent) {
    e.preventDefault()
    const clean = name.trim()
    setName('')
    if (clean) await ensureThemes(category, [clean.charAt(0).toUpperCase() + clean.slice(1)])
  }

  async function rename(t: CultureTheme) {
    const next = window.prompt('Nouveau nom du thème', t.name)
    if (next) await renameTheme(t.id!, next)
  }

  async function remove(t: CultureTheme) {
    const n = count(t)
    const msg = n ? `Supprimer « ${t.name} » ? ${n} œuvre(s) le perdront (elles sont conservées).` : `Supprimer « ${t.name} » ?`
    if (window.confirm(msg)) await deleteTheme(t.id!)
  }

  return (
    <Sheet title="Gérer les thèmes" onClose={onClose}>
      <form className="task-form" onSubmit={add}>
        <input
          className="field"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nouveau thème"
          aria-label="Nouveau thème"
        />
        <button type="submit" className="btn">
          Créer
        </button>
      </form>
      <ul className="theme-admin">
        {themes.map((t) => (
          <li key={t.id}>
            <span>
              {t.name} <span className="muted">({count(t)})</span>
            </span>
            <span className="theme-admin-actions">
              <button type="button" className="link-btn small-link" onClick={() => rename(t)}>
                Renommer
              </button>
              <button type="button" className="link-btn small-link danger" onClick={() => remove(t)}>
                Supprimer
              </button>
            </span>
          </li>
        ))}
      </ul>
    </Sheet>
  )
}
