interface Option<T extends string> {
  value: T
  label: string
}

interface Props<T extends string> {
  label?: string
  options: Option<T>[]
  // Choix unique : value est une valeur ; choix multiple : un tableau.
  value: T | T[] | undefined
  onChange: (value: T) => void
}

// Pastilles de choix (unique ou multiple selon que value est un tableau).
// En choix multiple, onChange reçoit la pastille touchée : à l'appelant de l'ajouter ou la retirer.
export default function Chips<T extends string>({ label, options, value, onChange }: Props<T>) {
  const isOn = (v: T) => (Array.isArray(value) ? value.includes(v) : value === v)
  return (
    <fieldset className="chips">
      {label && <legend>{label}</legend>}
      <div className="chips-row">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={isOn(o.value)}
            className={isOn(o.value) ? 'chip on' : 'chip'}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
