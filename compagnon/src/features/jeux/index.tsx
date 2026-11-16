import { Route, Routes } from 'react-router-dom'
import Accueil from './Accueil'
import Oie from './oie/Oie'
import Paires from './paires/Paires'
import Navale from './navale/Navale'
import Phare from './phare/Phare'
import './jeux.css'

// Jeux de société qui font bouger. Monté sur /jeux/*.
export default function Jeux() {
  return (
    <Routes>
      <Route index element={<Accueil />} />
      <Route path="oie" element={<Oie />} />
      <Route path="paires" element={<Paires />} />
      <Route path="bataille-navale" element={<Navale />} />
      <Route path="cap-au-phare" element={<Phare />} />
      <Route path="*" element={<Accueil />} />
    </Routes>
  )
}
