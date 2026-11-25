import { NavLink, useLocation } from 'react-router-dom'
import Avatar from '../features/compagnon/Avatar'
import { useSetting } from '../lib/settings'

const TABS = [
  { to: '/', label: 'Accueil', icon: '🏠', end: true },
  { to: '/agenda', label: 'Agenda', icon: '📅', end: false },
  { to: '/compagnon', label: 'Confident', icon: '💬', end: false, main: true },
  { to: '/jeux', label: 'Jeux', icon: '🎲', end: false },
  { to: '/plus', label: 'Plus', icon: '✨', end: false },
]

export default function BottomNav() {
  const companion = useSetting('companion')
  // Pendant l'accueil du premier lancement, rien ne doit détourner du parcours.
  if (useLocation().pathname.startsWith('/compagnon/bienvenue')) return null
  return (
    <nav className="bottom-nav" aria-label="Navigation principale">
      {TABS.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          className={({ isActive }) => ['tab', t.main ? 'tab-main' : '', isActive ? 'on' : ''].filter(Boolean).join(' ')}
        >
          {/* L'onglet du compagnon, deux fois plus large, porte son visage. */}
          {t.main && companion ? (
            <span className="tab-avatar" aria-hidden="true">
              <Avatar companion={companion} size={52} mood="content" />
            </span>
          ) : (
            <span className="tab-icon" aria-hidden="true">{t.icon}</span>
          )}
          <span>{t.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
