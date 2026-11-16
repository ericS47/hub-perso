import { useEffect, useRef, useState, type ReactNode } from 'react'
import Figure from './Figure'
import { CATEGORIES, libelleQuantite, type Exercice } from './exercices'

interface Props {
  exercice: Exercice
  // Ce qui a déclenché l'exercice (« Case 14 », « Paire trouvée ! »…).
  contexte?: ReactNode
  // Prénom de la personne qui fait l'exercice (parties à plusieurs).
  joueur?: string
  onFait: () => void
  onPasse: () => void
}

function vibrer() {
  try {
    navigator.vibrate?.(200)
  } catch {
    // pas de vibration : rien de grave
  }
}

function Minuteur({ total, parCote, couleur }: { total: number; parCote?: boolean; couleur: string }) {
  const [restant, setRestant] = useState(total)
  const [enCours, setEnCours] = useState(false)

  useEffect(() => {
    if (!enCours) return
    const id = window.setInterval(() => setRestant((r) => Math.max(0, r - 1)), 1000)
    return () => window.clearInterval(id)
  }, [enCours])

  const fini = restant === 0
  useEffect(() => {
    if (fini) vibrer()
  }, [fini])
  const mi = parCote && restant <= total / 2 && !fini
  const ratio = restant / total
  const C = 2 * Math.PI * 44
  return (
    <div className="jeux-compteur">
      <svg viewBox="0 0 100 100" width={128} height={128} aria-hidden="true">
        <circle cx={50} cy={50} r={44} fill="none" stroke="var(--surface-2)" strokeWidth={8} />
        <circle
          cx={50}
          cy={50}
          r={44}
          fill="none"
          stroke={couleur}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - ratio)}
          transform="rotate(-90 50 50)"
          className="jeux-anneau"
        />
      </svg>
      <div className="jeux-compteur-val" aria-live="polite">
        {fini ? 'Bravo !' : `${restant} s`}
      </div>
      {mi && <p className="jeux-compteur-note">Change de côté</p>}
      {!fini && (
        <button type="button" className="btn btn-secondary jeux-btn-minuteur" onClick={() => setEnCours((v) => !v)}>
          {enCours ? '⏸ Pause' : restant === total ? '▶ Lancer le minuteur' : '▶ Reprendre'}
        </button>
      )}
    </div>
  )
}

function CompteurReps({ total, parCote, couleur }: { total: number; parCote?: boolean; couleur: string }) {
  const [n, setN] = useState(0)
  const fini = n >= total
  return (
    <div className="jeux-compteur">
      <button
        type="button"
        className="jeux-tap"
        style={{ borderColor: couleur, color: couleur }}
        onClick={() => setN((v) => Math.min(total, v + 1))}
        aria-label={`Compter une répétition (${n} sur ${total})`}
      >
        <span className="jeux-tap-n">{fini ? '✓' : n}</span>
        <span className="jeux-tap-sur">sur {total}</span>
      </button>
      <p className="jeux-compteur-note">
        {fini ? 'Bravo !' : parCote && n >= total / 2 ? 'Change de côté' : 'Touche le rond à chaque mouvement (facultatif)'}
      </p>
    </div>
  )
}

// Carte plein écran commune à tous les jeux : consigne, illustration, minuteur ou compteur.
export default function CarteExercice({ exercice, contexte, joueur, onFait, onPasse }: Props) {
  const cat = CATEGORIES[exercice.categorie]
  const titreRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => titreRef.current?.focus(), [exercice.id])

  return (
    <div className="jeux-overlay" role="dialog" aria-modal="true" aria-labelledby="jeux-ex-titre">
      <div className="jeux-carte-ex">
        {contexte && <div className="jeux-carte-contexte">{contexte}</div>}
        <div className="jeux-carte-tete" style={{ background: cat.fond }}>
          <Figure pose={exercice.pose} couleur={cat.couleur} size={150} />
          <span className="jeux-cat" style={{ color: cat.couleur }}>
            {cat.emoji} {cat.label}
          </span>
        </div>
        <div className="jeux-carte-corps">
          {joueur && <p className="jeux-carte-joueur">À toi, {joueur} !</p>}
          <h2 id="jeux-ex-titre" ref={titreRef} tabIndex={-1}>
            {exercice.nom}
          </h2>
          <p className="jeux-consigne">{exercice.consigne}</p>
          <p className="jeux-quantite">{libelleQuantite(exercice)}</p>
          {exercice.duree ? (
            <Minuteur
              key={exercice.id}
              total={exercice.duree * (exercice.parCote ? 2 : 1)}
              parCote={exercice.parCote}
              couleur={cat.couleur}
            />
          ) : (
            <CompteurReps
              key={exercice.id}
              total={(exercice.reps ?? 6) * (exercice.parCote ? 2 : 1)}
              parCote={exercice.parCote}
              couleur={cat.couleur}
            />
          )}
          <div className="jeux-carte-actions">
            <button type="button" className="btn jeux-btn-fait" onClick={onFait}>
              Fait !
            </button>
            <button type="button" className="btn btn-secondary" onClick={onPasse}>
              Je passe
            </button>
          </div>
          <p className="muted jeux-carte-pied">Va à ton rythme. Passer ne fait rien perdre au jeu.</p>
        </div>
      </div>
    </div>
  )
}
