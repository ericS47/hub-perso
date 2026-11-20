import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'

// Entrée « Jeux de société » : la ludothèque ou la feuille de route (scores),
// avec l'accès aux statistiques accolé à la feuille de route.
export default function GamesHub() {
  const games = useLiveQuery(() => db.items.where('category').equals('jeux-societe').count(), [], 0)
  const playing = useLiveQuery(() => db.matches.where('status').equals('playing').count(), [], 0)

  return (
    <div className="hub-page">
      <Link to="/culture" className="back-link">← Culture</Link>
      <header className="page-head">
        <h1>
          <span aria-hidden="true">🎲 </span>Jeux de société
        </h1>
      </header>

      <nav className="hub-circles" aria-label="Jeux de société">
        <Link to="/culture/jeux-societe" className="hub-circle">
          <span className="hub-circle-icon" aria-hidden="true">📚</span>
          <strong>Bibliothèque</strong>
          <span className="muted">{games} jeu(x)</span>
        </Link>
        <div className="hub-circle-wrap">
          <Link to="/culture/jeux/scores" className="hub-circle">
            <span className="hub-circle-icon" aria-hidden="true">📝</span>
            <strong>Feuille de route</strong>
            <span className="muted">{playing ? `${playing} en cours` : 'Compter les points'}</span>
          </Link>
          <Link to="/culture/jeux/stats" className="hub-stat" aria-label="Statistiques des parties">
            <span aria-hidden="true">📊</span>
            <span className="hub-stat-label">Stats</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
