import { useEffect, useId, useRef, useState } from 'react'
import type { CultureCategory } from '../db'
import { suggest, type SourceStatus, type Suggestion } from '../culture/suggest'
import { categoryOf } from '../culture/categories'

interface Props {
  value: string
  category: CultureCategory
  autoFocus?: boolean
  onChange: (title: string) => void
  onPick: (s: Suggestion) => void
}

type State = { kind: 'idle' } | { kind: 'loading' } | { kind: 'done'; list: Suggestion[]; status: SourceStatus[] }

// Champ titre qui propose des œuvres existantes dès la 3e lettre.
export default function TitleAutocomplete({ value, category, autoFocus, onChange, onPick }: Props) {
  const [state, setState] = useState<State>({ kind: 'idle' })
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  // Vrai seulement après une frappe : pas de recherche à l'ouverture d'une fiche existante.
  const [typed, setTyped] = useState(false)
  const listId = useId()
  const icon = categoryOf(category)?.icon
  const blurTimer = useRef(0)

  useEffect(() => {
    const q = value.trim()
    if (!typed || q.length < 3) return
    const ctrl = new AbortController()
    // Attente de 350 ms : une seule recherche quand la frappe se calme.
    const timer = window.setTimeout(async () => {
      setState({ kind: 'loading' })
      const res = await suggest(category, q, ctrl.signal)
      if (ctrl.signal.aborted) return
      setState({ kind: 'done', list: res.suggestions, status: res.status })
      setActive(-1)
    }, 350)
    return () => {
      ctrl.abort()
      window.clearTimeout(timer)
    }
  }, [value, category, typed])

  useEffect(() => () => window.clearTimeout(blurTimer.current), [])

  const searching = typed && value.trim().length >= 3
  const list = searching && state.kind === 'done' ? state.list : []
  const showPanel = open && searching && state.kind !== 'idle'

  function pick(s: Suggestion) {
    onPick(s)
    setTyped(false)
    setOpen(false)
  }

  function onKey(e: React.KeyboardEvent) {
    if (!showPanel || list.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => (i + 1) % list.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (i <= 0 ? list.length - 1 : i - 1))
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault()
      pick(list[active])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      setOpen(false)
    }
  }

  return (
    <div className="autocomplete">
      <input
        className="field"
        value={value}
        required
        autoFocus={autoFocus}
        autoComplete="off"
        role="combobox"
        aria-label="Titre"
        aria-expanded={showPanel}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        placeholder="Commence à écrire, des œuvres te sont proposées"
        onChange={(e) => {
          onChange(e.target.value)
          setTyped(true)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        // Délai : laisse le temps au toucher sur une proposition d'être pris en compte.
        onBlur={() => {
          blurTimer.current = window.setTimeout(() => setOpen(false), 200)
        }}
        onKeyDown={onKey}
      />
      {showPanel && (
        <div className="ac-panel">
          {state.kind === 'loading' && <p className="ac-note">Recherche…</p>}
          {state.kind === 'done' && list.length === 0 && (
            <p className="ac-note">
              Aucune proposition, tu peux garder ton titre tel quel.
              <br />
              {/* État de chaque source : aide à repérer celle qui ne répond pas. */}
              <span className="small-text">
                {state.status.map((s) => `${s.name} : ${s.ok ? `${s.count} résultat(s)` : 'erreur'}`).join(' · ')}
                {!navigator.onLine && ' · hors ligne'}
              </span>
            </p>
          )}
          {list.length > 0 && (
            <ul id={listId} role="listbox" className="ac-list" aria-label="Propositions">
              {list.map((s, i) => (
                <li
                  key={`${s.source}-${i}`}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  className={i === active ? 'ac-item active' : 'ac-item'}
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => pick(s)}
                >
                  <span className="ac-thumb">
                    {s.cover ? (
                      <img src={s.cover} alt="" loading="lazy" referrerPolicy="no-referrer" />
                    ) : (
                      <span aria-hidden="true">{icon}</span>
                    )}
                  </span>
                  <span className="ac-text">
                    <strong>{s.title}</strong>
                    {s.subtitle && <span className="muted">{s.subtitle}</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
