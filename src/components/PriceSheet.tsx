import Sheet from './Sheet'

interface Props {
  // Numéro du set (75192) ; à défaut, le titre sert de recherche.
  reference?: string
  title: string
  onClose: () => void
}

interface Site {
  name: string
  url: (q: string, ref: string) => string
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
    hint: 'LEGO.com donne le prix officiel',
    sites: [
      { name: 'LEGO.com', url: (_q, ref) => `https://www.lego.com/fr-fr/search?q=${e(ref)}` },
      { name: 'Amazon', url: (q) => `https://www.amazon.fr/s?k=${e(q)}` },
      { name: 'Fnac', url: (q) => `https://www.fnac.com/SearchResult/ResultList.aspx?Search=${e(q)}` },
      { name: 'Cdiscount', url: (q) => `https://www.cdiscount.com/search/10/${e(q.toLowerCase()).replace(/%20/g, '+')}.html` },
      { name: 'Carrefour', url: (q) => `https://www.carrefour.fr/s?q=${e(q)}` },
      { name: 'Auchan', url: (q) => `https://www.auchan.fr/recherche?text=${e(q)}` },
      { name: 'E.Leclerc', url: (q) => `https://www.e.leclerc/recherche?q=${e(q)}` },
      { name: 'Smyths Toys', url: (_q, ref) => `https://www.smythstoys.com/fr/fr-fr/search/?text=${e(ref)}` },
      { name: 'Rakuten', url: (q) => `https://fr.shopping.rakuten.com/search/${e(q)}` },
    ],
  },
  {
    title: '🔥 Bons plans',
    hint: 'Promos signalées par la communauté',
    sites: [{ name: 'Dealabs', url: (q) => `https://www.dealabs.com/search?q=${e(q)}` }],
  },
  {
    title: '♻️ Occasion',
    hint: 'Souvent moins cher, et seul moyen pour les sets retirés',
    sites: [
      { name: 'Leboncoin', url: (q) => `https://www.leboncoin.fr/recherche?text=${e(q)}` },
      { name: 'Vinted', url: (q) => `https://www.vinted.fr/catalog?search_text=${e(q)}` },
      { name: 'eBay', url: (q) => `https://www.ebay.fr/sch/i.html?_nkw=${e(q)}` },
      {
        name: 'BrickLink',
        url: (q, ref) =>
          /^\d/.test(ref)
            ? `https://www.bricklink.com/v2/catalog/catalogitem.page?S=${e(ref.includes('-') ? ref : `${ref}-1`)}`
            : `https://www.bricklink.com/v2/search.page?q=${e(q)}`,
      },
    ],
  },
  {
    title: '📈 Cote du set',
    hint: 'Valeur actuelle et évolution, utile pour les sets retirés',
    sites: [{ name: 'BrickEconomy', url: (_q, ref) => `https://www.brickeconomy.com/search?query=${e(ref)}` }],
  },
]

export default function PriceSheet({ reference, title, onClose }: Props) {
  const ref = reference?.replace(/-1$/, '') || title
  const query = reference ? `LEGO ${ref}` : title

  return (
    <Sheet title="💶 Comparer les prix" onClose={onClose}>
      <p className="muted small-text sheet-sub">
        Recherche : <strong>{query}</strong> · chaque site s'ouvre dans un nouvel onglet
      </p>
      {GROUPS.map((g) => (
        <section key={g.title} className="price-group">
          <h3>{g.title}</h3>
          <p className="muted small-text">{g.hint}</p>
          <div className="price-links">
            {g.sites.map((s) => (
              <a key={s.name} href={s.url(query, ref)} target="_blank" rel="noopener noreferrer" className="chip">
                {s.name} ↗
              </a>
            ))}
          </div>
        </section>
      ))}
    </Sheet>
  )
}
