import { NavLink } from 'react-router-dom'

const items = [
  { to: '/', label: 'Accueil', icon: '⌂' },
  { to: '/culture', label: 'Culture', icon: '🎬' },
  { to: '/finance', label: 'Finance', icon: '📈' },
  { to: '/info', label: 'Info', icon: '🔔' },
  { to: '/emploi', label: 'Emploi', icon: '💼' },
  { to: '/promo', label: 'Promo', icon: '🏷️' },
]

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Navigation principale">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
        >
          <span className="nav-icon" aria-hidden="true">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
