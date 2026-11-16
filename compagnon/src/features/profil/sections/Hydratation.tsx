import { Choice, Multi, NumberField, SubBlock, TextField, YesNo } from '../fields'
import { useSectionEditor } from '../store'
import type { AlcoholFreq, WaterAmount } from '../types'
import Wizard, { type Step } from '../Wizard'

const WATER: { value: WaterAmount; label: string }[] = [
  { value: 'moins05', label: 'Moins d’½ litre' },
  { value: '05a1', label: '½ à 1 litre' },
  { value: '1a15', label: '1 à 1,5 litre' },
  { value: '15a2', label: '1,5 à 2 litres' },
  { value: 'plus2', label: 'Plus de 2 litres' },
]

const ALCOHOL: { value: AlcoholFreq; label: string }[] = [
  { value: 'jamais', label: 'Jamais' },
  { value: 'occasion', label: 'Occasionnellement' },
  { value: 'semaine1-2', label: '1 à 2 fois par semaine' },
  { value: 'semaine3-5', label: '3 à 5 fois par semaine' },
  { value: 'quotidien', label: 'Presque tous les jours' },
]

const opts = (l: string[]) => l.map((v) => ({ value: v, label: v }))

export default function Hydratation() {
  const ed = useSectionEditor('hydratation')
  if (!ed) return null
  const { data: d, update } = ed
  const drinks = d.alcohol !== undefined && d.alcohol !== 'jamais'

  const steps: Step[] = [
    {
      key: 'chaudes',
      title: 'Café, thé et autres',
      content: (
        <>
          <YesNo label="Bois-tu du café ?" value={d.coffee} onChange={(coffee) => update({ coffee })} />
          {d.coffee && (
            <SubBlock>
              <NumberField label="Combien de tasses par jour ?" unit="tasses" max={30} value={d.coffeeCups} onChange={(coffeeCups) => update({ coffeeCups })} />
            </SubBlock>
          )}
          <YesNo label="Du thé ou des infusions ?" value={d.tea} onChange={(tea) => update({ tea })} />
          {d.tea && (
            <SubBlock>
              <NumberField label="Combien de tasses par jour ?" unit="tasses" max={30} value={d.teaCups} onChange={(teaCups) => update({ teaCups })} />
            </SubBlock>
          )}
          <TextField label="D’autres boissons ? (facultatif)" value={d.otherDrinks} onChange={(otherDrinks) => update({ otherDrinks })} placeholder="Jus de fruits, sirop, lait…" />
        </>
      ),
    },
    {
      key: 'eau',
      title: 'L’eau',
      content: <Choice label="Environ combien d’eau bois-tu par jour ?" options={WATER} value={d.water} onChange={(water) => update({ water })} />,
    },
    {
      key: 'sodas',
      title: 'Les sodas',
      content: (
        <>
          <YesNo label="Bois-tu des sodas ?" value={d.sodas} onChange={(sodas) => update({ sodas })} />
          {d.sodas && (
            <SubBlock>
              <Multi
                label="Plutôt…"
                options={[
                  { value: 'normal', label: 'Classiques' },
                  { value: 'zero', label: 'Zéro / light' },
                ]}
                value={d.sodaTypes}
                onChange={(sodaTypes) => update({ sodaTypes })}
              />
              <Choice
                label="À quelle fréquence ?"
                options={[
                  { value: 'rarement', label: 'De temps en temps' },
                  { value: 'semaine', label: 'Plusieurs fois par semaine' },
                  { value: 'quotidien', label: 'Tous les jours' },
                ]}
                value={d.sodaFreq}
                onChange={(sodaFreq) => update({ sodaFreq })}
              />
              <TextField label="Quelle quantité, à peu près ? (facultatif)" value={d.sodaAmount} onChange={(sodaAmount) => update({ sodaAmount })} placeholder="Une canette, un verre…" />
            </SubBlock>
          )}
        </>
      ),
    },
    {
      key: 'alcool',
      title: 'L’alcool',
      intro: 'Ces questions servent seulement à mieux te connaître, sans aucun jugement.',
      content: (
        <>
          <Choice label="T’arrive-t-il de boire de l’alcool ?" options={ALCOHOL} value={d.alcohol} onChange={(alcohol) => update({ alcohol })} />
          {drinks && (
            <SubBlock>
              <Multi
                label="Dans quel contexte ?"
                options={opts(['Au repas', 'Entre amis', 'En famille', 'En soirée, fête', 'Seul·e', 'Après le travail'])}
                value={d.alcoholContexts}
                onChange={(alcoholContexts) => update({ alcoholContexts })}
              />
              <NumberField label="Combien de verres, en général, à chaque fois ?" unit="verres" max={50} value={d.alcoholQty} onChange={(alcoholQty) => update({ alcoholQty })} />
              <Multi
                label="Qu’est-ce que ça t’apporte ?"
                options={opts(['Le goût, le plaisir', 'La convivialité', 'Me détendre', 'Décompresser après une journée', 'Une habitude'])}
                value={d.alcoholWhy}
                onChange={(alcoholWhy) => update({ alcoholWhy })}
              />
              <TextField label="Autre chose ? (facultatif)" multiline value={d.alcoholNote} onChange={(alcoholNote) => update({ alcoholNote })} />
            </SubBlock>
          )}
        </>
      ),
    },
  ]
  return <Wizard id="hydratation" steps={steps} onFinish={() => ed.setDone(true)} />
}
