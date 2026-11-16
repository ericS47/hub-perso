import { useEffect, useReducer, useState } from 'react'
import PageShell from '../../../ui/PageShell'
import Chips from '../../../ui/Chips'
import CarteExercice from '../CarteExercice'
import Figure from '../Figure'
import FinPartie from '../FinPartie'
import Joueurs from '../Joueurs'
import Preparation from '../Preparation'
import { CATEGORIES, EXERCICES, filtrerExercices, type Reglages } from '../exercices'
import { ecrireNoms, nomsInitiaux, nomsPropres } from '../prefs'
import { useSeance } from '../useSeance'
import { GRILLES, creerPaquet, etatInitialPaires, pairesReducer, type Grille } from './logique'

const COULEURS = ['#e07a4d', '#1f6f6b']

function Partie({ noms, grille, reglages, onRejouer }: { noms: string[]; grille: Grille; reglages: Reglages; onRejouer: () => void }) {
  const { cols, paires } = GRILLES[grille]
  const [etat, dispatch] = useReducer(pairesReducer, null, () => {
    // En mode détente, toutes les illustrations sont permises : il n'y a rien à faire.
    const pool = reglages.detente ? EXERCICES : filtrerExercices(reglages)
    return etatInitialPaires(creerPaquet(pool, paires), noms)
  })
  const seance = useSeance(reglages)
  const deux = etat.joueurs.length > 1
  const joueur = etat.joueurs[etat.tour]

  // Pas de paire : on laisse le temps de mémoriser, puis on retourne les cartes.
  useEffect(() => {
    if (etat.phase !== 'non-paire') return
    const id = window.setTimeout(() => dispatch({ type: 'cacher' }), 1300)
    return () => window.clearTimeout(id)
  }, [etat.phase])

  // Mode détente : petite fête puis on continue.
  useEffect(() => {
    if (etat.phase !== 'exercice' || !reglages.detente) return
    const id = window.setTimeout(() => dispatch({ type: 'exercice-fini' }), 900)
    return () => window.clearTimeout(id)
  }, [etat.phase, reglages.detente])

  if (etat.phase === 'fin') {
    const [a, b] = etat.joueurs
    return (
      <FinPartie jeu="paires" nomJeu="Les paires" suivi={seance.suivi} detente={reglages.detente} onRejouer={onRejouer}>
        {deux && b ? (
          <p className="jeux-fin-sous">
            {a.paires === b.paires
              ? `Égalité parfaite : ${a.paires} paires chacun !`
              : `${a.paires > b.paires ? a.nom : b.nom} gagne avec ${Math.max(a.paires, b.paires)} paires contre ${Math.min(a.paires, b.paires)}.`}
          </p>
        ) : (
          <p className="jeux-fin-sous">
            Toutes les paires trouvées en {etat.coups} essais.
          </p>
        )}
      </FinPartie>
    )
  }

  const trouvees = etat.cartes.filter((c) => c.trouvee).length / 2

  return (
    <div className="jeux-paires">
      <div className="jeux-paires-tete">
        {deux ? (
          <ul className="jeux-joueurs" aria-label="Scores">
            {etat.joueurs.map((j, i) => (
              <li key={i} className={i === etat.tour ? 'on' : ''} style={{ borderColor: COULEURS[i] }}>
                <i className="jeux-pastille" style={{ background: COULEURS[i] }} aria-hidden="true" />
                <span>{j.nom}</span>
                <small>
                  {j.paires} paire{j.paires > 1 ? 's' : ''}
                </small>
              </li>
            ))}
          </ul>
        ) : (
          <p className="jeux-paires-score">
            <strong>
              {trouvees} / {paires}
            </strong>{' '}
            paires · {etat.coups} essai{etat.coups > 1 ? 's' : ''}
          </p>
        )}
        <p className="jeux-paires-statut" aria-live="polite">
          {etat.phase === 'non-paire'
            ? deux
              ? `Pas de paire… la main passe à ${etat.joueurs[(etat.tour + 1) % 2].nom}.`
              : 'Pas de paire… mémorise bien !'
            : etat.phase === 'exercice'
              ? 'Une paire ! 🎉'
              : deux
                ? `À ${joueur.nom} de retourner deux cartes.`
                : 'Retourne deux cartes.'}
        </p>
      </div>

      <div className="jeux-paires-grille" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {etat.cartes.map((c, i) => {
          const visible = c.trouvee || etat.retournees.includes(i)
          const cat = CATEGORIES[c.exercice.categorie]
          return (
            <button
              key={c.id}
              type="button"
              className={`jeux-pcarte${visible ? ' visible' : ''}${c.trouvee ? ' trouvee' : ''}`}
              onClick={() => dispatch({ type: 'retourner', index: i })}
              disabled={c.trouvee}
              aria-label={visible ? `${c.exercice.nom}${c.trouvee ? ', paire trouvée' : ''}` : `Carte ${i + 1}, face cachée`}
              style={c.trouvee && deux && c.par !== undefined ? { outlineColor: COULEURS[c.par] } : undefined}
            >
              <span className="jeux-pcarte-in">
                <span className="jeux-pcarte-dos" aria-hidden="true">
                  <span>✦</span>
                </span>
                <span className="jeux-pcarte-face" style={{ background: cat.fond }} aria-hidden="true">
                  <Figure pose={c.exercice.pose} couleur={cat.couleur} size={cols === 3 ? 72 : 56} anime={false} />
                  <span className="jeux-pcarte-nom">{c.exercice.nom}</span>
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {etat.phase === 'exercice' && etat.paireEnAttente && !reglages.detente && (
        <CarteExercice
          exercice={etat.paireEnAttente}
          joueur={deux ? joueur.nom : undefined}
          contexte={<strong>Paire trouvée ! 🎉</strong>}
          onFait={() => {
            if (etat.paireEnAttente) seance.fait(etat.paireEnAttente)
            dispatch({ type: 'exercice-fini' })
          }}
          onPasse={() => {
            if (etat.paireEnAttente) seance.passe(etat.paireEnAttente)
            dispatch({ type: 'exercice-fini' })
          }}
        />
      )}
    </div>
  )
}

export default function Paires() {
  const [noms, setNoms] = useState<string[]>(() => nomsInitiaux(2))
  const [grille, setGrille] = useState<Grille>('3x4')
  const [partie, setPartie] = useState<{ reglages: Reglages; noms: string[]; cle: number } | null>(null)

  return (
    <PageShell title="Les paires" subtitle="Mémoire et mouvements" backTo="/jeux">
      {partie ? (
        <Partie key={partie.cle} noms={partie.noms} grille={grille} reglages={partie.reglages} onRejouer={() => setPartie(null)} />
      ) : (
        <Preparation
          regles={
            <ul>
              <li>Retourne deux cartes : si elles montrent le même mouvement, c’est une paire !</li>
              <li>Chaque paire trouvée, on fait le mouvement (ou on passe, sans pénalité).</li>
              <li>À deux : on rejoue après une paire, sinon la main passe.</li>
            </ul>
          }
          onStart={(r) => {
            const propres = nomsPropres(noms)
            ecrireNoms(propres)
            setPartie({ reglages: r, noms: propres, cle: Date.now() })
          }}
        >
          <Joueurs noms={noms} onChange={setNoms} max={2} libelles={['Solo', 'À deux']} couleurs={COULEURS} />
          <section className="card">
            <Chips<Grille>
              label="Taille du jeu"
              options={[
                { value: '3x4', label: '12 cartes' },
                { value: '4x4', label: '16 cartes' },
                { value: '4x5', label: '20 cartes' },
              ]}
              value={grille}
              onChange={setGrille}
            />
            <p className="muted">
              {GRILLES[grille].paires} paires, donc jusqu’à {GRILLES[grille].paires} mouvements.
            </p>
          </section>
        </Preparation>
      )}
    </PageShell>
  )
}
