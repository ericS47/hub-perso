import Scale from '../../../ui/Scale'
import { Choice, SubBlock, TextField, YesNo } from '../fields'
import { newId, useSectionEditor } from '../store'
import type { Psy, Therapy } from '../types'
import SupportBox from '../SupportBox'
import Wizard, { type Step } from '../Wizard'

const PSY: { value: Psy; label: string }[] = [
  { value: 'psychiatre', label: 'Psychiatre' },
  { value: 'psychologue', label: 'Psychologue' },
  { value: 'autre', label: 'Autre (psychothérapeute…)' },
]

// Seuil d'affichage de l'encart de soutien (moral ≤ 2 sur 10).
const LOW = 2

export default function Moral() {
  const ed = useSectionEditor('moral')
  if (!ed) return null
  const { data: d, update } = ed
  const therapies = d.therapies ?? []
  const setTherapy = (id: string, patch: Partial<Therapy>) =>
    update((p) => ({ ...p, therapies: (p.therapies ?? []).map((t) => (t.id === id ? { ...t, ...patch } : t)) }))
  const low = d.moral !== undefined && d.moral <= LOW

  const compare =
    d.moral === undefined || d.moralBefore === undefined
      ? null
      : d.moral > d.moralBefore
        ? 'Plutôt mieux qu’avant.'
        : d.moral < d.moralBefore
          ? 'Un peu moins bien qu’avant. C’est utile de le savoir.'
          : 'À peu près pareil qu’avant.'

  const steps: Step[] = [
    {
      key: 'moral',
      title: 'Mon moral',
      content: (
        <>
          <Scale label="Comment est ton moral en ce moment ?" value={d.moral} onChange={(moral) => update({ moral })} minLabel="Très bas" maxLabel="Excellent" />
          <Scale label="Et avant (il y a quelques mois) ?" value={d.moralBefore} onChange={(moralBefore) => update({ moralBefore })} minLabel="Très bas" maxLabel="Excellent" />
          {compare && <p className="profil-answer">{compare}</p>}
          {low && <SupportBox />}
        </>
      ),
    },
    {
      key: 'ressenti',
      title: 'Comment je me sens',
      content: (
        <>
          <Scale label="Te sens-tu épanoui·e ?" value={d.epanoui} onChange={(epanoui) => update({ epanoui })} minLabel="Pas du tout" maxLabel="Tout à fait" />
          <Scale label="Te sens-tu fatigué·e ?" value={d.fatigue} onChange={(fatigue) => update({ fatigue })} minLabel="Pas du tout" maxLabel="Épuisé·e" />
          <Scale label="Te sens-tu stressé·e ?" value={d.stress} onChange={(stress) => update({ stress })} minLabel="Pas du tout" maxLabel="Énormément" />
          {low && <SupportBox />}
        </>
      ),
    },
    {
      key: 'suivi',
      title: 'Mon suivi',
      intro: 'Consulter, c’est prendre soin de soi. Ces réponses restent sur ton téléphone.',
      content: (
        <>
          <YesNo
            label="As-tu déjà consulté un psychiatre ou un psychologue ?"
            value={d.hadTherapy}
            onChange={(hadTherapy) =>
              update((p) => ({ ...p, hadTherapy, therapies: hadTherapy && !p.therapies?.length ? [{ id: newId() }] : p.therapies }))
            }
          />
          {d.hadTherapy && (
            <SubBlock>
              {therapies.map((t, n) => (
                <div key={t.id} className="profil-item">
                  <div className="row-between">
                    <strong>Suivi n° {n + 1}</strong>
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={`Retirer le suivi n° ${n + 1}`}
                      onClick={() => update((p) => ({ ...p, therapies: (p.therapies ?? []).filter((x) => x.id !== t.id) }))}
                    >
                      ✕
                    </button>
                  </div>
                  <Choice label="Avec qui ?" options={PSY} value={t.pro} onChange={(pro) => setTherapy(t.id, { pro })} />
                  <TextField label="Pour quel motif ? (facultatif)" multiline value={t.reason} onChange={(reason) => setTherapy(t.id, { reason })} placeholder="Deuil, anxiété, burn-out…" />
                  <TextField label="Pendant combien de temps ?" value={t.duration} onChange={(duration) => setTherapy(t.id, { duration })} placeholder="3 mois, 2 ans…" />
                  <YesNo label="Est-ce encore en cours ?" value={t.ongoing} onChange={(ongoing) => setTherapy(t.id, { ongoing })} />
                </div>
              ))}
              <button
                type="button"
                className="btn btn-secondary btn-block"
                onClick={() => update((p) => ({ ...p, therapies: [...(p.therapies ?? []), { id: newId() }] }))}
              >
                + Ajouter un autre suivi
              </button>
            </SubBlock>
          )}
        </>
      ),
    },
    {
      key: 'image',
      title: 'Mon image corporelle',
      intro: 'Il n’y a pas de bonne réponse : c’est ton ressenti, et il a toute sa place.',
      content: (
        <>
          <Scale
            label="Comment te sens-tu avec ton corps en ce moment ?"
            value={d.bodyImage}
            onChange={(bodyImage) => update({ bodyImage })}
            minLabel="Pas à l’aise"
            maxLabel="Bien dans mon corps"
          />
          <TextField label="Tu veux ajouter quelque chose ? (facultatif)" multiline value={d.note} onChange={(note) => update({ note })} />
        </>
      ),
    },
  ]
  return <Wizard id="moral" steps={steps} onFinish={() => ed.setDone(true)} />
}
