import { Navigate } from 'react-router-dom'
import { useSetting } from './lib/settings'
import Avatar from './features/compagnon/Avatar'
import CompagnonCard from './features/compagnon/HomeCard'
import AgendaCard from './features/agenda/HomeCard'
import ProfilCard from './features/profil/HomeCard'

function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Bonne nuit'
  if (h < 18) return 'Bonjour'
  return 'Bonsoir'
}

// Accueil : le compagnon salue, puis chaque fonctionnalité apporte sa carte.
export default function Home() {
  const welcomeDone = useSetting('welcomeDone')
  const companion = useSetting('companion')
  const firstName = useSetting('firstName')

  if (welcomeDone === undefined || companion === undefined) return null
  if (!welcomeDone) return <Navigate to="/compagnon/bienvenue" replace />

  return (
    <div>
      <header className="home-head row">
        <Avatar companion={companion} size={72} mood="content" />
        <div>
          <h1>{greeting()}{firstName ? ` ${firstName}` : ''}</h1>
          <p className="muted">{companion.name} est là pour {companion.tutoiement ? 'toi' : 'vous'}.</p>
        </div>
      </header>
      <CompagnonCard />
      <AgendaCard />
      <ProfilCard />
    </div>
  )
}
