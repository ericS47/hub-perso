// Applications de jeux externes recommandées par l'équipe soignante.
// Pour en ajouter une, décommenter / compléter un élément du tableau ci-dessous.
// Liste vide : l'accueil des jeux affiche « Bientôt : des jeux partenaires… ».
export interface AppliExterne {
  nom: string
  description: string
  url: string // lien https vers la fiche de l'application ou son site
  emoji?: string
}

export const APPLIS_EXTERNES: AppliExterne[] = [
  // {
  //   nom: 'Nom de l’application',
  //   description: 'Ce qu’elle propose, en une phrase.',
  //   url: 'https://exemple.org',
  //   emoji: '🎮',
  // },
]
