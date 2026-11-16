// FICHIER DE TEST TEMPORAIRE (à supprimer)
import { createRoot } from 'react-dom/client'
import { HashRouter, Route, Routes } from 'react-router-dom'
import '../../../index.css'
import Agenda from '../index'
import HomeCard from '../HomeCard'
import BottomNav from '../../../ui/BottomNav'

createRoot(document.getElementById('root')!).render(
  <HashRouter>
    <div className="app"><main className="content">
      <Routes>
        <Route path="/" element={<HomeCard />} />
        <Route path="/agenda/*" element={<Agenda />} />
        <Route path="*" element={<p>Autre écran : {location.hash}</p>} />
      </Routes>
    </main><BottomNav /></div>
  </HashRouter>,
)
