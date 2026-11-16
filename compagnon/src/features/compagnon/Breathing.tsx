import { useEffect, useState } from 'react'
import Sheet from '../../ui/Sheet'
import type { T } from './voice'

interface Props {
  t: T
  onClose: () => void
}

const INSPIRE = 4 // secondes
const EXPIRE = 6

// Respiration guidée : le cercle grandit à l'inspiration, rétrécit à l'expiration.
export default function Breathing({ t, onClose }: Props) {
  const [minutes, setMinutes] = useState(2)
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => window.clearInterval(id)
  }, [running])

  const total = minutes * 60
  const finished = running && elapsed >= total
  const inCycle = elapsed % (INSPIRE + EXPIRE)
  const inhale = inCycle < INSPIRE
  const left = Math.max(0, total - elapsed)

  return (
    <Sheet title={t('Respirer ensemble', 'Respirer ensemble')} onClose={onClose}>
      {!running ? (
        <div className="stack">
          <p>
            {t(
              'Installe-toi confortablement. Inspire par le nez pendant que le cercle grandit, souffle doucement par la bouche quand il rétrécit.',
              'Installez-vous confortablement. Inspirez par le nez pendant que le cercle grandit, soufflez doucement par la bouche quand il rétrécit.',
            )}
          </p>
          <fieldset>
            <legend>Durée</legend>
            <div className="chips-row">
              {[1, 2, 3].map((m) => (
                <button key={m} type="button" className={m === minutes ? 'chip on' : 'chip'} aria-pressed={m === minutes} onClick={() => setMinutes(m)}>
                  {m} min
                </button>
              ))}
            </div>
          </fieldset>
          <button type="button" className="btn btn-block" onClick={() => { setElapsed(0); setRunning(true) }}>
            Commencer
          </button>
        </div>
      ) : finished ? (
        <div className="stack compagnon-center">
          <p className="compagnon-breath-done">🌿</p>
          <p>{t('C’est terminé. Prends un instant pour remarquer comment tu te sens.', 'C’est terminé. Prenez un instant pour remarquer comment vous vous sentez.')}</p>
          <button type="button" className="btn btn-block" onClick={onClose}>
            {t('Revenir à la conversation', 'Revenir à la conversation')}
          </button>
        </div>
      ) : (
        <div className="compagnon-center">
          <div className="compagnon-breath-stage" aria-hidden="true">
            <div className={inhale ? 'compagnon-breath-circle in' : 'compagnon-breath-circle out'} />
          </div>
          <p className="compagnon-breath-label" aria-live="polite">
            {inhale ? t('Inspire…', 'Inspirez…') : t('Expire…', 'Expirez…')}
          </p>
          <p className="muted">
            Encore {Math.floor(left / 60)} min {String(left % 60).padStart(2, '0')} s
          </p>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Arrêter
          </button>
        </div>
      )}
    </Sheet>
  )
}
