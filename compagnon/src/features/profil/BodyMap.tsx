import type { ZoneId } from './types'
import { ZONE_LABEL } from './utils'

type View = 'face' | 'dos'
// Position des zones par rapport à l'axe du corps ; sym = présent des deux côtés.
const SPOTS: { zone: ZoneId; x: number; y: number; sym?: boolean; views: View[] }[] = [
  { zone: 'tete', x: 0, y: 22, views: ['face', 'dos'] },
  { zone: 'nuque', x: 0, y: 41, views: ['dos'] },
  { zone: 'epaules', x: 21, y: 52, sym: true, views: ['face', 'dos'] },
  { zone: 'poitrine', x: 0, y: 68, views: ['face'] },
  { zone: 'ventre', x: 0, y: 100, views: ['face'] },
  { zone: 'haut-dos', x: 0, y: 72, views: ['dos'] },
  { zone: 'bas-dos', x: 0, y: 106, views: ['dos'] },
  { zone: 'coudes', x: 34, y: 94, sym: true, views: ['face', 'dos'] },
  { zone: 'mains', x: 43, y: 134, sym: true, views: ['face', 'dos'] },
  { zone: 'hanches', x: 17, y: 124, sym: true, views: ['face', 'dos'] },
  { zone: 'genoux', x: 14, y: 176, sym: true, views: ['face', 'dos'] },
  { zone: 'pieds', x: 15, y: 226, sym: true, views: ['face', 'dos'] },
]

function Figure({ cx, view, selected, onToggle }: { cx: number; view: View; selected: ZoneId[]; onToggle: (z: ZoneId) => void }) {
  const limb = (pts: [number, number][], w: number) => (
    <polyline points={pts.map(([x, y]) => `${cx + x},${y}`).join(' ')} fill="none" stroke="var(--profil-body)" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
  )
  return (
    <g>
      {limb([[-23, 52], [-35, 94], [-43, 132]], 11)}
      {limb([[23, 52], [35, 94], [43, 132]], 11)}
      {limb([[-12, 118], [-14, 176], [-15, 226]], 15)}
      {limb([[12, 118], [14, 176], [15, 226]], 15)}
      <rect x={cx - 25} y={44} width={50} height={84} rx={14} fill="var(--profil-body)" />
      <rect x={cx - 6} y={32} width={12} height={14} fill="var(--profil-body)" />
      <circle cx={cx} cy={22} r={14} fill="var(--profil-body)" />
      {view === 'dos' && <line x1={cx} y1={50} x2={cx} y2={118} stroke="var(--border)" strokeWidth={1.5} />}
      {SPOTS.filter((s) => s.views.includes(view)).flatMap((s) =>
        (s.sym ? [-s.x, s.x] : [s.x]).map((dx) => {
          const on = selected.includes(s.zone)
          return (
            <circle
              key={`${s.zone}${dx}`}
              cx={cx + dx}
              cy={s.y}
              r={on ? 9 : 7}
              className={on ? 'profil-spot on' : 'profil-spot'}
              onClick={() => onToggle(s.zone)}
            />
          )
        }),
      )}
      <text x={cx} y={254} textAnchor="middle" className="profil-svg-label">
        {view === 'face' ? 'De face' : 'De dos'}
      </text>
    </g>
  )
}

// Silhouette simple (face / dos) : affiche les zones choisies ; on peut aussi toucher un point.
// Les pastilles sous la silhouette restent le moyen principal (accessible) de choisir.
export default function BodyMap({ selected, onToggle }: { selected: ZoneId[]; onToggle: (z: ZoneId) => void }) {
  const names = selected.map((z) => ZONE_LABEL[z]).join(', ')
  return (
    <svg viewBox="0 0 240 262" className="profil-body" role="img" aria-label={names ? `Zones douloureuses : ${names}` : 'Silhouette : aucune zone choisie'}>
      <Figure cx={62} view="face" selected={selected} onToggle={onToggle} />
      <Figure cx={178} view="dos" selected={selected} onToggle={onToggle} />
    </svg>
  )
}
