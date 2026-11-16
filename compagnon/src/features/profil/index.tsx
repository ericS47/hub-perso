import type { ComponentType } from 'react'
import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import type { ProfileSectionId } from '../../db'
import './profil.css'
import ProfilHome from './ProfilHome'
import Alimentation from './sections/Alimentation'
import Attentes from './sections/Attentes'
import Douleurs from './sections/Douleurs'
import Foyer from './sections/Foyer'
import Hydratation from './sections/Hydratation'
import Identite from './sections/Identite'
import Moral from './sections/Moral'
import Onaps from './sections/Onaps'
import Sante from './sections/Sante'
import Sport from './sections/Sport'
import Travail from './sections/Travail'
import { isSectionId } from './store'

const SECTIONS: Record<ProfileSectionId, ComponentType> = {
  identite: Identite,
  sport: Sport,
  onaps: Onaps,
  foyer: Foyer,
  travail: Travail,
  sante: Sante,
  douleurs: Douleurs,
  alimentation: Alimentation,
  hydratation: Hydratation,
  moral: Moral,
  attentes: Attentes,
}

function SectionRoute() {
  const { section } = useParams()
  if (!isSectionId(section)) return <Navigate to="/profil" replace />
  const Section = SECTIONS[section]
  // key : on repart d'un état propre en changeant de rubrique.
  return <Section key={section} />
}

// Questionnaire « Mon profil » : accueil (/profil) et une page par rubrique (/profil/<rubrique>).
export default function Profil() {
  return (
    <Routes>
      <Route index element={<ProfilHome />} />
      <Route path=":section" element={<SectionRoute />} />
      <Route path="*" element={<Navigate to="/profil" replace />} />
    </Routes>
  )
}
