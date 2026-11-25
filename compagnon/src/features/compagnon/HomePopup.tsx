import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { CompanionSettings } from '../../db'
import Sheet from '../../ui/Sheet'
import Avatar from './Avatar'
import { alreadySeen, markSeen, SUJETS } from './sujets'
import { companionT } from './voice'

// Fenêtre d'ouverture : le compagnon demande de quoi parler, l'accueil reste visible derrière.
export default function HomePopup({ companion, hasMood }: { companion: CompanionSettings; hasMood: boolean }) {
  const [open, setOpen] = useState(() => !alreadySeen())
  if (!open) return null
  const t = companionT(companion)
  const close = () => {
    markSeen()
    setOpen(false)
  }

  return (
    <Sheet title={t('De quoi veux-tu parler ?', 'De quoi voulez-vous parler ?')} onClose={close}>
      <div className="compagnon-hero">
        <Avatar companion={companion} size={64} mood="attentif" />
        <p className="compagnon-bubble them compagnon-hero-bubble">
          {t('Je suis là si tu as quelque chose sur le cœur. Sinon, tu peux passer.', 'Je suis là si vous avez quelque chose sur le cœur. Sinon, vous pouvez passer.')}
        </p>
      </div>
      <nav className="compagnon-topics" aria-label="De quoi parler">
        {SUJETS.map((s) => (
          <Link key={s.to} to={`/compagnon/parler/${s.to}`} className="compagnon-topic" onClick={markSeen}>
            <span className="compagnon-topic-emoji" aria-hidden="true">{s.emoji}</span>
            <span>{s.label}</span>
          </Link>
        ))}
        {!hasMood && (
          <Link to="/compagnon/meteo" className="compagnon-topic" onClick={markSeen}>
            <span className="compagnon-topic-emoji" aria-hidden="true">🌤️</span>
            <span>Noter ma météo du jour</span>
          </Link>
        )}
      </nav>
      <button type="button" className="btn btn-secondary btn-block" onClick={close}>
        Passer
      </button>
    </Sheet>
  )
}
