import { Link } from 'react-router-dom'
import { findPro, proName } from './pros'
import { REQUESTS_KEY, useLocal, type ContactRequest } from './storage'

// Liste « Mes demandes » (toutes, ou celles d'un professionnel).
export default function Demandes({ proId }: { proId?: string }) {
  const [requests, setRequests] = useLocal<ContactRequest[]>(REQUESTS_KEY, [])
  const list = requests.filter((r) => !proId || r.proId === proId).sort((a, b) => b.createdAt - a.createdAt)
  if (list.length === 0) return null

  return (
    <section aria-labelledby="plus-demandes" className="plus-demandes">
      <h2 id="plus-demandes" className="plus-section-title">Mes demandes</h2>
      {list.map((r) => {
        const pro = findPro(r.proId)
        return (
          <article key={r.id} className="card">
            <div className="row-between">
              <strong>{pro ? (proId ? 'Demande de contact' : <Link to={`/plus/pros/${pro.id}`}>{proName(pro)}</Link>) : 'Demande'}</strong>
              <span className="muted">{new Date(r.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
            </div>
            {r.motifs.length > 0 && <p className="plus-demande-motifs">{r.motifs.join(' · ')}</p>}
            {r.texte && <p className="muted">« {r.texte} »</p>}
            {r.creneau && <p className="muted">Préférence : {r.creneau}</p>}
            <p className="plus-status">
              <span aria-hidden="true">📱</span> Enregistrée sur ton téléphone — l’envoi à l’équipe arrivera bientôt
            </p>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setRequests(requests.filter((x) => x.id !== r.id))}
            >
              Supprimer cette demande
            </button>
          </article>
        )
      })}
    </section>
  )
}
