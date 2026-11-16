import { Route, Routes } from 'react-router-dom'
import BottomNav from './ui/BottomNav'
import Home from './Home'
import Profil from './features/profil'
import Agenda from './features/agenda'
import Compagnon from './features/compagnon'
import Jeux from './features/jeux'
import Plus from './features/plus'
import { ReminderRunner } from './features/agenda/reminders'

// Chaque fonctionnalité gère ses propres sous-routes (voir src/features/*/index.tsx).
export default function App() {
  return (
    <div className="app">
      <main className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profil/*" element={<Profil />} />
          <Route path="/agenda/*" element={<Agenda />} />
          <Route path="/compagnon/*" element={<Compagnon />} />
          <Route path="/jeux/*" element={<Jeux />} />
          <Route path="/plus/*" element={<Plus />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <ReminderRunner />
      <BottomNav />
    </div>
  )
}
