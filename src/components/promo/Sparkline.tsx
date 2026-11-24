// Évolution des prix notés d'un produit : une seule courbe, sans légende
// (la carte la nomme), le dernier point marqué, l'objectif en pointillés.
export default function Sparkline({ prices, target }: { prices: number[]; target?: number }) {
  if (prices.length < 2) return null
  const W = 120
  const H = 36
  const all = target ? [...prices, target] : prices
  const min = Math.min(...all)
  const max = Math.max(...all)
  const x = (i: number) => 4 + (i / (prices.length - 1)) * (W - 8)
  const y = (v: number) => 4 + (1 - (v - min) / (max - min || 1)) * (H - 8)
  const last = prices.length - 1

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="sparkline" role="img" aria-label={`Évolution du prix sur ${prices.length} relevés`}>
      {target !== undefined && <line x1={4} x2={W - 4} y1={y(target)} y2={y(target)} className="spark-target" />}
      <polyline
        points={prices.map((p, i) => `${x(i)},${y(p)}`).join(' ')}
        fill="none"
        className="spark-line"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={x(last)} cy={y(prices[last])} r={4} className="spark-dot" />
    </svg>
  )
}
