import { useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PageShell from '../../ui/PageShell'
import ProAvatar from './ProAvatar'
import Demandes from './Demandes'
import { BESOINS, PROS, findPro, proName, proRole } from './pros'

// Guide « Vers qui me tourner ? ». ?besoin=<clé> met une situation en avant.
function Orientation() {
  const [params] = useSearchParams()
  const besoin = params.get('besoin')
  const highlighted = BESOINS.some((b) => b.cle === besoin) ? besoin : null
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (highlighted) ref.current?.scrollIntoView({ block: 'start' })
  }, [highlighted])

  return (
    <section ref={ref} id="vers-qui" aria-labelledby="plus-orientation" className="plus-orientation">
      <h2 id="plus-orientation" className="plus-section-title">Vers qui me tourner ?</h2>
      <p className="muted">Touche la situation qui te ressemble.</p>
      {BESOINS.map((b) => {
        const on = b.cle === highlighted
        return (
          <details key={b.cle} className={on ? 'card plus-besoin plus-besoin-on' : 'card plus-besoin'} open={on || undefined}>
            <summary>
              <span aria-hidden="true">{b.emoji}</span>
              <span className="plus-besoin-label">{b.situation}</span>
              {on && <span className="badge">Pour toi</span>}
            </summary>
            <div className="plus-besoin-body">
              <p>{b.conseil}</p>
              <div className="plus-besoin-pros">
                {b.pros.map((id) => {
                  const p = findPro(id)
                  if (!p) return null
                  return (
                    <Link key={id} to={`/plus/pros/${id}`} className="plus-pro-chip">
                      <ProAvatar pro={p} size={32} />
                      <span>
                        <strong>{proName(p)}</strong>
                        <span className="muted"> · {proRole(p)}</span>
                      </span>
                    </Link>
                  )
                })}
              </div>
              {b.lien && (
                <Link to={b.lien.to} className="btn btn-secondary btn-block">{b.lien.label}</Link>
              )}
            </div>
          </details>
        )
      })}
      <p className="muted">
        En cas d’urgence, appelle le <a href="tel:15">15</a> ou le <a href="tel:112">112</a>. Idées noires : <a href="tel:3114">3114</a>.
      </p>
    </section>
  )
}

export default function Pros() {
  return (
    <PageShell title="L’équipe" subtitle="Les professionnels qui peuvent t’accompagner" backTo="/plus">
      <p className="demo-note" role="note">
        <strong>Aperçu :</strong> la prise de contact n’est pas encore active. Tes demandes restent sur ton
        téléphone ; tu peux aussi préparer un message à envoyer toi-même.
      </p>

      <Orientation />

      <h2 className="plus-section-title">Les membres de l’équipe</h2>
      <ul className="plus-pro-list">
        {PROS.map((p) => (
          <li key={p.id}>
            <Link to={`/plus/pros/${p.id}`} className="card plus-entry">
              <ProAvatar pro={p} />
              <span className="plus-entry-text">
                <strong>{proName(p)}</strong>
                <span className="muted">{proRole(p)}</span>
              </span>
              <span className="plus-chevron" aria-hidden="true">›</span>
            </Link>
          </li>
        ))}
      </ul>

      <Demandes />
    </PageShell>
  )
}
