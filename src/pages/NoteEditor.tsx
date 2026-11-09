import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type NoteLabel } from '../db'
import { labelOptions } from '../notes/labels'
import { useDictation } from '../hooks/useDictation'

// Ajoute une phrase dictée à la fin du texte, avec majuscule et espace si besoin.
function appendSentence(body: string, sentence: string) {
  if (!sentence) return body
  const capitalized = sentence.charAt(0).toUpperCase() + sentence.slice(1)
  if (!body) return capitalized
  const separator = /[\s]$/.test(body) ? '' : /[.!?]$/.test(body) ? ' ' : '. '
  return body + separator + capitalized
}

export default function NoteEditor() {
  const { noteId } = useParams()
  const id = Number(noteId)
  const navigate = useNavigate()
  const labels = useLiveQuery(() => db.labels.toArray(), [], [] as NoteLabel[])

  const [status, setStatus] = useState<'loading' | 'ready' | 'missing'>('loading')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [labelId, setLabelId] = useState(0)
  const [updatedAt, setUpdatedAt] = useState(0)
  const bodyRef = useRef('')

  useEffect(() => {
    let cancelled = false
    db.notes.get(id).then((n) => {
      if (cancelled) return
      if (!n) {
        setStatus('missing')
        return
      }
      setTitle(n.title)
      setBody(n.body)
      bodyRef.current = n.body
      setLabelId(n.labelId)
      setUpdatedAt(n.updatedAt)
      setStatus('ready')
    })
    return () => {
      cancelled = true
    }
  }, [id])

  // Enregistrement automatique à chaque modification.
  function save(changes: { title?: string; body?: string; labelId?: number }) {
    const now = Date.now()
    setUpdatedAt(now)
    db.notes.update(id, { ...changes, updatedAt: now })
  }

  function changeBody(next: string) {
    bodyRef.current = next
    setBody(next)
    save({ body: next })
  }

  const dictation = useDictation((sentence) => changeBody(appendSentence(bodyRef.current, sentence)))

  const backTo = labelId ? `/notes/etiquette/${labelId}` : '/notes'

  async function remove() {
    if (!window.confirm('Supprimer cette note ?')) return
    dictation.stop()
    await db.notes.delete(id)
    navigate(backTo)
  }

  if (status === 'loading') return null
  if (status === 'missing') {
    return (
      <section className="card">
        <h1>Note introuvable</h1>
        <Link to="/notes" className="back-link">← Toutes les notes</Link>
      </section>
    )
  }

  return (
    <div className="note-editor">
      <Link to={backTo} className="back-link">← Retour</Link>

      <input
        className="note-title"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value)
          save({ title: e.target.value })
        }}
        placeholder="Titre"
        aria-label="Titre de la note"
      />

      <label className="note-label-select small-text">
        Étiquette
        <select
          value={labelId}
          onChange={(e) => {
            const next = Number(e.target.value)
            setLabelId(next)
            save({ labelId: next })
          }}
        >
          <option value={0}>Sans étiquette</option>
          {labelOptions(labels).map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
      </label>

      <textarea
        className="note-body"
        value={body}
        onChange={(e) => changeBody(e.target.value)}
        placeholder="Écris ou dicte ta note…"
        aria-label="Texte de la note"
        rows={12}
      />

      {dictation.interim && <p className="note-interim">{dictation.interim}</p>}

      <div className="note-actions">
        {dictation.supported ? (
          <button
            type="button"
            className={dictation.listening ? 'btn dictate listening' : 'btn dictate'}
            aria-pressed={dictation.listening}
            onClick={dictation.listening ? dictation.stop : dictation.start}
          >
            {dictation.listening ? '■ Arrêter la dictée' : '🎤 Dicter'}
          </button>
        ) : (
          <p className="muted small-text">
            La dictée n'est pas disponible dans ce navigateur : utilise le micro du clavier de ton téléphone.
          </p>
        )}
        <button type="button" className="link-btn danger" onClick={remove}>Supprimer</button>
      </div>
      {dictation.error && <p className="note-error small-text">{dictation.error}</p>}

      <p className="muted small-text">
        Enregistré automatiquement · {new Date(updatedAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
      </p>
    </div>
  )
}
