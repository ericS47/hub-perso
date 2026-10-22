import { Route, Routes } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import Home from './pages/Home'
import Module from './pages/Module'
import Culture from './pages/Culture'
import Library from './pages/Library'

const modules = [
  { path: '/finance', title: 'Finance' },
  { path: '/info', title: 'Info' },
  { path: '/emploi', title: 'Emploi' },
  { path: '/promo', title: 'Promo' },
]

export default function App() {
  return (
    <div className="app">
      <main className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/culture" element={<Culture />} />
          <Route path="/culture/liste/:listId" element={<Library />} />
          <Route path="/culture/:category" element={<Library />} />
          {modules.map((m) => (
            <Route key={m.path} path={m.path} element={<Module title={m.title} />} />
          ))}
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}
