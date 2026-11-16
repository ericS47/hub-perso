import { useEffect, useReducer, useState } from 'react'
import PageShell from '../../../ui/PageShell'
import Chips from '../../../ui/Chips'
import CarteExercice from '../CarteExercice'
import FinPartie from '../FinPartie'
import Preparation from '../Preparation'
import type { Exercice, Reglages } from '../exercices'
import { ecrireNoms, lireNoms } from '../prefs'
import { useSeance } from '../useSeance'
import Grille from './Grille'
import {
  FLOTTES,
  casesBateau,
  choixIA,
  etatInitialNavale,
  flotteAleatoire,
  navaleReducer,
  nomCase,
  placementLibre,
  type Bateau,
  type Camp,
  type EtatNavale,
  type ModeNavale,
  type RegleExercice,
  type Taille,
} from './logique'

const MSG_INVITATION =
  'Viens jouer avec moi à la bataille navale qui fait bouger, dans l’appli Mon Compagnon ! ' +
  'Pour l’instant, on joue à deux sur le même téléphone : passe me voir et on se lance.'

// Invitation : partage natif si possible, sinon copie du texte.
function Inviter() {
  const [etat, setEtat] = useState<'' | 'copie' | 'texte'>('')
  async function inviter() {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Bataille navale qui fait bouger', text: MSG_INVITATION })
        return
      }
      await navigator.clipboard.writeText(MSG_INVITATION)
      setEtat('copie')
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setEtat('texte')
    }
  }
  return (
    <section className="card card-warm jeux-inviter">
      <h2>Inviter un ami</h2>
      <p>Envoie un petit message à quelqu’un pour lui proposer une partie ensemble.</p>
      <button type="button" className="btn btn-secondary btn-block" onClick={() => void inviter()}>
        📨 Inviter un ami
      </button>
      {etat === 'copie' && <p className="jeux-ok">Message copié : il ne reste qu’à le coller dans un SMS.</p>}
      {etat === 'texte' && <p className="jeux-citation">{MSG_INVITATION}</p>}
      <p className="muted">
        Honnêtement : jouer chacun sur son téléphone, à distance, arrivera dans une prochaine version. Pour l’instant,
        on joue à deux sur le même téléphone.
      </p>
    </section>
  )
}

// Placement manuel (case de départ + sens) ou aléatoire.
function Placement({ taille, nom, onValider }: { taille: Taille; nom: string; onValider: (b: Bateau[]) => void }) {
  const modeles = FLOTTES[taille]
  const [bateaux, setBateaux] = useState<Bateau[]>([])
  const [horizontal, setHorizontal] = useState(true)
  const [erreur, setErreur] = useState('')
  const restant = modeles.filter((m) => !bateaux.some((b) => b.id === m.id))
  const [choisi, setChoisi] = useState<string>(modeles[0].id)
  const actuel = restant.find((m) => m.id === choisi) ?? restant[0]

  const campAffiche: Camp = { nom, ia: false, bateaux, tirs: Array(taille * taille).fill(null) }

  function toucher(i: number) {
    setErreur('')
    const present = bateaux.find((b) => b.cases.includes(i))
    if (present) {
      // Toucher un bateau posé le reprend.
      setBateaux(bateaux.filter((b) => b !== present))
      setChoisi(present.id)
      return
    }
    if (!actuel) return
    const cases = casesBateau(taille, actuel.longueur, i % taille, Math.floor(i / taille), horizontal)
    if (!cases) return setErreur('Ça dépasse de la grille : choisis une case plus proche du bord opposé ou change le sens.')
    if (!placementLibre(taille, bateaux, cases)) return setErreur('Un autre bateau est déjà là.')
    const suite = [...bateaux, { ...actuel, cases }]
    setBateaux(suite)
    const prochain = modeles.find((m) => !suite.some((b) => b.id === m.id))
    if (prochain) setChoisi(prochain.id)
  }

  return (
    <div className="jeux-nav-placement">
      <h2>{nom}, place tes bateaux</h2>
      {actuel ? (
        <>
          <div className="chips-row jeux-nav-bateaux" role="radiogroup" aria-label="Bateau à placer">
            {restant.map((m) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={m.id === actuel.id}
                className={m.id === actuel.id ? 'chip on' : 'chip'}
                onClick={() => setChoisi(m.id)}
              >
                {m.nom} <span className="jeux-nav-long">{'■'.repeat(m.longueur)}</span>
              </button>
            ))}
          </div>
          <p className="muted">
            Touche une case pour poser le {actuel.nom.toLowerCase()} ({actuel.longueur} cases)
            {horizontal ? ' vers la droite' : ' vers le bas'}.
          </p>
        </>
      ) : (
        <p className="jeux-ok">Tous tes bateaux sont à l’eau ! Touche un bateau pour le déplacer.</p>
      )}
      <div className="btn-row jeux-nav-outils">
        <button type="button" className="btn btn-secondary" onClick={() => setHorizontal((h) => !h)} aria-label="Changer le sens">
          {horizontal ? '↔ Horizontal' : '↕ Vertical'}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            setErreur('')
            setBateaux(flotteAleatoire(taille))
          }}
        >
          🎲 Au hasard
        </button>
        {bateaux.length > 0 && (
          <button type="button" className="btn btn-ghost" onClick={() => setBateaux([])}>
            Tout enlever
          </button>
        )}
      </div>
      {erreur && (
        <p className="jeux-erreur" role="alert">
          {erreur}
        </p>
      )}
      <Grille camp={campAffiche} taille={taille} vue="flotte" onCase={toucher} label="Ta grille" />
      <button
        type="button"
        className="btn btn-block jeux-go"
        disabled={restant.length > 0}
        onClick={() => onValider(bateaux)}
      >
        {restant.length > 0 ? `Encore ${restant.length} bateau${restant.length > 1 ? 'x' : ''} à placer` : 'Valider ma flotte'}
      </button>
    </div>
  )
}

function messageTir(e: EtatNavale): string {
  const d = e.dernier
  if (!d) return ''
  const tireur = e.camps[d.par]
  const ia = tireur.ia
  const qui = ia ? 'L’appli tire' : e.mode === 'ami' ? `${tireur.nom} tire` : 'Tu tires'
  const ou = nomCase(d.index, e.taille)
  if (d.resultat === 'eau') return `${qui} en ${ou} : à l’eau.`
  if (d.resultat === 'touche') return `${qui} en ${ou} : touché !`
  return `${qui} en ${ou} : ${d.bateau ? `le ${d.bateau.toLowerCase()}` : 'un bateau'} est coulé !`
}

function Restants({ camp }: { camp: Camp }) {
  return (
    <ul className="jeux-nav-restants" aria-label={`Bateaux de ${camp.nom}`}>
      {camp.bateaux.map((b) => {
        const coule = b.cases.every((c) => camp.tirs[c] === 'coule')
        return (
          <li key={b.id} className={coule ? 'coule' : ''}>
            {b.nom}
            {coule ? ' (coulé)' : ''}
          </li>
        )
      })}
    </ul>
  )
}

function Partie({
  config,
  reglages,
  onRejouer,
}: {
  config: { taille: Taille; mode: ModeNavale; regle: RegleExercice; noms: [string, string] }
  reglages: Reglages
  onRejouer: () => void
}) {
  const [e, dispatch] = useReducer(navaleReducer, null, () =>
    etatInitialNavale(config.taille, config.mode, config.regle, config.noms),
  )
  const seance = useSeance(reglages)
  const [exo, setExo] = useState<Exercice | null>(null)
  const ia = e.mode === 'ia'
  const moi = e.camps[e.tour]
  const adverse = e.camps[e.tour === 0 ? 1 : 0]

  // Tour de l'appli : elle réfléchit un instant puis tire.
  useEffect(() => {
    if (!ia || e.phase !== 'tir' || e.tour !== 1) return
    const id = window.setTimeout(() => dispatch({ type: 'tirer', index: choixIA(e.camps[0].tirs, e.taille) }), 900)
    return () => window.clearTimeout(id)
  }, [ia, e.phase, e.tour, e.camps, e.taille])

  // Contre l'appli, les résultats s'enchaînent tout seuls (sauf victoire).
  useEffect(() => {
    if (!ia || e.phase !== 'resultat' || e.gagnant !== null) return
    const id = window.setTimeout(() => dispatch({ type: 'continuer' }), e.tour === 1 ? 1800 : 1300)
    return () => window.clearTimeout(id)
  }, [ia, e.phase, e.tour, e.gagnant])

  // Phase exercice : on tire un mouvement (ou on saute en mode détente).
  useEffect(() => {
    if (e.phase !== 'exercice') return
    if (reglages.detente) {
      dispatch({ type: 'exercice-fini' })
      return
    }
    setExo((x) => x ?? seance.tirer())
  }, [e.phase, reglages.detente, seance])

  function finExo(fait: boolean) {
    if (exo) (fait ? seance.fait : seance.passe)(exo)
    setExo(null)
    dispatch({ type: 'exercice-fini' })
  }

  if (e.phase === 'fin' && e.gagnant !== null) {
    const g = e.camps[e.gagnant]
    return (
      <FinPartie jeu="bataille-navale" nomJeu="Bataille navale" suivi={seance.suivi} detente={reglages.detente} onRejouer={onRejouer}>
        <p className="jeux-fin-sous">
          {g.ia ? 'L’appli a gagné cette fois-ci… la revanche t’attend !' : ia ? 'Tu as coulé toute la flotte de l’appli !' : `${g.nom} a gagné !`}{' '}
          ({e.tirsJoues[e.gagnant]} tirs)
        </p>
      </FinPartie>
    )
  }

  if (e.phase === 'passage') {
    return (
      <div className="jeux-passage">
        <div className="jeux-passage-emoji" aria-hidden="true">
          📱
        </div>
        <h2>Passe le téléphone à {moi.nom}</h2>
        <p className="muted">
          {e.dernier ? messageTir(e) : ''} {adverse.nom}, ne regarde pas l’écran !
        </p>
        <button type="button" className="btn btn-block jeux-go" onClick={() => dispatch({ type: 'pret' })}>
          C’est moi, {moi.nom} !
        </button>
      </div>
    )
  }

  if (e.phase === 'placement') {
    return (
      <Placement
        key={e.tour}
        taille={e.taille}
        nom={moi.nom}
        onValider={(b) => dispatch({ type: 'placer', bateaux: b })}
      />
    )
  }

  // Côté de l'écran : contre l'appli, on est toujours le joueur 1.
  const joueur = ia ? e.camps[0] : moi
  const cibleCamp = ia ? e.camps[1] : adverse
  const tourIA = ia && e.tour === 1
  const statut =
    e.phase === 'resultat'
      ? messageTir(e)
      : tourIA
        ? 'L’appli vise…'
        : e.phase === 'tir'
          ? `${ia ? 'À toi' : `À ${moi.nom}`} : touche une case de la grille adverse.`
          : ''

  return (
    <div className="jeux-navale">
      <p className={`jeux-nav-statut ${e.phase === 'resultat' ? e.dernier?.resultat : ''}`} aria-live="polite">
        {statut}
      </p>
      {!tourIA && !(ia && e.phase === 'resultat' && e.tour === 1) ? (
        <>
          <h2 className="jeux-nav-titre">Mer de {cibleCamp.ia ? 'l’appli' : cibleCamp.nom}</h2>
          <Grille
            camp={cibleCamp}
            taille={e.taille}
            vue="attaque"
            onCase={e.phase === 'tir' ? (i) => dispatch({ type: 'tirer', index: i }) : undefined}
            dernier={e.dernier && e.dernier.par === e.camps.indexOf(joueur) ? e.dernier.index : null}
            label={`Grille adverse : ${cibleCamp.nom}`}
          />
          <Restants camp={cibleCamp} />
          {e.mode === 'ami' && e.phase === 'resultat' && (
            <button type="button" className="btn btn-block jeux-go" onClick={() => dispatch({ type: 'continuer' })}>
              {e.gagnant !== null ? 'Voir le résultat' : 'Fin de mon tour'}
            </button>
          )}
          {ia && e.phase === 'resultat' && e.gagnant !== null && (
            <button type="button" className="btn btn-block jeux-go" onClick={() => dispatch({ type: 'continuer' })}>
              Voir le résultat
            </button>
          )}
          <details className="jeux-nav-maflotte">
            <summary>Voir ma flotte</summary>
            <Grille camp={joueur} taille={e.taille} vue="flotte" petite label="Ma flotte" />
          </details>
        </>
      ) : (
        <>
          <h2 className="jeux-nav-titre">Ta flotte</h2>
          <Grille
            camp={joueur}
            taille={e.taille}
            vue="flotte"
            dernier={e.phase === 'resultat' ? e.dernier?.index : null}
            label="Ta flotte, visée par l’appli"
          />
          {e.gagnant !== null && (
            <button type="button" className="btn btn-block jeux-go" onClick={() => dispatch({ type: 'continuer' })}>
              Voir le résultat
            </button>
          )}
        </>
      )}

      {e.phase === 'exercice' && exo && e.exo && (
        <CarteExercice
          exercice={exo}
          joueur={!ia ? e.camps[e.exo.pour].nom : undefined}
          contexte={
            <strong>
              {e.exo.apresTir ? 'Bateau coulé, bravo ! Mouvement de victoire :' : `${messageTir(e)} À toi de bouger :`}
            </strong>
          }
          onFait={() => finExo(true)}
          onPasse={() => finExo(false)}
        />
      )}
    </div>
  )
}

export default function Navale() {
  const [mode, setMode] = useState<ModeNavale>('ia')
  const [taille, setTaille] = useState<Taille>(8)
  const [regle, setRegle] = useState<RegleExercice>('touche')
  const [noms, setNoms] = useState<[string, string]>(() => {
    const l = lireNoms()
    return [l[0] ?? 'Joueur 1', l[1] ?? 'Joueur 2']
  })
  const [partie, setPartie] = useState<{ reglages: Reglages; cle: number; noms: [string, string] } | null>(null)

  return (
    <PageShell title="Bataille navale" subtitle="Contre l’appli ou contre un ami" backTo="/jeux">
      {partie ? (
        <Partie
          key={partie.cle}
          config={{ taille, mode, regle, noms: partie.noms }}
          reglages={partie.reglages}
          onRejouer={() => setPartie(null)}
        />
      ) : (
        <>
          <Preparation
            regles={
              <ul>
                <li>Place tes bateaux, puis tire chacun votre tour sur la grille adverse.</li>
                <li>
                  {regle === 'touche'
                    ? 'Quand un de tes bateaux est touché, tu fais un petit mouvement.'
                    : 'Quand tu coules un bateau adverse, tu fais un mouvement de victoire.'}
                </li>
                <li>Le premier qui coule toute la flotte adverse gagne.</li>
              </ul>
            }
            onStart={(r) => {
              const propres: [string, string] = [noms[0].trim() || 'Joueur 1', noms[1].trim() || 'Joueur 2']
              if (mode === 'ami') ecrireNoms(propres)
              setPartie({ reglages: r, cle: Date.now(), noms: propres })
            }}
          >
            <section className="card">
              <Chips<ModeNavale>
                label="Contre qui ?"
                options={[
                  { value: 'ia', label: '🤖 Contre l’appli' },
                  { value: 'ami', label: '🧑‍🤝‍🧑 Défier un ami' },
                ]}
                value={mode}
                onChange={setMode}
              />
              {mode === 'ami' && (
                <>
                  <p className="muted">
                    À deux sur le même téléphone : un écran « Passe le téléphone » cache ta grille entre chaque tour.
                  </p>
                  {[0, 1].map((i) => (
                    <label key={i} className="field">
                      <span>Prénom du joueur {i + 1}</span>
                      <input
                        value={noms[i]}
                        maxLength={16}
                        onChange={(ev) => setNoms(i === 0 ? [ev.target.value, noms[1]] : [noms[0], ev.target.value])}
                        onFocus={(ev) => ev.target.select()}
                      />
                    </label>
                  ))}
                </>
              )}
              <Chips<string>
                label="Taille de la mer"
                options={[
                  { value: '8', label: '8 × 8 (rapide)' },
                  { value: '10', label: '10 × 10 (classique)' },
                ]}
                value={String(taille)}
                onChange={(v) => setTaille(v === '10' ? 10 : 8)}
              />
              <Chips<RegleExercice>
                label="Quand est-ce qu’on bouge ?"
                options={[
                  { value: 'touche', label: 'Quand mon bateau est touché' },
                  { value: 'coule', label: 'Quand je coule un bateau' },
                ]}
                value={regle}
                onChange={setRegle}
              />
            </section>
          </Preparation>
          <Inviter />
        </>
      )}
    </PageShell>
  )
}
