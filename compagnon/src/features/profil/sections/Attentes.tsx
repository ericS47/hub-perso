import { Multi, TextField } from '../fields'
import { useSectionEditor } from '../store'
import Wizard, { type Step } from '../Wizard'

const REASONS = [
  'Reprendre une activité physique',
  'Me sentir mieux dans mon corps',
  'Avoir plus d’énergie',
  'Mieux gérer mon alimentation',
  'Prendre soin de ma santé',
  'Retrouver le moral',
  'Être accompagné·e',
  'Sur conseil de mon médecin',
]

export default function Attentes() {
  const ed = useSectionEditor('attentes')
  if (!ed) return null
  const { data: d, update } = ed

  const steps: Step[] = [
    {
      key: 'pourquoi',
      title: 'Pourquoi je viens ici',
      content: (
        <>
          <Multi label="Qu’est-ce qui t’amène ?" options={REASONS.map((r) => ({ value: r, label: r }))} value={d.reasons} onChange={(reasons) => update({ reasons })} />
          <TextField label="Avec tes mots (facultatif)" multiline value={d.why} onChange={(why) => update({ why })} />
        </>
      ),
    },
    {
      key: 'attentes',
      title: 'Mes attentes',
      content: (
        <TextField
          label="Qu’attends-tu de cet accompagnement ?"
          hint="Ce que tu aimerais voir changer, ce qui te ferait dire « ça valait le coup »."
          multiline
          value={d.expectations}
          onChange={(expectations) => update({ expectations })}
        />
      ),
    },
  ]
  return <Wizard id="attentes" steps={steps} onFinish={() => ed.setDone(true)} />
}
