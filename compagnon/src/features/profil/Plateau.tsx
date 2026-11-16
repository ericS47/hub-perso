import { useState } from 'react'
import Chips from '../../ui/Chips'
import { TextField } from './fields'
import { newId } from './store'
import type { Meal, MealExtra, MealKind, PlateShares } from './types'
import { toggleIn } from './utils'

// Plateau repas : représentation visuelle d'un repas type, sans aucun jugement ni calcul.

const MAIN: { kind: Exclude<MealKind, 'collation'>; label: string; icon: string }[] = [
  { kind: 'petit-dejeuner', label: 'Petit-déj', icon: '☀️' },
  { kind: 'dejeuner', label: 'Déjeuner', icon: '🍽️' },
  { kind: 'diner', label: 'Dîner', icon: '🌙' },
]

type PartKey = keyof PlateShares
const PARTS: { key: PartKey; label: string; icon: string; color: string; examples: string }[] = [
  { key: 'feculents', label: 'Féculents', icon: '🍞', color: '#f2c46b', examples: 'pain, pâtes, riz, pommes de terre, légumes secs' },
  { key: 'legumes', label: 'Légumes', icon: '🥦', color: '#7bb86b', examples: 'crus ou cuits, en soupe, en salade' },
  { key: 'proteines', label: 'Protéines', icon: '🍗', color: '#de8a68', examples: 'viande, poisson, œufs, tofu' },
]

const SNACK_ITEMS = [
  { value: 'fruit', label: '🍎 Fruit' },
  { value: 'laitage', label: '🥛 Laitage' },
  { value: 'pain', label: '🥖 Pain / tartine' },
  { value: 'biscuit', label: '🍪 Biscuits' },
  { value: 'viennoiserie', label: '🥐 Viennoiserie' },
  { value: 'oleagineux', label: '🥜 Fruits secs, noix' },
  { value: 'chocolat', label: '🍫 Chocolat' },
  { value: 'boisson', label: '☕ Boisson' },
  { value: 'autre', label: '✳️ Autre' },
]
const SNACK_ICON: Record<string, string> = Object.fromEntries(SNACK_ITEMS.map((i) => [i.value, i.label.split(' ')[0]]))

const SNACK_TIMES = [
  { value: 'matin', label: 'Le matin' },
  { value: 'apres-midi', label: 'L’après-midi' },
  { value: 'soir', label: 'Le soir' },
  { value: 'nuit', label: 'La nuit' },
]

const DEFAULT_SHARES: PlateShares = { feculents: 35, legumes: 35, proteines: 30 }

// Règle une part et répartit le reste entre les deux autres, proportionnellement (total 100).
function setShare(cur: PlateShares, key: PartKey, value: number): PlateShares {
  const v = Math.max(0, Math.min(100, Math.round(value / 5) * 5))
  const [a, b] = PARTS.map((p) => p.key).filter((k) => k !== key)
  const rest = 100 - v
  const sum = cur[a] + cur[b]
  const na = sum === 0 ? Math.round(rest / 2 / 5) * 5 : Math.round((rest * cur[a]) / sum / 5) * 5
  return { ...cur, [key]: v, [a]: na, [b]: rest - na } as PlateShares
}

function arc(cx: number, cy: number, r: number, from: number, to: number): string {
  const p = (t: number) => {
    const ang = (t / 100) * 2 * Math.PI - Math.PI / 2
    return `${(cx + r * Math.cos(ang)).toFixed(2)} ${(cy + r * Math.sin(ang)).toFixed(2)}`
  }
  const large = to - from > 50 ? 1 : 0
  return `M ${cx} ${cy} L ${p(from)} A ${r} ${r} 0 ${large} 1 ${p(to)} Z`
}

function mealTitle(m: Meal, snackIndex: number): string {
  if (m.kind === 'collation') return `Collation ${snackIndex + 1}`
  return MAIN.find((x) => x.kind === m.kind)?.label ?? ''
}

// ───── Dessins ─────
function SideDish({ x, y, r, label, icon, on }: { x: number; y: number; r: number; label: string; icon: string; on?: boolean }) {
  return (
    <g className={on ? 'profil-dish on' : 'profil-dish'}>
      <circle cx={x} cy={y} r={r} className="profil-dish-plate" />
      {on ? (
        <text x={x} y={y + 8} textAnchor="middle" fontSize={24}>
          {icon}
        </text>
      ) : (
        <text x={x} y={y + 6} textAnchor="middle" fontSize={18} className="profil-dish-plus">
          +
        </text>
      )}
      <text x={x} y={y + r + 13} textAnchor="middle" className="profil-svg-label">
        {label}
      </text>
    </g>
  )
}

function TrayDrawing({ meal }: { meal: Meal }) {
  const shares = meal.plate
  const cx = 160
  const cy = 112
  let acc = 0
  const wedges = shares
    ? PARTS.map((p) => {
        const from = acc
        acc += shares[p.key]
        return { ...p, from, to: acc, value: shares[p.key] }
      }).filter((w) => w.value > 0)
    : []
  const desc = meal.skipped
    ? 'Repas non pris'
    : [
        meal.entree?.on ? 'entrée' : '',
        shares ? `assiette : ${PARTS.map((p) => `${p.label.toLowerCase()} ${shares[p.key]} %`).join(', ')}` : 'assiette à composer',
        meal.fromage?.on ? 'fromage' : '',
        meal.dessert?.on ? 'dessert' : '',
      ]
        .filter(Boolean)
        .join(' ; ')

  return (
    <svg viewBox="0 0 320 232" className="profil-tray" role="img" aria-label={`Plateau : ${desc}`}>
      <rect x={4} y={6} width={312} height={208} rx={24} className="profil-tray-wood" />
      <rect x={14} y={16} width={292} height={188} rx={18} className="profil-tray-inner" />
      <rect x={140} y={10} width={40} height={6} rx={3} className="profil-tray-handle" />
      <rect x={140} y={204} width={40} height={6} rx={3} className="profil-tray-handle" />
      {/* Couverts */}
      <g className="profil-cutlery">
        <rect x={76} y={86} width={4} height={60} rx={2} />
        <rect x={72} y={74} width={2} height={16} rx={1} />
        <rect x={76} y={74} width={2} height={16} rx={1} />
        <rect x={80} y={74} width={2} height={16} rx={1} />
        <path d="M240 74 q8 18 0 40 v32 h4 v-72 z" />
      </g>
      {/* Assiette principale */}
      <circle cx={cx} cy={cy} r={70} className="profil-plate-rim" />
      <circle cx={cx} cy={cy} r={58} className="profil-plate-in" />
      {wedges.map((w) =>
        w.value >= 100 ? (
          <circle key={w.key} cx={cx} cy={cy} r={56} fill={w.color} />
        ) : (
          <path key={w.key} d={arc(cx, cy, 56, w.from, w.to)} fill={w.color} stroke="#fff" strokeWidth={2} />
        ),
      )}
      {wedges
        .filter((w) => w.value >= 10)
        .map((w) => {
          const mid = ((w.from + w.to) / 2 / 100) * 2 * Math.PI - Math.PI / 2
          const r = w.value >= 100 ? 0 : 32
          const x = cx + r * Math.cos(mid)
          const y = cy + r * Math.sin(mid)
          return (
            <g key={`t-${w.key}`}>
              <text x={x} y={y - 2} textAnchor="middle" fontSize={16}>
                {w.icon}
              </text>
              <text x={x} y={y + 14} textAnchor="middle" className="profil-plate-pct">
                {w.value} %
              </text>
            </g>
          )
        })}
      {!shares && (
        <text x={cx} y={cy + 5} textAnchor="middle" className="profil-svg-label">
          Mon assiette
        </text>
      )}
      <SideDish x={44} y={52} r={26} label="Entrée" icon="🥗" on={meal.entree?.on} />
      <SideDish x={276} y={52} r={24} label="Fromage" icon="🧀" on={meal.fromage?.on} />
      <SideDish x={276} y={156} r={24} label="Dessert" icon="🍮" on={meal.dessert?.on} />
      {/* Verre d'eau, pour le décor */}
      <path d="M30 140 h28 l-4 40 h-20 z" className="profil-glass" />
      <path d="M33 156 h22 l-2.6 22 h-16.8 z" className="profil-water" />
      {meal.skipped && (
        <g>
          <rect x={4} y={6} width={312} height={208} rx={24} className="profil-tray-veil" />
          <text x={160} y={118} textAnchor="middle" className="profil-tray-skip">
            Je ne prends pas ce repas
          </text>
        </g>
      )}
    </svg>
  )
}

function SnackDrawing({ meal }: { meal: Meal }) {
  const items = meal.items ?? []
  const pos = (n: number) => {
    if (items.length === 1) return { x: 110, y: 82 }
    const ang = (n / items.length) * 2 * Math.PI - Math.PI / 2
    return { x: 110 + 32 * Math.cos(ang), y: 82 + 32 * Math.sin(ang) }
  }
  return (
    <svg viewBox="0 0 220 160" className="profil-snack" role="img" aria-label={`Collation : ${items.length ? items.map((i) => SNACK_ITEMS.find((s) => s.value === i)?.label.slice(3)).join(', ') : 'vide'}`}>
      <ellipse cx={110} cy={82} rx={92} ry={66} className="profil-tray-wood" />
      <circle cx={110} cy={78} r={58} className="profil-plate-rim" />
      <circle cx={110} cy={78} r={48} className="profil-plate-in" />
      {items.length === 0 && (
        <text x={110} y={84} textAnchor="middle" className="profil-svg-label">
          À composer
        </text>
      )}
      {items.map((it, n) => {
        const p = pos(n)
        return (
          <text key={it} x={p.x} y={p.y + 4} textAnchor="middle" fontSize={24}>
            {SNACK_ICON[it]}
          </text>
        )
      })}
    </svg>
  )
}

// ───── Réglages ─────
function ExtraField({ label, icon, value, onChange, placeholder }: { label: string; icon: string; value: MealExtra | undefined; onChange: (v: MealExtra) => void; placeholder: string }) {
  const v = value ?? {}
  return (
    <div className={v.on ? 'profil-extra on' : 'profil-extra'}>
      <label className="profil-check">
        <input type="checkbox" checked={!!v.on} onChange={(e) => onChange({ ...v, on: e.target.checked })} />
        <span>
          {icon} {label}
        </span>
      </label>
      {v.on && (
        <label className="field profil-extra-detail">
          <span className="profil-visually-hidden">Précision : {label.toLowerCase()}</span>
          <input type="text" value={v.detail ?? ''} placeholder={placeholder} onChange={(e) => onChange({ ...v, detail: e.target.value })} />
        </label>
      )}
    </div>
  )
}

function PlateSliders({ value, onChange }: { value: PlateShares | undefined; onChange: (v: PlateShares) => void }) {
  const cur = value ?? DEFAULT_SHARES
  return (
    <fieldset className="profil-sliders">
      <legend>🍽️ Mon assiette (plat principal)</legend>
      {!value && <p className="profil-hint">Règle les parts comme dans ton assiette habituelle : le total reste toujours à 100 %.</p>}
      {PARTS.map((p) => (
        <div key={p.key} className="profil-slider">
          <div className="row-between">
            <label htmlFor={`part-${p.key}`}>
              <span className="profil-swatch" style={{ background: p.color }} aria-hidden="true" /> {p.icon} {p.label}
            </label>
            <strong>{value ? `${cur[p.key]} %` : '—'}</strong>
          </div>
          <div className="profil-slider-row">
            <button type="button" className="profil-step-btn" aria-label={`Moins de ${p.label.toLowerCase()}`} onClick={() => onChange(setShare(cur, p.key, cur[p.key] - 5))}>
              −
            </button>
            <input
              id={`part-${p.key}`}
              type="range"
              min={0}
              max={100}
              step={5}
              value={cur[p.key]}
              style={{ accentColor: p.color }}
              aria-valuetext={`${cur[p.key]} %`}
              onChange={(e) => onChange(setShare(cur, p.key, Number(e.target.value)))}
            />
            <button type="button" className="profil-step-btn" aria-label={`Plus de ${p.label.toLowerCase()}`} onClick={() => onChange(setShare(cur, p.key, cur[p.key] + 5))}>
              +
            </button>
          </div>
          <small className="profil-hint">{p.examples}</small>
        </div>
      ))}
    </fieldset>
  )
}

interface Props {
  meals: Meal[] | undefined
  onChange: (update: (meals: Meal[]) => Meal[]) => void
}

export default function Plateau({ meals, onChange }: Props) {
  const list = meals ?? []
  const snacks = list.filter((m) => m.kind === 'collation')
  const [tab, setTab] = useState<string>('dejeuner')
  const tabs = [...MAIN.map((m) => ({ id: m.kind as string, label: `${m.icon} ${m.label}` })), ...snacks.map((s, n) => ({ id: s.id, label: `🍏 Collation ${n + 1}` }))]
  const activeId = tabs.some((t) => t.id === tab) ? tab : 'dejeuner'
  const isMain = MAIN.some((m) => m.kind === activeId)
  const meal: Meal = list.find((m) => m.id === activeId) ?? { id: activeId, kind: isMain ? (activeId as MealKind) : 'collation' }
  const snackIndex = snacks.findIndex((s) => s.id === meal.id)

  // Les trois repas principaux sont créés à la première modification.
  const patch = (p: Partial<Meal>) =>
    onChange((all) => (all.some((m) => m.id === meal.id) ? all.map((m) => (m.id === meal.id ? { ...m, ...p } : m)) : [...all, { ...meal, ...p }]))
  const addSnack = () => {
    const id = newId()
    onChange((all) => [...all, { id, kind: 'collation' }])
    setTab(id)
  }
  const removeSnack = () => {
    onChange((all) => all.filter((m) => m.id !== meal.id))
    setTab('dejeuner')
  }

  return (
    <div className="profil-plateau">
      <div className="profil-tabs profil-tabs-scroll" role="tablist" aria-label="Repas">
        {tabs.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={t.id === activeId} className={t.id === activeId ? 'profil-tab on' : 'profil-tab'} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
        <button type="button" className="profil-tab profil-tab-add" onClick={addSnack}>
          + Collation
        </button>
      </div>

      <div role="tabpanel" aria-label={mealTitle(meal, snackIndex)}>
        {meal.kind === 'collation' ? (
          <>
            <SnackDrawing meal={meal} />
            <Chips label="Quand ?" options={SNACK_TIMES} value={meal.time} onChange={(time) => patch({ time: time === meal.time ? undefined : time })} />
            <Chips label="Qu’est-ce que tu prends ?" options={SNACK_ITEMS} value={meal.items ?? []} onChange={(it) => patch({ items: toggleIn(meal.items, it) })} />
            <TextField label="Précision (facultatif)" value={meal.note} onChange={(note) => patch({ note })} placeholder="Une pomme et un yaourt…" />
            <button type="button" className="btn btn-ghost btn-block" onClick={removeSnack}>
              Retirer cette collation
            </button>
          </>
        ) : (
          <>
            <TrayDrawing meal={meal} />
            <label className="profil-check profil-skip">
              <input type="checkbox" checked={!!meal.skipped} onChange={(e) => patch({ skipped: e.target.checked })} />
              <span>Je ne prends pas ce repas, en général</span>
            </label>
            {!meal.skipped && (
              <>
                <ExtraField label="Entrée" icon="🥗" value={meal.entree} onChange={(entree) => patch({ entree })} placeholder="Crudités, soupe…" />
                <PlateSliders value={meal.plate} onChange={(plate) => patch({ plate })} />
                <TextField label="Dans mon assiette, il y a souvent… (facultatif)" value={meal.plateNote} onChange={(plateNote) => patch({ plateNote })} placeholder={meal.kind === 'petit-dejeuner' ? 'Tartines, œuf, fruit…' : 'Riz, poulet, haricots verts…'} />
                <ExtraField label="Fromage" icon="🧀" value={meal.fromage} onChange={(fromage) => patch({ fromage })} placeholder="Un morceau, un yaourt…" />
                <ExtraField label="Dessert" icon="🍮" value={meal.dessert} onChange={(dessert) => patch({ dessert })} placeholder="Fruit, compote, gâteau…" />
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
