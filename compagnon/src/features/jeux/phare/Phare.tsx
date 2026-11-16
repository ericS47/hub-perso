import { useReducer, useState } from 'react'
import PageShell from '../../../ui/PageShell'
import CarteExercice from '../CarteExercice'
import FinPartie from '../FinPartie'
import Preparation from '../Preparation'
import { CATEGORIES, type Exercice, type Reglages } from '../exercices'
import { useSeance } from '../useSeance'
import { DISTANCE, ETAPES, SORTES, creerPaquetPhare, etapeAtteinte, etatInitialPhare, phareReducer } from './logique'

// Point du sentier pour un nombre de pas donné (courbe douce qui monte vers le phare).
function point(pas: number) {
  const t = pas / DISTANCE
  return { x: 26 + t * 262, y: 158 - t * 104 + Math.sin(t * Math.PI * 3) * 20 }
}

// Petit phare rayé dessiné à la main (pied du phare en x, y).
function Phare3({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} className="jeux-phare-tour">
      <path d="M-14 -34 L14 -34" stroke="#f2b84b" strokeWidth={3} strokeLinecap="round" className="jeux-phare-feu" />
      <path d="M-8 0 L-5 -26 H5 L8 0 Z" fill="#fff" stroke="#b8443b" strokeWidth={1.5} />
      <path d="M-7.2 -7 H7.2 L6.6 -12 H-6.6 Z M-6 -17 H6 L5.6 -21 H-5.6 Z" fill="#b8443b" />
      <rect x={-5} y={-33} width={10} height={7} rx={1.5} fill="#f2b84b" stroke="#22302f" strokeWidth={1.2} />
      <path d="M-6 -33 L0 -38 L6 -33 Z" fill="#b8443b" />
    </g>
  )
}

function Sentier({ pas }: { pas: number }) {
  const pts = Array.from({ length: DISTANCE + 1 }, (_, i) => point(i))
  const ici = point(pas)
  return (
    <svg viewBox="0 0 320 190" className="jeux-phare-sentier" role="img" aria-label={`Tu as fait ${pas} pas sur ${DISTANCE}.`}>
      <path d="M150 190 Q 230 160 320 112 V190 Z" fill="#cfe1ee" />
      <path d="M200 176 q8 -4 16 0 t16 0 M250 150 q8 -4 16 0 t16 0" stroke="#fff" strokeWidth={2} fill="none" opacity={0.8} />
      <polyline points={pts.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#e7dccb" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
      <polyline
        points={pts.slice(0, pas + 1).map((p) => `${p.x},${p.y}`).join(' ')}
        fill="none"
        stroke="#f2b84b"
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2.5} fill={i <= pas ? '#c98a14' : '#bfb29c'} />
      ))}
      {ETAPES.map((e) => {
        const p = point(e.pas)
        if (e.pas === DISTANCE) return <Phare3 key={e.pas} x={p.x} y={p.y - 6} />
        return (
          <text key={e.pas} x={p.x} y={p.y - 12} fontSize={18} textAnchor="middle">
            {e.emoji}
          </text>
        )
      })}
      <g className="jeux-pion" style={{ transform: `translate(${ici.x}px, ${ici.y}px)` }}>
        <circle r={11} fill="#1f6f6b" stroke="#fff" strokeWidth={3} />
        <text y={4.5} fontSize={12} textAnchor="middle" fill="#fff">
          ★
        </text>
      </g>
    </svg>
  )
}

function Partie({ reglages, onRejouer }: { reglages: Reglages; onRejouer: () => void }) {
  const [e, dispatch] = useReducer(phareReducer, null, () => etatInitialPhare(creerPaquetPhare()))
  const seance = useSeance(reglages)
  const [exo, setExo] = useState<Exercice | null>(null)
  // On laisse la carte se révéler un instant avant d'ouvrir l'exercice.
  const [revele, setRevele] = useState(false)
  const etape = etapeAtteinte(e.pas)

  if (e.phase === 'fin') {
    return (
      <FinPartie jeu="cap-au-phare" nomJeu="Cap au phare" suivi={seance.suivi} detente={reglages.detente} onRejouer={onRejouer}>
        <p className="jeux-fin-sous">🌊 Tu as atteint le phare en {e.tirages} cartes. Quelle balade !</p>
      </FinPartie>
    )
  }

  function piocher() {
    const c = e.pioche[0]
    dispatch({ type: 'piocher' })
    setExo(c ? seance.tirer(c.categorie) : null)
    setRevele(false)
    window.setTimeout(() => setRevele(true), 900)
  }

  function avancer(fait: boolean | null) {
    if (exo && fait !== null) (fait ? seance.fait : seance.passe)(exo)
    setExo(null)
    dispatch({ type: 'avancer' })
  }

  const carte = e.carte
  const sorte = carte ? SORTES[carte.sorte] : null

  return (
    <div className="jeux-phare">
      <Sentier pas={e.pas} />
      <p className="jeux-phare-ou">
        <strong>
          {etape.emoji} {etape.nom}
        </strong>{' '}
        · {e.pas} / {DISTANCE} pas
      </p>

      <div className="jeux-phare-table">
        <button
          type="button"
          className="jeux-phare-pioche"
          onClick={piocher}
          disabled={e.phase !== 'piocher'}
          aria-label={`Piocher une carte (${e.pioche.length} restantes)`}
        >
          <span aria-hidden="true">🧭</span>
          <small>{e.phase === 'piocher' ? 'Pioche !' : `${e.pioche.length} cartes`}</small>
        </button>
        {carte && sorte ? (
          <div className={`jeux-phare-carte ${carte.sorte}`} key={carte.id}>
            <span className="jeux-phare-carte-emoji" aria-hidden="true">
              {sorte.emoji}
            </span>
            <strong>{sorte.nom}</strong>
            <span className="jeux-phare-carte-pas">+{carte.pas} pas</span>
            <span className="jeux-phare-carte-cat">
              {CATEGORIES[carte.categorie].emoji} {CATEGORIES[carte.categorie].label}
            </span>
          </div>
        ) : (
          <div className="jeux-phare-carte vide" aria-hidden="true">
            <span>Touche la pioche</span>
          </div>
        )}
      </div>

      {carte && sorte && !exo && (
        <div className="card jeux-phare-action">
          <p>{sorte.texte}</p>
          <button type="button" className="btn btn-block" onClick={() => avancer(null)} autoFocus>
            Avancer de {carte.pas} pas
          </button>
        </div>
      )}

      {carte && sorte && exo && revele && (
        <CarteExercice
          exercice={exo}
          contexte={
            <strong>
              {sorte.emoji} Carte {sorte.nom} · +{carte.pas} pas
            </strong>
          }
          onFait={() => avancer(true)}
          onPasse={() => avancer(false)}
        />
      )}
    </div>
  )
}

export default function Phare() {
  const [partie, setPartie] = useState<{ reglages: Reglages; cle: number } | null>(null)
  return (
    <PageShell title="Cap au phare" subtitle="Une balade en cartes jusqu’au bord de mer" backTo="/jeux">
      {partie ? (
        <Partie key={partie.cle} reglages={partie.reglages} onRejouer={() => setPartie(null)} />
      ) : (
        <Preparation
          regles={
            <ol>
              <li>Pioche une carte à chaque tour.</li>
              <li>Fais le mouvement qu’elle propose (ou passe, sans pénalité), puis avance d’autant de pas.</li>
              <li>Les cartes Élan ⚡ font filer, les cartes Pause 🍃 et Belle vue 🌅 invitent à souffler.</li>
              <li>Atteins le phare au bord de la mer, au bout de {DISTANCE} pas pour finir la balade !</li>
            </ol>
          }
          onStart={(r) => setPartie({ reglages: r, cle: Date.now() })}
        />
      )}
    </PageShell>
  )
}
