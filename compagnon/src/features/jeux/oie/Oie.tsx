import { useEffect, useReducer, useRef, useState } from 'react'
import PageShell from '../../../ui/PageShell'
import Chips from '../../../ui/Chips'
import CarteExercice from '../CarteExercice'
import FinPartie from '../FinPartie'
import Joueurs from '../Joueurs'
import Preparation from '../Preparation'
import { CATEGORIES, type Exercice, type Reglages } from '../exercices'
import { ecrireNoms, nomsInitiaux, nomsPropres } from '../prefs'
import { useSeance } from '../useSeance'
import De from './De'
import {
  COULEURS_PIONS,
  INFOS_CASES,
  coordCase,
  etatInitialOie,
  oieReducer,
  type CaseOie,
  type EtatOie,
  type Longueur,
} from './logique'

const COLS = 8
const T = 40 // taille d'une case dans le repère SVG

function centre(n: number) {
  const { col, ligne } = coordCase(n, COLS)
  return { x: col * T + T / 2, y: ligne * T + T / 2 }
}

function couleurCase(c: CaseOie): string {
  if (c.type === 'exercice' && c.categorie) return CATEGORIES[c.categorie].fond
  if (c.type === 'depart' || c.type === 'arrivee') return '#f2b84b'
  if (c.type === 'oie' || c.type === 'pont') return '#cfe6c9'
  return '#f3d6c8'
}

function Plateau({ etat, etape }: { etat: EtatOie; etape: number }) {
  const { plateau, joueurs, coup, phase } = etat
  const lignes = Math.ceil(plateau.length / COLS)
  const route = plateau.map((c) => centre(c.n))
  const posAffichee = (i: number) =>
    phase === 'deplacement' && coup && coup.joueur === i ? coup.chemin[Math.min(etape, coup.chemin.length - 1)] : joueurs[i].pos
  const decalages = [
    [-8, -8],
    [8, -8],
    [-8, 8],
    [8, 8],
  ]
  return (
    <svg
      viewBox={`-2 -2 ${COLS * T + 4} ${lignes * T + 4}`}
      className="jeux-oie-plateau"
      role="img"
      aria-label={`Plateau de ${plateau.length - 1} cases. ${joueurs.map((j, i) => `${j.nom} case ${posAffichee(i)}`).join(', ')}.`}
    >
      <polyline
        points={route.map((p) => `${p.x},${p.y}`).join(' ')}
        fill="none"
        stroke="#e7dccb"
        strokeWidth={22}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {plateau.map((c) => {
        const { x, y } = centre(c.n)
        const info = INFOS_CASES[c.type]
        const special = c.type !== 'exercice'
        return (
          <g key={c.n}>
            <rect
              x={x - 17}
              y={y - 17}
              width={34}
              height={34}
              rx={9}
              fill={couleurCase(c)}
              stroke={special ? '#b58b3a' : '#d8cdb9'}
              strokeWidth={special ? 1.6 : 1}
            />
            <text x={x - 14} y={y - 7} fontSize={8.5} fontWeight={700} fill="#4a5655">
              {c.n === 0 ? '' : c.n}
            </text>
            <text x={x} y={y + (special ? 9 : 10)} fontSize={special ? 17 : 11} textAnchor="middle">
              {special ? info.emoji : c.categorie ? CATEGORIES[c.categorie].emoji : ''}
            </text>
          </g>
        )
      })}
      {joueurs.map((j, i) => {
        const { x, y } = centre(posAffichee(i))
        const [dx, dy] = joueurs.length > 1 ? decalages[i] : [0, 0]
        const actif = i === etat.tour && phase !== 'fin'
        return (
          <g key={i} className="jeux-pion" style={{ transform: `translate(${x + dx}px, ${y + dy}px)` }}>
            {actif && <circle r={11} fill="none" stroke={j.couleur} strokeWidth={2} className="jeux-pion-halo" />}
            <circle r={7.5} fill={j.couleur} stroke="#fff" strokeWidth={2.5} />
          </g>
        )
      })}
    </svg>
  )
}

function Legende() {
  const items: { e: string; t: string }[] = [
    { e: '🪿', t: 'Oie : tu avances encore d’autant' },
    { e: '🌉', t: 'Pont : raccourci' },
    { e: '⛲', t: 'Fontaine : pause eau, un tour' },
    { e: '🪣', t: 'Puits : respiration' },
    { e: '🌀', t: 'Labyrinthe : détour' },
    { e: '🪑', t: 'Banc : repos, un tour' },
    { e: '🌧️', t: 'Averse : on recule s’abriter' },
  ]
  return (
    <details className="jeux-legende">
      <summary>Les cases spéciales</summary>
      <ul>
        {items.map((i) => (
          <li key={i.e}>
            <span aria-hidden="true">{i.e}</span> {i.t}
          </li>
        ))}
        <li>Les autres cases proposent un exercice : ❤️ cardio, 💪 renfo, 🌿 souplesse, 🦩 équilibre, 🌬️ respiration.</li>
      </ul>
    </details>
  )
}

function Partie({ noms, longueur, reglages, onRejouer }: { noms: string[]; longueur: Longueur; reglages: Reglages; onRejouer: () => void }) {
  const [etat, dispatch] = useReducer(oieReducer, null, () => etatInitialOie(noms, longueur))
  const seance = useSeance(reglages)
  const [etape, setEtape] = useState(0)
  const [faceDe, setFaceDe] = useState(1)
  const [roule, setRoule] = useState(false)
  const [exo, setExo] = useState<Exercice | null>(null)
  const tirer = useRef(seance.tirer)
  useEffect(() => {
    tirer.current = seance.tirer
  }, [seance.tirer])

  const joueur = etat.joueurs[etat.tour]
  const plusieurs = etat.joueurs.length > 1

  // Animation du pion case par case, puis arrivée.
  useEffect(() => {
    if (etat.phase !== 'deplacement' || !etat.coup) return
    const coup = etat.coup
    let i = 0
    const id = window.setInterval(() => {
      i++
      if (i < coup.chemin.length) {
        setEtape(i)
        return
      }
      window.clearInterval(id)
      setExo(coup.exercice ? tirer.current(coup.exercice) : null)
      dispatch({ type: 'arrive' })
    }, 280)
    return () => window.clearInterval(id)
  }, [etat.phase, etat.coup])

  // Rien à lire ni à faire : on enchaîne directement.
  useEffect(() => {
    if (etat.phase === 'evenement' && !exo && etat.coup && etat.coup.messages.length === 0) {
      dispatch({ type: 'suivant' })
    }
  }, [etat.phase, etat.coup, exo])

  function lancer() {
    if (roule || etat.phase !== 'lancer') return
    setRoule(true)
    const valeur = 1 + Math.floor(Math.random() * 6)
    let n = 0
    const id = window.setInterval(() => {
      n++
      setFaceDe(1 + Math.floor(Math.random() * 6))
      if (n >= 7) {
        window.clearInterval(id)
        setFaceDe(valeur)
        setRoule(false)
        setEtape(0)
        dispatch({ type: 'lancer', de: valeur })
      }
    }, 85)
  }

  function finExercice(fait: boolean) {
    if (exo) (fait ? seance.fait : seance.passe)(exo)
    setExo(null)
    dispatch({ type: 'suivant' })
  }

  if (etat.phase === 'fin' && etat.gagnant !== null) {
    const classement = etat.joueurs
      .map((j, i) => ({ ...j, i }))
      .sort((a, b) => (a.i === etat.gagnant ? -1 : b.i === etat.gagnant ? 1 : b.pos - a.pos))
    return (
      <FinPartie jeu="oie" nomJeu="Jeu de l’oie" suivi={seance.suivi} detente={reglages.detente} onRejouer={onRejouer}>
        {plusieurs ? (
          <ol className="jeux-classement">
            {classement.map((j) => (
              <li key={j.i}>
                <i className="jeux-pastille" style={{ background: j.couleur }} aria-hidden="true" />
                {j.nom} {j.i === etat.gagnant ? '— arrivé(e) en premier 🏁' : `— case ${j.pos}`}
              </li>
            ))}
          </ol>
        ) : (
          <p className="jeux-fin-sous">Parcours bouclé en {etat.lancers} lancers de dé.</p>
        )}
      </FinPartie>
    )
  }

  const coup = etat.coup
  const caseFinale = coup ? etat.plateau[coup.final] : null

  return (
    <div className="jeux-oie">
      {plusieurs && (
        <ul className="jeux-joueurs" aria-label="Joueurs">
          {etat.joueurs.map((j, i) => (
            <li key={i} className={i === etat.tour ? 'on' : ''} style={{ borderColor: j.couleur }}>
              <i className="jeux-pastille" style={{ background: j.couleur }} aria-hidden="true" />
              <span>{j.nom}</span>
              <small>{j.pos === 0 ? 'départ' : `case ${j.pos}`}</small>
            </li>
          ))}
        </ul>
      )}

      <Plateau etat={etat} etape={etape} />
      <Legende />

      <div className="jeux-barre">
        <button
          type="button"
          className="jeux-de-btn"
          onClick={lancer}
          disabled={etat.phase !== 'lancer' || roule}
          aria-label={etat.phase === 'lancer' ? `Lancer le dé (${joueur.nom})` : `Dé : ${faceDe}`}
        >
          <De valeur={faceDe} roule={roule} />
        </button>
        <div className="jeux-barre-texte" aria-live="polite">
          {etat.phase === 'lancer' && (
            <>
              <strong>{plusieurs ? `À ${joueur.nom} !` : 'À toi !'}</strong>
              <span>Touche le dé pour le lancer.</span>
            </>
          )}
          {etat.phase === 'deplacement' && coup && (
            <>
              <strong>{coup.de} !</strong>
              <span>{plusieurs ? `${etat.joueurs[coup.joueur].nom} avance…` : 'Ton pion avance…'}</span>
            </>
          )}
          {etat.phase === 'repos' && (
            <>
              <strong>{plusieurs ? `${joueur.nom} se repose` : 'Petit repos'}</strong>
              <span>Ce tour-ci, on souffle.</span>
            </>
          )}
        </div>
        {etat.phase === 'repos' && (
          <button type="button" className="btn" onClick={() => dispatch({ type: 'fin-repos' })}>
            Continuer
          </button>
        )}
      </div>

      {etat.phase === 'evenement' && coup && exo && (
        <CarteExercice
          exercice={exo}
          joueur={plusieurs ? etat.joueurs[coup.joueur].nom : undefined}
          contexte={
            <>
              <strong>Case {coup.final}</strong>
              {coup.messages.map((m) => (
                <span key={m}> · {m}</span>
              ))}
            </>
          }
          onFait={() => finExercice(true)}
          onPasse={() => finExercice(false)}
        />
      )}

      {etat.phase === 'evenement' && coup && !exo && coup.messages.length > 0 && (
        <div className="jeux-overlay" role="dialog" aria-modal="true" aria-label="Événement">
          <div className="jeux-evenement">
            <div className="jeux-evenement-emoji" aria-hidden="true">
              {caseFinale && caseFinale.type !== 'exercice' ? INFOS_CASES[caseFinale.type].emoji : '🎲'}
            </div>
            {coup.messages.map((m) => (
              <p key={m}>{m}</p>
            ))}
            <button type="button" className="btn btn-block" autoFocus onClick={() => dispatch({ type: 'suivant' })}>
              {coup.gagne ? 'Voir le récapitulatif' : 'Continuer'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Oie() {
  const [noms, setNoms] = useState<string[]>(() => nomsInitiaux(4))
  const [longueur, setLongueur] = useState<Longueur>(42)
  const [partie, setPartie] = useState<{ reglages: Reglages; noms: string[]; cle: number } | null>(null)

  return (
    <PageShell title="Jeu de l’oie" subtitle="Le grand parcours qui fait bouger" backTo="/jeux">
      {partie ? (
        <Partie
          key={partie.cle}
          noms={partie.noms}
          longueur={longueur}
          reglages={partie.reglages}
          onRejouer={() => setPartie(null)}
        />
      ) : (
        <Preparation
          regles={
            <ul>
              <li>Lance le dé et avance ton pion.</li>
              <li>Chaque case propose un petit mouvement : fais-le, ou passe ton tour d’exercice, sans pénalité.</li>
              <li>Les cases spéciales de l’oie sont là : oies, pont, puits, labyrinthe… revisitées en douceur.</li>
              <li>Il faut tomber pile sur l’arrivée pour gagner.</li>
            </ul>
          }
          onStart={(r) => {
            const propres = nomsPropres(noms)
            ecrireNoms(propres)
            setPartie({ reglages: r, noms: propres, cle: Date.now() })
          }}
        >
          <Joueurs noms={noms} onChange={setNoms} max={4} couleurs={COULEURS_PIONS} />
          <section className="card">
            <Chips<string>
              label="Longueur du parcours"
              options={[
                { value: '42', label: 'Balade (42 cases)' },
                { value: '63', label: 'Grand tour (63 cases)' },
              ]}
              value={String(longueur)}
              onChange={(v) => setLongueur(v === '63' ? 63 : 42)}
            />
            <p className="muted">Comptez environ 15 minutes pour la balade en solo, 25 pour le grand tour.</p>
          </section>
        </Preparation>
      )}
    </PageShell>
  )
}
