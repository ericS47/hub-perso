import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ProfileSectionId } from '../../db'
import PageShell from '../../ui/PageShell'
import { readStep, sectionMeta, writeStep } from './store'

export interface Step {
  key: string
  title: string
  intro?: string
  content: ReactNode
}

interface Props {
  id: ProfileSectionId
  steps: Step[]
  onFinish: () => Promise<void>
}

// Parcours d'une rubrique en petites étapes. Les réponses sont déjà enregistrées :
// Précédent / Suivant ne font que déplacer, « Terminer » marque la rubrique comme faite.
export default function Wizard({ id, steps, onFinish }: Props) {
  const meta = sectionMeta(id)
  const navigate = useNavigate()
  const [index, setIndex] = useState(() => readStep(id))
  const headRef = useRef<HTMLHeadingElement>(null)
  const first = useRef(true)
  const i = Math.min(Math.max(index, 0), steps.length - 1)
  const step = steps[i]
  const last = i === steps.length - 1

  useEffect(() => {
    writeStep(id, i)
    if (first.current) {
      first.current = false
      return
    }
    window.scrollTo({ top: 0 })
    headRef.current?.focus()
  }, [id, i])

  const finish = async () => {
    await onFinish()
    writeStep(id, 0)
    navigate('/profil', { state: { finished: id } })
  }

  return (
    <PageShell title={`${meta.icon} ${meta.title}`} backTo="/profil">
      <div className="profil-steps" aria-hidden="true">
        {steps.map((s, n) => (
          <span key={s.key} className={n < i ? 'is-past' : n === i ? 'is-current' : ''} />
        ))}
      </div>
      <p className="muted profil-step-count">
        Étape {i + 1} sur {steps.length}
      </p>
      <section className="card profil-step" aria-labelledby={`profil-step-${step.key}`}>
        <h2 id={`profil-step-${step.key}`} ref={headRef} tabIndex={-1}>
          {step.title}
        </h2>
        {step.intro && <p className="muted">{step.intro}</p>}
        {step.content}
      </section>
      <div className="profil-nav">
        <button type="button" className="btn btn-secondary" disabled={i === 0} onClick={() => setIndex(i - 1)}>
          ← Précédent
        </button>
        {last ? (
          <button type="button" className="btn" onClick={() => void finish()}>
            Terminer ✓
          </button>
        ) : (
          <button type="button" className="btn" onClick={() => setIndex(i + 1)}>
            Suivant →
          </button>
        )}
      </div>
      <p className="muted profil-saved">✓ Tes réponses s’enregistrent toutes seules. Tu peux passer une question ou revenir plus tard.</p>
    </PageShell>
  )
}
