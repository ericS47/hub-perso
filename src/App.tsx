import { Route, Routes } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import Home from './pages/Home'
import Info from './pages/Info'
import Emploi from './pages/Emploi'
import Promo from './pages/Promo'
import Culture, { ListRedirect } from './pages/Culture'
import Finance from './pages/Finance'
import Portfolio from './pages/Portfolio'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <div className="app">
      <main className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/culture" element={<Culture />} />
          <Route path="/culture/liste/:listId" element={<ListRedirect />} />
          <Route path="/culture/:category" element={<Culture />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/finance/portefeuille" element={<Portfolio />} />
          <Route path="/info" element={<Info />} />
          <Route path="/emploi" element={<Emploi />} />
          <Route path="/promo" element={<Promo />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}
