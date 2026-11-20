import type { Ranked } from '../../scores/logic'

const MEDALS = ['🥇', '🥈', '🥉']

// Podium des trois premières places (2e à gauche, 1er au centre, 3e à droite),
// puis la suite du classement.
export default function Podium({ ranked }: { ranked: Ranked[] }) {
  const top = ranked.slice(0, 3)
  const order = [top[1], top[0], top[2]].filter(Boolean) as Ranked[]
  const rest = ranked.slice(3)

  return (
    <section className="card podium-card" aria-label="Podium">
      <ol className="podium">
        {order.map((r) => (
          <li key={r.name} className={`podium-step place-${Math.min(r.rank, 3)}`}>
            <span className="podium-medal" aria-hidden="true">{MEDALS[Math.min(r.rank, 3) - 1]}</span>
            <strong className="podium-name">{r.name}</strong>
            <span className="podium-score">{r.total} pts</span>
            <span className="podium-block">{r.rank}</span>
          </li>
        ))}
      </ol>
      {rest.length > 0 && (
        <ol className="podium-rest">
          {rest.map((r) => (
            <li key={r.name}>
              <span className="muted">{r.rank}e</span>
              <span>{r.name}</span>
              <span className="muted">{r.total} pts</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
