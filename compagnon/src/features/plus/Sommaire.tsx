import { Link } from 'react-router-dom'
import PageShell from '../../ui/PageShell'
import { useSetting } from '../../lib/settings'
import { FORMULES } from './formules'

interface Entry {
  to: string
  emoji: string
  title: string
  text: string
  demo?: boolean
}

const SERVICES: Entry[] = [
  { to: '/plus/formules', emoji: '🎁', title: 'Mes formules', text: 'Découvrir les différentes formules d’accompagnement.', demo: true },
  { to: '/plus/pros', emoji: '👥', title: 'L’équipe', text: 'Les professionnels qui peuvent t’aider, et vers qui te tourner.', demo: true },
  { to: '/plus/visio', emoji: '📺', title: 'Séances en visio', text: 'Pilates, stretching, cardio : des séances guidées.', demo: true },
  { to: '/plus/coach', emoji: '🧭', title: 'Coaching', text: 'Être suivi à distance par un enseignant en activité physique adaptée.', demo: true },
]

const RACCOURCIS: Entry[] = [
  { to: '/profil', emoji: '🙂', title: 'Mon profil', text: 'Tes réponses et tes préférences.' },
  { to: '/compagnon/personnaliser', emoji: '🎨', title: 'Personnaliser mon compagnon', text: 'Son apparence, son nom, sa façon de te parler.' },
  { to: '/agenda/rappels', emoji: '🔔', title: 'Rappels', text: 'Quand et comment être prévenu.' },
  { to: '/agenda/suivi', emoji: '📈', title: 'Mon évolution', text: 'Le chemin parcouru, semaine après semaine.' },
  { to: '/plus/a-propos', emoji: 'ℹ️', title: 'À propos et confidentialité', text: 'Ce que fait l’appli, tes données, l’installer sur ton téléphone.' },
]

function EntryCard({ e, extra }: { e: Entry; extra?: string }) {
  return (
    <Link to={e.to} className="card plus-entry">
      <span className="plus-entry-icon" aria-hidden="true">{e.emoji}</span>
      <span className="plus-entry-text">
        <strong>{e.title}</strong>
        <span className="muted">{e.text}</span>
        {(e.demo || extra) && (
          <span className="plus-entry-badges">
            {extra && <span className="badge">{extra}</span>}
            {e.demo && <span className="badge badge-warm">Aperçu</span>}
          </span>
        )}
      </span>
      <span className="plus-chevron" aria-hidden="true">›</span>
    </Link>
  )
}

export default function Sommaire() {
  const plan = useSetting('plan')
  const formule = FORMULES.find((f) => f.id === plan)

  return (
    <PageShell title="Plus" subtitle="Services, équipe et réglages">
      <h2 className="plus-section-title">Services</h2>
      <p className="muted">
        Ces services sont en préparation : tu peux déjà les découvrir, mais rien n’est payé, envoyé ni réservé.
      </p>
      {SERVICES.map((e) => (
        <EntryCard key={e.to} e={e} extra={e.to === '/plus/formules' && formule ? `Actuelle : ${formule.nom}` : undefined} />
      ))}

      <h2 className="plus-section-title">Mon espace</h2>
      {RACCOURCIS.map((e) => (
        <EntryCard key={e.to} e={e} />
      ))}
    </PageShell>
  )
}
