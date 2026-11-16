import { NUMEROS_AIDE } from './safety'
import type { T } from './voice'

interface Props {
  t: T
  // Version courte (pied de page) ou complète (message de sécurité).
  compact?: boolean
}

// Numéros d'aide, toujours cliquables.
export default function SafetyCard({ t, compact }: Props) {
  if (compact) {
    return (
      <p className="compagnon-help-line muted">
        {t('Besoin d’aide tout de suite ?', 'Besoin d’aide tout de suite ?')}{' '}
        <a href="tel:3114">3114</a> (prévention du suicide, 24 h/24) · <a href="tel:15">15</a> · <a href="tel:112">112</a>
      </p>
    )
  }
  return (
    <div className="compagnon-safety-card" role="region" aria-label="Numéros d’aide">
      {NUMEROS_AIDE.map((n) => (
        <a key={n.numero} className="compagnon-tel" href={`tel:${n.numero}`}>
          <span className="compagnon-tel-num">📞 {n.titre}</span>
          <span className="compagnon-tel-detail">{n.detail}</span>
        </a>
      ))}
    </div>
  )
}
