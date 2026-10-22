import { useState } from 'react'
import PageShell from '../components/PageShell'

// Catégories proposées : Sport, Monde, Positif, Autre, plus Économie et Santé.
const CATEGORIES = ['Sport', 'Monde', 'Positif', 'Autre', 'Économie', 'Santé']

export default function Info() {
  const [active, setActive] = useState<string | null>(null)

  return (
    <PageShell title="Info" subtitle="Les infos importantes, en notifications">
      <section className="card">
        <div className="filters">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              className={active === c ? 'chip active' : 'chip'}
              aria-pressed={active === c}
              onClick={() => setActive(active === c ? null : c)}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <p className="muted">
          {active ? `Aucune info « ${active} » pour l'instant.` : "Aucune info pour l'instant."}
        </p>
        <p className="muted small-text">
          Pastille verte : bonne nouvelle. Pastille rouge : information grave. Les sources seront branchées à l'étape suivante.
        </p>
      </section>
    </PageShell>
  )
}
