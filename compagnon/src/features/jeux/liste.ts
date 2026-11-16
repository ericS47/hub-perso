// Les jeux proposés sur l'accueil des jeux.
import type { PoseId } from './poses'

export const JEUX: { id: string; route: string; nom: string; emoji: string; texte: string; pose: PoseId; couleur: string; fond: string }[] = [
  { id: 'oie', route: '/jeux/oie', nom: 'Jeu de l’oie', emoji: '🪿', texte: 'Le parcours classique : chaque case, un petit mouvement. De 1 à 4 joueurs.', pose: 'marche', couleur: '#b4532a', fond: '#fbe6dc' },
  { id: 'paires', route: '/jeux/paires', nom: 'Les paires', emoji: '🃏', texte: 'Retrouve les mouvements jumeaux. Solo ou à deux.', pose: 'bras-haut', couleur: '#1f6f6b', fond: '#d9ece9' },
  { id: 'bataille-navale', route: '/jeux/bataille-navale', nom: 'Bataille navale', emoji: '⚓', texte: 'Contre l’appli ou en défiant un ami. On bouge quand ça touche !', pose: 'boxe', couleur: '#3e6590', fond: '#e1eaf4' },
  { id: 'cap-au-phare', route: '/jeux/cap-au-phare', nom: 'Cap au phare', emoji: '🗼', texte: 'Une balade en cartes jusqu’au bord de mer, à son rythme.', pose: 'funambule', couleur: '#8a6212', fond: '#fbefd2' },
]
