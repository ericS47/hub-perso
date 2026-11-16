import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../../db'
import { isoDate } from '../../lib/dates'
import Sheet from '../../ui/Sheet'
import { clearSteps } from './store'

// Toutes les tables Dexie, lues au moment de l'export (aucune liste à tenir à jour).
async function exportAll(): Promise<void> {
  const tables: Record<string, unknown[]> = {}
  for (const t of db.tables) tables[t.name] = await t.toArray()
  const payload = { app: 'Mon Compagnon', exportedAt: new Date().toISOString(), dbVersion: db.verno, tables }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `mon-compagnon-${isoDate()}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

async function wipeAll(): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((t) => t.clear()))
  })
  clearSteps()
}

export default function MyData() {
  const navigate = useNavigate()
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  return (
    <section className="profil-data" aria-labelledby="profil-data-title">
      <h2 id="profil-data-title">Mes données</h2>
      <p className="muted">Tout est enregistré uniquement sur ce téléphone. Tu peux en garder une copie ou tout effacer.</p>
      <div className="stack">
        <button
          type="button"
          className="btn btn-secondary btn-block"
          onClick={() => {
            void exportAll().then(() => setMsg('Fichier préparé : regarde dans tes téléchargements.'))
          }}
        >
          ⬇️ Exporter toutes mes données (fichier JSON)
        </button>
        <button type="button" className="btn btn-ghost btn-block profil-danger-text" onClick={() => setConfirm(true)}>
          🗑️ Tout effacer
        </button>
      </div>
      {msg && (
        <p className="profil-hint" role="status">
          {msg}
        </p>
      )}
      {confirm && (
        <Sheet title="Tout effacer ?" onClose={() => setConfirm(false)}>
          <p>
            Cela supprime <strong>toutes</strong> les données de l’appli sur ce téléphone : profil, agenda, séances, journal,
            moral, jeux et réglages du compagnon.
          </p>
          <p>
            <strong>C’est définitif</strong> : rien n’est sauvegardé ailleurs. Si tu veux garder une copie, exporte d’abord tes
            données.
          </p>
          <div className="btn-row">
            <button type="button" className="btn btn-secondary" onClick={() => setConfirm(false)}>
              Annuler
            </button>
            <button
              type="button"
              className="btn btn-danger"
              disabled={busy}
              onClick={async () => {
                setBusy(true)
                await wipeAll()
                setBusy(false)
                setConfirm(false)
                navigate('/', { replace: true })
              }}
            >
              Oui, tout effacer
            </button>
          </div>
        </Sheet>
      )}
    </section>
  )
}
