import { Choice, Multi, NumberField, SubBlock, TextField, YesNo } from '../fields'
import { newId, useSectionEditor } from '../store'
import type { AlcoholFreq, DrinkFreq, DrinkItem, HydratationData, Sugar, WaterAmount, WaterWay } from '../types'
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

const SUGAR: { value: Sugar; label: string }[] = [
  { value: 'non', label: 'Sans sucre' },
  { value: 'peu', label: '1 sucre (ou 1 cuillère)' },
  { value: 'beaucoup', label: '2 sucres ou plus' },
  { value: 'edulcorant', label: 'Édulcorant' },
]

const FREQ: { value: DrinkFreq; label: string }[] = [
  { value: 'rarement', label: 'De temps en temps' },
  { value: 'semaine', label: 'Plusieurs fois par semaine' },
  { value: 'quotidien', label: 'Tous les jours' },
]

const WATER_WAYS: { value: WaterWay; label: string }[] = [
  { value: 'nature', label: 'Nature' },
  { value: 'gazeuse', label: 'Gazeuse' },
  { value: 'sirop', label: 'Avec du sirop' },
  { value: 'aromatisee', label: 'Aromatisée (citron, menthe…)' },
  { value: 'autre', label: 'Autre' },
]

const opts = (l: string[]) => l.map((v) => ({ value: v, label: v }))

type ListKey = 'otherHot' | 'otherCold'

export default function Hydratation() {
  const ed = useSectionEditor('hydratation')
  if (!ed) return null
  const { data: d, update } = ed
  const drinks = d.alcohol !== undefined && d.alcohol !== 'jamais'

  const setItem = (key: ListKey, id: string, patch: Partial<DrinkItem>) =>
    update((p) => ({ ...p, [key]: (p[key] ?? []).map((x) => (x.id === id ? { ...x, ...patch } : x)) }))
  const addItem = (key: ListKey) => update((p) => ({ ...p, [key]: [...(p[key] ?? []), { id: newId(), name: '' }] }))
  const removeItem = (key: ListKey, id: string) => update((p) => ({ ...p, [key]: (p[key] ?? []).filter((x) => x.id !== id) }))

  // Café, thé, chocolat : même trio de questions (oui/non, tasses, sucre).
  const hot = (label: string, has: 'coffee' | 'tea' | 'chocolate') => {
    const cups = `${has}Cups` as const
    const sugar = `${has}Sugar` as const
    return (
      <>
        <YesNo label={label} value={d[has]} onChange={(v) => update({ [has]: v } as Partial<HydratationData>)} />
        {d[has] && (
          <SubBlock>
            <NumberField label="Combien de tasses par jour ?" unit="tasses" max={30} value={d[cups]} onChange={(v) => update({ [cups]: v } as Partial<HydratationData>)} />
            <Choice label="Tu y ajoutes du sucre ?" options={SUGAR} value={d[sugar]} onChange={(v) => update({ [sugar]: v } as Partial<HydratationData>)} />
          </SubBlock>
        )}
      </>
    )
  }

  const itemHead = (key: ListKey, x: DrinkItem, n: number, what: string) => (
    <div className="row-between">
      <strong>
        {what} n° {n + 1}
      </strong>
      <button type="button" className="icon-btn" aria-label={`Retirer ${x.name || `${what.toLowerCase()} n° ${n + 1}`}`} onClick={() => removeItem(key, x.id)}>
        ✕
      </button>
    </div>
  )

  const steps: Step[] = [
    {
      key: 'chaudes',
      title: 'Les boissons chaudes',
      content: (
        <>
          {hot('Bois-tu du café ?', 'coffee')}
          {hot('Du thé ou des infusions ?', 'tea')}
          {hot('Du chocolat chaud ?', 'chocolate')}
          <p className="profil-hint">D’autres boissons chaudes ? (chicorée, lait chaud, café au lait…)</p>
          {(d.otherHot ?? []).map((x, n) => (
            <div key={x.id} className="profil-item">
              {itemHead('otherHot', x, n, 'Boisson')}
              <TextField label="Laquelle ?" value={x.name} onChange={(name) => setItem('otherHot', x.id, { name })} placeholder="Chicorée, lait chaud…" />
              <NumberField label="Combien de tasses par jour ?" unit="tasses" max={30} value={x.cups} onChange={(cups) => setItem('otherHot', x.id, { cups })} />
              <Choice label="Tu y ajoutes du sucre ?" options={SUGAR} value={x.sugar} onChange={(sugar) => setItem('otherHot', x.id, { sugar })} />
            </div>
          ))}
          <button type="button" className="btn btn-secondary btn-block" onClick={() => addItem('otherHot')}>
            + Ajouter une boisson chaude
          </button>
        </>
      ),
    },
    {
      key: 'eau',
      title: 'L’eau',
      content: (
        <>
          <Choice label="Environ combien d’eau bois-tu par jour ?" options={WATER} value={d.water} onChange={(water) => update({ water })} />
          <Multi label="Tu la bois plutôt…" options={WATER_WAYS} value={d.waterWays} onChange={(waterWays) => update({ waterWays })} />
          {(d.waterWays?.includes('sirop') || d.waterWays?.includes('autre')) && (
            <SubBlock>
              <TextField
                label="Avec quoi ? (facultatif)"
                value={d.waterNote}
                onChange={(waterNote) => update({ waterNote })}
                placeholder="Sirop de grenadine, sirop sans sucre, pastille…"
              />
            </SubBlock>
          )}
        </>
      ),
    },
    {
      key: 'froides',
      title: 'Les boissons froides',
      content: (
        <>
          <h3>Les sodas</h3>
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
              <Choice label="À quelle fréquence ?" options={FREQ} value={d.sodaFreq} onChange={(sodaFreq) => update({ sodaFreq })} />
              <TextField label="Quelle quantité, à peu près ? (facultatif)" value={d.sodaAmount} onChange={(sodaAmount) => update({ sodaAmount })} placeholder="Une canette, un verre…" />
            </SubBlock>
          )}
          <h3>Autres boissons froides</h3>
          <p className="profil-hint">Lait, jus de fruits, thé glacé, boissons énergisantes…</p>
          {(d.otherCold ?? []).map((x, n) => (
            <div key={x.id} className="profil-item">
              {itemHead('otherCold', x, n, 'Boisson')}
              <TextField label="Laquelle ?" value={x.name} onChange={(name) => setItem('otherCold', x.id, { name })} placeholder="Lait, jus d’orange…" />
              <Choice label="À quelle fréquence ?" options={FREQ} value={x.freq} onChange={(freq) => setItem('otherCold', x.id, { freq })} />
              <TextField label="Quelle quantité, à peu près ? (facultatif)" value={x.amount} onChange={(amount) => setItem('otherCold', x.id, { amount })} placeholder="Un verre, une brique…" />
            </div>
          ))}
          <button type="button" className="btn btn-secondary btn-block" onClick={() => addItem('otherCold')}>
            + Ajouter une boisson froide
          </button>
          {d.otherDrinks && (
            <TextField label="Tes précisions" value={d.otherDrinks} onChange={(otherDrinks) => update({ otherDrinks })} />
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
