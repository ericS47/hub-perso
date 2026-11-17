import type { CultureItem } from '../db'
import CoverImage from './CoverImage'

export const NO_THEME = '__sans-theme__'

interface Props {
  items: CultureItem[]
  // Thèmes dans l'ordre d'affichage (les plus fournis d'abord).
  themes: string[]
  onOpen: (theme: string, item?: CultureItem) => void
}

// Vue « Par thème » : une rangée qui glisse par thème, une œuvre pouvant
// apparaître dans plusieurs rangées.
export default function ThemeRows({ items, themes, onOpen }: Props) {
  const rows = themes
    .map((t) => ({ id: t, label: t, items: items.filter((i) => i.genres.includes(t)) }))
    .filter((r) => r.items.length > 0)
  const orphans = items.filter((i) => i.genres.length === 0)
  if (orphans.length) rows.push({ id: NO_THEME, label: 'Sans thème', items: orphans })

  const sorted = rows.length - (orphans.length ? 1 : 0)

  return (
    <div className="theme-rows">
      {sorted === 0 && (
        <p className="muted small-text theme-hint">
          Aucune œuvre n'est encore rangée dans un thème. Coche des thèmes dans la fiche d'une œuvre (Modifier), ou
          réimporte le fichier Babelio qui contient les thèmes.
        </p>
      )}
      {rows.map((r) => (
        <section key={r.id} className="theme-row" aria-label={r.label}>
          <button type="button" className="theme-row-head" onClick={() => onOpen(r.id)}>
            <h2>{r.label}</h2>
            <span className="muted">
              {r.items.length} ›
            </span>
          </button>
          <div className="theme-row-track">
            {r.items.map((i) => (
              <button
                key={i.id}
                type="button"
                className={i.priority ? 'theme-tile recommended' : 'theme-tile'}
                onClick={() => onOpen(r.id, i)}
                aria-label={i.title}
              >
                <CoverImage item={i} />
                {i.priority && <span className="cf-ribbon">★</span>}
                <span className="theme-tile-title">{i.title}</span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
