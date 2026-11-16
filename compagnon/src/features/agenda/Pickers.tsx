import { useId, useState } from 'react'
import { ACTIVITIES, DURATIONS, formatDuration } from './lib'
import { DAY_SHORT, parseIso } from '../../lib/dates'

// Activité : pastilles de suggestions + « Autre » avec saisie libre.
export function ActivityPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const known = ACTIVITIES.some((a) => a.label === value)
  const [otherOpen, setOtherOpen] = useState(!known && value !== '')
  const id = useId()
  return (
    <fieldset className="chips">
      <legend>Quelle activité ?</legend>
      <div className="chips-row">
        {ACTIVITIES.map((a) => {
          const on = !otherOpen && value === a.label
          return (
            <button
              key={a.label}
              type="button"
              aria-pressed={on}
              className={on ? 'chip on' : 'chip'}
              onClick={() => {
                setOtherOpen(false)
                onChange(a.label)
              }}
            >
              <span aria-hidden="true">{a.emoji} </span>
              {a.label}
            </button>
          )
        })}
        <button
          type="button"
          aria-pressed={otherOpen}
          className={otherOpen ? 'chip on' : 'chip'}
          onClick={() => {
            setOtherOpen(true)
            if (known) onChange('')
          }}
        >
          <span aria-hidden="true">✨ </span>Autre…
        </button>
      </div>
      {otherOpen && (
        <label className="field agenda-other" htmlFor={id}>
          <span>Mon activité</span>
          <input
            id={id}
            type="text"
            value={value}
            maxLength={40}
            placeholder="ex. tennis de table, randonnée…"
            autoFocus
            onChange={(e) => onChange(e.target.value)}
          />
        </label>
      )}
    </fieldset>
  )
}

// Durée : pastilles courantes + durée libre en minutes.
export function DurationPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const id = useId()
  const custom = !DURATIONS.includes(value)
  const [otherOpen, setOtherOpen] = useState(custom)
  return (
    <fieldset className="chips">
      <legend>Combien de temps ?</legend>
      <div className="chips-row">
        {DURATIONS.map((d) => {
          const on = !otherOpen && value === d
          return (
            <button
              key={d}
              type="button"
              aria-pressed={on}
              className={on ? 'chip on' : 'chip'}
              onClick={() => {
                setOtherOpen(false)
                onChange(d)
              }}
            >
              {formatDuration(d)}
            </button>
          )
        })}
        <button type="button" aria-pressed={otherOpen} className={otherOpen ? 'chip on' : 'chip'} onClick={() => setOtherOpen(true)}>
          Autre
        </button>
      </div>
      {otherOpen && (
        <label className="field agenda-other" htmlFor={id}>
          <span>Durée en minutes</span>
          <input
            id={id}
            type="number"
            inputMode="numeric"
            min={5}
            max={300}
            step={5}
            value={value}
            onChange={(e) => {
              const n = Math.round(Number(e.target.value))
              if (n > 0) onChange(Math.min(n, 300))
            }}
          />
        </label>
      )}
    </fieldset>
  )
}

// Jour de la semaine : 7 pastilles (lun 16, mar 17…), jours passés désactivés.
export function DayPicker({
  dates,
  value,
  onChange,
  disabledBefore,
  marks,
}: {
  dates: string[]
  value: string
  onChange: (v: string) => void
  disabledBefore?: string
  // Nombre de séances déjà prévues par date (petit point).
  marks?: Record<string, number>
}) {
  return (
    <fieldset className="chips">
      <legend>Quel jour ?</legend>
      <div className="agenda-days">
        {dates.map((d, i) => {
          const disabled = disabledBefore !== undefined && d < disabledBefore
          const on = value === d
          const n = marks?.[d] ?? 0
          return (
            <button
              key={d}
              type="button"
              disabled={disabled}
              aria-pressed={on}
              aria-label={`${parseIso(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}${n ? `, ${n} séance${n > 1 ? 's' : ''} déjà prévue${n > 1 ? 's' : ''}` : ''}${disabled ? ', déjà passé' : ''}`}
              className={on ? 'agenda-day-chip on' : 'agenda-day-chip'}
              onClick={() => onChange(d)}
            >
              <span>{DAY_SHORT[i]}</span>
              <strong>{parseIso(d).getDate()}</strong>
              <span className="agenda-day-dots" aria-hidden="true">{n ? '•'.repeat(Math.min(n, 3)) : ' '}</span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
