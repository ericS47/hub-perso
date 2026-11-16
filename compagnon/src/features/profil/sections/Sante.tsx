import { useState } from 'react'
import Chips from '../../../ui/Chips'
import { Multi, SubBlock, TextField, YesNo } from '../fields'
import { newId, useSectionEditor } from '../store'
import type { Pathology } from '../types'
import Wizard, { type Step } from '../Wizard'

const COMMON = [
  'Diabète',
  'Hypertension',
  'Cholestérol',
  'Maladie cardiaque',
  'Asthme',
  'Apnée du sommeil',
  'Arthrose',
  'Mal de dos chronique',
  'Thyroïde',
  'Anxiété / dépression',
]

const FAMILY = ['Diabète', 'Hypertension', 'Maladie cardiaque', 'AVC', 'Cholestérol', 'Cancer', 'Surpoids', 'Autre']

export default function Sante() {
  const ed = useSectionEditor('sante')
  const [other, setOther] = useState('')
  if (!ed) return null
  const { data: d, update } = ed
  const list = d.pathologies ?? []

  const togglePatho = (name: string) =>
    update((p) => {
      const cur = p.pathologies ?? []
      const exists = cur.some((x) => x.name === name)
      return { ...p, pathologies: exists ? cur.filter((x) => x.name !== name) : [...cur, { id: newId(), name }] }
    })
  const setPatho = (id: string, patch: Partial<Pathology>) =>
    update((p) => ({ ...p, pathologies: (p.pathologies ?? []).map((x) => (x.id === id ? { ...x, ...patch } : x)) }))
  const addOther = () => {
    const name = other.trim()
    if (!name) return
    if (!list.some((x) => x.name.toLowerCase() === name.toLowerCase())) togglePatho(name)
    setOther('')
  }
  const extra = list.filter((x) => !COMMON.includes(x.name))

  const steps: Step[] = [
    {
      key: 'pathologies',
      title: 'Mes pathologies',
      content: (
        <>
          <YesNo label="As-tu des problèmes de santé suivis (pathologies) ?" value={d.hasPathologies} onChange={(hasPathologies) => update({ hasPathologies })} />
          {d.hasPathologies && (
            <SubBlock>
              <Chips
                label="Lesquelles ?"
                options={[...COMMON, ...extra.map((x) => x.name)].map((n) => ({ value: n, label: n }))}
                value={list.map((x) => x.name)}
                onChange={togglePatho}
              />
              <div className="profil-inline-add">
                <label className="field">
                  <span>Une autre ?</span>
                  <input
                    type="text"
                    value={other}
                    onChange={(e) => setOther(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addOther()
                    }}
                    placeholder="Nom de la pathologie"
                  />
                </label>
                <button type="button" className="btn btn-secondary" onClick={addOther} disabled={!other.trim()}>
                  Ajouter
                </button>
              </div>
            </SubBlock>
          )}
        </>
      ),
    },
    ...(d.hasPathologies && list.length > 0
      ? [
          {
            key: 'traitements',
            title: 'Mes traitements',
            content: (
              <>
                {list.map((x) => (
                  <div key={x.id} className="profil-item">
                    <h3>{x.name}</h3>
                    <YesNo label="Y a-t-il un traitement ?" value={x.treatment} onChange={(treatment) => setPatho(x.id, { treatment })} />
                    {x.treatment && (
                      <TextField label="Lequel ? (facultatif)" value={x.treatmentDetail} onChange={(treatmentDetail) => setPatho(x.id, { treatmentDetail })} placeholder="Nom du médicament, appareil…" />
                    )}
                  </div>
                ))}
              </>
            ),
          },
        ]
      : []),
    {
      key: 'famille',
      title: 'Mes antécédents familiaux',
      intro: 'Des problèmes de santé chez tes parents ? Réponds seulement si tu le sais.',
      content: (
        <>
          <Multi label="Ta mère" options={FAMILY.map((n) => ({ value: n, label: n }))} value={d.familyMother} onChange={(familyMother) => update({ familyMother })} />
          <Multi label="Ton père" options={FAMILY.map((n) => ({ value: n, label: n }))} value={d.familyFather} onChange={(familyFather) => update({ familyFather })} />
          <TextField label="Précisions (facultatif)" multiline value={d.familyNote} onChange={(familyNote) => update({ familyNote })} placeholder="Autre pathologie, frères et sœurs…" />
        </>
      ),
    },
  ]
  return <Wizard id="sante" steps={steps} onFinish={() => ed.setDone(true)} />
}
