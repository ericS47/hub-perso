import Chips from '../../../ui/Chips'
import Scale from '../../../ui/Scale'
import BodyMap from '../BodyMap'
import { SubBlock, TextField, YesNo } from '../fields'
import { useSectionEditor } from '../store'
import type { PainZone, ZoneId } from '../types'
import { ZONE_LABEL, ZONES } from '../utils'
import Wizard, { type Step } from '../Wizard'

export default function Douleurs() {
  const ed = useSectionEditor('douleurs')
  if (!ed) return null
  const { data: d, update } = ed
  const zones = d.zones ?? []
  const selected = zones.map((z) => z.zone)

  // Les zones gardent l'ordre du corps (de la tête aux pieds).
  const toggle = (zone: ZoneId) =>
    update((p) => {
      const cur = p.zones ?? []
      const next = cur.some((z) => z.zone === zone) ? cur.filter((z) => z.zone !== zone) : [...cur, { zone }]
      const order = ZONES.map((z) => z.id)
      return { ...p, zones: next.sort((a, b) => order.indexOf(a.zone) - order.indexOf(b.zone)) }
    })
  const setZone = (zone: ZoneId, patch: Partial<PainZone>) =>
    update((p) => ({ ...p, zones: (p.zones ?? []).map((z) => (z.zone === zone ? { ...z, ...patch } : z)) }))
  const zoneName = (z: ZoneId) => (z === 'autre' && d.otherZone ? d.otherZone : ZONE_LABEL[z])

  const steps: Step[] = [
    {
      key: 'douleurs',
      title: 'Ai-je des douleurs ?',
      content: (
        <>
          <YesNo label="As-tu des douleurs en ce moment, ou qui reviennent souvent ?" value={d.hasPain} onChange={(hasPain) => update({ hasPain })} />
          {d.hasPain === false && <p className="profil-answer">Tant mieux. Tu pourras toujours revenir ici si ça change.</p>}
        </>
      ),
    },
    ...(d.hasPain
      ? [
          {
            key: 'zones',
            title: 'Où as-tu mal ?',
            intro: 'Touche les zones concernées, dans la liste ou sur la silhouette.',
            content: (
              <>
                <BodyMap selected={selected} onToggle={toggle} />
                <Chips label="Zones" options={ZONES.map((z) => ({ value: z.id, label: z.label }))} value={selected} onChange={toggle} />
                {selected.includes('autre') && (
                  <SubBlock>
                    <TextField label="Où, précisément ?" value={d.otherZone} onChange={(otherZone) => update({ otherZone })} />
                  </SubBlock>
                )}
              </>
            ),
          },
          ...zones.map((z) => ({
            key: `zone-${z.zone}`,
            title: `Douleur : ${zoneName(z.zone).toLowerCase()}`,
            intro: 'De 0 (aucune douleur) à 10 (douleur maximale imaginable).',
            content: (
              <>
                <Scale label="Au repos" value={z.repos} onChange={(repos) => setZone(z.zone, { repos })} minLabel="Aucune" maxLabel="Maximale" />
                <Scale label="À l’effort" value={z.effort} onChange={(effort) => setZone(z.zone, { effort })} minLabel="Aucune" maxLabel="Maximale" />
                <Scale label="La nuit" value={z.nuit} onChange={(nuit) => setZone(z.zone, { nuit })} minLabel="Aucune" maxLabel="Maximale" />
                <TextField label="Un mot sur cette douleur ? (facultatif)" multiline value={z.note} onChange={(note) => setZone(z.zone, { note })} placeholder="Depuis quand, ce qui la soulage…" />
              </>
            ),
          })),
        ]
      : []),
  ]
  return <Wizard id="douleurs" steps={steps} onFinish={() => ed.setDone(true)} />
}
