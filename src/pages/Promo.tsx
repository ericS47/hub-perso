import PageShell from '../components/PageShell'

// Limite de favoris, en option : la liste reste facultative.
const MAX_FAVORITES = 6

export default function Promo() {
  return (
    <PageShell title="Promo" subtitle="Compare les prix et trouve le moins cher">
      <section className="card">
        <form className="task-form" onSubmit={(e) => e.preventDefault()}>
          <input placeholder="Rechercher un produit" aria-label="Rechercher un produit" />
          <button type="submit" className="btn" aria-label="Lancer la recherche">⌕</button>
        </form>
        <p className="muted small-text">Le comparatif affichera les prix du moins cher au plus cher.</p>
      </section>

      <section className="card">
        <h2>Favoris (0/{MAX_FAVORITES})</h2>
        <p className="muted">Aucun favori pour l'instant.</p>
      </section>
    </PageShell>
  )
}
