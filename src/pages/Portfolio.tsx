import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Portfolio as PortfolioType, type Position } from '../db'

const eur = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })

// Saisie tolérante : accepte la virgule comme séparateur décimal.
const parseNumber = (s: string) => Number(s.replace(',', '.'))

export default function Portfolio() {
  const portfolios = useLiveQuery(() => db.portfolios.orderBy('createdAt').toArray(), [], [] as PortfolioType[])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const current = portfolios.find((p) => p.id === selectedId) ?? portfolios[0]
  const positions = useLiveQuery(
    () => (current?.id === undefined ? [] : db.positions.where('portfolioId').equals(current.id).toArray()),
    [current?.id],
    [] as Position[],
  )

  const [newName, setNewName] = useState('')
  const [pName, setPName] = useState('')
  const [pQty, setPQty] = useState('')
  const [pBuy, setPBuy] = useState('')

  async function createPortfolio(e: React.FormEvent) {
    e.preventDefault()
    const clean = newName.trim()
    if (!clean) return
    const id = await db.portfolios.add({ name: clean, createdAt: Date.now() })
    setSelectedId(id as number)
    setNewName('')
  }

  async function addPosition(e: React.FormEvent) {
    e.preventDefault()
    const qty = parseNumber(pQty)
    const buy = parseNumber(pBuy)
    if (!pName.trim() || !(qty > 0) || !(buy > 0) || current?.id === undefined) return
    await db.positions.add({
      portfolioId: current.id,
      name: pName.trim(),
      quantity: qty,
      buyPrice: buy,
      currentPrice: buy,
      createdAt: Date.now(),
    })
    setPName('')
    setPQty('')
    setPBuy('')
  }

  async function setCurrentPrice(p: Position, value: string) {
    const price = parseNumber(value)
    if (p.id === undefined || !(price >= 0)) return
    await db.positions.update(p.id, { currentPrice: price })
  }

  async function removePosition(p: Position) {
    if (p.id === undefined) return
    await db.positions.delete(p.id)
  }

  const invested = positions.reduce((sum, p) => sum + p.quantity * p.buyPrice, 0)
  const value = positions.reduce((sum, p) => sum + p.quantity * p.currentPrice, 0)
  const gain = value - invested
  const gainPct = invested > 0 ? (gain / invested) * 100 : 0

  return (
    <div>
      <Link to="/finance" className="back-link">← Finance</Link>
      <header className="page-head">
        <h1>Portefeuille virtuel</h1>
        <p className="muted">Simulation saisie à la main, rien n'est relié à tes comptes.</p>
      </header>

      <section className="card">
        <div className="filters">
          {portfolios.map((p) => (
            <button
              key={p.id}
              type="button"
              className={p.id === current?.id ? 'chip active' : 'chip'}
              aria-pressed={p.id === current?.id}
              onClick={() => setSelectedId(p.id as number)}
            >
              {p.name}
            </button>
          ))}
        </div>
        <form className="task-form" onSubmit={createPortfolio}>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nouveau portefeuille"
            aria-label="Nouveau portefeuille"
          />
          <button type="submit" className="btn">Créer</button>
        </form>
      </section>

      {current && (
        <>
          <section className="card">
            <h2>Résumé · {current.name}</h2>
            <div className="summary">
              <div><span className="muted">Investi</span><strong>{eur(invested)}</strong></div>
              <div><span className="muted">Valeur</span><strong>{eur(value)}</strong></div>
              <div>
                <span className="muted">Plus ou moins-value</span>
                <strong className={gain >= 0 ? 'gain' : 'loss'}>
                  {eur(gain)} ({gainPct.toFixed(1)} %)
                </strong>
              </div>
            </div>
          </section>

          <section className="card">
            <h2>Ajouter une position</h2>
            <form className="add-form" onSubmit={addPosition}>
              <input value={pName} onChange={(e) => setPName(e.target.value)} placeholder="Actif (ex. MSCI World)" aria-label="Actif" required />
              <div className="two-cols">
                <input value={pQty} onChange={(e) => setPQty(e.target.value)} placeholder="Quantité" inputMode="decimal" aria-label="Quantité" required />
                <input value={pBuy} onChange={(e) => setPBuy(e.target.value)} placeholder="Prix d'achat (€)" inputMode="decimal" aria-label="Prix d'achat" required />
              </div>
              <button type="submit" className="btn">Ajouter</button>
            </form>
          </section>

          <section className="card">
            <h2>Positions</h2>
            {positions.length === 0 ? (
              <p className="muted">Aucune position pour l'instant.</p>
            ) : (
              <ul className="plain-list">
                {positions.map((p) => {
                  const pl = (p.currentPrice - p.buyPrice) * p.quantity
                  return (
                    <li key={p.id} className="position">
                      <div className="position-head">
                        <strong>{p.name}</strong>
                        <button type="button" className="link-btn small-link" onClick={() => removePosition(p)}>Supprimer</button>
                      </div>
                      <span className="muted small-text">
                        {p.quantity} × {eur(p.buyPrice)} acheté · valeur {eur(p.quantity * p.currentPrice)}
                        {' '}· <span className={pl >= 0 ? 'gain' : 'loss'}>{eur(pl)}</span>
                      </span>
                      <label className="small-text">
                        Cours actuel (€)
                        <input
                          key={p.currentPrice}
                          defaultValue={String(p.currentPrice)}
                          inputMode="decimal"
                          onBlur={(e) => setCurrentPrice(p, e.target.value)}
                          aria-label={`Cours actuel de ${p.name}`}
                        />
                      </label>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}
