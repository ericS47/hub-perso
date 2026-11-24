import { isoDate } from '../../../lib/dates'
import { ageFrom } from '../utils'
import { Choice, NumberField, TextField } from '../fields'
import { newId, useSectionEditor } from '../store'
import type { WeightEntry } from '../types'
import Wizard, { type Step } from '../Wizard'

export default function Identite() {
  const ed = useSectionEditor('identite')
  if (!ed) return null
  const { data: d, update } = ed
  const age = ageFrom(d.birthDate)
  const history = d.weightHistory ?? []
  const setEntry = (id: string, patch: Partial<WeightEntry>) =>
    update((p) => ({ ...p, weightHistory: (p.weightHistory ?? []).map((w) => (w.id === id ? { ...w, ...patch } : w)) }))

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
          <Choice
            label="Es-tu satisfait·e de ton poids ?"
            options={[
              { value: 'oui', label: 'Oui' },
              { value: 'moyen', label: 'Pas tout à fait' },
              { value: 'non', label: 'Non' },
            ]}
            value={d.weightSatisfied}
            onChange={(weightSatisfied) => update({ weightSatisfied })}
          />
        </>
      ),
    },
    {
      key: 'historique',
      title: 'Mon poids au fil du temps',
      intro: 'Facultatif. Si tu t’en souviens, note quelques poids à des moments marquants, avec la raison d’un changement.',
      content: (
        <>
          {history.map((w, n) => (
            <div key={w.id} className="profil-item">
              <div className="row-between">
                <strong>Poids n° {n + 1}</strong>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={`Retirer le poids n° ${n + 1}`}
                  onClick={() => update((p) => ({ ...p, weightHistory: (p.weightHistory ?? []).filter((x) => x.id !== w.id) }))}
                >
                  ✕
                </button>
              </div>
              <div className="profil-two">
                <label className="field">
                  <span>Date</span>
                  <input type="date" max={isoDate()} min="1900-01-01" value={w.date ?? ''} onChange={(e) => setEntry(w.id, { date: e.target.value || undefined })} />
                </label>
                <NumberField label="Poids" unit="kg" min={20} max={400} decimals value={w.kg} onChange={(kg) => setEntry(w.id, { kg })} />
              </div>
              <TextField
                label="Remarque (facultatif)"
                multiline
                value={w.note}
                onChange={(note) => setEntry(w.id, { note })}
                placeholder="Grossesse, arrêt du tabac, régime, blessure, déménagement…"
              />
            </div>
          ))}
          <button
            type="button"
            className="btn btn-secondary btn-block"
            onClick={() => update((p) => ({ ...p, weightHistory: [...(p.weightHistory ?? []), { id: newId() }] }))}
          >
            + Ajouter un poids
          </button>
        </>
      ),
    },
  ]
  return <Wizard id="identite" steps={steps} onFinish={() => ed.setDone(true)} />
}
