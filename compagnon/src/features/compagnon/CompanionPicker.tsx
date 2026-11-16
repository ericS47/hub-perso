import type { CompanionSettings } from '../../db'
import Avatar from './Avatar'
import { KINDS, PALETTE } from './voice'

interface Props {
  value: CompanionSettings
  onChange: (v: CompanionSettings) => void
}

// Choix du personnage, de son nom, de sa couleur et du tutoiement.
export default function CompanionPicker({ value, onChange }: Props) {
  const set = (patch: Partial<CompanionSettings>) => onChange({ ...value, ...patch })
  const isDefaultName = !value.name.trim() || KINDS.some((k) => k.defaultName === value.name)

  return (
    <div>
      <fieldset>
        <legend>Personnage</legend>
        <div className="compagnon-kinds" role="radiogroup" aria-label="Personnage">
          {KINDS.map((k) => {
            const on = k.kind === value.kind
            return (
              <button
                key={k.kind}
                type="button"
                role="radio"
                aria-checked={on}
                className={on ? 'compagnon-kind on' : 'compagnon-kind'}
                onClick={() => set({ kind: k.kind, ...(isDefaultName ? { name: k.defaultName } : {}) })}
              >
                <Avatar companion={{ ...value, kind: k.kind }} size={64} mood={on ? 'content' : 'neutre'} />
                <span className="compagnon-kind-label">{k.label}</span>
                <span className="compagnon-kind-desc">{k.description}</span>
              </button>
            )
          })}
        </div>
      </fieldset>

      <label className="field">
        <span>Son nom</span>
        <input value={value.name} maxLength={24} onChange={(e) => set({ name: e.target.value })} placeholder="Un prénom, un surnom…" />
      </label>

      <fieldset>
        <legend>Sa couleur</legend>
        <div className="compagnon-colors" role="radiogroup" aria-label="Couleur">
          {PALETTE.map((p) => (
            <button
              key={p.color}
              type="button"
              role="radio"
              aria-checked={p.color === value.color}
              aria-label={p.label}
              title={p.label}
              className={p.color === value.color ? 'compagnon-color on' : 'compagnon-color'}
              style={{ background: p.color }}
              onClick={() => set({ color: p.color })}
            />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Comment {value.name.trim() || 'ton compagnon'} s’adresse à toi</legend>
        <div className="chips-row">
          <button type="button" className={value.tutoiement ? 'chip on' : 'chip'} aria-pressed={value.tutoiement} onClick={() => set({ tutoiement: true })}>
            Me tutoyer (« tu »)
          </button>
          <button type="button" className={!value.tutoiement ? 'chip on' : 'chip'} aria-pressed={!value.tutoiement} onClick={() => set({ tutoiement: false })}>
            Me vouvoyer (« vous »)
          </button>
        </div>
      </fieldset>
    </div>
  )
}
