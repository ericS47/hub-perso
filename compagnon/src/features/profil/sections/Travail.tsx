import { jobLabel, travailJobs } from '../constraints'
import { Choice, SubBlock, TextField, YesNo } from '../fields'
import { ScheduleBlock } from '../Schedule'
import { newId, useSectionEditor } from '../store'
import type { Emploi, TravailData, WorkStatus } from '../types'
import Wizard, { type Step } from '../Wizard'

const STATUS: { value: WorkStatus; label: string }[] = [
  { value: 'retraite', label: 'À la retraite' },
  { value: 'recherche', label: 'En recherche d’emploi' },
  { value: 'arret', label: 'En arrêt / invalidité' },
  { value: 'etudes', label: 'En études' },
  { value: 'foyer', label: 'Au foyer' },
  { value: 'autre', label: 'Autre' },
]

// Passe à la liste d'emplois en abandonnant l'ancien format à un seul emploi.
function withJobs(p: TravailData, jobs: Emploi[]): TravailData {
  return { works: p.works, status: p.status, jobs }
}

export default function Travail() {
  const ed = useSectionEditor('travail')
  if (!ed) return null
  const { data: d, update } = ed
  const jobs = travailJobs(d)

  const setJob = (id: string, patch: Partial<Emploi>) =>
    update((p) => withJobs(p, travailJobs(p).map((e) => (e.id === id ? { ...e, ...patch } : e))))
  const addJob = () => update((p) => withJobs(p, [...travailJobs(p), { id: newId(), employer: '' }]))
  const removeJob = (id: string) => update((p) => withJobs(p, travailJobs(p).filter((e) => e.id !== id)))

  const steps: Step[] = [
    {
      key: 'travail',
      title: 'Est-ce que je travaille ?',
      content: (
        <>
          <YesNo
            label="Travailles-tu en ce moment ?"
            value={d.works}
            onChange={(works) =>
              update((p) => {
                const cur = travailJobs(p)
                return withJobs({ ...p, works }, works && !cur.length ? [{ id: newId(), employer: '' }] : cur)
              })
            }
          />
          {d.works === true && (
            <SubBlock>
              <p className="muted">Tu as plusieurs emplois ? Ajoute-les un par un, avec le nom de la structure à chaque fois.</p>
              {jobs.map((e, n) => (
                <div key={e.id} className="profil-item">
                  <div className="row-between">
                    <strong>Emploi n° {n + 1}</strong>
                    {jobs.length > 1 && (
                      <button type="button" className="icon-btn" aria-label={`Retirer ${jobLabel(e, n)}`} onClick={() => removeJob(e.id)}>
                        ✕
                      </button>
                    )}
                  </div>
                  <TextField
                    label="Nom de la structure"
                    value={e.employer}
                    onChange={(employer) => setJob(e.id, { employer })}
                    placeholder="Hôpital Nord, Mairie, particulier…"
                  />
                  <TextField label="Ton métier (facultatif)" value={e.job} onChange={(job) => setJob(e.id, { job })} placeholder="Aide-soignante, chauffeur…" />
                </div>
              ))}
              <button type="button" className="btn btn-secondary btn-block" onClick={addJob}>
                + Ajouter un emploi
              </button>
            </SubBlock>
          )}
          {d.works === false && (
            <SubBlock>
              <Choice label="Tu es plutôt… (facultatif)" options={STATUS} value={d.status} onChange={(status) => update({ status })} />
            </SubBlock>
          )}
        </>
      ),
    },
    // Une étape d'horaires par emploi.
    ...(d.works
      ? jobs.map(
          (e, n): Step => ({
            key: `horaires-${e.id}`,
            title: jobs.length > 1 ? `Mes horaires – ${jobLabel(e, n)}` : 'Mes horaires',
            intro:
              n === 0
                ? 'Tes horaires de travail (trajets compris si tu veux) : l’agenda te proposera des séances en dehors.'
                : 'Les horaires de cet emploi s’ajoutent aux autres : l’agenda en tiendra compte aussi.',
            content: (
              <ScheduleBlock
                key={e.id}
                value={e.schedule}
                onChange={(schedule) => setJob(e.id, { schedule })}
                formatLabel={jobs.length > 1 ? `Comment sont organisées tes semaines chez ${jobLabel(e, n)} ?` : 'Comment sont organisées tes semaines ?'}
                formatOptions={[
                  { value: 'standard', label: 'Semaine standard (pareil chaque semaine)' },
                  { value: 'alterne', label: 'Petite et grande semaine' },
                  { value: 'aleatoire', label: 'Horaires aléatoires' },
                ]}
                defaultSlot={{ start: '09:00', end: '17:00' }}
                editorLabel="Heures de travail"
                randomNote="Tes horaires changent d’une semaine à l’autre : pas de planning fixe ici. Chaque début de semaine, tu indiqueras tes disponibilités dans l’agenda."
              />
            ),
          }),
        )
      : []),
  ]
  return <Wizard id="travail" steps={steps} onFinish={() => ed.setDone(true)} />
}
