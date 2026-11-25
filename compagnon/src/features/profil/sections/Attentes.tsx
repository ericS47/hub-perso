import { Choice, Multi, TextField } from '../fields'
import { newId, useSectionEditor } from '../store'
import type { Goal, GoalDomain, GoalPriority, SubGoal } from '../types'
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

const DOMAINS: { id: GoalDomain; title: string; icon: string; examples: string; subExamples: string }[] = [
  { id: 'ap', title: 'Activité physique', icon: '🏃', examples: 'Marcher 30 minutes sans m’arrêter', subExamples: 'Marcher 10 minutes chaque jour' },
  { id: 'diet', title: 'Alimentation', icon: '🥗', examples: 'Moins grignoter le soir', subExamples: 'Préparer une collation pour 16 h' },
  { id: 'psy', title: 'Bien-être psychologique', icon: '🧠', examples: 'Mieux gérer mon stress', subExamples: 'Faire 5 minutes de respiration le soir' },
  { id: 'medical', title: 'Santé, suivi médical', icon: '🩺', examples: 'Faire baisser ma tension', subExamples: 'Prendre rendez-vous chez mon médecin' },
]

const PRIORITIES: { value: GoalPriority; label: string }[] = [
  { value: 'important', label: '🔴 Important' },
  { value: 'moyen', label: '🟠 Moyen' },
  { value: 'plus-tard', label: '⚪ Pas dans l’immédiat' },
]

export default function Attentes() {
  const ed = useSectionEditor('attentes')
  if (!ed) return null
  const { data: d, update } = ed
  const goals = d.goals ?? []

  const setGoals = (fn: (g: Goal[]) => Goal[]) => update((p) => ({ ...p, goals: fn(p.goals ?? []) }))
  const setGoal = (id: string, patch: Partial<Goal>) => setGoals((all) => all.map((g) => (g.id === id ? { ...g, ...patch } : g)))
  const setSubs = (id: string, fn: (s: SubGoal[]) => SubGoal[]) => setGoals((all) => all.map((g) => (g.id === id ? { ...g, subs: fn(g.subs ?? []) } : g)))
  const setSub = (id: string, subId: string, patch: Partial<SubGoal>) => setSubs(id, (subs) => subs.map((x) => (x.id === subId ? { ...x, ...patch } : x)))

  // Une étape par domaine : objectifs, priorité, sous-objectifs.
  const domainStep = (dom: (typeof DOMAINS)[number]): Step => {
    const list = goals.filter((g) => g.domain === dom.id)
    return {
      key: `objectifs-${dom.id}`,
      title: `${dom.icon} Mes objectifs : ${dom.title.toLowerCase()}`,
      intro: list.length ? undefined : 'Facultatif. Tu peux passer ce domaine s’il ne te concerne pas pour l’instant.',
      content: (
        <>
          {list.map((g, n) => (
            <div key={g.id} className="profil-item">
              <div className="row-between">
                <strong>Objectif n° {n + 1}</strong>
                <button type="button" className="icon-btn" aria-label={`Retirer l’objectif n° ${n + 1}`} onClick={() => setGoals((all) => all.filter((x) => x.id !== g.id))}>
                  ✕
                </button>
              </div>
              <TextField label="Mon objectif" value={g.text} onChange={(text) => setGoal(g.id, { text })} placeholder={dom.examples} />
              <Choice label="Priorité" options={PRIORITIES} value={g.priority} onChange={(priority) => setGoal(g.id, { priority })} />
              {(g.subs ?? []).map((sg, k) => (
                <div key={sg.id} className="profil-subgoal">
                  <div className="row-between">
                    <strong>
                      ↳ Sous-objectif {n + 1}.{k + 1}
                    </strong>
                    <button type="button" className="icon-btn" aria-label={`Retirer le sous-objectif ${n + 1}.${k + 1}`} onClick={() => setSubs(g.id, (subs) => subs.filter((x) => x.id !== sg.id))}>
                      ✕
                    </button>
                  </div>
                  <TextField label="Sous-objectif" value={sg.text} onChange={(text) => setSub(g.id, sg.id, { text })} placeholder={dom.subExamples} />
                  <Choice label="Priorité" options={PRIORITIES} value={sg.priority} onChange={(priority) => setSub(g.id, sg.id, { priority })} />
                </div>
              ))}
              <button type="button" className="btn btn-ghost btn-block" onClick={() => setSubs(g.id, (subs) => [...subs, { id: newId(), text: '' }])}>
                + Ajouter un sous-objectif
              </button>
            </div>
          ))}
          <button type="button" className="btn btn-secondary btn-block" onClick={() => setGoals((all) => [...all, { id: newId(), domain: dom.id, text: '' }])}>
            + Ajouter un objectif
          </button>
        </>
      ),
    }
  }

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
    ...DOMAINS.map(domainStep),
  ]
  return <Wizard id="attentes" steps={steps} onFinish={() => ed.setDone(true)} />
}
