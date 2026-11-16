import { useId, useState, type ReactNode } from 'react'
import Chips from '../../ui/Chips'
import { formatMinutes, toggleIn } from './utils'

// Petits champs réutilisés par toutes les rubriques. Toucher à nouveau une réponse la retire.

interface YesNoProps {
  label: string
  value: boolean | undefined
  onChange: (v: boolean | undefined) => void
  yes?: string
  no?: string
}

export function YesNo({ label, value, onChange, yes = 'Oui', no = 'Non' }: YesNoProps) {
  const current = value === true ? 'oui' : value === false ? 'non' : undefined
  return (
    <Chips
      label={label}
      options={[
        { value: 'oui', label: yes },
        { value: 'non', label: no },
      ]}
      value={current}
      onChange={(v) => {
        const b = v === 'oui'
        onChange(value === b ? undefined : b)
      }}
    />
  )
}

interface ChoiceProps<T extends string> {
  label: string
  options: { value: T; label: string }[]
  value: T | undefined
  onChange: (v: T | undefined) => void
}

// Choix unique qu'on peut désélectionner.
export function Choice<T extends string>({ label, options, value, onChange }: ChoiceProps<T>) {
  return <Chips label={label} options={options} value={value} onChange={(v) => onChange(v === value ? undefined : v)} />
}

interface MultiProps<T extends string> {
  label: string
  options: { value: T; label: string }[]
  value: T[] | undefined
  onChange: (v: T[]) => void
}

export function Multi<T extends string>({ label, options, value, onChange }: MultiProps<T>) {
  return <Chips label={label} options={options} value={value ?? []} onChange={(v) => onChange(toggleIn(value, v))} />
}

export const OFTEN_OPTIONS = [
  { value: 'oui' as const, label: 'Oui' },
  { value: 'parfois' as const, label: 'Parfois' },
  { value: 'non' as const, label: 'Non' },
]

interface TextProps {
  label: string
  value: string | undefined
  onChange: (v: string) => void
  placeholder?: string
  multiline?: boolean
  hint?: string
}

export function TextField({ label, value, onChange, placeholder, multiline, hint }: TextProps) {
  return (
    <label className="field">
      <span>{label}</span>
      {hint && <small className="profil-hint">{hint}</small>}
      {multiline ? (
        <textarea value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input type="text" value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  )
}

interface NumberProps {
  label: string
  value: number | undefined
  onChange: (v: number | undefined) => void
  unit?: string
  min?: number
  max?: number
  hint?: string
  decimals?: boolean
}

// Champ numérique tolérant à la saisie (virgule acceptée, valeur hors bornes ignorée).
export function NumberField({ label, value, onChange, unit, min = 0, max = 9999, hint, decimals }: NumberProps) {
  const [text, setText] = useState(value === undefined ? '' : String(value).replace('.', ','))
  const [seen, setSeen] = useState(value)
  // Valeur changée de l'extérieur (pastille rapide) : on resynchronise le texte.
  if (value !== seen) {
    setSeen(value)
    const parsed = Number(text.replace(',', '.'))
    if (value === undefined ? text !== '' : parsed !== value) setText(value === undefined ? '' : String(value).replace('.', ','))
  }
  const id = useId()
  return (
    <div className="field">
      <label htmlFor={id}>
        <span>{label}</span>
      </label>
      {hint && <small className="profil-hint">{hint}</small>}
      <div className="profil-number">
        <input
          id={id}
          className="input"
          type="text"
          inputMode={decimals ? 'decimal' : 'numeric'}
          value={text}
          onChange={(e) => {
            const t = e.target.value
            setText(t)
            const n = Number(t.replace(',', '.'))
            const next = t.trim() === '' || Number.isNaN(n) || n < min || n > max ? undefined : n
            setSeen(next)
            onChange(next)
          }}
        />
        {unit && <span className="profil-unit">{unit}</span>}
      </div>
    </div>
  )
}

interface DaysProps {
  label: string
  value: number | undefined
  onChange: (v: number | undefined) => void
}

export function DaysPerWeek({ label, value, onChange }: DaysProps) {
  const opts = Array.from({ length: 8 }, (_, n) => ({ value: String(n), label: String(n) }))
  return (
    <Choice
      label={label}
      options={opts}
      value={value === undefined ? undefined : String(value)}
      onChange={(v) => onChange(v === undefined ? undefined : Number(v))}
    />
  )
}

const DURATIONS = [10, 15, 20, 30, 45, 60, 90, 120, 180, 240]

interface DurationProps {
  label: string
  value: number | undefined
  onChange: (v: number | undefined) => void
}

// Durée en minutes : pastilles rapides + saisie libre.
export function DurationField({ label, value, onChange }: DurationProps) {
  return (
    <div>
      <Choice
        label={label}
        options={DURATIONS.map((d) => ({ value: String(d), label: formatMinutes(d) }))}
        value={value !== undefined && DURATIONS.includes(value) ? String(value) : undefined}
        onChange={(v) => onChange(v === undefined ? undefined : Number(v))}
      />
      <NumberField label="Ou en minutes" value={value} onChange={onChange} unit="min / jour" max={1440} />
    </div>
  )
}

export function SubBlock({ children }: { children: ReactNode }) {
  return <div className="profil-sub">{children}</div>
}
