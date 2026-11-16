import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/', label: 'Accueil', icon: '🏠', end: true },
  { to: '/agenda', label: 'Agenda', icon: '📅', end: false },
  { to: '/compagnon', label: 'Confident', icon: '💬', end: false },
  { to: '/jeux', label: 'Jeux', icon: '🎲', end: false },
  { to: '/plus', label: 'Plus', icon: '✨', end: false },
]

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Navigation principale">
      {TABS.map((t) => (
        <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => (isActive ? 'tab on' : 'tab')}>
          <span className="tab-icon" aria-hidden="true">{t.icon}</span>
          <span>{t.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
