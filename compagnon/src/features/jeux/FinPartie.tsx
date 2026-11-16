import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../../db'
import { fromMinutes, isoDate } from '../../lib/dates'
import type { Suivi } from './suivi'

interface Props {
  jeu: string // identifiant enregistré dans db.games
  nomJeu: string // nom lisible, pour la séance
  suivi: Suivi
  detente: boolean
  // Bandeau propre au jeu (gagnant, nombre de coups…).
  children?: ReactNode
  onRejouer: () => void
}

function messageValorisant(faits: number, detente: boolean): string {
  if (detente) return 'Un bon moment de jeu, c’est aussi prendre soin de soi.'
  if (faits === 0) return 'Tu as joué jusqu’au bout : c’est déjà une belle pause pour toi.'
  if (faits < 4) return 'Chaque mouvement compte. Ton corps te dit merci !'
  if (faits < 10) return 'Belle séance ! Tu as bougé tout en t’amusant.'
  return 'Quelle énergie ! Pense à boire un verre d’eau.'
}

// Récapitulatif de fin de partie : enregistrement dans db.games et proposition de séance.
export default function FinPartie({ jeu, nomJeu, suivi, detente, children, onRejouer }: Props) {
  const dureeSec = useRef(Math.max(1, Math.round((Date.now() - suivi.debut) / 1000)))
  const enregistre = useRef(false)
  const [seance, setSeance] = useState<'non' | 'en-cours' | 'ajoutee'>('non')

  useEffect(() => {
    // Garde : un seul enregistrement, même si l'effet est rejoué (mode strict).
    if (enregistre.current) return
    enregistre.current = true
    void db.games.add({
      game: jeu,
      exercisesDone: suivi.faits,
      durationSec: dureeSec.current,
      createdAt: Date.now(),
    })
  }, [jeu, suivi.faits])

  const dureeMin = Math.max(1, Math.round(dureeSec.current / 60))

  async function compterSeance() {
    setSeance('en-cours')
    const debut = new Date(suivi.debut)
    await db.sessions.add({
      date: isoDate(debut),
      start: fromMinutes(debut.getHours() * 60 + debut.getMinutes()),
      durationMin: dureeMin,
      activity: `Jeu : ${nomJeu}`,
      status: 'faite',
      createdAt: Date.now(),
    })
    setSeance('ajoutee')
  }

  return (
    <div className="jeux-fin">
      <div className="jeux-fin-trophee" aria-hidden="true">
        🎉
      </div>
      <h2 className="jeux-fin-titre">Partie terminée !</h2>
      {children}
      <div className="jeux-fin-stats">
        {!detente && (
          <div className="jeux-stat">
            <strong>{suivi.faits}</strong>
            <span>exercice{suivi.faits > 1 ? 's' : ''} fait{suivi.faits > 1 ? 's' : ''}</span>
          </div>
        )}
        {!detente && (
          <div className="jeux-stat">
            <strong>{suivi.secondes === 0 ? 0 : suivi.secondes < 60 ? '< 1' : Math.round(suivi.secondes / 60)}</strong>
            <span>min d’activité</span>
          </div>
        )}
        <div className="jeux-stat">
          <strong>{dureeMin}</strong>
          <span>min de jeu</span>
        </div>
      </div>
      <p className="jeux-fin-message">{messageValorisant(suivi.faits, detente)}</p>

      {!detente && suivi.faits > 0 && (
        <div className="card card-soft jeux-fin-seance">
          {seance === 'ajoutee' ? (
            <p>
              ✅ C’est noté : une séance « Jeu : {nomJeu} » de {dureeMin} min a été ajoutée à ton agenda.{' '}
              <Link to="/agenda">Voir l’agenda</Link>
            </p>
          ) : (
            <>
              <p>Cette partie peut compter comme une séance d’activité physique.</p>
              <button
                type="button"
                className="btn btn-block"
                disabled={seance === 'en-cours'}
                onClick={() => void compterSeance()}
              >
                Compter cette partie comme une séance
              </button>
            </>
          )}
        </div>
      )}

      <div className="btn-row">
        <button type="button" className="btn" onClick={onRejouer}>
          Rejouer
        </button>
        <Link to="/jeux" className="btn btn-secondary">
          Autres jeux
        </Link>
      </div>
    </div>
  )
}
