// Sujets de conversation proposés par le compagnon (onglet Confident et fenêtre d'accueil).
export const SUJETS = [
  { to: 'seance-manquee', emoji: '🏃', label: 'Je n’ai pas fait ma séance' },
  { to: 'grignotage', emoji: '🍪', label: 'J’ai grignoté' },
  { to: 'compulsion', emoji: '🌊', label: 'J’ai eu une compulsion' },
  { to: 'coup-de-mou', emoji: '🌧️', label: 'J’ai un coup de mou' },
  { to: 'libre', emoji: '✍️', label: 'J’ai juste envie d’écrire' },
  { to: 'bonne-nouvelle', emoji: '🌟', label: 'J’ai une bonne nouvelle à partager' },
]

const KEY = 'compagnon-accueil-vu'

// Une seule fois par ouverture de l'appli (la session du navigateur), pas à chaque retour sur l'accueil.
export function alreadySeen(): boolean {
  try {
    return sessionStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function markSeen(): void {
  try {
    sessionStorage.setItem(KEY, '1')
  } catch {
    // Stockage indisponible : la fenêtre pourra revenir, sans gravité.
  }
}
