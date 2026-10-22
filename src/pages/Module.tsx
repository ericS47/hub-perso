interface Props {
  title: string
}

// Page temporaire : chaque module sera développé dans sa phase.
export default function Module({ title }: Props) {
  return (
    <section className="card">
      <h1>{title}</h1>
      <p className="muted">Ce module sera développé dans sa phase.</p>
    </section>
  )
}
