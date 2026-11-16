import { Link } from 'react-router-dom'
import PageShell from '../../ui/PageShell'
import ProAvatar from './ProAvatar'
import { SEANCES } from './seances'
import { findPro } from './pros'

export default function Visio() {
  return (
    <PageShell title="Séances en visio" subtitle="Bouger chez toi, guidé par l’équipe" backTo="/plus">
      <p className="demo-note" role="note">
        <strong>Aperçu :</strong> les séances en visio ne sont pas encore actives. Tu peux déjà les découvrir et
        les ajouter à ton agenda pour les faire de ton côté.
      </p>
      {SEANCES.map((s) => {
        const pro = findPro(s.proId)
        return (
          <Link key={s.id} to={`/plus/visio/${s.id}`} className="card plus-entry">
            {pro ? <ProAvatar pro={pro} /> : <span className="plus-entry-icon" aria-hidden="true">{s.emoji}</span>}
            <span className="plus-entry-text">
              <strong>{s.activite}</strong>
              <span className="muted">{s.description}</span>
              <span className="plus-entry-badges">
                <span className="badge">⏱ {s.duree} min</span>
                <span className="badge">{s.niveau}</span>
              </span>
            </span>
            <span className="plus-chevron" aria-hidden="true">›</span>
          </Link>
        )
      })}
    </PageShell>
  )
}
