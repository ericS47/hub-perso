import type { CultureCategory } from '../db'

// Liste de départ, modifiable ensuite dans l'appli (renommer, supprimer, ajouter).
export const DEFAULT_THEMES: Record<CultureCategory, string[]> = {
  films: ['Action', 'Comédie', 'Drame', 'Policier & thriller', 'Science-fiction', 'Animation', 'Documentaire', 'Horreur'],
  series: ['Policier & thriller', 'Drame', 'Comédie', 'Science-fiction & fantasy', 'Historique', 'Animation', 'Documentaire'],
  'jeux-societe': ['Stratégie', 'Ambiance & party', 'Coopératif', 'Famille', 'Cartes', 'Enquête', 'Deux joueurs'],
  'jeux-video': ['Action & aventure', 'RPG', 'Stratégie', 'Course & sport', 'Plateforme', 'Réflexion', 'Multijoueur'],
  livres: [
    'Roman',
    'Classique',
    'Polar & thriller',
    'SF & fantasy',
    'Histoire',
    'Biographie',
    'Essai & société',
    'Politique & géopolitique',
    'Économie & finance',
    'Développement personnel',
    'Philosophie & spiritualité',
    'Santé & bien-être',
    'Sciences',
    'Voyage & aventure',
    'Poésie & théâtre',
    'BD & manga',
    'Jeunesse',
  ],
  spectacles: ['Théâtre', 'Humour', 'Concert', 'Comédie musicale', 'Danse & ballet', 'Opéra', 'Cirque'],
}
