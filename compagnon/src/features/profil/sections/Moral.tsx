import Scale from '../../../ui/Scale'
import { TextField } from '../fields'
import { useSectionEditor } from '../store'
import SupportBox from '../SupportBox'
import Wizard, { type Step } from '../Wizard'

// Seuil d'affichage de l'encart de soutien (moral ≤ 2 sur 10).
const LOW = 2

export default function Moral() {
  const ed = useSectionEditor('moral')
  if (!ed) return null
  const { data: d, update } = ed
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
