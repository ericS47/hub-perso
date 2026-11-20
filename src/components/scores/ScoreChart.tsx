import { useState } from 'react'

// Couleurs des joueurs (palette catégorielle validée pour fond sombre),
// attribuées dans l'ordre des joueurs, jamais selon leur classement.
const PLAYER_COLORS = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#0ca30c', '#9085e9', '#e66767']

interface Props {
  players: string[]
  // series[k][p] : total du joueur p après la manche k (k = 0 : départ).
  series: number[][]
  target?: number
}

const W = 340
const H = 200

function niceTicks(min: number, max: number) {
  const span = max - min || 1
  const step = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000].find((s) => span / s <= 4) ?? Math.ceil(span / 4)
  const ticks: number[] = []
  for (let v = Math.floor(min / step) * step; v <= max + step / 2; v += step) ticks.push(v)
  return ticks
}

// Évolution des scores cumulés, manche par manche. Toucher le graphique
// affiche les scores de la manche la plus proche.
export default function ScoreChart({ players, series, target }: Props) {
  const [hover, setHover] = useState<number>()
  // Noms au bout des lignes jusqu'à 4 joueurs ; au-delà, la légende suffit.
  const direct = players.length <= 4
  const PAD = { top: 12, right: direct ? 58 : 14, bottom: 24, left: 36 }
  const rounds = series.length - 1
  const values = series.flat().concat(target ?? [], 0)
  const ticks = niceTicks(Math.min(...values), Math.max(...values))
  const yMin = ticks[0]
  const yMax = ticks[ticks.length - 1]
  const x = (k: number) => PAD.left + (rounds ? (k / rounds) * (W - PAD.left - PAD.right) : 0)
  const y = (v: number) => PAD.top + (1 - (v - yMin) / (yMax - yMin || 1)) * (H - PAD.top - PAD.bottom)
  const color = (p: number) => PLAYER_COLORS[p % PLAYER_COLORS.length]
  const everyLabel = Math.ceil(rounds / 8)

  function onPointer(e: React.PointerEvent<SVGSVGElement>) {
    const box = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - box.left) / box.width) * W
    setHover(Math.max(0, Math.min(rounds, Math.round(((px - PAD.left) / (W - PAD.left - PAD.right)) * rounds))))
  }

  // Étiquettes de fin espacées d'au moins 12 px pour ne pas se chevaucher.
  const ends = players
    .map((p, i) => ({ p, i, y: y(series[rounds][i]) }))
    .sort((a, b) => a.y - b.y)
  for (let j = 1; j < ends.length; j++) ends[j].y = Math.max(ends[j].y, ends[j - 1].y + 12)

  const tip = hover !== undefined ? players.map((p, i) => ({ p, i, v: series[hover][i] })).sort((a, b) => b.v - a.v) : []

  return (
    <section className="card chart-card" aria-label="Évolution de la partie">
      <h2 className="section-title no-margin">📈 Évolution de la partie</h2>
      <ul className="chart-legend">
        {players.map((p, i) => (
          <li key={p}>
            <span className="legend-dot" style={{ background: color(i) }} aria-hidden="true" />
            {p}
          </li>
        ))}
      </ul>
      <div className="chart-box">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="score-chart"
          role="img"
          aria-label={`Scores cumulés de ${players.join(', ')} sur ${rounds} manche(s)`}
          onPointerDown={onPointer}
          onPointerMove={onPointer}
          onPointerLeave={() => setHover(undefined)}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className={t === 0 ? 'grid zero' : 'grid'} />
              <text x={PAD.left - 6} y={y(t)} className="axis" textAnchor="end" dominantBaseline="middle">
                {t}
              </text>
            </g>
          ))}
          {series.map((_, k) =>
            k % everyLabel === 0 || k === rounds ? (
              <text key={k} x={x(k)} y={H - 6} className="axis" textAnchor="middle">
                {k === 0 ? 'Début' : k}
              </text>
            ) : null,
          )}
          {target !== undefined && target <= yMax && (
            <g>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(target)} y2={y(target)} className="target-line" />
              <text x={W - PAD.right} y={y(target) - 4} className="axis" textAnchor="end">
                objectif {target}
              </text>
            </g>
          )}
          {hover !== undefined && <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={H - PAD.bottom} className="crosshair" />}
          {players.map((p, i) => (
            <g key={p}>
              <polyline
                points={series.map((s, k) => `${x(k)},${y(s[i])}`).join(' ')}
                fill="none"
                stroke={color(i)}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {series.map((s, k) =>
                k === rounds || k === hover ? (
                  <circle key={k} cx={x(k)} cy={y(s[i])} r={4} fill={color(i)} className="dot" />
                ) : null,
              )}
            </g>
          ))}
          {direct &&
            ends.map((e) => (
              <text key={e.p} x={x(rounds) + 8} y={e.y} className="end-label" dominantBaseline="middle">
                {e.p.length > 9 ? `${e.p.slice(0, 8)}…` : e.p}
              </text>
            ))}
        </svg>
        {hover !== undefined && (
          <div className="chart-tip" style={{ left: `${(x(hover) / W) * 100}%` }} role="status">
            <strong>{hover === 0 ? 'Début' : `Manche ${hover}`}</strong>
            {tip.map((t) => (
              <span key={t.p}>
                <span className="legend-dot" style={{ background: color(t.i) }} aria-hidden="true" />
                {t.p} <b>{t.v}</b>
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
