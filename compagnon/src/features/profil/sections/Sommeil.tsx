import { toMinutes } from '../../../lib/dates'
import Scale from '../../../ui/Scale'
import { Choice, Multi, NumberField, SubBlock, TextField, TimeField, YesNo } from '../fields'
import { useSectionEditor } from '../store'
import type { FallAsleep, NapLength, SleepHistory, SleepRegularity } from '../types'
import { formatMinutes, OFTEN_OPTIONS } from '../utils'
import Wizard, { type Step } from '../Wizard'

const REGULARITY: { value: SleepRegularity; label: string }[] = [
  { value: 'regulier', label: 'Réguliers : à peu près les mêmes chaque jour' },
  { value: 'weekend', label: 'Réguliers en semaine, différents le week-end' },
  { value: 'aleatoire', label: 'Aléatoires : ça change souvent' },
]

const FALL_ASLEEP: { value: FallAsleep; label: string }[] = [
  { value: 'moins15', label: 'Moins de 15 min' },
  { value: '15a30', label: '15 à 30 min' },
  { value: '30a60', label: '30 min à 1 h' },
  { value: 'plus60', label: 'Plus d’1 h' },
  { value: 'variable', label: 'Ça dépend des soirs' },
]

const NAP_MOMENTS = ['En fin de matinée', 'Après le déjeuner', 'En fin d’après-midi', 'En début de soirée', 'Ça varie']

const NAP_LENGTH: { value: NapLength; label: string }[] = [
  { value: 'moins20', label: 'Moins de 20 min' },
  { value: '20a45', label: '20 à 45 min' },
  { value: '45a90', label: '45 min à 1 h 30' },
  { value: 'plus90', label: 'Plus d’1 h 30' },
]

const RITUALS = [
  '📱 Écran (téléphone, tablette)',
  '📺 Télé',
  '📖 Lecture',
  '🎵 Musique',
  '🏃 Sport',
  '🚿 Douche ou bain',
  '🧘 Relaxation, respiration',
  '🍵 Tisane, boisson chaude',
]

const HISTORY: { value: SleepHistory; label: string }[] = [
  { value: 'aucune', label: 'Je n’ai pas de souci de sommeil' },
  { value: 'toujours', label: 'Ça a toujours été le cas' },
  { value: 'recent', label: 'Depuis peu' },
  { value: 'periode', label: 'Sur une période précise' },
]

// Durée de la nuit, en passant minuit si besoin.
function nightLength(bed: string | undefined, wake: string | undefined): number | undefined {
  if (!bed || !wake) return undefined
  const m = (toMinutes(wake) - toMinutes(bed) + 24 * 60) % (24 * 60)
  return m || undefined
}

export default function Sommeil() {
  const ed = useSectionEditor('sommeil')
  if (!ed) return null
  const { data: d, update } = ed
  const length = nightLength(d.bedtime, d.wakeTime)

  const steps: Step[] = [
    {
      key: 'horaires',
      title: 'Mes horaires de sommeil',
      intro: 'Pense à une nuit habituelle.',
      content: (
        <>
          <div className="profil-two">
            <TimeField label="Je me couche vers" value={d.bedtime} onChange={(bedtime) => update({ bedtime })} />
            <TimeField label="Je me réveille vers" value={d.wakeTime} onChange={(wakeTime) => update({ wakeTime })} />
          </div>
          {length !== undefined && <p className="profil-answer">Soit environ {formatMinutes(length)} dans ton lit.</p>}
          <Choice label="Tes horaires sont plutôt…" options={REGULARITY} value={d.regularity} onChange={(regularity) => update({ regularity })} />
          <Choice label="Combien de temps te faut-il pour t’endormir ?" options={FALL_ASLEEP} value={d.fallAsleep} onChange={(fallAsleep) => update({ fallAsleep })} />
        </>
      ),
    },
    {
      key: 'nuit',
      title: 'Ma nuit',
      content: (
        <>
          <YesNo label="Te réveilles-tu pendant la nuit ?" value={d.wakesAtNight} onChange={(wakesAtNight) => update({ wakesAtNight })} />
          {d.wakesAtNight && (
            <SubBlock>
              <NumberField label="Combien de fois par nuit, environ ?" unit="fois" max={20} value={d.wakeCount} onChange={(wakeCount) => update({ wakeCount })} />
              <Choice label="Arrives-tu à te rendormir facilement ?" options={OFTEN_OPTIONS} value={d.backToSleep} onChange={(backToSleep) => update({ backToSleep })} />
            </SubBlock>
          )}
        </>
      ),
    },
    {
      key: 'siestes',
      title: 'Les siestes',
      content: (
        <>
          <YesNo label="Fais-tu des siestes dans la journée ?" value={d.naps} onChange={(naps) => update({ naps })} />
          {d.naps && (
            <SubBlock>
              <Multi label="Plutôt quand ?" options={NAP_MOMENTS.map((m) => ({ value: m, label: m }))} value={d.napMoments} onChange={(napMoments) => update({ napMoments })} />
              <NumberField label="Combien de siestes par semaine, environ ?" unit="fois / semaine" max={21} value={d.napsPerWeek} onChange={(napsPerWeek) => update({ napsPerWeek })} />
              <Choice label="Combien de temps dure une sieste ?" options={NAP_LENGTH} value={d.napLength} onChange={(napLength) => update({ napLength })} />
            </SubBlock>
          )}
        </>
      ),
    },
    {
      key: 'rituels',
      title: 'Avant de me coucher',
      intro: 'Ce que tu fais en général dans l’heure qui précède le coucher.',
      content: (
        <>
          <Multi label="Avant de dormir, il y a…" options={RITUALS.map((r) => ({ value: r, label: r }))} value={d.rituals} onChange={(rituals) => update({ rituals })} />
          <TextField
            label="Comment ça se passe ? (facultatif)"
            multiline
            value={d.ritualNote}
            onChange={(ritualNote) => update({ ritualNote })}
            placeholder="Je regarde une série au lit, puis je lis un peu…"
          />
        </>
      ),
    },
    {
      key: 'qualite',
      title: 'Mon sommeil en général',
      content: (
        <>
          <Scale label="Comment évalues-tu ton sommeil ?" min={1} max={10} value={d.quality} onChange={(quality) => update({ quality })} minLabel="Très mauvais" maxLabel="Excellent" />
          <Choice label="Tes difficultés de sommeil, c’est…" options={HISTORY} value={d.history} onChange={(history) => update({ history })} />
          {(d.history === 'recent' || d.history === 'periode') && (
            <SubBlock>
              <TextField
                label={d.history === 'recent' ? 'Depuis quand ? (facultatif)' : 'Quelle période ? (facultatif)'}
                value={d.historyDetail}
                onChange={(historyDetail) => update({ historyDetail })}
                placeholder={d.history === 'recent' ? 'Depuis 2 mois, depuis la rentrée…' : 'Après une naissance, pendant un deuil, en 2020…'}
              />
            </SubBlock>
          )}
        </>
      ),
    },
  ]
  return <Wizard id="sommeil" steps={steps} onFinish={() => ed.setDone(true)} />
}
