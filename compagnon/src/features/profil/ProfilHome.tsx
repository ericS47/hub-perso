import { Link, useLocation } from 'react-router-dom'
import PageShell from '../../ui/PageShell'
import MyData from './MyData'
import { isSectionId, PROFILE_SECTIONS, sectionMeta, useProfileProgress } from './store'
import type { SectionStatus } from './types'

const STATUS_LABEL: Record<SectionStatus, string> = {
  todo: 'Non commencé',
  progress: 'En cours',
  done: 'Terminé',
}

export default function ProfilHome() {
  const progress = useProfileProgress()
  const location = useLocation()
  const raw = (location.state as { finished?: string } | null)?.finished
  const finished = isSectionId(raw) ? raw : undefined
  const groups = [...new Set(PROFILE_SECTIONS.map((s) => s.group))]

  return (
    <PageShell title="Mon profil" subtitle="Pour que ton équipe et ton compagnon te connaissent mieux.">
      <div className="card card-soft profil-reassure">
        <p>
          🌱 <strong>À ton rythme.</strong> Rien n’est obligatoire : chaque question peut être passée, et tu peux t’arrêter
          puis reprendre quand tu veux.
        </p>
        <p className="muted">🔒 Tout reste sur ton téléphone.</p>
      </div>

      {finished && (
        <p className="card profil-thanks" role="status">
          ✓ Merci ! La rubrique « {sectionMeta(finished).title} » est complétée.
        </p>
      )}

      {progress && (
        <div className="profil-progress">
          <div className="row-between">
            <strong>
              {progress.doneCount} rubrique{progress.doneCount > 1 ? 's' : ''} sur {progress.total} terminée{progress.doneCount > 1 ? 's' : ''}
            </strong>
            <span className="muted">{Math.round(progress.ratio * 100)} %</span>
          </div>
          <div className="profil-gauge" role="progressbar" aria-label="Avancement du profil" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress.ratio * 100)}>
            <span style={{ width: `${progress.ratio * 100}%` }} />
          </div>
          {progress.next && (
            <Link to={`/profil/${progress.next.id}`} className="btn btn-block profil-continue">
              {progress.doneCount === 0 && progress.ratio === 0 ? 'Commencer' : 'Continuer'} : {progress.next.title}
            </Link>
          )}
        </div>
      )}

      {groups.map((g) => (
        <section key={g} className="profil-group" aria-label={g}>
          <h2>{g}</h2>
          <ul className="profil-list">
            {PROFILE_SECTIONS.filter((s) => s.group === g).map((s) => {
              const st = progress?.statuses[s.id] ?? 'todo'
              return (
                <li key={s.id}>
                  <Link to={`/profil/${s.id}`} className={`profil-row is-${st}`}>
                    <span className="profil-row-icon" aria-hidden="true">
                      {s.icon}
                    </span>
                    <span className="profil-row-text">
                      <strong>{s.title}</strong>
                      <span className="muted">{s.hint}</span>
                    </span>
                    <span className={`profil-status is-${st}`}>{st === 'done' ? '✓ ' : ''}{STATUS_LABEL[st]}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      ))}

      <MyData />
    </PageShell>
  )
}
