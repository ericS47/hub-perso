import Scale from '../../../ui/Scale'
import { Choice, NumberField, SubBlock, TextField, YesNo } from '../fields'
import { ScheduleBlock } from '../Schedule'
import { useSectionEditor } from '../store'
import type { Couple, Custody } from '../types'
import Wizard, { type Step } from '../Wizard'

const COUPLE: { value: Couple; label: string }[] = [
  { value: 'celibataire', label: 'Célibataire' },
  { value: 'couple', label: 'En couple' },
  { value: 'marie', label: 'Marié·e / pacsé·e' },
  { value: 'separe', label: 'Séparé·e / divorcé·e' },
  { value: 'veuf', label: 'Veuf / veuve' },
  { value: 'nsp', label: 'Je préfère ne pas répondre' },
]

const CUSTODY: { value: Custody; label: string }[] = [
  { value: 'totale', label: 'Oui, tout le temps' },
  { value: 'alternee', label: 'En garde alternée' },
  { value: 'partielle', label: 'Certains jours' },
  { value: 'non', label: 'Non (enfants grands ou ailleurs)' },
]

export default function Foyer() {
  const ed = useSectionEditor('foyer')
  if (!ed) return null
  const { data: d, update } = ed
  const caring = d.children === true && d.custody !== undefined && d.custody !== 'non'

  const steps: Step[] = [
    {
      key: 'couple',
      title: 'Ma vie de couple',
      content: <Choice label="Es-tu marié·e, en couple… ?" options={COUPLE} value={d.couple} onChange={(couple) => update({ couple })} />,
    },
    {
      key: 'enfants',
      title: 'Mes enfants',
      content: (
        <>
          <YesNo label="As-tu des enfants ?" value={d.children} onChange={(children) => update({ children })} />
          {d.children && (
            <SubBlock>
              <NumberField label="Combien ?" max={20} value={d.childrenCount} onChange={(childrenCount) => update({ childrenCount })} />
              <TextField label="Leurs âges (facultatif)" value={d.childrenAges} onChange={(childrenAges) => update({ childrenAges })} placeholder="4, 9 et 15 ans" />
              <Choice label="En as-tu la garde ?" options={CUSTODY} value={d.custody} onChange={(custody) => update({ custody })} />
            </SubBlock>
          )}
        </>
      ),
    },
    ...(caring
      ? [
          {
            key: 'enfants-planning',
            title: 'Les moments pris par les enfants',
            intro:
              'Indique les créneaux où tu n’es pas disponible à cause des enfants (trajets d’école, activités, garde…). L’agenda évitera ces moments.',
            content: (
              <ScheduleBlock
                value={d.childSchedule}
                onChange={(childSchedule) => update({ childSchedule })}
                formatLabel="Ce planning est-il le même chaque semaine ?"
                formatOptions={[
                  { value: 'standard', label: 'Oui, chaque semaine' },
                  { value: 'alterne', label: 'Une semaine sur deux' },
                  { value: 'aleatoire', label: 'Ça change tout le temps' },
                ]}
                weekNames={['Semaine avec les enfants', 'Semaine sans les enfants']}
                defaultSlot={{ start: '08:00', end: '09:00' }}
                editorLabel="Moments pris"
                randomNote="Pas de souci : chaque semaine, tu pourras ajuster tes disponibilités directement dans l’agenda."
              />
            ),
          },
        ]
      : []),
    {
      key: 'parents',
      title: 'Mes parents',
      content: (
        <>
          <YesNo label="Dois-tu t’occuper de tes parents (ou d’un proche) ?" value={d.parents} onChange={(parents) => update({ parents })} />
          {d.parents && (
            <SubBlock>
              <Scale
                label="À quel point est-ce prenant pour toi ?"
                value={d.parentsLoad}
                onChange={(parentsLoad) => update({ parentsLoad: parentsLoad === d.parentsLoad ? undefined : parentsLoad })}
                minLabel="Pas du tout"
                maxLabel="Énormément"
              />
              <TextField label="De quoi s’agit-il ? (facultatif)" multiline value={d.parentsNote} onChange={(parentsNote) => update({ parentsNote })} placeholder="Rendez-vous médicaux, courses, visites…" />
            </SubBlock>
          )}
        </>
      ),
    },
    ...(d.parents
      ? [
          {
            key: 'parents-planning',
            title: 'Les rendez-vous de mes parents',
            intro: 'Si certains moments reviennent régulièrement (visites, rendez-vous), note-les : l’agenda les évitera.',
            content: (
              <ScheduleBlock
                value={d.parentsSchedule}
                onChange={(parentsSchedule) => update({ parentsSchedule })}
                formatLabel="Ces moments sont-ils réguliers ?"
                formatOptions={[
                  { value: 'standard', label: 'Oui, chaque semaine' },
                  { value: 'alterne', label: 'Une semaine sur deux' },
                  { value: 'aleatoire', label: 'Non, ça varie' },
                ]}
                weekNames={['1re semaine', '2e semaine']}
                defaultSlot={{ start: '14:00', end: '16:00' }}
                editorLabel="Moments pris"
                randomNote="D’accord : chaque semaine, tu pourras bloquer les rendez-vous prévus directement dans l’agenda."
              />
            ),
          },
        ]
      : []),
  ]
  return <Wizard id="foyer" steps={steps} onFinish={() => ed.setDone(true)} />
}
