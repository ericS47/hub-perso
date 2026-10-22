import { Link } from 'react-router-dom'
import PriceChart from '../components/PriceChart'

// MSCI World et l'or attendent leur source de données (clé API ou choix de service).
const assets = [
  { id: 'bitcoin', label: 'Bitcoin (BTC)', source: 'coingecko' as const },
  { id: 'ethereum', label: 'Ethereum (ETH)', source: 'coingecko' as const },
  { id: 'msci-world', label: 'ETF MSCI World', source: 'todo' as const },
  { id: 'gold', label: 'Or', source: 'todo' as const },
]

export default function Finance() {
  return (
    <div>
      <header className="page-head">
        <h1>Finance</h1>
        <p className="muted">Tes 4 suivis, en euros</p>
      </header>

      {assets.map((a) => (
        <section key={a.id} className="card">
          <h2>{a.label}</h2>
          {a.source === 'coingecko' ? (
            <PriceChart coinId={a.id} />
          ) : (
            <p className="muted small-text">Source de données à brancher pour cet actif.</p>
          )}
        </section>
      ))}

      <Link to="/finance/portefeuille" className="card action-card">
        <strong>Mon portefeuille virtuel</strong>
        <span className="muted">Simule tes positions sans les relier à tes comptes</span>
      </Link>
    </div>
  )
}
