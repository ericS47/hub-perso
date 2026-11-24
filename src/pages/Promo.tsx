import { useCallback, useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Watch } from '../db'
import PageShell from '../components/PageShell'
import PriceSheet from '../components/PriceSheet'
import BarcodeScanner from '../components/BarcodeScanner'
import WatchSheet from '../components/promo/WatchSheet'
import Sparkline from '../components/promo/Sparkline'
import Thumb from '../components/promo/Thumb'
import { isBarcode } from '../culture/barcode'
import { CATALOGS, DEAL_FEEDS, STORES, TooManyRequests, cachedDeals, fetchDeals, type Deal, type FeedId } from '../promo/sources'
import { MAX_WATCHES, euros, summary } from '../promo/prices'

type DealsState = { kind: 'loading' } | { kind: 'done'; deals: Deal[]; old?: number } | { kind: 'error'; busy: boolean }

// Promo : comparer un produit, suivre 6 prix, bons plans et catalogues.
export default function Promo() {
  const watches = useLiveQuery(() => db.watches.orderBy('createdAt').toArray(), [], [] as Watch[])
  const [query, setQuery] = useState('')
  const [compare, setCompare] = useState<{ title: string; reference?: string; watch?: Watch }>()
  const [editing, setEditing] = useState<Watch | { name: string; reference?: string }>()
  const [scanning, setScanning] = useState(false)
  const [feed, setFeed] = useState<FeedId>('tendance')
  const [deals, setDeals] = useState<DealsState>({ kind: 'loading' })

  // Les bons plans se chargent à l'ouverture de la page (pas de notification).
  useEffect(() => {
    const ctrl = new AbortController()
    fetchDeals(feed, ctrl.signal)
      .then((d) => setDeals({ kind: 'done', deals: d }))
      .catch((err) => {
        if (ctrl.signal.aborted) return
        // Service indisponible : les derniers bons plans gardés, s'il y en a.
        const old = cachedDeals(feed)
        setDeals(old ? { kind: 'done', deals: old.deals, old: old.at } : { kind: 'error', busy: err instanceof TooManyRequests })
      })
    return () => ctrl.abort()
  }, [feed])

  const onScanned = useCallback((code: string) => {
    setScanning(false)
    setQuery(code)
    setCompare({ title: code, reference: code })
  }, [])

  function search(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (q) setCompare({ title: q, reference: isBarcode(q) ? q : undefined })
  }

  function follow() {
    if (!compare) return
    if (watches.length >= MAX_WATCHES) {
      window.alert(`${MAX_WATCHES} produits suivis au maximum : retire-en un d'abord.`)
      return
    }
    setEditing({ name: compare.reference ? '' : compare.title, reference: compare.reference })
    setCompare(undefined)
  }

  return (
    <PageShell title="Promo" subtitle="Compare, suis les prix, profite des bons plans">
      <section className="card">
        <h2 className="section-title no-margin">🔎 Comparer un produit</h2>
        <form className="task-form promo-search" onSubmit={search}>
          <input
            className="field"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Produit ou code-barres"
            aria-label="Produit ou code-barres"
          />
          <button type="button" className="btn ghost" onClick={() => setScanning(true)} aria-label="Scanner un code-barres">
            📷
          </button>
          <button type="submit" className="btn" disabled={!query.trim()}>
            Comparer
          </button>
        </form>
        <p className="muted small-text no-margin">Comparateurs, boutiques, bons plans et occasion, d'un toucher.</p>
      </section>

      <section className="card">
        <div className="players-head">
          <h2 className="section-title no-margin">
            ⭐ Prix suivis ({watches.length}/{MAX_WATCHES})
          </h2>
          {watches.length < MAX_WATCHES && (
            <button type="button" className="link-btn small-link import-link" onClick={() => setEditing({ name: '' })}>
              + Suivre un produit
            </button>
          )}
        </div>
        {watches.length === 0 ? (
          <p className="muted small-text">
            Ajoute un produit que tu guettes, note les prix que tu vois et fixe un prix cible : l'appli te dit quand c'est une
            bonne affaire.
          </p>
        ) : (
          <ul className="watch-list">
            {watches.map((w) => {
              const { sorted, last, best, deal } = summary(w)
              return (
                <li key={w.id} className={deal ? 'watch deal' : 'watch'}>
                  <button type="button" className="watch-main" onClick={() => setEditing(w)}>
                    <span className="watch-img">
                      <Thumb src={w.image} />
                    </span>
                    <span className="match-text">
                      <strong>{w.name}</strong>
                      <span className="muted small-text">
                        {last ? `${euros(last.price)}${last.shop ? ` · ${last.shop}` : ''}` : 'Aucun prix noté'}
                        {best && best !== last && ` · min ${euros(best.price)}`}
                      </span>
                      {w.target !== undefined && (
                        <span className={deal ? 'deal-badge' : 'muted small-text'}>
                          {deal ? `✅ Sous ton prix cible (${euros(w.target)})` : `Cible : ${euros(w.target)}`}
                        </span>
                      )}
                    </span>
                    <Sparkline prices={sorted.map((p) => p.price)} target={w.target} />
                  </button>
                  <button
                    type="button"
                    className="btn ghost watch-compare"
                    onClick={() => setCompare({ title: w.name, reference: w.reference, watch: w })}
                  >
                    💶 Revérifier
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="card">
        <h2 className="section-title no-margin">🔥 Bons plans du moment</h2>
        <div className="filters scroll-row deal-tabs" role="tablist" aria-label="Bons plans">
          {DEAL_FEEDS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={feed === f.id}
              className={feed === f.id ? 'chip small active' : 'chip small'}
              onClick={() => {
                setFeed(f.id)
                setDeals({ kind: 'loading' })
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        {deals.kind === 'loading' && <p className="muted small-text">Chargement des bons plans…</p>}
        {deals.kind === 'error' && (
          <p className="muted small-text">
            {deals.busy
              ? 'Trop de demandes au service des bons plans : réessaie dans quelques minutes.'
              : 'Bons plans indisponibles pour le moment (hors ligne ?).'}{' '}
            <a href="https://www.dealabs.com" target="_blank" rel="noopener noreferrer" className="import-link">
              Ouvrir Dealabs ↗
            </a>
          </p>
        )}
        {deals.kind === 'done' && deals.old && (
          <p className="muted small-text">
            Service indisponible : bons plans enregistrés à{' '}
            {new Date(deals.old).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}.
          </p>
        )}
        {deals.kind === 'done' && (
          <ul className="deal-list">
            {deals.deals.map((d) => (
              <li key={d.link}>
                <a href={d.link} target="_blank" rel="noopener noreferrer" className="deal">
                  <span className="deal-img">
                    <Thumb src={d.image} />
                  </span>
                  <span className="match-text">
                    <strong className="deal-title">{d.title}</strong>
                    <span className="muted small-text">
                      {[d.price, d.shop].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  {d.temperature !== undefined && (
                    <span className={d.temperature >= 100 ? 'deal-temp hot' : 'deal-temp'}>{d.temperature}°</span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        )}
        <p className="muted small-text no-margin">Source : Dealabs (température = avis de la communauté).</p>
      </section>

      <section className="card">
        <h2 className="section-title no-margin">🛒 Catalogues à Saint-Sulpice</h2>
        <div className="price-links catalog-links">
          {CATALOGS.map((c) => (
            <a key={c.url} href={c.url} target="_blank" rel="noopener noreferrer" className="chip active-soft">
              📰 {c.name} ↗
            </a>
          ))}
          {STORES.map((s) => (
            <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="chip">
              {s.name} ↗
            </a>
          ))}
        </div>
      </section>

      {compare && (
        <PriceSheet
          reference={compare.reference}
          title={compare.title}
          lego={false}
          onClose={() => setCompare(undefined)}
          onFollow={compare.watch ? undefined : follow}
        />
      )}
      {scanning && <BarcodeScanner onDetected={onScanned} onClose={() => setScanning(false)} />}
      {editing && (
        <WatchSheet
          key={'id' in editing ? editing.id : 'new'}
          watch={'id' in editing ? (editing as Watch) : undefined}
          initialName={'id' in editing ? undefined : editing.name}
          initialReference={'id' in editing ? undefined : editing.reference}
          onClose={() => setEditing(undefined)}
        />
      )}
    </PageShell>
  )
}
