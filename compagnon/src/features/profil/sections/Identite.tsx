import { isoDate } from '../../../lib/dates'
import { ageFrom } from '../utils'
import { NumberField, TextField } from '../fields'
import { useSectionEditor } from '../store'
import Wizard, { type Step } from '../Wizard'

export default function Identite() {
  const ed = useSectionEditor('identite')
  if (!ed) return null
  const { data: d, update } = ed
  const age = ageFrom(d.birthDate)

  const steps: Step[] = [
    {
      key: 'naissance',
      title: 'Ma naissance',
      content: (
        <>
          <label className="field">
            <span>Date de naissance</span>
            <input type="date" max={isoDate()} min="1900-01-01" value={d.birthDate ?? ''} onChange={(e) => update({ birthDate: e.target.value || undefined })} />
          </label>
          {age !== undefined && <p className="profil-answer">🎂 Tu as {age} ans.</p>}
          <TextField label="Lieu de naissance" value={d.birthPlace} onChange={(birthPlace) => update({ birthPlace })} placeholder="Ville, pays" />
        </>
      ),
    },
    {
      key: 'mesures',
      title: 'Ma taille et mon poids',
      intro: 'Seulement si tu le souhaites. Ces repères servent à ton équipe soignante, rien n’est calculé ni jugé ici.',
      content: (
        <>
          <NumberField label="Taille" unit="cm" min={50} max={250} value={d.heightCm} onChange={(heightCm) => update({ heightCm })} />
          <NumberField label="Poids" unit="kg" min={20} max={400} decimals value={d.weightKg} onChange={(weightKg) => update({ weightKg })} />
          <p className="profil-hint">Tu peux laisser vide et en parler directement en consultation.</p>
        </>
      ),
    },
  ]
  return <Wizard id="identite" steps={steps} onFinish={() => ed.setDone(true)} />
}
