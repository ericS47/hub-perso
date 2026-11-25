import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './index.css'

// Mise à jour automatique : dès qu'une nouvelle version est en ligne, la page se recharge.
registerSW({
  immediate: true,
  onRegisteredSW(_url, registration) {
    if (!registration) return
    const check = () => registration.update().catch(() => {})
    setInterval(check, 30 * 60 * 1000)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') check()
    })
  },
})

// Demande au navigateur de ne pas effacer les données de l'appli (profil, compagnon…) quand la place manque.
void navigator.storage?.persist?.().catch(() => false)

// HashRouter : l'appli vit dans un sous-dossier de GitHub Pages, les liens directs
// fonctionnent ainsi sans page 404 dédiée.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
