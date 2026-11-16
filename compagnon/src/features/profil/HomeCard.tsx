import { Link } from 'react-router-dom'
import { useProfileProgress } from './store'

// Carte de l'accueil : invite à compléter le profil tant qu'il n'est pas terminé.
export default function HomeCard() {
  const progress = useProfileProgress()
  if (!progress || !progress.next) return null
  const pct = Math.round(progress.ratio * 100)
  const started = progress.ratio > 0

  return (
    <Link to={`/profil/${progress.next.id}`} className="card profil-homecard">
      <div className="row-between">
        <h2>🪪 Mon profil</h2>
        <span className="badge">{pct} %</span>
      </div>
      <p className="muted">
        {started
          ? 'Tu as commencé à te présenter : on continue quand tu veux, à ton rythme.'
          : 'Présente-toi en quelques questions, à ton rythme. Rien n’est obligatoire.'}
      </p>
      <div className="profil-gauge" aria-hidden="true">
        <span style={{ width: `${pct}%` }} />
      </div>
      <p className="profil-homecard-next">
        {started ? 'Continuer' : 'Commencer'} : {progress.next.icon} {progress.next.title} →
      </p>
    </Link>
  )
}
