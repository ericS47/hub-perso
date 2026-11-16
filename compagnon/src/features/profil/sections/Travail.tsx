import { Choice, SubBlock, TextField, YesNo } from '../fields'
import { ScheduleBlock } from '../Schedule'
import { useSectionEditor } from '../store'
import type { WorkStatus } from '../types'
import Wizard, { type Step } from '../Wizard'

const STATUS: { value: WorkStatus; label: string }[] = [
  { value: 'retraite', label: 'À la retraite' },
  { value: 'recherche', label: 'En recherche d’emploi' },
  { value: 'arret', label: 'En arrêt / invalidité' },
  { value: 'etudes', label: 'En études' },
  { value: 'foyer', label: 'Au foyer' },
  { value: 'autre', label: 'Autre' },
]

export default function Travail() {
  const ed = useSectionEditor('travail')
  if (!ed) return null
  const { data: d, update } = ed

  const steps: Step[] = [
    {
      key: 'travail',
      title: 'Est-ce que je travaille ?',
      content: (
        <>
          <YesNo label="Travailles-tu en ce moment ?" value={d.works} onChange={(works) => update({ works })} />
          {d.works === true && (
            <SubBlock>
              <TextField label="Ton métier (facultatif)" value={d.job} onChange={(job) => update({ job })} placeholder="Aide-soignante, chauffeur…" />
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
    ...(d.works
      ? [
          {
            key: 'horaires',
            title: 'Mes horaires',
            intro: 'Tes horaires de travail (trajets compris si tu veux) : l’agenda te proposera des séances en dehors.',
            content: (
              <ScheduleBlock
                value={d.schedule}
                onChange={(schedule) => update({ schedule })}
                formatLabel="Comment sont organisées tes semaines ?"
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
          },
        ]
      : []),
  ]
  return <Wizard id="travail" steps={steps} onFinish={() => ed.setDone(true)} />
}
