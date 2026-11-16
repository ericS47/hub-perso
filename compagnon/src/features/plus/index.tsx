import { Route, Routes } from 'react-router-dom'
import './plus.css'
import Sommaire from './Sommaire'
import APropos from './APropos'
import Formules from './Formules'
import Pros from './Pros'
import ProDetail from './ProDetail'
import Visio from './Visio'
import VisioDetail from './VisioDetail'
import Coach from './Coach'

// Onglet « Plus » : services en aperçu (formules, équipe, visio, coaching) et pages utiles.
export default function Plus() {
  return (
    <Routes>
      <Route index element={<Sommaire />} />
      <Route path="a-propos" element={<APropos />} />
      <Route path="formules" element={<Formules />} />
      <Route path="pros" element={<Pros />} />
      <Route path="pros/:id" element={<ProDetail />} />
      <Route path="orientation" element={<Pros />} />
      <Route path="visio" element={<Visio />} />
      <Route path="visio/:id" element={<VisioDetail />} />
      <Route path="coach" element={<Coach />} />
      <Route path="*" element={<Sommaire />} />
    </Routes>
  )
}
