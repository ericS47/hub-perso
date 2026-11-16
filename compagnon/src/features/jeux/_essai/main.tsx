// Banc d'essai temporaire (à supprimer) : monte uniquement les jeux.
import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import '../../../index.css'
import BottomNav from '../../../ui/BottomNav'
import Jeux from '..'

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <HashRouter>
      <div className="app">
        <main className="content">
          <Routes>
            <Route path="/jeux/*" element={<Jeux />} />
            <Route path="/agenda/*" element={<p>Agenda</p>} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </HashRouter>
  </StrictMode>,
)
