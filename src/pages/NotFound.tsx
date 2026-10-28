import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="card">
      <h1>Page introuvable</h1>
      <p className="muted">Cette adresse ne correspond à aucune page de l'application.</p>
      <Link to="/" className="back-link">← Retour à l'accueil</Link>
    </section>
  )
}
