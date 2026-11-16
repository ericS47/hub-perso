import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageShell from '../../ui/PageShell'
import { setSetting, useSetting } from '../../lib/settings'
import { FORMULES, type PlanId } from './formules'

export default function Formules() {
  const plan = useSetting('plan')
  const [noted, setNoted] = useState<PlanId | null>(null)

  async function choose(id: PlanId) {
    await setSetting('plan', id)
    setNoted(id)
  }

  return (
    <PageShell title="Mes formules" subtitle="Trois façons d’être accompagné" backTo="/plus">
      <p className="demo-note" role="note">
        <strong>Aperçu :</strong> les formules ne sont pas encore actives. Choisir une formule n’engage à rien
        et ne déclenche aucun paiement : cela nous indique seulement ce qui t’intéresse.
      </p>

      {FORMULES.map((f) => {
        const current = plan === f.id
        return (
          <section key={f.id} className={current ? 'card plus-plan plus-plan-on' : 'card plus-plan'} aria-labelledby={`plan-${f.id}`}>
            <div className="row-between">
              <h2 id={`plan-${f.id}`} className="plus-plan-name">
                <span aria-hidden="true">{f.emoji}</span> {f.nom}
              </h2>
              {current && <span className="badge">Ma formule</span>}
            </div>
            <p className="muted">{f.accroche}</p>
            <p className="plus-plan-price">{f.prix}</p>
            <ul className="plus-checks">
              {f.inclus.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
            {f.enAttendant && (
              <p className="muted">
                {f.enAttendant} <Link to="/agenda/rappels">Régler mes rappels</Link>
              </p>
            )}
            {noted === f.id && (
              <p className="plus-noted" role="status">✓ Ton intérêt est noté. Merci !</p>
            )}
            <button
              type="button"
              className={current ? 'btn btn-secondary btn-block' : 'btn btn-block'}
              disabled={current}
              onClick={() => void choose(f.id)}
            >
              {current ? 'Formule actuelle' : f.id === 'gratuite' ? 'Revenir à cette formule' : 'Cette formule m’intéresse'}
            </button>
          </section>
        )
      })}
    </PageShell>
  )
}
