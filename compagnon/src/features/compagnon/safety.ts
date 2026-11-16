// ═══════════════════════════════════════════════════════════════════════════
//  SÉCURITÉ — repérage local de signes de détresse
// ═══════════════════════════════════════════════════════════════════════════
//
//  Tout se passe sur le téléphone : aucun texte n'est envoyé nulle part.
//
//  Quand déclenche-t-on le message de sécurité ?
//    1. Un texte libre écrit par la personne contient une des expressions
//       de la liste EXPRESSIONS_DETRESSE ci-dessous ;
//    2. ou la personne place son moral à 2 ou moins sur 10 (MORAL_SEUIL).
//
//  Alors le compagnon interrompt la conversation, répond avec chaleur, rappelle
//  qu'il n'est qu'une application et donne les numéros d'aide (3114, 15, 112).
//  La personne peut ensuite reprendre la conversation ou s'arrêter.
//
//  On préfère une fausse alerte (message doux, sans dramatiser) à un oubli.
//  La recherche ignore majuscules, accents et apostrophes : « J’ai plus envie
//  de vivre » est reconnu par l'expression « plus envie de vivre ».
//
//  POUR LES SOIGNANTS : la liste se lit et se complète simplement.
//    - Une ligne = une expression, écrite naturellement (accents permis).
//    - Un astérisque * en fin de mot accepte toutes les terminaisons :
//      « suicid* » reconnaît suicide, suicider, suicidaire…
//    - Les expressions sont cherchées comme des mots entiers.
//    - Volontairement absents (trop de fausses alertes dans une appli sportive) :
//      « me faire mal » (« j'ai peur de me faire mal au genou »), « mourir » seul
//      (« mourir de rire »), « en finir » seul (« en finir avec les grignotages »).
// ═══════════════════════════════════════════════════════════════════════════

export const MORAL_SEUIL = 2

export const EXPRESSIONS_DETRESSE: string[] = [
  // Suicide, idées de mort
  'suicid*',
  'me tuer',
  'me foutre en l’air',
  'me flinguer',
  'envie de mourir',
  'veux mourir',
  'voudrais mourir',
  'aimerais mourir',
  'préférerais mourir',
  'préfère mourir',
  'plutôt mourir',
  'envie de crever',
  'veux crever',
  'mieux mort',
  'mieux morte',
  'pas me réveiller',
  'plus me réveiller',
  'jamais me réveiller',
  'disparaître pour toujours',
  'envie de disparaître',
  'veux disparaître',

  // En finir
  'envie d’en finir',
  'veux en finir',
  'vais en finir',
  'voudrais en finir',
  'en finir avec la vie',
  'en finir avec tout',
  'en finir une bonne fois',
  'mettre fin à mes jours',
  'mettre fin à ma vie',
  'mettre un terme à ma vie',

  // Plus envie de vivre, perte de sens
  'plus envie de vivre',
  'pas envie de vivre',
  'envie de ne plus vivre',
  'marre de vivre',
  'fatigué de vivre',
  'fatiguée de vivre',
  'las de vivre',
  'lasse de vivre',
  'plus de raison de vivre',
  'aucune raison de vivre',
  'à quoi bon vivre',
  'sert à rien de vivre',
  'la vie ne vaut pas',
  'ma vie ne vaut rien',
  'je ne vaux rien',
  'mieux sans moi',
  'personne ne me regretterait',
  'personne ne me regrettera',
  'je suis un fardeau',
  'plus la force de vivre',
  'plus la force de continuer',
  'je n’en peux plus de vivre',

  // Se faire du mal
  'me faire du mal',
  'me blesser exprès',
  'me blesser volontairement',
  'me mutiler',
  'automutil*',
  'me scarifier',
  'scarif*',
  'me couper les veines',
  'me pendre',
  'pendaison',
  'sauter du pont',
  'sauter par la fenêtre',
  'me jeter sous',
  'me jeter du',
  'avaler mes médicaments',
  'avaler tous mes médicaments',
  'prendre tous mes médicaments',
  'overdose',
]

// Minuscules, sans accents, apostrophes et tirets remplacés par des espaces.
export function normaliser(texte: string): string {
  return texte
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’'`´\-–—_.,;:!?«»"()[\]/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const MOTIFS: RegExp[] = EXPRESSIONS_DETRESSE.map((expr) => {
  const etoile = expr.endsWith('*')
  const base = normaliser(etoile ? expr.slice(0, -1) : expr)
  const echappe = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(^| )${echappe}${etoile ? '[a-z]*' : ''}( |$)`)
})

// Vrai si le texte contient une expression de détresse.
export function texteInquietant(texte: string | undefined): boolean {
  if (!texte) return false
  const t = normaliser(texte)
  return MOTIFS.some((m) => m.test(t))
}

// Vrai si le moral (0 à 10) est au plus bas.
export function moralInquietant(moral: number | undefined): boolean {
  return moral !== undefined && moral <= MORAL_SEUIL
}

// Numéros d'aide affichés dans le message de sécurité (liens tel: cliquables).
export const NUMEROS_AIDE = [
  {
    numero: '3114',
    titre: '3114',
    detail: 'Numéro national de prévention du suicide. Gratuit, 24 h/24, 7 j/7.',
  },
  { numero: '15', titre: '15 — SAMU', detail: 'Urgence médicale.' },
  { numero: '112', titre: '112', detail: 'Numéro d’urgence européen, depuis n’importe quel téléphone.' },
]
