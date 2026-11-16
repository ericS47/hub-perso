import { useState } from 'react'
import { DAY_NAMES, fromMinutes, isoDate, isoWeekNumber, toMinutes } from '../../lib/dates'
import { Choice, TextField } from './fields'
import type { Schedule, ScheduleFormat, TimeSlot } from './types'

interface WeekProps {
  label: string
  slots: TimeSlot[] | undefined
  onChange: (slots: TimeSlot[]) => void
  defaultSlot: { start: string; end: string }
}

// Petit éditeur de planning : pour chaque jour, des plages début – fin.
export function WeekEditor({ label, slots, onChange, defaultSlot }: WeekProps) {
  const list = slots ?? []
  const byDay = (d: number) => list.map((s, idx) => ({ s, idx })).filter((x) => x.s.day === d)
  const set = (idx: number, patch: Partial<TimeSlot>) => onChange(list.map((s, n) => (n === idx ? { ...s, ...patch } : s)))
  const remove = (idx: number) => onChange(list.filter((_, n) => n !== idx))
  const add = (day: number) => {
    const prev = byDay(day).at(-1)?.s
    const after = prev ? Math.min(toMinutes(prev.end) + 60, 23 * 60 + 59) : 0
    onChange([...list, prev ? { day, start: prev.end, end: fromMinutes(after) } : { day, ...defaultSlot }])
  }
  const monday = byDay(0).map((x) => x.s)
  const copyMonday = () => {
    const others = list.filter((s) => s.day === 0 || s.day > 4)
    const copies = [1, 2, 3, 4].flatMap((day) => monday.map((s) => ({ ...s, day })))
    onChange([...others, ...copies].sort((a, b) => a.day - b.day))
  }

  return (
    <fieldset className="profil-week">
      <legend>{label}</legend>
      {DAY_NAMES.map((name, day) => {
        const items = byDay(day)
        return (
          <div key={name} className="profil-day">
            <div className="row-between">
              <strong>{name}</strong>
              <button type="button" className="btn btn-ghost profil-add-slot" onClick={() => add(day)}>
                + plage
              </button>
            </div>
            {items.length === 0 && <p className="muted profil-free">Libre</p>}
            {items.map(({ s, idx }) => {
              const night = s.start && s.end && toMinutes(s.end) < toMinutes(s.start)
              return (
                <div key={idx}>
                  <div className="profil-slot">
                    <label>
                      <span className="profil-visually-hidden">{name} : début</span>
                      <input type="time" className="input" value={s.start} onChange={(e) => set(idx, { start: e.target.value })} />
                    </label>
                    <span aria-hidden="true">–</span>
                    <label>
                      <span className="profil-visually-hidden">{name} : fin</span>
                      <input type="time" className="input" value={s.end} onChange={(e) => set(idx, { end: e.target.value })} />
                    </label>
                    <button type="button" className="icon-btn" aria-label={`Retirer la plage du ${name.toLowerCase()}`} onClick={() => remove(idx)}>
                      ✕
                    </button>
                  </div>
                  {night && <p className="profil-hint">Plage de nuit : elle se poursuit le lendemain matin.</p>}
                  {s.start === s.end && <p className="profil-hint">Indique une heure de fin différente du début.</p>}
                </div>
              )
            })}
          </div>
        )
      })}
      {monday.length > 0 && (
        <button type="button" className="btn btn-secondary btn-block" onClick={copyMonday}>
          Recopier le lundi du mardi au vendredi
        </button>
      )}
    </fieldset>
  )
}

interface BlockProps {
  value: Schedule | undefined
  onChange: (s: Schedule) => void
  formatLabel: string
  formatOptions?: { value: ScheduleFormat; label: string }[]
  weekNames?: [string, string]
  defaultSlot: { start: string; end: string }
  editorLabel: string
  randomNote: string
}

const DEFAULT_FORMATS: { value: ScheduleFormat; label: string }[] = [
  { value: 'standard', label: 'Pareil chaque semaine' },
  { value: 'alterne', label: 'Petite et grande semaine' },
  { value: 'aleatoire', label: 'Ça change tout le temps' },
]

// Choix du format de planning + éditeur(s) correspondant(s).
export function ScheduleBlock({
  value,
  onChange,
  formatLabel,
  formatOptions = DEFAULT_FORMATS,
  weekNames = ['Petite semaine', 'Grande semaine'],
  defaultSlot,
  editorLabel,
  randomNote,
}: BlockProps) {
  const s = value ?? {}
  const [tab, setTab] = useState<0 | 1>(0)
  // Semaine en cours : A si numéro ISO pair, B sinon (même règle que l'agenda).
  const thisWeek: 'A' | 'B' = isoWeekNumber(isoDate()) % 2 === 0 ? 'A' : 'B'
  const otherWeek: 'A' | 'B' = thisWeek === 'A' ? 'B' : 'A'
  const currentIsFirst = s.firstWeekType === undefined ? undefined : s.firstWeekType === thisWeek

  return (
    <div>
      <Choice label={formatLabel} options={formatOptions} value={s.format} onChange={(format) => onChange({ ...s, format })} />
      {s.format === 'standard' && (
        <WeekEditor label={editorLabel} slots={s.slots} defaultSlot={defaultSlot} onChange={(slots) => onChange({ ...s, slots })} />
      )}
      {s.format === 'alterne' && (
        <>
          <Choice
            label="Cette semaine, c’est…"
            options={[
              { value: 'first', label: `la ${weekNames[0].toLowerCase()}` },
              { value: 'second', label: `la ${weekNames[1].toLowerCase()}` },
            ]}
            value={currentIsFirst === undefined ? undefined : currentIsFirst ? 'first' : 'second'}
            onChange={(v) =>
              onChange({ ...s, firstWeekType: v === undefined ? undefined : v === 'first' ? thisWeek : otherWeek })
            }
          />
          <div className="profil-tabs" role="tablist" aria-label="Semaine à remplir">
            {weekNames.map((n, k) => (
              <button
                key={n}
                type="button"
                role="tab"
                aria-selected={tab === k}
                className={tab === k ? 'profil-tab on' : 'profil-tab'}
                onClick={() => setTab(k as 0 | 1)}
              >
                {n}
              </button>
            ))}
          </div>
          {tab === 0 ? (
            <WeekEditor label={`${editorLabel} — ${weekNames[0].toLowerCase()}`} slots={s.slots} defaultSlot={defaultSlot} onChange={(slots) => onChange({ ...s, slots })} />
          ) : (
            <WeekEditor label={`${editorLabel} — ${weekNames[1].toLowerCase()}`} slots={s.slotsAlt} defaultSlot={defaultSlot} onChange={(slotsAlt) => onChange({ ...s, slotsAlt })} />
          )}
        </>
      )}
      {s.format === 'aleatoire' && <p className="demo-note">{randomNote}</p>}
      {s.format && (
        <TextField label="Une précision ? (facultatif)" value={s.note} onChange={(note) => onChange({ ...s, note })} multiline />
      )}
      {s.format && s.format !== 'aleatoire' && (
        <p className="profil-hint">📅 Ces créneaux sont transmis à ton agenda : il te proposera des séances en dehors.</p>
      )}
    </div>
  )
}
