import Sheet from './Sheet'

interface Props {
  // LEGO : numéro du set (75192) ; puzzles : code-barres. À défaut, le titre.
  reference?: string
  title: string
  lego: boolean
  // Jeux de société : ajoute les boutiques spécialisées (Philibert, Ludum).
  boardgame?: boolean
  onClose: () => void
  // Page Promo : propose d'ajouter le produit aux prix suivis.
  onFollow?: () => void
}

interface Site {
  name: string
  url: (q: string, ref: string) => string
  // Site propre aux LEGO (masqué pour les autres produits).
  lego?: boolean
  // Boutique spécialisée en jeux de société (masquée pour les autres produits).
  boardgame?: boolean
  // Annonces de particuliers : on y cherche par nom, jamais par code-barres.
  byName?: boolean
}

const e = encodeURIComponent

// Pages de recherche des sites, déjà réglées sur le set : les sites marchands
// interdisent la lecture automatique de leurs prix, on y va donc d'un toucher.
const GROUPS: { title: string; hint: string; sites: Site[] }[] = [
  {
    title: '🔎 Comparateurs',
    hint: 'Le plus large : Google Shopping regroupe le plus de boutiques',
    sites: [
      { name: 'Google Shopping', url: (q) => `https://www.google.com/search?tbm=shop&q=${e(q)}` },
      { name: 'Idealo', url: (q) => `https://www.idealo.fr/prechcat.html?q=${e(q)}` },
      { name: 'Le Dénicheur', url: (q) => `https://ledenicheur.fr/search?search=${e(q)}` },
    ],
  },
  {
    title: '🛒 Boutiques',
    hint: 'Les grandes enseignes (LEGO.com donne le prix officiel des sets)',
    sites: [
      { name: 'LEGO.com', url: (_q, ref) => `https://www.lego.com/fr-fr/search?q=${e(ref)}`, lego: true },
      {
        name: 'Philibert',
        url: (q) => `https://www.philibertnet.com/fr/recherche?search_query=${e(q)}`,
        boardgame: true,
        byName: true,
      },
      {
        name: 'Ludum',
        url: (q) => `https://www.ludum.fr/recherche?controller=search&s=${e(q)}`,
        boardgame: true,
        byName: true,
      },
      { name: 'Amazon', url: (q) => `https://www.amazon.fr/s?k=${e(q)}` },
      { name: 'Fnac', url: (q) => `https://www.fnac.com/SearchResult/ResultList.aspx?Search=${e(q)}` },
      { name: 'Cdiscount', url: (q) => `https://www.cdiscount.com/search/10/${e(q.toLowerCase()).replace(/%20/g, '+')}.html` },
      { name: 'Carrefour', url: (q) => `https://www.carrefour.fr/s?q=${e(q)}` },
      { name: 'Auchan', url: (q) => `https://www.auchan.fr/recherche?text=${e(q)}` },
      { name: 'E.Leclerc', url: (q) => `https://www.e.leclerc/recherche?q=${e(q)}` },
      { name: 'Smyths Toys', url: (q) => `https://www.smythstoys.com/fr/fr-fr/search/?text=${e(q)}` },
      { name: 'Rakuten', url: (q) => `https://fr.shopping.rakuten.com/search/${e(q)}` },
    ],
  },
  {
    title: '🔥 Bons plans',
    hint: 'Promos signalées par la communauté',
    sites: [{ name: 'Dealabs', url: (q) => `https://www.dealabs.com/search?q=${e(q)}`, byName: true }],
  },
  {
    title: '♻️ Occasion',
    hint: 'Souvent moins cher, et seul moyen pour les produits retirés',
    sites: [
      { name: 'Leboncoin', url: (q) => `https://www.leboncoin.fr/recherche?text=${e(q)}`, byName: true },
      { name: 'Vinted', url: (q) => `https://www.vinted.fr/catalog?search_text=${e(q)}`, byName: true },
      { name: 'eBay', url: (q) => `https://www.ebay.fr/sch/i.html?_nkw=${e(q)}`, byName: true },
      {
        name: 'BrickLink',
        url: (q, ref) =>
          /^\d/.test(ref)
            ? `https://www.bricklink.com/v2/catalog/catalogitem.page?S=${e(ref.includes('-') ? ref : `${ref}-1`)}`
            : `https://www.bricklink.com/v2/search.page?q=${e(q)}`,
        lego: true,
      },
    ],
  },
  {
    title: '📈 Cote du set',
    hint: 'Valeur actuelle et évolution, utile pour les sets retirés',
    sites: [{ name: 'BrickEconomy', url: (_q, ref) => `https://www.brickeconomy.com/search?query=${e(ref)}`, lego: true }],
  },
]

export default function PriceSheet({ reference, title, lego, boardgame = false, onClose, onFollow }: Props) {
  const ref = (lego ? reference?.replace(/-1$/, '') : reference) || title
  // Code-barres : reconnu tel quel par la plupart des boutiques et comparateurs.
  // Jeux de société sans code-barres : « jeu de société » évite les livres ou
  // films du même nom dans les grandes boutiques.
  const query = reference ? (lego ? `LEGO ${ref}` : ref) : boardgame ? `${title} jeu de société` : title
  const groups = GROUPS.map((g) => ({
    ...g,
    hint: boardgame && g.title.startsWith('🛒') ? 'Les boutiques spécialisées en jeux (Philibert, Ludum) et les grandes enseignes' : g.hint,
    sites: g.sites.filter((s) => (lego || !s.lego) && (boardgame || !s.boardgame)),
  })).filter((g) => g.sites.length)

  return (
    <Sheet title="💶 Comparer les prix" onClose={onClose}>
      <p className="muted small-text sheet-sub">
        Recherche : <strong>{query}</strong> · chaque site s'ouvre dans un nouvel onglet
      </p>
      {groups.map((g) => (
        <section key={g.title} className="price-group">
          <h3>{g.title}</h3>
          <p className="muted small-text">{g.hint}</p>
          <div className="price-links">
            {g.sites.map((s) => (
              <a key={s.name} href={s.url(s.byName && !lego ? title : query, ref)} target="_blank" rel="noopener noreferrer" className="chip">
                {s.name} ↗
              </a>
            ))}
          </div>
        </section>
      ))}
      {onFollow && (
        <div className="form-actions">
          <button type="button" className="btn" onClick={onFollow}>
            ⭐ Suivre le prix de ce produit
          </button>
        </div>
      )}
    </Sheet>
  )
}
