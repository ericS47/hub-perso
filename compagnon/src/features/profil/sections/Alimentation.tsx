import { Choice, Multi, NumberField, SubBlock, TextField, YesNo } from '../fields'
import { OFTEN_OPTIONS } from '../utils'
import Plateau from '../Plateau'
import { useSectionEditor } from '../store'
import Wizard, { type Step } from '../Wizard'

const EMOTIONS = ['Stress', 'Ennui', 'Tristesse', 'Colère', 'Fatigue', 'Solitude', 'Anxiété', 'Joie / fête', 'Frustration']
const CONTEXTS = ['Seul·e à la maison', 'En rentrant du travail', 'Le soir / la nuit', 'Devant un écran', 'Après une dispute', 'En voyant de la nourriture', 'Entre amis', 'Au travail']

export default function Alimentation() {
  const ed = useSectionEditor('alimentation')
  if (!ed) return null
  const { data: d, update } = ed
  const opts = (l: string[]) => l.map((v) => ({ value: v, label: v }))

  const steps: Step[] = [
    {
      key: 'restaurant',
      title: 'Au restaurant',
      content: (
        <>
          <Choice
            label="Manges-tu souvent au restaurant (cantine, snack, livraison compris) ?"
            options={[
              { value: 'jamais', label: 'Presque jamais' },
              { value: 'parfois', label: 'Parfois' },
              { value: 'souvent', label: 'Souvent' },
            ]}
            value={d.restaurant}
            onChange={(restaurant) => update({ restaurant })}
          />
          {d.restaurant && d.restaurant !== 'jamais' && (
            <SubBlock>
              <NumberField label="Combien de fois par semaine, environ ?" unit="fois / semaine" max={21} value={d.restaurantPerWeek} onChange={(restaurantPerWeek) => update({ restaurantPerWeek })} />
              <Multi
                label="Plutôt pour…"
                options={[
                  { value: 'plaisir', label: 'Le plaisir' },
                  { value: 'travail', label: 'Le travail' },
                ]}
                value={d.restaurantWhy}
                onChange={(restaurantWhy) => update({ restaurantWhy })}
              />
            </SubBlock>
          )}
        </>
      ),
    },
    {
      key: 'allergies',
      title: 'Allergies et aversions',
      content: (
        <>
          <YesNo label="As-tu des allergies ou intolérances alimentaires ?" value={d.allergies} onChange={(allergies) => update({ allergies })} />
          {d.allergies && (
            <SubBlock>
              <TextField label="Lesquelles ?" value={d.allergiesDetail} onChange={(allergiesDetail) => update({ allergiesDetail })} placeholder="Arachide, lactose…" />
            </SubBlock>
          )}
          <TextField
            label="Y a-t-il des aliments que tu n’aimes vraiment pas ?"
            multiline
            value={d.aversions}
            onChange={(aversions) => update({ aversions })}
            placeholder="Les endives, le poisson…"
          />
        </>
      ),
    },
    {
      key: 'plateau',
      title: 'Comment je construis mon repas',
      intro: 'Compose ton plateau habituel pour chaque repas. Il n’y a pas de bonne ou de mauvaise réponse : c’est juste une photo de tes habitudes.',
      content: <Plateau meals={d.meals} onChange={(fn) => update((p) => ({ ...p, meals: fn(p.meals ?? []) }))} />,
    },
    {
      key: 'compulsions',
      title: 'Les envies irrésistibles',
      intro: 'Il arrive à beaucoup de monde de manger sans faim, sous le coup d’une émotion. En parler aide à mieux comprendre.',
      content: (
        <>
          <YesNo label="T’arrive-t-il d’avoir des compulsions alimentaires ?" value={d.compulsions} onChange={(compulsions) => update({ compulsions })} />
          {d.compulsions && (
            <SubBlock>
              <Multi label="Plutôt avec quelle émotion ?" options={opts(EMOTIONS)} value={d.compulsionEmotions} onChange={(compulsionEmotions) => update({ compulsionEmotions })} />
              <Multi label="Dans quelle situation ?" options={opts(CONTEXTS)} value={d.compulsionContexts} onChange={(compulsionContexts) => update({ compulsionContexts })} />
              <TextField label="Tu veux en dire plus ? (facultatif)" multiline value={d.compulsionNote} onChange={(compulsionNote) => update({ compulsionNote })} />
            </SubBlock>
          )}
        </>
      ),
    },
    {
      key: 'moment',
      title: 'Le moment du repas',
      content: (
        <>
          <Choice label="Manges-tu en pleine conscience (en prenant le temps de goûter) ?" options={OFTEN_OPTIONS} value={d.mindful} onChange={(mindful) => update({ mindful })} />
          <Choice label="Manges-tu assis·e, à table ?" options={OFTEN_OPTIONS} value={d.seated} onChange={(seated) => update({ seated })} />
          <Multi
            label="Pendant le repas, il y a…"
            options={[
              { value: 'telephone', label: '📱 Le téléphone' },
              { value: 'tv', label: '📺 La télé' },
              { value: 'aucun', label: 'Aucun écran' },
            ]}
            value={d.screens}
            onChange={(screens) => {
              // « Aucun écran » exclut les autres choix, et inversement.
              const pickedNone = screens.includes('aucun') && !d.screens?.includes('aucun')
              update({ screens: pickedNone ? ['aucun'] : screens.length > 1 ? screens.filter((s) => s !== 'aucun') : screens })
            }}
          />
          <Choice label="Est-ce un moment agréable ?" options={OFTEN_OPTIONS} value={d.pleasant} onChange={(pleasant) => update({ pleasant })} />
          <Choice label="Est-ce qu’il te tarde de passer à table ?" options={OFTEN_OPTIONS} value={d.lookForward} onChange={(lookForward) => update({ lookForward })} />
        </>
      ),
    },
  ]
  return <Wizard id="alimentation" steps={steps} onFinish={() => ed.setDone(true)} />
}
