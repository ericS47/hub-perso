import { useLiveQuery } from 'dexie-react-hooks'
import { Navigate } from 'react-router-dom'
import { db } from './db'
import { isoDate } from './lib/dates'
import { useSetting } from './lib/settings'
import Avatar from './features/compagnon/Avatar'
import CompagnonCard from './features/compagnon/HomeCard'
import HomePopup from './features/compagnon/HomePopup'
import AgendaCard from './features/agenda/HomeCard'
import ProfilCard from './features/profil/HomeCard'

// Accueil : le compagnon salue, propose de parler (une fois par ouverture), puis chaque fonctionnalité apporte sa carte.
export default function Home() {
  const welcomeDone = useSetting('welcomeDone')
  const companion = useSetting('companion')
  const today = isoDate()
  // null : pas de météo aujourd'hui ; undefined : pas encore chargé.
  const mood = useLiveQuery(async () => (await db.moods.where('date').equals(today).first()) ?? null, [today])

  if (welcomeDone === undefined || companion === undefined || mood === undefined) return null
  if (!welcomeDone) return <Navigate to="/compagnon/bienvenue" replace />

  return (
    <div>
      <header className="home-head row">
        <Avatar companion={companion} size={72} mood="content" />
        <h1>{companion.tutoiement ? 'Content de te revoir !' : 'Content de vous revoir !'}</h1>
      </header>
      <CompagnonCard />
      <AgendaCard />
      <ProfilCard />
      <HomePopup companion={companion} hasMood={mood !== null} />
    </div>
  )
}
