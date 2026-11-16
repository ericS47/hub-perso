import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageShell from '../../ui/PageShell'
import Sheet from '../../ui/Sheet'
import Chips from '../../ui/Chips'
import ProAvatar from './ProAvatar'
import Demandes from './Demandes'
import { findPro, proName, proRole, type Pro } from './pros'
import { findSeance } from './seances'
import { REQUESTS_KEY, useLocal, type ContactRequest } from './storage'

const MOTIFS = ['Une question', 'Un conseil', 'Un rendez-vous', 'Un moment difficile', 'Faire le point']
const CRENEAUX = ['Le matin', 'Le midi', 'L’après-midi', 'En soirée', 'Peu importe']

function messageText(pro: Pro, motifs: string[], texte: string, creneau: string): string {
  const lines = [`Bonjour ${pro.prenom || ''},`.replace(' ,', ','), '']
  lines.push(`Je souhaiterais être recontacté·e${motifs.length ? ` pour : ${motifs.join(', ').toLowerCase()}` : ''}.`)
  if (texte.trim()) lines.push('', texte.trim())
  if (creneau) lines.push('', `Mon moment préféré : ${creneau.toLowerCase()}.`)
  lines.push('', 'Merci !')
  return lines.join('\n')
}

function ContactSheet({ pro, onClose }: { pro: Pro; onClose: () => void }) {
  const [requests, setRequests] = useLocal<ContactRequest[]>(REQUESTS_KEY, [])
  const [motifs, setMotifs] = useState<string[]>([])
  const [texte, setTexte] = useState('')
  const [creneau, setCreneau] = useState('')
  const [done, setDone] = useState(false)
  const [shareMsg, setShareMsg] = useState('')

  const empty = motifs.length === 0 && !texte.trim()

  function save() {
    const r: ContactRequest = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      proId: pro.id,
      motifs,
      texte: texte.trim(),
      creneau,
      createdAt: Date.now(),
    }
    setRequests([...requests, r])
    setDone(true)
  }

  async function share() {
    const text = messageText(pro, motifs, texte, creneau)
    try {
      if (navigator.share) {
        await navigator.share({ text })
        setShareMsg('Message prêt : choisis l’application pour l’envoyer.')
        return
      }
    } catch (e) {
      // Partage annulé par la personne : on ne fait rien.
      if (e instanceof DOMException && e.name === 'AbortError') return
    }
    try {
      await navigator.clipboard.writeText(text)
      setShareMsg('Message copié. Tu peux le coller dans un SMS ou un e-mail.')
    } catch {
      setShareMsg('Copie impossible ici : tu peux recopier le texte ci-dessous.')
    }
  }

  if (done) {
    return (
      <Sheet title="Demande enregistrée" onClose={onClose}>
        <p className="plus-noted" role="status">✓ Ta demande est enregistrée sur ton téléphone.</p>
        <p className="muted">
          L’envoi à l’équipe arrivera bientôt. En attendant, tu peux préparer un message et l’envoyer toi-même.
        </p>
        <div className="stack">
          <button type="button" className="btn btn-secondary btn-block" onClick={() => void share()}>
            Préparer ma demande par message
          </button>
          {shareMsg && <p className="muted" role="status">{shareMsg}</p>}
          {shareMsg.startsWith('Copie impossible') && (
            <pre className="plus-message">{messageText(pro, motifs, texte, creneau)}</pre>
          )}
          <button type="button" className="btn btn-block" onClick={onClose}>Terminé</button>
        </div>
      </Sheet>
    )
  }

  return (
    <Sheet title={`Demander un contact`} onClose={onClose}>
      <p className="demo-note" role="note">
        <strong>Aperçu :</strong> la demande n’est pas encore envoyée à l’équipe, elle reste sur ton téléphone.
      </p>
      <Chips
        label="Pourquoi ?"
        options={MOTIFS.map((m) => ({ value: m, label: m }))}
        value={motifs}
        onChange={(m) => setMotifs(motifs.includes(m) ? motifs.filter((x) => x !== m) : [...motifs, m])}
      />
      <label className="field">
        <span>En quelques mots (facultatif)</span>
        <textarea value={texte} onChange={(e) => setTexte(e.target.value)} placeholder="Ce que tu aimerais aborder…" />
      </label>
      <Chips
        label="Quel moment te convient le mieux ?"
        options={CRENEAUX.map((c) => ({ value: c, label: c }))}
        value={creneau}
        onChange={(c) => setCreneau(c === creneau ? '' : c)}
      />
      <div className="stack">
        <button type="button" className="btn btn-block" disabled={empty} onClick={save}>
          Enregistrer ma demande
        </button>
        {empty && <p className="muted">Choisis au moins un motif ou écris quelques mots.</p>}
        <button type="button" className="btn btn-secondary btn-block" onClick={() => void share()}>
          Préparer ma demande par message
        </button>
        {shareMsg && <p className="muted" role="status">{shareMsg}</p>}
        {shareMsg.startsWith('Copie impossible') && (
          <pre className="plus-message">{messageText(pro, motifs, texte, creneau)}</pre>
        )}
      </div>
    </Sheet>
  )
}

export default function ProDetail() {
  const { id } = useParams()
  const pro = findPro(id)
  const [open, setOpen] = useState(false)

  if (!pro) {
    return (
      <PageShell title="Introuvable" backTo="/plus/pros">
        <p>Cette personne n’est pas dans la liste de l’équipe.</p>
      </PageShell>
    )
  }

  const name = proName(pro)
  const seances = (pro.seances ?? []).map(findSeance).filter((s) => s !== undefined)

  return (
    <PageShell title={name} subtitle={proRole(pro)} backTo="/plus/pros">
      <div className="plus-pro-hero">
        <ProAvatar pro={pro} size={72} />
      </div>

      <section className="card">
        <h2>En quoi {pro.role ? 'ce métier peut-il' : 'peut-elle'} m’aider ?</h2>
        <p>{pro.aide}</p>
      </section>

      <section className="card">
        <h2>Quand {pro.role ? 'consulter' : 'la solliciter'} ?</h2>
        <ul className="plus-checks">
          {pro.situations.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>

      {seances.length > 0 && (
        <section className="card card-soft">
          <h2>Séances en visio</h2>
          {seances.map((s) => (
            <Link key={s.id} to={`/plus/visio/${s.id}`} className="plus-inline-link">
              <span aria-hidden="true">{s.emoji}</span> {s.activite} ›
            </Link>
          ))}
        </section>
      )}

      <p className="demo-note" role="note">
        <strong>Aperçu :</strong> la mise en relation n’est pas encore active. Aucune coordonnée n’est affichée
        pour le moment.
      </p>
      <button type="button" className="btn btn-block" onClick={() => setOpen(true)}>
        Demander un contact
      </button>

      <div className="plus-gap" />
      <Demandes proId={pro.id} />

      {open && <ContactSheet pro={pro} onClose={() => setOpen(false)} />}
    </PageShell>
  )
}
