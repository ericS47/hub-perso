import { useState, type ReactNode } from 'react'
import Chips from '../../ui/Chips'
import { NIVEAUX, ZONES, filtrerExercices, type Niveau, type Reglages, type Zone } from './exercices'
import { ecrireReglages, lireReglages } from './prefs'

interface Props {
  // Options propres au jeu (taille de grille, joueurs…), affichées avant les réglages communs.
  children?: ReactNode
  regles: ReactNode
  onStart: (r: Reglages) => void
  boutonLabel?: string
  startDisabled?: boolean
}

// Écran commun avant chaque partie : niveau, zones à ménager, mode détente, rappel de sécurité.
export default function Preparation({ children, regles, onStart, boutonLabel = 'C’est parti !', startDisabled }: Props) {
  const [r, setR] = useState<Reglages>(lireReglages)
  const nb = filtrerExercices(r).length
  const niveau = NIVEAUX.find((n) => n.value === r.niveau)

  const toggleZone = (z: Zone) =>
    setR((prev) => ({ ...prev, zones: prev.zones.includes(z) ? prev.zones.filter((x) => x !== z) : [...prev.zones, z] }))

  return (
    <div className="jeux-prep">
      <details className="card jeux-regles" open>
        <summary>Comment on joue ?</summary>
        <div className="jeux-regles-corps">{regles}</div>
      </details>

      {children}

      <section className="card">
        <h2>Ta séance</h2>
        <label className="jeux-switch">
          <input
            type="checkbox"
            checked={r.detente}
            onChange={(e) => setR({ ...r, detente: e.target.checked })}
          />
          <span>
            <strong>Mode détente</strong>
            <span className="muted"> — jouer juste pour le plaisir, sans exercice</span>
          </span>
        </label>

        {!r.detente && (
          <>
            <Chips<Niveau>
              label="Comment veux-tu bouger ?"
              options={NIVEAUX.map((n) => ({ value: n.value, label: n.label }))}
              value={r.niveau}
              onChange={(v) => setR({ ...r, niveau: v })}
            />
            {niveau && <p className="muted jeux-niveau-detail">{niveau.detail}</p>}
            <Chips<Zone>
              label="Des zones à ménager aujourd’hui ?"
              options={ZONES}
              value={r.zones}
              onChange={toggleZone}
            />
            <p className="muted">
              {r.zones.length === 0
                ? 'Aucune zone à ménager : tous les exercices du niveau sont possibles.'
                : `On écarte les mouvements qui sollicitent ces zones (${nb} exercices restent possibles).`}
            </p>
          </>
        )}
      </section>

      {!r.detente && (
        <aside className="jeux-securite" aria-label="Rappel de sécurité">
          <span aria-hidden="true">🛟</span>
          <p>
            Arrête-toi en cas de douleur, de vertige ou d’essoufflement inhabituel. Garde un verre d’eau à portée de
            main, et une chaise stable près de toi. Passer un exercice, c’est toujours permis.
          </p>
        </aside>
      )}

      <button
        type="button"
        className="btn btn-block jeux-go"
        disabled={startDisabled}
        onClick={() => {
          ecrireReglages(r)
          onStart(r)
        }}
      >
        {boutonLabel}
      </button>
    </div>
  )
}
