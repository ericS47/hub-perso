import { Route, Routes } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import Home from './pages/Home'
import Module from './pages/Module'

const modules = [
  { path: '/culture', title: 'Culture' },
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
          {modules.map((m) => (
            <Route key={m.path} path={m.path} element={<Module title={m.title} />} />
          ))}
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}
