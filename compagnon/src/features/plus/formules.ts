// Les formules présentées sur l'écran « Mes formules » (démonstration : rien n'est payé).
//
// Pour modifier une formule : changez simplement les textes entre guillemets.
// Pour ajouter un avantage : ajoutez une ligne 'Texte de l'avantage', dans la liste « inclus ».
// Le champ « id » ne doit pas être changé : il correspond au réglage enregistré dans l'appli
// ('gratuite', 'encouragements' ou 'premium').
// Le prix reste « tarif à définir » tant qu'aucun tarif n'est décidé.

export type PlanId = 'gratuite' | 'encouragements' | 'premium'

export interface Formule {
  id: PlanId
  nom: string
  emoji: string
  accroche: string
  prix: string
  inclus: string[]
  // Précision honnête sur ce qui fonctionne déjà ou pas encore.
  enAttendant?: string
}

export const FORMULES: Formule[] = [
  {
    id: 'gratuite',
    nom: 'Découverte',
    emoji: '🌱',
    accroche: 'Tout le nécessaire pour avancer à ton rythme.',
    prix: 'Gratuite',
    inclus: [
      'Le compagnon confident, à l’écoute',
      'L’agenda de tes séances et leur évaluation',
      'Les jeux d’activité',
      'Ton profil et tes préférences',
    ],
  },
  {
    id: 'encouragements',
    nom: 'Encouragements',
    emoji: '💌',
    accroche: 'Un petit mot pour te soutenir aux moments clés.',
    prix: 'Tarif à définir',
    inclus: [
      'Tout ce que contient « Découverte »',
      'Des messages d’encouragement par SMS',
      'Un rappel bienveillant avant tes séances',
    ],
    enAttendant: 'En attendant les SMS, tu peux activer les rappels dans l’appli.',
  },
  {
    id: 'premium',
    nom: 'Accompagnement personnalisé',
    emoji: '🤝',
    accroche: 'Un échange individuel avec un professionnel de l’équipe.',
    prix: 'Tarif à définir',
    inclus: [
      'Tout ce que contient « Encouragements »',
      'Un entretien individuel avec un professionnel',
      'Des conseils personnalisés pour ton activité',
      'Un lien avec l’équipe (diététique, psychologie, ergothérapie…)',
    ],
  },
]
