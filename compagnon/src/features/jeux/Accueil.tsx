import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { db } from '../../db'
import PageShell from '../../ui/PageShell'
import Figure from './Figure'
import { APPLIS_EXTERNES } from './externes'
import type { PoseId } from './poses'

export const JEUX: { id: string; route: string; nom: string; emoji: string; texte: string; pose: PoseId; couleur: string; fond: string }[] = [
  { id: 'oie', route: '/jeux/oie', nom: 'Jeu de l’oie', emoji: '🪿', texte: 'Le parcours classique : chaque case, un petit mouvement. De 1 à 4 joueurs.', pose: 'marche', couleur: '#b4532a', fond: '#fbe6dc' },
  { id: 'paires', route: '/jeux/paires', nom: 'Les paires', emoji: '🃏', texte: 'Retrouve les mouvements jumeaux. Solo ou à deux.', pose: 'bras-haut', couleur: '#1f6f6b', fond: '#d9ece9' },
  { id: 'bataille-navale', route: '/jeux/bataille-navale', nom: 'Bataille navale', emoji: '⚓', texte: 'Contre l’appli ou en défiant un ami. On bouge quand ça touche !', pose: 'boxe', couleur: '#3e6590', fond: '#e1eaf4' },
  { id: 'cap-au-phare', route: '/jeux/cap-au-phare', nom: 'Cap au phare', emoji: '🗼', texte: 'Une balade en cartes jusqu’au bord de mer, à son rythme.', pose: 'funambule', couleur: '#8a6212', fond: '#fbefd2' },
]

function nomDuJeu(id: string): string {
  return JEUX.find((j) => j.id === id)?.nom ?? id
}

function quand(ts: number): string {
  return new Date(ts).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function Accueil() {
  const parties = useLiveQuery(() => db.games.orderBy('createdAt').reverse().toArray(), [])
  const total = parties?.reduce((s, p) => s + p.exercisesDone, 0) ?? 0
  const minutes = Math.round((parties?.reduce((s, p) => s + p.durationSec, 0) ?? 0) / 60)

  return (
    <PageShell title="Jeux" subtitle="Bouger en s’amusant, seul ou à plusieurs">
      {parties && parties.length > 0 && (
        <div className="jeux-bilan card card-soft">
          <div className="jeux-stat">
            <strong>{total}</strong>
            <span>exercice{total > 1 ? 's' : ''} faits en jouant</span>
          </div>
          <div className="jeux-stat">
            <strong>{parties.length}</strong>
            <span>partie{parties.length > 1 ? 's' : ''}</span>
          </div>
          <div className="jeux-stat">
            <strong>{minutes}</strong>
            <span>min de jeu</span>
          </div>
        </div>
      )}

      <div className="jeux-liste">
        {JEUX.map((j) => (
          <Link key={j.id} to={j.route} className="card jeux-tuile">
            <span className="jeux-tuile-fig" style={{ background: j.fond }}>
              <Figure pose={j.pose} couleur={j.couleur} size={72} />
            </span>
            <span className="jeux-tuile-txt">
              <strong>
                {j.emoji} {j.nom}
              </strong>
              <span className="muted">{j.texte}</span>
            </span>
          </Link>
        ))}
      </div>

      {parties && parties.length > 0 && (
        <section className="card">
          <h2>Dernières parties</h2>
          <ul className="jeux-historique">
            {parties.slice(0, 5).map((p) => (
              <li key={p.id}>
                <span>
                  <strong>{nomDuJeu(p.game)}</strong>
                  <span className="muted"> · {quand(p.createdAt)}</span>
                </span>
                <span className="badge">
                  {p.exercisesDone} exercice{p.exercisesDone > 1 ? 's' : ''}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card">
        <h2>Autres applis</h2>
        {APPLIS_EXTERNES.length === 0 ? (
          <p className="muted">Bientôt : des jeux partenaires recommandés par ton équipe.</p>
        ) : (
          <ul className="jeux-externes">
            {APPLIS_EXTERNES.map((a) => (
              <li key={a.url}>
                <a href={a.url} target="_blank" rel="noopener noreferrer">
                  <span aria-hidden="true">{a.emoji ?? '🔗'}</span>
                  <span>
                    <strong>{a.nom}</strong>
                    <span className="muted">{a.description}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PageShell>
  )
}
