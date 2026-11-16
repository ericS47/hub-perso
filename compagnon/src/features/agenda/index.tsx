import { Navigate, Route, Routes } from 'react-router-dom'
import Week from './Week'
import Plan from './Plan'
import Suivi from './Suivi'
import Rappels from './Rappels'
import './agenda.css'

// Monté sur /agenda/*.
export default function Agenda() {
  return (
    <Routes>
      <Route index element={<Week />} />
      <Route path="planifier" element={<Plan />} />
      <Route path="suivi" element={<Suivi />} />
      <Route path="rappels" element={<Rappels />} />
      <Route path="*" element={<Navigate to="/agenda" replace />} />
    </Routes>
  )
}
