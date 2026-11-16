// Les séances en visio présentées dans « Séances en visio » (démonstration : la visio n'est
// pas encore active, mais on peut ajouter la séance à son agenda).
//
// Pour ajouter une séance : copiez un bloc { … }, collez-le à la suite et changez les textes.
//   id        : identifiant court, sans espace ni accent (sert dans l'adresse de la page) ;
//   activite  : le nom qui apparaîtra dans l'agenda (ex. 'Pilates avec Léa') ;
//   proId     : l'identifiant de la personne dans pros.ts ;
//   duree     : durée indicative en minutes ;
//   exemple   : planning d'EXEMPLE (jour 0 = lundi … 6 = dimanche, heure 'HH:MM').

export interface Seance {
  id: string
  titre: string
  activite: string
  proId: string
  emoji: string
  description: string
  duree: number
  niveau: string
  materiel: string[]
  pourQui: string
  precautions: string[]
  exemple: { jour: number; heure: string }[]
}

export const SEANCES: Seance[] = [
  {
    id: 'pilates',
    titre: 'Pilates',
    activite: 'Pilates avec Léa',
    proId: 'lea',
    emoji: '🧘',
    description:
      'Des mouvements lents et contrôlés pour renforcer le centre du corps, améliorer la posture et l’équilibre, en suivant sa respiration.',
    duree: 30,
    niveau: 'Débutant, tout en douceur',
    materiel: ['Un tapis ou une serviette épaisse', 'Une tenue souple', 'Une bouteille d’eau'],
    pourQui: 'Pour toutes celles et ceux qui veulent bouger en douceur et renforcer leur dos.',
    precautions: [
      'Chaque exercice a une version simplifiée : prends-la sans hésiter.',
      'Arrête en cas de douleur et parles-en à ton médecin.',
    ],
    exemple: [
      { jour: 0, heure: '10:00' },
      { jour: 3, heure: '18:30' },
    ],
  },
  {
    id: 'stretching',
    titre: 'Stretching',
    activite: 'Stretching avec JB',
    proId: 'jb',
    emoji: '🤸',
    description:
      'Des étirements progressifs pour gagner en souplesse, relâcher les tensions et mieux récupérer après l’effort.',
    duree: 20,
    niveau: 'Tous niveaux',
    materiel: ['Un tapis ou une serviette', 'Une chaise stable'],
    pourQui: 'Pour se détendre, assouplir le corps et compléter les autres activités.',
    precautions: [
      'On étire sans à-coups et sans aller jusqu’à la douleur.',
      'Les exercices peuvent se faire assis sur une chaise.',
    ],
    exemple: [
      { jour: 1, heure: '12:30' },
      { jour: 5, heure: '09:30' },
    ],
  },
  {
    id: 'cardio',
    titre: 'Cardio doux',
    activite: 'Cardio avec Fab',
    proId: 'fab',
    emoji: '💓',
    description:
      'Une séance pour faire travailler le cœur et le souffle à une intensité modérée : marche sur place, mouvements des bras, enchaînements simples.',
    duree: 30,
    niveau: 'Progressif, à ton rythme',
    materiel: ['Des chaussures confortables', 'Une bouteille d’eau', 'Un peu d’espace autour de toi'],
    pourQui: 'Pour reprendre du souffle et de l’endurance pas à pas.',
    precautions: [
      'Tu dois pouvoir parler pendant l’effort : sinon, ralentis.',
      'Si tu as un problème cardiaque ou respiratoire, demande d’abord l’avis de ton médecin.',
      'Arrête en cas de douleur à la poitrine, de vertige ou de malaise.',
    ],
    exemple: [
      { jour: 2, heure: '17:30' },
      { jour: 4, heure: '10:00' },
    ],
  },
]

export function findSeance(id: string | undefined): Seance | undefined {
  return SEANCES.find((s) => s.id === id)
}
