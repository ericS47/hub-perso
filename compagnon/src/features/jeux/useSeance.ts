import { useCallback, useReducer } from 'react'
import { choisirExercice, filtrerExercices, type Categorie, type Exercice, type Reglages } from './exercices'
import { suiviInitial, suiviReducer } from './suivi'

// Suivi des exercices d'une partie + tirage d'exercices selon les réglages.
export function useSeance(reglages: Reglages | null) {
  const [suivi, dispatch] = useReducer(suiviReducer, 0, () => suiviInitial(Date.now()))

  const tirer = useCallback(
    (categorie?: Categorie): Exercice | null => {
      if (!reglages || reglages.detente) return null
      return choisirExercice(filtrerExercices(reglages), { categorie, niveau: reglages.niveau, eviter: suivi.recents })
    },
    [reglages, suivi.recents],
  )

  return {
    suivi,
    tirer,
    fait: (exercice: Exercice) => dispatch({ type: 'fait', exercice }),
    passe: (exercice: Exercice) => dispatch({ type: 'passe', exercice }),
    reset: () => dispatch({ type: 'reset', now: Date.now() }),
  }
}
