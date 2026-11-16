import { Navigate, Route, Routes } from 'react-router-dom'
import Confident from './pages/Confident'
import Customize from './pages/Customize'
import Journal from './pages/Journal'
import Meteo from './pages/Meteo'
import Talk from './pages/Talk'
import Welcome from './pages/Welcome'
import './compagnon.css'

// Fonctionnalité « Compagnon / Confident », montée sur /compagnon/*.
export default function Compagnon() {
  return (
    <Routes>
      <Route index element={<Confident />} />
      <Route path="bienvenue" element={<Welcome />} />
      <Route path="personnaliser" element={<Customize />} />
      <Route path="parler/:type" element={<Talk />} />
      <Route path="journal" element={<Journal />} />
      <Route path="meteo" element={<Meteo />} />
      <Route path="*" element={<Navigate to="/compagnon" replace />} />
    </Routes>
  )
}
