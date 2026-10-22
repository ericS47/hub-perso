import PageShell from '../components/PageShell'

// Recherches sauvegardées : une par type de poste recherché.
const SEARCHES = ['Enseignant en APA', 'Chef de projet en santé', 'Promotion à la santé']

export default function Emploi() {
  return (
    <PageShell title="Emploi" subtitle="Offres dans les départements 31, 40, 47, 81 et 82">
      <section className="card">
        <h2>Mes recherches</h2>
        <ul className="plain-list">
          {SEARCHES.map((s) => (
            <li key={s} className="search-item">
              <span>{s}</span>
              <span className="muted small-text">0 nouvelle</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Historique</h2>
        <p className="muted">Aucune offre enregistrée pour l'instant.</p>
      </section>
    </PageShell>
  )
}
