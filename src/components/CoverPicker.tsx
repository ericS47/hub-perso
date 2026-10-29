import { useEffect, useRef, useState } from 'react'
import type { CultureCategory } from '../db'
import { searchCovers, type CoverHit } from '../culture/coverSearch'
import { fileToCover } from '../culture/image'
import CoverImage from './CoverImage'

interface Props {
  title: string
  category: CultureCategory
  value?: string
  onChange: (cover: string | undefined) => void
}

type State = { kind: 'idle' } | { kind: 'loading' } | { kind: 'done'; hits: CoverHit[]; failed: boolean }

export default function CoverPicker({ title, category, value, onChange }: Props) {
  const [state, setState] = useState<State>({ kind: 'idle' })
  const [showLink, setShowLink] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => () => abortRef.current?.abort(), [])

  async function search() {
    if (!title.trim()) return
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setState({ kind: 'loading' })
    const res = await searchCovers(category, title, ctrl.signal)
    if (!ctrl.signal.aborted) setState({ kind: 'done', ...res })
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      onChange(await fileToCover(file))
    } catch {
      window.alert("Cette image n'a pas pu être lue.")
    }
  }

  return (
    <div className="cover-picker">
      <div className="cover-picker-head">
        <div className="cover-preview">
          <CoverImage item={{ title: title || 'Sans titre', category, cover: value }} />
        </div>
        <div className="cover-actions">
          <button type="button" className="btn" onClick={search} disabled={!title.trim() || state.kind === 'loading'}>
            🔍 Chercher la couverture
          </button>
          <button type="button" className="btn ghost" onClick={() => fileRef.current?.click()}>
            📷 Photo ou image
          </button>
          <button type="button" className="link-btn small-link" onClick={() => setShowLink((v) => !v)}>
            🔗 Coller un lien
          </button>
          {value && (
            <button type="button" className="link-btn small-link" onClick={() => onChange(undefined)}>
              Retirer l'image
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
        </div>
      </div>

      {showLink && (
        <input
          className="field"
          type="url"
          placeholder="https://…"
          aria-label="Lien de l'image"
          defaultValue={value?.startsWith('http') ? value : ''}
          onChange={(e) => onChange(e.target.value.trim() || undefined)}
        />
      )}

      {!title.trim() && state.kind === 'idle' && <p className="muted small-text">Saisis d'abord le titre pour chercher.</p>}
      {state.kind === 'loading' && <p className="muted small-text">Recherche en cours…</p>}
      {state.kind === 'done' && state.hits.length === 0 && (
        <p className="muted small-text">
          {state.failed ? 'Recherche impossible (hors ligne ?).' : 'Aucune image trouvée.'} Tu peux importer une photo.
        </p>
      )}
      {state.kind === 'done' && state.hits.length > 0 && (
        <>
          <p className="muted small-text">Touche l'image qui correspond :</p>
          <div className="cover-hits">
            {state.hits.map((h) => (
              <button
                key={h.url}
                type="button"
                className={h.url === value ? 'cover-hit selected' : 'cover-hit'}
                onClick={() => onChange(h.url)}
                title={`${h.label} · ${h.source}`}
                aria-pressed={h.url === value}
              >
                <img src={h.url} alt={h.label} loading="lazy" referrerPolicy="no-referrer" />
                <span>{h.source}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
