import { useCallback, useEffect, useState } from 'react'
import { db, type Watch } from '../../db'
import { isBarcode, lookupBarcode } from '../../culture/barcode'
import { imageFromLink, isWebLink } from '../../culture/linkImage'
import { euros, parsePrice, summary } from '../../promo/prices'
import BarcodeScanner from '../BarcodeScanner'
import Sheet from '../Sheet'

interface Props {
  // Produit à modifier ; absent pour un nouveau (avec un nom proposé).
  watch?: Watch
  initialName?: string
  initialReference?: string
  onClose: () => void
}

// Ajout ou fiche d'un produit suivi : nom, code-barres, image, prix cible,
// et historique des prix relevés.
export default function WatchSheet({ watch, initialName, initialReference, onClose }: Props) {
  const [name, setName] = useState(watch?.name ?? initialName ?? '')
  const [reference, setReference] = useState(watch?.reference ?? initialReference ?? '')
  const [image, setImage] = useState(watch?.image)
  const [link, setLink] = useState('')
  const [target, setTarget] = useState(watch?.target ? String(watch.target).replace('.', ',') : '')
  const [price, setPrice] = useState('')
  const [shop, setShop] = useState('')
  const [scanning, setScanning] = useState(false)
  const [status, setStatus] = useState('')

  const onScanned = useCallback((code: string) => {
    setReference(code)
    setScanning(false)
  }, [])

  // Code-barres reconnu : nom et image proposés (base Open Products Facts).
  useEffect(() => {
    if (!isBarcode(reference)) return
    const ctrl = new AbortController()
    const timer = window.setTimeout(async () => {
      const p = await lookupBarcode(reference, ctrl.signal).catch(() => undefined)
      if (ctrl.signal.aborted || !p) return
      if (p.name) setName((n) => n || [p.brand, p.name].filter(Boolean).join(' · '))
      if (p.image) setImage((i) => i ?? p.image)
    }, 400)
    return () => {
      ctrl.abort()
      window.clearTimeout(timer)
    }
  }, [reference])

  // Lien de la page du produit : son image est récupérée.
  useEffect(() => {
    if (!isWebLink(link)) return
    const ctrl = new AbortController()
    const timer = window.setTimeout(async () => {
      setStatus("Recherche de l'image…")
      const img = await imageFromLink(link, ctrl.signal).catch(() => undefined)
      if (ctrl.signal.aborted) return
      setStatus(img ? '✓ Image ajoutée' : "Pas d'image trouvée sur cette page")
      if (img) setImage(img)
    }, 500)
    return () => {
      ctrl.abort()
      window.clearTimeout(timer)
    }
  }, [link])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    const clean = name.trim()
    if (!clean) return
    const first = parsePrice(price)
    const data = {
      name: clean,
      reference: reference.trim() || undefined,
      image,
      target: parsePrice(target),
    }
    if (watch?.id !== undefined) await db.watches.update(watch.id, data)
    else {
      if ((await db.watches.count()) >= 6) {
        window.alert('6 produits suivis au maximum : retire-en un d’abord.')
        return
      }
      await db.watches.add({
        ...data,
        prices: first ? [{ price: first, shop: shop.trim() || undefined, date: Date.now() }] : [],
        createdAt: Date.now(),
      })
    }
    onClose()
  }

  async function addPrice() {
    const p = parsePrice(price)
    if (!p || watch?.id === undefined) return
    await db.watches.update(watch.id, { prices: [...watch.prices, { price: p, shop: shop.trim() || undefined, date: Date.now() }] })
    setPrice('')
    setShop('')
    onClose()
  }

  async function removePrice(date: number) {
    if (watch?.id === undefined) return
    await db.watches.update(watch.id, { prices: watch.prices.filter((p) => p.date !== date) })
  }

  async function remove() {
    if (watch?.id === undefined || !window.confirm(`Ne plus suivre « ${watch.name} » ?`)) return
    await db.watches.delete(watch.id)
    onClose()
  }

  const info = watch ? summary(watch) : undefined

  return (
    <>
      {scanning && <BarcodeScanner onDetected={onScanned} onClose={() => setScanning(false)} />}
      <Sheet title={watch ? watch.name : '⭐ Suivre un produit'} onClose={onClose}>
        {watch && (
          <section className="watch-add-price">
            <h3>Noter un prix vu</h3>
            <div className="ref-row">
              <input
                className="field"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                inputMode="decimal"
                placeholder="Prix (ex. 49,90)"
                aria-label="Prix vu"
              />
              <input
                className="field"
                value={shop}
                onChange={(e) => setShop(e.target.value)}
                placeholder="Magasin"
                aria-label="Magasin"
              />
            </div>
            <button type="button" className="btn" onClick={addPrice} disabled={!parsePrice(price)}>
              Enregistrer ce prix
            </button>
          </section>
        )}

        <form className="item-form" onSubmit={save}>
          <label className="field-label">
            Produit
            <input className="field" value={name} onChange={(e) => setName(e.target.value)} required placeholder="ex. Aspirateur Dyson V15" />
          </label>
          <label className="field-label">
            Code-barres ou référence (facultatif)
            <span className="ref-row">
              <input
                className="field"
                value={reference}
                onChange={(e) => setReference(e.target.value.replace(/[^\w-]/g, ''))}
                inputMode="numeric"
                placeholder="13 chiffres sous le code-barres"
              />
              <button type="button" className="btn scan-btn" onClick={() => setScanning(true)}>
                📷 Scanner
              </button>
            </span>
          </label>
          <label className="field-label">
            Image (lien de la page du produit, facultatif)
            <span className="ref-row">
              {image && <img src={image} alt="" className="watch-thumb" referrerPolicy="no-referrer" />}
              <input
                className="field"
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value.trim())}
                placeholder="https://…"
              />
            </span>
            {status && <span className="muted small-text">{status}</span>}
          </label>
          <label className="field-label">
            Prix cible : bonne affaire en dessous de… (facultatif)
            <input
              className="field"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              inputMode="decimal"
              placeholder="ex. 399"
            />
          </label>
          {!watch && (
            <div className="field-label">
              Prix vu aujourd'hui (facultatif)
              <span className="ref-row">
                <input
                  className="field"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  inputMode="decimal"
                  placeholder="Prix"
                  aria-label="Prix vu aujourd'hui"
                />
                <input className="field" value={shop} onChange={(e) => setShop(e.target.value)} placeholder="Magasin" aria-label="Magasin" />
              </span>
            </div>
          )}
          <div className="form-actions">
            <button type="submit" className={watch ? 'btn ghost' : 'btn'}>
              {watch ? 'Enregistrer les changements' : 'Suivre ce produit'}
            </button>
            {watch && (
              <button type="button" className="link-btn danger" onClick={remove}>
                Ne plus suivre
              </button>
            )}
          </div>
        </form>

        {info && info.sorted.length > 0 && (
          <section className="watch-history">
            <h3>Prix relevés</h3>
            <ul>
              {[...info.sorted].reverse().map((p) => (
                <li key={p.date}>
                  <span>{new Date(p.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                  <span className="muted">{p.shop ?? '—'}</span>
                  <strong className={info.best?.date === p.date ? 'best-price' : undefined}>{euros(p.price)}</strong>
                  <button type="button" className="link-btn small-link" aria-label="Supprimer ce prix" onClick={() => removePrice(p.date)}>
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </Sheet>
    </>
  )
}
