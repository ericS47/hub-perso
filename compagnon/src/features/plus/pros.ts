// L'équipe présentée dans « L'équipe ». Ce sont de vraies personnes : on n'indique que le
// prénom et le métier. Ne jamais ajouter de téléphone, d'e-mail, d'adresse ou de diplôme
// sans leur accord.
//
// Pour ajouter une personne : copiez un bloc { … }, de l'accolade ouvrante à la virgule
// après l'accolade fermante, collez-le à la suite et changez :
//   id      : identifiant court, sans espace ni accent (sert dans l'adresse de la page) ;
//   prenom  : le prénom ('' si on ne le connaît pas encore) ;
//   role    : le métier ('' s'il est à préciser : on affichera « Membre de l'équipe ») ;
//   couleur : la couleur de la pastille (code couleur, ex. '#7a5c99') ;
//   aide, situations : textes généraux sur le MÉTIER, pas sur la personne ;
//   seances : facultatif, l'identifiant d'une séance en visio (voir seances.ts).

export interface Pro {
  id: string
  prenom: string
  role: string
  couleur: string
  // « En quoi peut-il / elle m'aider ? » : description générale du métier.
  aide: string
  // Exemples de situations où le consulter.
  situations: string[]
  seances?: string[]
}

export const PROS: Pro[] = [
  {
    id: 'lucie',
    prenom: 'Lucie',
    role: 'Diététicienne',
    couleur: '#3f8f5a',
    aide:
      'Un ou une diététicienne aide à trouver une alimentation qui convient à ta vie, sans régime strict ni interdit : organisation des repas, envies, équilibre au fil de la semaine.',
    situations: [
      'Tu as des questions sur tes repas ou tes collations',
      'Tu manques d’idées pour cuisiner simplement',
      'Tu veux manger en accord avec ton activité physique',
      'Tu vis des grignotages ou des compulsions et tu veux en parler',
    ],
  },
  {
    id: 'fab',
    prenom: 'Fab',
    role: 'Ergothérapeute',
    couleur: '#c0673f',
    aide:
      'Un ou une ergothérapeute aide à rendre les gestes du quotidien plus faciles et plus sûrs : aménager son logement, s’économiser, adapter ses activités à ses capacités du moment.',
    situations: [
      'Certains gestes du quotidien deviennent difficiles (se baisser, porter, monter des marches)',
      'Tu te fatigues vite dans les tâches de la maison',
      'Tu veux reprendre une activité en l’adaptant',
    ],
    seances: ['cardio'],
  },
  {
    id: 'jb',
    prenom: 'JB',
    role: 'Ostéopathe',
    couleur: '#3b6ea5',
    aide:
      'Un ou une ostéopathe s’intéresse à la mobilité du corps et peut soulager certaines tensions ou gênes, en complément du suivi médical.',
    situations: [
      'Tu ressens des tensions ou raideurs qui gênent tes mouvements',
      'Une gêne apparaît pendant ou après l’effort',
      'Tu veux mieux comprendre comment bouger sans te faire mal',
    ],
    seances: ['stretching'],
  },
  {
    id: 'antonin',
    prenom: 'Antonin',
    role: 'Psychologue',
    couleur: '#7a5c99',
    aide:
      'Un ou une psychologue offre un espace d’écoute pour parler de ce qui pèse : émotions, stress, rapport à la nourriture ou au corps, motivation. Sans jugement.',
    situations: [
      'Ton moral est en baisse depuis quelque temps',
      'Tu vis des compulsions alimentaires et tu veux comprendre ce qui se joue',
      'Tu te sens stressé·e, débordé·e ou découragé·e',
      'Tu as envie de parler de ton image de toi',
    ],
  },
  {
    id: 'lea',
    prenom: 'Léa',
    role: 'Séances de pilates',
    couleur: '#b5527a',
    aide:
      'Le pilates fait travailler en douceur la posture, l’équilibre et les muscles profonds, avec une attention particulière à la respiration.',
    situations: [
      'Tu veux renforcer ton dos et ta posture en douceur',
      'Tu cherches une activité calme et progressive',
      'Tu as envie de mieux sentir ton corps et ta respiration',
    ],
    seances: ['pilates'],
  },
  {
    id: 'kine',
    prenom: '',
    role: 'Kinésithérapeute',
    couleur: '#2f7f86',
    aide:
      'Un ou une kinésithérapeute accompagne la rééducation et la reprise du mouvement : renforcement, mobilité, gestion de certaines douleurs liées à l’effort.',
    situations: [
      'Une douleur apparaît pendant l’effort et persiste',
      'Tu reprends après une blessure ou une opération',
      'Tu as besoin d’exercices adaptés à une articulation fragile',
    ],
  },
  {
    id: 'amandine',
    prenom: 'Amandine',
    role: '',
    couleur: '#8a7a3c',
    aide: 'Amandine fait partie de l’équipe qui t’accompagne. Son rôle sera précisé prochainement.',
    situations: ['Tu as une question et tu ne sais pas à qui la poser'],
  },
  {
    id: 'carole',
    prenom: 'Carole',
    role: '',
    couleur: '#a3555a',
    aide: 'Carole fait partie de l’équipe qui t’accompagne. Son rôle sera précisé prochainement.',
    situations: ['Tu as une question et tu ne sais pas à qui la poser'],
  },
]

// Nom affiché : le prénom, ou le métier quand le prénom n'est pas encore connu.
export function proName(p: Pro): string {
  return p.prenom || p.role || 'Membre de l’équipe'
}

// Ligne sous le nom : le métier, ou « Nom à préciser » quand le nom affiché est déjà le métier.
export function proRole(p: Pro): string {
  if (!p.prenom) return 'Nom à préciser'
  return p.role || 'Membre de l’équipe'
}

export function proInitials(p: Pro): string {
  const src = p.prenom || p.role || '?'
  // « JB » reste « JB » ; « Lucie » donne « L ».
  if (/^[A-Z]{2,3}$/.test(src)) return src
  return src.charAt(0).toUpperCase()
}

export function findPro(id: string | undefined): Pro | undefined {
  return PROS.find((p) => p.id === id)
}

// ───── Guide « Vers qui me tourner ? » ─────
// La clé (ex. 'douleur') peut être passée dans l'adresse : /plus/pros?besoin=douleur
// Pour ajouter une situation : copiez un bloc et changez la clé, le texte et les ids de « pros ».
export interface Besoin {
  cle: string
  emoji: string
  situation: string
  conseil: string
  pros: string[]
  // Lien complémentaire facultatif (ex. vers les séances en visio).
  lien?: { to: string; label: string }
}

export const BESOINS: Besoin[] = [
  {
    cle: 'douleur',
    emoji: '🦵',
    situation: 'J’ai mal pendant l’effort',
    conseil:
      'Arrête l’exercice et ne force pas. Si la douleur persiste, parles-en à ton médecin ; le ou la kinésithérapeute ou l’ostéopathe pourront ensuite t’aider à reprendre.',
    pros: ['kine', 'jb'],
  },
  {
    cle: 'alimentation',
    emoji: '🍫',
    situation: 'Je vis des compulsions alimentaires',
    conseil:
      'Ce n’est pas un manque de volonté. Le psychologue aide à comprendre ce qui se joue, la diététicienne à retrouver des repas apaisés.',
    pros: ['antonin', 'lucie'],
  },
  {
    cle: 'moral',
    emoji: '🌧️',
    situation: 'Mon moral est en baisse',
    conseil:
      'En parler aide. Le psychologue est là pour ça. Si tu as des idées noires, appelle tout de suite le 3114 (gratuit, 24 h/24).',
    pros: ['antonin'],
  },
  {
    cle: 'quotidien',
    emoji: '🧺',
    situation: 'Les gestes du quotidien sont difficiles',
    conseil: 'L’ergothérapeute aide à adapter les gestes et l’environnement pour te faciliter la vie.',
    pros: ['fab'],
  },
  {
    cle: 'activite',
    emoji: '🚶',
    situation: 'J’ai envie de reprendre le sport',
    conseil:
      'Super ! Commence doucement avec une séance guidée, et demande conseil à l’équipe pour une activité adaptée.',
    pros: ['lea', 'jb', 'fab'],
    lien: { to: '/plus/visio', label: 'Voir les séances en visio' },
  },
  {
    cle: 'repas',
    emoji: '🥗',
    situation: 'J’ai des questions sur mes repas',
    conseil: 'La diététicienne t’aide à composer des repas simples qui te conviennent, sans interdit.',
    pros: ['lucie'],
  },
]
