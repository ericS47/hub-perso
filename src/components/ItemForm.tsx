import { useCallback, useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type CultureCategory, type CultureItem, type CultureList, type CultureTheme, type Ownership } from '../db'
import { CATEGORIES, OWNERSHIP, doneLabel, parseGenres } from '../culture/categories'
import type { Suggestion } from '../culture/suggest'
import { ensureThemes } from '../culture/themes'
import { legoImage, legoRef } from '../culture/lego'
import { isBarcode, lookupBarcode } from '../culture/barcode'
import { loads } from '../culture/fillCovers'
import CoverPicker from './CoverPicker'
import TitleAutocomplete from './TitleAutocomplete'
import Sheet from './Sheet'
import BarcodeScanner from './BarcodeScanner'

interface Props {
  // Œuvre à modifier ; absente pour un ajout.
  item?: CultureItem
  defaultCategory: CultureCategory
  lists: CultureList[]
  onClose: () => void
  onSaved: (id: number) => void
}

export default function ItemForm({ item, defaultCategory, lists, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(item?.title ?? '')
  const [category, setCategory] = useState<CultureCategory>(item?.category ?? defaultCategory)
  const [cover, setCover] = useState(item?.cover)
  const [reference, setReference] = useState(item?.reference ?? '')
  const [refStatus, setRefStatus] = useState<'idle' | 'checking' | 'found' | 'noimage' | 'unknown'>('idle')
  const [scanning, setScanning] = useState(false)
  // Stable : le scanner ne redémarre pas la caméra à chaque rendu.
  const onScanned = useCallback((code: string) => {
    setReference(code)
    setRefStatus('idle')
    setScanning(false)
  }, [])
  const [ownership, setOwnership] = useState<Ownership>(item?.ownership ?? 'owned')
  const [seen, setSeen] = useState(item?.seen ?? false)
  const [priority, setPriority] = useState(item?.priority ?? false)
  const [recommendedBy, setRecommendedBy] = useState(item?.recommendedBy ?? '')
  const [genres, setGenres] = useState<string[]>(item?.genres ?? [])
  const [newTheme, setNewTheme] = useState('')
  const [listIds, setListIds] = useState(item?.listIds ?? [])

  const themes = useLiveQuery(
    () => db.themes.where('category').equals(category).sortBy('name'),
    [category],
    [] as CultureTheme[],
  )
  // Thèmes cochés mais pas (encore) dans la liste du type : ajoutés à l'enregistrement.
  const extra = genres.filter((g) => !themes.some((t) => t.name.toLowerCase() === g.toLowerCase()))
  const choices = [...themes.map((t) => t.name), ...extra].sort((a, b) => a.localeCompare(b, 'fr'))

  function toggleTheme(name: string) {
    setGenres((gs) => (gs.includes(name) ? gs.filter((g) => g !== name) : [...gs, name]))
  }

  function addTheme() {
    const [name] = parseGenres(newTheme)
    setNewTheme('')
    if (!name) return
    const known = choices.find((c) => c.toLowerCase() === name.toLowerCase()) ?? name
    setGenres((gs) => (gs.includes(known) ? gs : [...gs, known]))
  }

  // Une proposition choisie remplit le titre, la couverture et le genre s'il est connu.
  function pickSuggestion(s: Suggestion) {
    setTitle(s.title)
    if (s.cover) setCover(s.cover)
    if (s.genres.length) setGenres((gs) => parseGenres([...gs, ...s.genres].join(',')))
  }

  // Référence (LEGO : numéro de set ; puzzles : code-barres). Dès qu'elle est
  // reconnue, l'image du produit devient la couverture (sauf photo importée)
  // et un titre est proposé s'il est vide.
  useEffect(() => {
    const ref = category === 'lego' ? legoRef(reference) : undefined
    const ean = category === 'puzzles' && isBarcode(reference) ? reference.trim() : undefined
    if (!ref && !ean) return
    let alive = true
    const ctrl = new AbortController()
    const timer = window.setTimeout(async () => {
      setRefStatus('checking')
      if (ref) {
        const ok = await loads(legoImage(ref))
        if (!alive) return
        setRefStatus(ok ? 'found' : 'unknown')
        if (!ok) return
        setCover((c) => (c?.startsWith('data:') ? c : legoImage(ref)))
        setTitle((t) => t || `LEGO ${ref.replace(/-1$/, '')}`)
        return
      }
      const product = await lookupBarcode(ean!, ctrl.signal).catch(() => undefined)
      if (!alive) return
      if (!product) return setRefStatus('unknown')
      setRefStatus(product.image ? 'found' : 'noimage')
      if (product.image) setCover((c) => (c?.startsWith('data:') ? c : product.image))
      if (product.name) setTitle((t) => t || [product.brand, product.name].filter(Boolean).join(' · '))
    }, 400)
    return () => {
      alive = false
      ctrl.abort()
      window.clearTimeout(timer)
    }
  }, [category, reference])

  function toggleList(id: number) {
    setListIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    const clean = title.trim()
    if (!clean) return
    const data = {
      title: clean,
      category,
      cover,
      reference: category === 'lego' || category === 'puzzles' ? reference.trim() || undefined : item?.reference,
      ownership,
      seen,
      priority,
      recommendedBy: priority ? recommendedBy.trim() || undefined : undefined,
      genres,
      listIds,
    }
    await ensureThemes(category, genres)
    const id =
      item?.id !== undefined
        ? (await db.items.update(item.id, data), item.id)
        : await db.items.add({ ...data, createdAt: Date.now() })
    onSaved(id)
    onClose()
  }

  async function remove() {
    if (item?.id === undefined) return
    if (!window.confirm(`Supprimer « ${item.title} » ?`)) return
    await db.items.delete(item.id)
    onClose()
  }

  return (
    <>
      {scanning && <BarcodeScanner onDetected={onScanned} onClose={() => setScanning(false)} />}
      <Sheet title={item ? 'Modifier' : 'Ajouter une œuvre'} onClose={onClose}>
        <form className="item-form" onSubmit={save}>
          <label className="field-label">
            Type
            <select className="field" value={category} onChange={(e) => setCategory(e.target.value as CultureCategory)}>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.label}
                </option>
              ))}
            </select>
          </label>

          {(category === 'lego' || category === 'puzzles') && (
            <label className="field-label">
              {category === 'lego' ? 'Numéro du set (sur la boîte, ex. 75192)' : 'Code-barres (13 chiffres) ou référence'}
              <span className="ref-row">
                <input
                  className="field"
                  value={reference}
                  onChange={(e) => {
                    setReference(
                      category === 'lego' ? e.target.value.replace(/[^\d-]/g, '') : e.target.value.replace(/[^\w-]/g, ''),
                    )
                    setRefStatus('idle')
                  }}
                  inputMode="numeric"
                  placeholder={category === 'lego' ? '75192' : '4005556173839'}
                  autoFocus={!item && category === 'lego'}
                />
                {category === 'puzzles' && (
                  <button type="button" className="btn scan-btn" onClick={() => setScanning(true)}>
                    📷 Scanner
                  </button>
                )}
              </span>
              <span className={refStatus === 'unknown' ? 'muted small-text warn-text' : 'muted small-text'}>
                {refStatus === 'checking'
                  ? "Recherche de l'image…"
                  : refStatus === 'found'
                    ? '✓ Produit trouvé, image ajoutée'
                    : refStatus === 'noimage'
                      ? 'Produit trouvé, mais sans image : ajoute une photo'
                      : refStatus === 'unknown'
                        ? category === 'lego'
                          ? 'Numéro inconnu : vérifie-le sur la boîte, ou ajoute une photo'
                          : 'Code-barres inconnu de la base : ajoute une photo de la boîte'
                        : category === 'lego'
                          ? "L'image de la boîte est ajoutée automatiquement"
                          : 'Avec le code-barres, image et nom sont cherchés automatiquement ; il sert aussi à comparer les prix'}
              </span>
            </label>
          )}

          <div className="field-label">
            Titre
            <TitleAutocomplete
              value={title}
              category={category}
              autoFocus={!item && category !== 'lego' && category !== 'puzzles'}
              onChange={setTitle}
              onPick={pickSuggestion}
            />
          </div>

          <div className="field-label">
            Couverture
            <CoverPicker title={title} category={category} value={cover} onChange={setCover} />
          </div>

          <div className="field-label">
            Statut
            <div className="segmented" role="radiogroup" aria-label="Statut">
              {OWNERSHIP.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  role="radio"
                  aria-checked={ownership === o.id}
                  className={ownership === o.id ? 'chip active' : 'chip'}
                  onClick={() => setOwnership(o.id)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <label className="check">
            <input type="checkbox" checked={seen} onChange={(e) => setSeen(e.target.checked)} />
            {doneLabel(category)}
          </label>

          <label className="check">
            <input type="checkbox" checked={priority} onChange={(e) => setPriority(e.target.checked)} />
            ★ Conseillé (mis en avant)
          </label>
          {priority && (
            <input
              className="field"
              value={recommendedBy}
              onChange={(e) => setRecommendedBy(e.target.value)}
              placeholder="Conseillé par… (facultatif)"
              aria-label="Conseillé par"
            />
          )}

          <div className="field-label">
            Thèmes (plusieurs possibles)
            <div className="filters" role="group" aria-label="Thèmes">
              {choices.map((name) => (
                <button
                  key={name}
                  type="button"
                  className={genres.includes(name) ? 'chip small active' : 'chip small'}
                  aria-pressed={genres.includes(name)}
                  onClick={() => toggleTheme(name)}
                >
                  {name}
                </button>
              ))}
            </div>
            <div className="task-form">
              <input
                className="field"
                value={newTheme}
                onChange={(e) => setNewTheme(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTheme()
                  }
                }}
                placeholder="Nouveau thème"
                aria-label="Nouveau thème"
              />
              <button type="button" className="btn ghost" onClick={addTheme}>
                Créer
              </button>
            </div>
          </div>

          {lists.length > 0 && (
            <div className="field-label">
              Listes
              <div className="filters">
                {lists.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    className={listIds.includes(l.id!) ? 'chip active' : 'chip'}
                    aria-pressed={listIds.includes(l.id!)}
                    onClick={() => toggleList(l.id!)}
                  >
                    {l.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="btn">
              {item ? 'Enregistrer' : 'Ajouter'}
            </button>
            {item && (
              <button type="button" className="link-btn danger" onClick={remove}>
                Supprimer
              </button>
            )}
          </div>
        </form>
      </Sheet>
    </>
  )
}
