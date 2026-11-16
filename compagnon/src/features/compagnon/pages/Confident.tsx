import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSetting } from '../../../lib/settings'
import Avatar from '../Avatar'
import SafetyCard from '../SafetyCard'
import { companionT, dayMoment } from '../voice'

const SUJETS = [
  { to: 'seance-manquee', emoji: '🏃', label: 'Je n’ai pas fait ma séance' },
  { to: 'grignotage', emoji: '🍪', label: 'J’ai grignoté' },
  { to: 'compulsion', emoji: '🌊', label: 'J’ai eu une compulsion' },
  { to: 'coup-de-mou', emoji: '🌧️', label: 'J’ai un coup de mou' },
  { to: 'libre', emoji: '✍️', label: 'J’ai juste envie d’écrire' },
  { to: 'bonne-nouvelle', emoji: '🌟', label: 'J’ai une bonne nouvelle à partager' },
]

// Onglet « Confident » : le compagnon accueille et propose de quoi parler.
export default function Confident() {
  const companion = useSetting('companion')
  const firstName = useSetting('firstName')
  const t = companionT(companion)
  const [seed] = useState(() => Math.random())

  if (!companion) return null

  const moment = dayMoment()
  const salut = moment === 'soir' || moment === 'nuit' ? 'Bonsoir' : 'Bonjour'
  const nom = firstName ? ` ${firstName}` : ''
  const phrases = [
    t(`${salut}${nom}. Je suis là, prends ton temps. De quoi as-tu envie de parler ?`, `${salut}${nom}. Je suis là, prenez votre temps. De quoi avez-vous envie de parler ?`),
    t(`Ça me fait plaisir de te voir${nom}. Ici, tu peux tout me dire, sans jugement.`, `Ça me fait plaisir de vous voir${nom}. Ici, vous pouvez tout me dire, sans jugement.`),
    t(`${salut}${nom}. Comment ça va, vraiment ? Je t’écoute.`, `${salut}${nom}. Comment ça va, vraiment ? Je vous écoute.`),
    t(`${salut}${nom}. Une séance, un grignotage, un coup de mou ou une bonne nouvelle : tout a sa place ici.`, `${salut}${nom}. Une séance, un grignotage, un coup de mou ou une bonne nouvelle : tout a sa place ici.`),
  ]
  // Tirage stable pendant la visite de la page.
  const phrase = phrases[Math.floor(seed * phrases.length)]

  return (
    <div className="compagnon-confident">
      <header className="compagnon-hero">
        <Avatar companion={companion} size={96} mood="attentif" />
        <p className="compagnon-bubble them compagnon-hero-bubble">{phrase}</p>
      </header>

      <h1 className="compagnon-sr">Confident</h1>
      <nav className="compagnon-topics" aria-label="De quoi parler">
        {SUJETS.map((s) => (
          <Link key={s.to} to={`/compagnon/parler/${s.to}`} className="compagnon-topic">
            <span className="compagnon-topic-emoji" aria-hidden="true">{s.emoji}</span>
            <span>{s.label}</span>
          </Link>
        ))}
      </nav>

      <div className="compagnon-links">
        <Link to="/compagnon/journal" className="card compagnon-link">
          <span aria-hidden="true">📖</span>
          <span>
            <strong>Mon journal</strong>
            <span className="muted">Relire, et ce que {companion.name} remarque</span>
          </span>
        </Link>
        <Link to="/compagnon/meteo" className="card compagnon-link">
          <span aria-hidden="true">🌤️</span>
          <span>
            <strong>Ma météo intérieure</strong>
            <span className="muted">Moral, fatigue, stress du jour</span>
          </span>
        </Link>
        <Link to="/compagnon/personnaliser" className="card compagnon-link">
          <span aria-hidden="true">🎨</span>
          <span>
            <strong>Personnaliser {companion.name}</strong>
            <span className="muted">Personnage, couleur, nom, tu ou vous</span>
          </span>
        </Link>
      </div>

      <p className="muted compagnon-disclaimer">
        {t(
          `${companion.name} est une application : ce n’est pas un soignant et ne remplace pas ton équipe. Tout reste sur ton téléphone.`,
          `${companion.name} est une application : ce n’est pas un soignant et ne remplace pas votre équipe. Tout reste sur votre téléphone.`,
        )}
      </p>
      <SafetyCard t={t} compact />
    </div>
  )
}
