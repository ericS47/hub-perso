import PageShell from '../../ui/PageShell'
import { COACH_DEFAULT, COACH_KEY, useLocal, type CoachPrefs } from './storage'

const OPTIONS = [
  { id: 'agenda', label: 'Mon agenda de séances', detail: 'Les séances prévues, faites ou manquées.' },
  { id: 'evaluations', label: 'Mes évaluations de séances', detail: 'Envie, motivation et plaisir après chaque séance.' },
  { id: 'meteo', label: 'Ma météo intérieure', detail: 'Moral, fatigue et stress.' },
  { id: 'jeux', label: 'Mes jeux d’activité', detail: 'Les exercices réalisés.' },
]

export default function Coach() {
  const [prefs, setPrefs] = useLocal<CoachPrefs>(COACH_KEY, COACH_DEFAULT)

  function toggle(id: string) {
    const partage = prefs.partage.includes(id) ? prefs.partage.filter((x) => x !== id) : [...prefs.partage, id]
    setPrefs({ ...prefs, partage, updatedAt: Date.now() })
  }

  return (
    <PageShell title="Coaching" subtitle="Un suivi à distance par un professionnel de l’activité physique" backTo="/plus">
      <p className="demo-note" role="note">
        <strong>Aperçu :</strong> cette fonction n’est pas encore active. Rien n’est partagé pour l’instant.
      </p>

      <section className="card">
        <h2>Ce que ce sera</h2>
        <ul className="plus-checks">
          <li>Une mise en relation avec un enseignant en <strong>activité physique adaptée</strong> (APA), via une plateforme de coachs.</li>
          <li>Un suivi à distance : conseils, ajustement de tes séances, encouragements.</li>
          <li>Un partage <strong>volontaire</strong> : c’est toi qui choisis ce que le coach peut voir, et tu peux changer d’avis à tout moment.</li>
        </ul>
      </section>

      <section className="card">
        <h2>Ce que je pourrai choisir de partager</h2>
        <p className="muted">Coche ce que tu serais d’accord de partager plus tard. Rien n’est envoyé aujourd’hui.</p>
        <fieldset>
          <legend className="plus-sr">Éléments à partager</legend>
          {OPTIONS.map((o) => (
            <label key={o.id} className="plus-check">
              <input type="checkbox" checked={prefs.partage.includes(o.id)} onChange={() => toggle(o.id)} />
              <span>
                <strong>{o.label}</strong>
                <span className="muted">{o.detail}</span>
              </span>
            </label>
          ))}
        </fieldset>
        <p className="plus-private">
          <span aria-hidden="true">🔒</span> Ton journal intime (le confident) n’est <strong>jamais</strong> partagé
          sans ton accord explicite, demandé à chaque fois.
        </p>
      </section>

      {prefs.prevenir ? (
        <div className="card card-soft" role="status">
          <p><strong>✓ C’est noté.</strong> Tu verras ici quand le coaching sera disponible.</p>
          <button type="button" className="btn btn-ghost" onClick={() => setPrefs({ ...prefs, prevenir: false, updatedAt: Date.now() })}>
            Ne plus me prévenir
          </button>
        </div>
      ) : (
        <button type="button" className="btn btn-block" onClick={() => setPrefs({ ...prefs, prevenir: true, updatedAt: Date.now() })}>
          🔔 Me prévenir quand c’est disponible
        </button>
      )}
    </PageShell>
  )
}
