import { Choice, DaysPerWeek, DurationField, NumberField, SubBlock, YesNo } from '../fields'
import { formatMinutes } from '../utils'
import { summarizeOnaps, WEEKLY_TARGET_MIN } from '../onaps'
import { useSectionEditor } from '../store'
import type { ActivityBlock, OnapsData } from '../types'
import Wizard, { type Step } from '../Wizard'

// Questions inspirées de l'ONAPS-PAQ (questionnaire d'activité physique et de sédentarité de
// l'Observatoire national de l'activité physique et de la sédentarité, dérivé du GPAQ de l'OMS) :
// pour chaque domaine (travail, déplacements, loisirs / domicile), jours par semaine et durée par jour
// d'activité d'intensité élevée ou modérée, puis temps passé assis.
// ⚠️ Libellés reformulés de mémoire : le texte exact des questions est À FAIRE VALIDER par l'équipe soignante.

interface BlockProps {
  question: string
  example: string
  value: ActivityBlock | undefined
  onChange: (b: ActivityBlock) => void
}

function ActivityQuestion({ question, example, value, onChange }: BlockProps) {
  const b = value ?? {}
  return (
    <div className="profil-q">
      <YesNo label={question} value={b.yes} onChange={(yes) => onChange({ ...b, yes })} />
      <p className="profil-hint">{example}</p>
      {b.yes && (
        <SubBlock>
          <DaysPerWeek label="Combien de jours par semaine ?" value={b.days} onChange={(days) => onChange({ ...b, days })} />
          <DurationField label="Combien de temps, un jour habituel ?" value={b.minPerDay} onChange={(minPerDay) => onChange({ ...b, minPerDay })} />
        </SubBlock>
      )}
    </div>
  )
}

const HOURS = [1, 2, 4, 6, 8, 10, 12]

export default function Onaps() {
  const ed = useSectionEditor('onaps')
  if (!ed) return null
  const { data: d, update } = ed
  const set = (k: keyof OnapsData) => (b: ActivityBlock) => update({ [k]: b })
  const sum = summarizeOnaps(d)
  const pct = Math.min(100, Math.round((sum.equivalentMin / WEEKLY_TARGET_MIN) * 100))

  const steps: Step[] = [
    {
      key: 'travail',
      title: 'Au travail',
      intro:
        'Pense à ton activité principale : travail payé ou non, études, bénévolat, tâches à la maison si c’est ton activité principale. On ne compte que les moments d’au moins 10 minutes d’affilée.',
      content: (
        <>
          <ActivityQuestion
            question="Ton activité demande-t-elle des efforts intenses, qui essoufflent fortement ?"
            example="Par exemple : porter des charges lourdes, creuser, travaux de chantier."
            value={d.workVigorous}
            onChange={set('workVigorous')}
          />
          <ActivityQuestion
            question="Et des efforts modérés, qui accélèrent un peu la respiration ?"
            example="Par exemple : marcher d’un bon pas, porter des charges légères, soins aux personnes."
            value={d.workModerate}
            onChange={set('workModerate')}
          />
        </>
      ),
    },
    {
      key: 'deplacements',
      title: 'Mes déplacements',
      intro: 'Pour aller au travail, faire les courses, accompagner les enfants…',
      content: (
        <ActivityQuestion
          question="Fais-tu des trajets d’au moins 10 minutes à pied ou à vélo ?"
          example="Les trajets en voiture, bus ou train ne comptent pas ici."
          value={d.travelActive}
          onChange={set('travelActive')}
        />
      ),
    },
    {
      key: 'loisirs',
      title: 'Loisirs et maison',
      content: (
        <>
          <ActivityQuestion
            question="Pendant tes loisirs, fais-tu des activités intenses ?"
            example="Par exemple : course à pied, football, vélo rapide, cours de fitness soutenu."
            value={d.leisureVigorous}
            onChange={set('leisureVigorous')}
          />
          <ActivityQuestion
            question="Des activités de loisirs modérées ?"
            example="Par exemple : marche rapide, vélo tranquille, natation, danse, aquagym."
            value={d.leisureModerate}
            onChange={set('leisureModerate')}
          />
          <ActivityQuestion
            question="À la maison, des activités modérées ?"
            example="Par exemple : ménage soutenu, jardinage, bricolage."
            value={d.homeModerate}
            onChange={set('homeModerate')}
          />
        </>
      ),
    },
    {
      key: 'assis',
      title: 'Le temps assis',
      intro: 'Un jour habituel, en comptant le travail, les transports, les repas, les écrans… mais pas le sommeil.',
      content: (
        <>
          <Choice
            label="Combien d’heures passes-tu assis·e ou allongé·e par jour ?"
            options={HOURS.map((h) => ({ value: String(h), label: `${h} h` }))}
            value={d.sittingHoursPerDay !== undefined && HOURS.includes(d.sittingHoursPerDay) ? String(d.sittingHoursPerDay) : undefined}
            onChange={(v) => update({ sittingHoursPerDay: v === undefined ? undefined : Number(v) })}
          />
          <NumberField label="Ou en heures" unit="h / jour" max={24} decimals value={d.sittingHoursPerDay} onChange={(sittingHoursPerDay) => update({ sittingHoursPerDay })} />
          <NumberField
            label="Dont devant un écran, en dehors du travail"
            unit="h / jour"
            max={24}
            decimals
            value={d.screenHoursPerDay}
            onChange={(screenHoursPerDay) => update({ screenHoursPerDay })}
          />
        </>
      ),
    },
    {
      key: 'resume',
      title: 'Mon résumé',
      content: sum.answered ? (
        <>
          <div className="profil-onaps-total">
            <strong>{formatMinutes(sum.moderateMin + sum.vigorousMin)}</strong>
            <span className="muted">d’activité physique par semaine</span>
          </div>
          <ul className="profil-onaps-list">
            <li>
              Au travail : <strong>{formatMinutes(sum.byDomain.travail)}</strong>
            </li>
            <li>
              En déplacements : <strong>{formatMinutes(sum.byDomain.deplacements)}</strong>
            </li>
            <li>
              Loisirs et maison : <strong>{formatMinutes(sum.byDomain.loisirs)}</strong>
            </li>
            {sum.sittingHours !== undefined && (
              <li>
                Temps assis : <strong>{String(sum.sittingHours).replace('.', ',')} h</strong> par jour
              </li>
            )}
          </ul>
          <div className="profil-gauge" aria-hidden="true">
            <span style={{ width: `${pct}%` }} />
          </div>
          <p className="profil-hint">
            Repère courant : au moins {WEEKLY_TARGET_MIN} minutes d’activité modérée par semaine (une minute intense compte
            environ double). Tes réponses représentent environ {formatMinutes(sum.equivalentMin)} en équivalent modéré.
            {sum.equivalentMin >= WEEKLY_TARGET_MIN ? ' C’est une belle base.' : ' Chaque minute compte : on avancera petit à petit.'}
          </p>
        </>
      ) : (
        <p className="muted">Tu n’as pas encore répondu aux questions : tu peux revenir en arrière ou terminer plus tard.</p>
      ),
    },
  ]
  return (
    <>
      <Wizard id="onaps" steps={steps} onFinish={() => ed.setDone(true)} />
      <p className="profil-validation">
        Questions inspirées du questionnaire ONAPS-PAQ ; le libellé exact est à faire valider par l’équipe soignante. Ce
        résumé est descriptif, ce n’est pas un score médical.
      </p>
    </>
  )
}
