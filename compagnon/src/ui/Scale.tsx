interface Props {
  label: string
  value: number | undefined
  onChange: (value: number) => void
  // Libellés des extrémités, ex. « Pas du tout » / « Énormément ».
  minLabel?: string
  maxLabel?: string
  max?: number
}

// Échelle de 0 à 10 (par défaut) : une rangée de pastilles faciles à toucher.
export default function Scale({ label, value, onChange, minLabel, maxLabel, max = 10 }: Props) {
  return (
    <fieldset className="scale">
      <legend>{label}</legend>
      <div className="scale-row" role="radiogroup" aria-label={label}>
        {Array.from({ length: max + 1 }, (_, n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            className={value === n ? 'scale-dot on' : 'scale-dot'}
            onClick={() => onChange(n)}
          >
            {n}
          </button>
        ))}
      </div>
      {(minLabel || maxLabel) && (
        <div className="scale-ends muted">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      )}
    </fieldset>
  )
}
