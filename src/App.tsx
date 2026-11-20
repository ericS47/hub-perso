import { Route, Routes } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import Home from './pages/Home'
import Info from './pages/Info'
import Emploi from './pages/Emploi'
import Promo from './pages/Promo'
import Culture from './pages/Culture'
import Library from './pages/Library'
import GamesHub from './pages/GamesHub'
import ScoreBoard from './pages/ScoreBoard'
import MatchPage from './pages/MatchPage'
import ScoreStats from './pages/ScoreStats'
import Finance from './pages/Finance'
import Portfolio from './pages/Portfolio'
import Notes from './pages/Notes'
import NoteEditor from './pages/NoteEditor'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <div className="app">
      <main className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/culture" element={<Culture />} />
          <Route path="/culture/jeux" element={<GamesHub />} />
          <Route path="/culture/jeux/scores" element={<ScoreBoard />} />
          <Route path="/culture/jeux/partie/:matchId" element={<MatchPage />} />
          <Route path="/culture/jeux/stats" element={<ScoreStats />} />
          <Route path="/culture/liste/:listId" element={<Library />} />
          <Route path="/culture/:category" element={<Library />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/finance/portefeuille" element={<Portfolio />} />
          <Route path="/info" element={<Info />} />
          <Route path="/emploi" element={<Emploi />} />
          <Route path="/promo" element={<Promo />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/notes/etiquette/:labelId" element={<Notes />} />
          <Route path="/notes/note/:noteId" element={<NoteEditor />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}
