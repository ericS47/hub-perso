// Scripts « J'ai grignoté » et « J'ai eu une compulsion ».
// Esprit : comprendre sans juger, relier émotion et comportement, déculpabiliser.
// Aucun conseil nutritionnel prescriptif, aucune notion de calories ou de poids.

import type { Script, ScriptCtx } from '../engine/script'
import type { TurnAction } from '../engine/types'
import { closingWords, emotionsPhrase } from './common'

type Kind = 'grignotage' | 'compulsion'

export const MOMENTS = [
  { value: 'matin', label: '🌅 Le matin' },
  { value: 'midi', label: '🍽️ Vers midi' },
  { value: 'apres-midi', label: '☀️ L’après-midi' },
  { value: 'soir', label: '🌆 Le soir' },
  { value: 'nuit', label: '🌙 La nuit' },
]

const LIEUX = [
  { value: 'maison', label: 'À la maison', phrase: 'à la maison' },
  { value: 'travail', label: 'Au travail', phrase: 'au travail' },
  { value: 'voiture', label: 'En voiture', phrase: 'en voiture' },
  { value: 'dehors', label: 'Dehors', phrase: 'dehors' },
  { value: 'chez', label: 'Chez quelqu’un', phrase: 'chez quelqu’un' },
]

const AVEC = [
  { value: 'personne', label: 'Personne' },
  { value: 'famille', label: 'En famille' },
  { value: 'amis', label: 'Avec des amis' },
  { value: 'collegues', label: 'Avec des collègues' },
]

const APRES = [
  { value: 'soulagement', label: 'Du soulagement' },
  { value: 'calme', label: 'Du calme' },
  { value: 'culpabilite', label: 'De la culpabilité' },
  { value: 'honte', label: 'De la honte' },
  { value: 'tristesse', label: 'De la tristesse' },
  { value: 'colere', label: 'De la colère contre moi' },
  { value: 'rien', label: 'Rien de particulier' },
]

export const A_ESSAYER = [
  { value: 'respirer', label: '🌬️ Respirer calmement une minute' },
  { value: 'appeler', label: '📞 Appeler ou écrire à quelqu’un' },
  { value: 'eau', label: '💧 Boire un verre d’eau' },
  { value: 'marcher', label: '🚶 Sortir marcher 5 minutes' },
  { value: 'noter', label: '✍️ Noter l’émotion ici' },
]

const mot = (k: Kind) => (k === 'compulsion' ? 'cette compulsion' : 'ce grignotage')

// Moment difficile : intensité forte, ou honte / tristesse / colère après coup avec une intensité marquée.
function forteDetresse(c: ScriptCtx): boolean {
  const i = c.num('intensite') ?? 0
  const apres = c.values('apres')
  return i >= 8 || (i >= 6 && apres.some((v) => v === 'honte' || v === 'tristesse' || v === 'colere'))
}

function frequent(c: ScriptCtx, k: Kind): boolean {
  // Nombre d'entrées des 14 derniers jours, sans compter celle-ci.
  const n = c.context.recent[k] ?? 0
  return k === 'compulsion' ? n >= 2 : n >= 6
}

function make(k: Kind): Script {
  return {
    id: k,
    start: 'accueil',
    nodes: {
      accueil: {
        say: (c) => [
          k === 'compulsion'
            ? [
                c.t('Merci de me le confier. Une compulsion, c’est souvent un moment difficile, et tu as eu le courage d’en parler.', 'Merci de me le confier. Une compulsion, c’est souvent un moment difficile, et vous avez eu le courage d’en parler.'),
                c.t('Je suis là. Ici, aucun jugement : on va juste essayer de comprendre ensemble ce qui s’est passé.', 'Je suis là. Ici, aucun jugement : on va juste essayer de comprendre ensemble ce qui s’est passé.'),
              ]
            : [
                c.t('Merci de me le dire. Ici, pas de jugement : on essaie juste de comprendre ensemble.', 'Merci de me le dire. Ici, pas de jugement : on essaie juste de comprendre ensemble.'),
                c.t('Ça arrive, et c’est très bien d’en parler. On regarde ça tranquillement ?', 'Ça arrive, et c’est très bien d’en parler. On regarde ça tranquillement ?'),
              ],
          c.t('Pour commencer : c’était à quel moment de la journée ?', 'Pour commencer : c’était à quel moment de la journée ?'),
        ],
        input: { kind: 'choice', options: MOMENTS },
        question: 'À quel moment',
        next: 'ou',
      },
      ou: {
        say: (c) => [c.t('Et tu étais où ?', 'Et vous étiez où ?')],
        input: { kind: 'choice', options: LIEUX.map(({ value, label }) => ({ value, label })), allowText: true, placeholder: 'Ailleurs…' },
        question: 'Où',
        next: 'avec',
      },
      avec: {
        say: (c) => [c.t('Il y avait quelqu’un avec toi ?', 'Il y avait quelqu’un avec vous ?')],
        input: { kind: 'choice', options: AVEC, allowText: true, placeholder: 'Autre…' },
        question: 'Avec qui',
        next: 'raconte',
      },
      raconte: {
        say: (c) => [
          c.t('Si tu veux, raconte-moi avec tes mots comment ça s’est passé. Tu peux aussi passer cette question.', 'Si vous voulez, racontez-moi avec vos mots comment ça s’est passé. Vous pouvez aussi passer cette question.'),
        ],
        input: (c) => ({ kind: 'text', long: true, placeholder: c.t('Ce qui s’est passé…', 'Ce qui s’est passé…') }),
        question: 'Ce qui s’est passé',
        next: 'faim',
      },
      faim: {
        say: (c) => [
          c.text('raconte')
            ? [
                c.t('Merci, je vois mieux la scène.', 'Merci, je vois mieux la scène.'),
                c.t('D’accord. Merci de m’avoir raconté.', 'D’accord. Merci de m’avoir raconté.'),
              ]
            : null,
          c.t(
            'Juste avant, est-ce que ton ventre avait faim ? Situe-le de 0 (pas faim du tout) à 10 (très faim).',
            'Juste avant, est-ce que votre ventre avait faim ? Situez-le de 0 (pas faim du tout) à 10 (très faim).',
          ),
        ],
        input: { kind: 'scale', minLabel: 'Pas faim du tout', maxLabel: 'Très faim', measure: 'faim' },
        question: 'Faim du ventre (0-10)',
        next: 'emotions',
      },
      emotions: {
        say: (c) => {
          const f = c.num('faim')
          return [
            f === undefined
              ? null
              : f >= 7
                ? c.t('Ton corps avait vraiment faim. C’est un signal normal, qui mérite d’être écouté.', 'Votre corps avait vraiment faim. C’est un signal normal, qui mérite d’être écouté.')
                : f <= 3
                  ? c.t('Donc ce n’était pas vraiment la faim du ventre. Souvent, dans ces moments-là, c’est une émotion qui cherche une sortie.', 'Donc ce n’était pas vraiment la faim du ventre. Souvent, dans ces moments-là, c’est une émotion qui cherche une sortie.')
                  : c.t('Un peu de faim, et peut-être autre chose aussi.', 'Un peu de faim, et peut-être autre chose aussi.'),
            c.t('Qu’est-ce que tu ressentais juste avant ? Tu peux choisir plusieurs émotions.', 'Qu’est-ce que vous ressentiez juste avant ? Vous pouvez choisir plusieurs émotions.'),
          ]
        },
        input: { kind: 'emotions', allowText: true },
        question: 'Émotions avant',
        next: 'intensite',
      },
      intensite: {
        say: (c) => {
          const e = emotionsPhrase(c.values('emotions'), c.text('emotions'))
          return [
            e
              ? [
                  c.t(`Il y avait ${e}. Merci de mettre des mots dessus, ce n’est pas toujours simple.`, `Il y avait ${e}. Merci de mettre des mots dessus, ce n’est pas toujours simple.`),
                  c.t(`D’accord : ${e}. Je comprends que ça ait pu peser.`, `D’accord : ${e}. Je comprends que ça ait pu peser.`),
                ]
              : null,
            e
              ? c.t('C’était fort comment, de 0 à 10 ?', 'C’était fort comment, de 0 à 10 ?')
              : c.t('Et cette envie de manger, elle était forte comment, de 0 à 10 ?', 'Et cette envie de manger, elle était forte comment, de 0 à 10 ?'),
          ]
        },
        input: { kind: 'scale', minLabel: 'Très léger', maxLabel: 'Très fort', measure: 'intensity' },
        question: 'Intensité',
        next: 'declencheur',
      },
      declencheur: {
        say: (c) => [
          (c.num('intensite') ?? 0) >= 7
            ? c.t('C’était intense. Je comprends que ça ait été difficile à traverser.', 'C’était intense. Je comprends que ça ait été difficile à traverser.')
            : null,
          c.t('D’après toi, qu’est-ce qui a pu déclencher ce moment ?', 'D’après vous, qu’est-ce qui a pu déclencher ce moment ?'),
        ],
        input: {
          kind: 'choice',
          multiple: true,
          options: [
            { value: 'contrariete', label: 'Une contrariété' },
            { value: 'dispute', label: 'Une dispute' },
            { value: 'journee', label: 'Une journée difficile' },
            { value: 'fatigue', label: 'La fatigue' },
            { value: 'ennui', label: 'L’ennui' },
            { value: 'vue', label: 'La nourriture était sous mes yeux' },
            { value: 'sais-pas', label: 'Je ne sais pas' },
          ],
          allowText: true,
          placeholder: 'Autre chose…',
        },
        question: 'Déclencheur',
        next: 'apres',
      },
      apres: {
        say: (c) => [
          c.t('Et après, comment tu te sens ?', 'Et après, comment vous sentez-vous ?'),
        ],
        input: { kind: 'choice', multiple: true, options: APRES, allowText: true, placeholder: 'Autre chose…' },
        question: 'Après',
        next: 'essayer',
      },
      essayer: {
        say: (c) => {
          const apres = c.values('apres')
          const lourd = apres.some((v) => v === 'culpabilite' || v === 'honte' || v === 'colere')
          const e = emotionsPhrase(c.values('emotions'), c.text('emotions'))
          return [
            lourd
              ? c.t(
                  'Je tiens à te le dire clairement : tu n’as pas à te sentir coupable. Manger pour apaiser une émotion, c’est un réflexe très humain, pas un manque de volonté.',
                  'Je tiens à vous le dire clairement : vous n’avez pas à vous sentir coupable. Manger pour apaiser une émotion, c’est un réflexe très humain, pas un manque de volonté.',
                )
              : [
                  c.t('Tu n’as rien fait de mal. Manger pour se réconforter, beaucoup de gens le font, c’est humain.', 'Vous n’avez rien fait de mal. Manger pour se réconforter, beaucoup de gens le font, c’est humain.'),
                  c.t('Pas de culpabilité à avoir : ce moment ne dit rien de ta valeur ni de ta volonté.', 'Pas de culpabilité à avoir : ce moment ne dit rien de votre valeur ni de votre volonté.'),
                ],
            e
              ? c.t(
                  `Ce que tu viens de décrire est précieux : avant ${mot(k)}, il y avait ${e}. La nourriture est peut-être venue apaiser ce moment. Repérer ce lien, c’est déjà reprendre un peu la main.`,
                  `Ce que vous venez de décrire est précieux : avant ${mot(k)}, il y avait ${e}. La nourriture est peut-être venue apaiser ce moment. Repérer ce lien, c’est déjà reprendre un peu la main.`,
                )
              : c.t(
                  'Prendre le temps de regarder ce moment, c’est déjà commencer à comprendre ce qui se joue. Les émotions et l’envie de manger sont souvent liées.',
                  'Prendre le temps de regarder ce moment, c’est déjà commencer à comprendre ce qui se joue. Les émotions et l’envie de manger sont souvent liées.',
                ),
            c.t(
              'La prochaine fois que tu sens cette émotion monter, tu voudrais essayer quelque chose ? Choisis ce qui te parle, même une seule idée.',
              'La prochaine fois que vous sentez cette émotion monter, vous voudriez essayer quelque chose ? Choisissez ce qui vous parle, même une seule idée.',
            ),
          ]
        },
        input: { kind: 'choice', multiple: true, options: A_ESSAYER, allowText: true, placeholder: 'Une autre idée…' },
        question: 'À essayer la prochaine fois',
        next: 'fin',
      },
      fin: {
        say: (c) => {
          const moment = MOMENTS.find((m) => m.value === c.value('accueil'))?.label.replace(/^\S+\s/, '').toLowerCase()
          const lieu = LIEUX.find((l) => l.value === c.value('ou'))?.phrase
          const e = emotionsPhrase(c.values('emotions'), c.text('emotions'))
          const i = c.num('intensite')
          const f = c.num('faim')
          const apres = c.labels('apres').filter((l) => l !== 'rien de particulier')
          const essais = c.labels('essayer').map((l) => l.replace(/^\S+\s/, '').toLowerCase())

          const contexte = [moment, lieu].filter(Boolean).join(', ')
          const lignes: string[] = []
          if (contexte) lignes.push(c.t(`c’était ${contexte}`, `c’était ${contexte}`))
          if (f !== undefined && f <= 3) lignes.push(c.t('ce n’était pas vraiment la faim du ventre', 'ce n’était pas vraiment la faim du ventre'))
          if (e) lignes.push(`avant, il y avait ${e}${i !== undefined ? ` (${i}/10)` : ''}`)
          if (apres.length) lignes.push(`après, ${apres.join(', ')}`)

          const out: (string | readonly string[] | null)[] = [
            lignes.length
              ? c.t(`Si je résume ce que tu m’as dit : ${lignes.join(' ; ')}.`, `Si je résume ce que vous m’avez dit : ${lignes.join(' ; ')}.`)
              : c.t('Merci d’avoir pris ce moment pour en parler, même sans tout détailler.', 'Merci d’avoir pris ce moment pour en parler, même sans tout détailler.'),
            essais.length
              ? c.t(`Pour la prochaine fois, tu as envie d’essayer : ${essais.join(', ')}. C’est ton idée, et elle est bonne.`, `Pour la prochaine fois, vous avez envie d’essayer : ${essais.join(', ')}. C’est votre idée, et elle est bonne.`)
              : null,
          ]
          if (frequent(c, k) || forteDetresse(c)) {
            out.push(
              k === 'compulsion' && frequent(c, k)
                ? c.t(
                    'J’ai remarqué que ces moments reviennent ces derniers temps. Tu n’as pas à les porter sans aide : la diététicienne ou le psychologue de ton équipe connaissent bien ces situations, sans jugement. Ce serait une bonne idée de leur en parler.',
                    'J’ai remarqué que ces moments reviennent ces derniers temps. Vous n’avez pas à les porter sans aide : la diététicienne ou le psychologue de votre équipe connaissent bien ces situations, sans jugement. Ce serait une bonne idée de leur en parler.',
                  )
                : c.t(
                    'Ce moment a l’air d’avoir été lourd. La diététicienne ou le psychologue de ton équipe peuvent t’aider à y voir plus clair, sans jugement. N’hésite pas à leur en parler.',
                    'Ce moment a l’air d’avoir été lourd. La diététicienne ou le psychologue de votre équipe peuvent vous aider à y voir plus clair, sans jugement. N’hésitez pas à leur en parler.',
                  ),
            )
          }
          out.push(
            [
              c.t('Tu as fait quelque chose d’important aujourd’hui : regarder ce moment avec curiosité plutôt qu’avec sévérité.', 'Vous avez fait quelque chose d’important aujourd’hui : regarder ce moment avec curiosité plutôt qu’avec sévérité.'),
              c.t('Chaque fois que tu en parles, tu te connais un peu mieux. C’est comme ça qu’on avance.', 'Chaque fois que vous en parlez, vous vous connaissez un peu mieux. C’est comme ça qu’on avance.'),
            ],
            closingWords(c),
          )
          return out
        },
        actions: (c) => {
          const acts: TurnAction[] = []
          if (c.values('essayer').includes('respirer')) acts.push({ kind: 'breathing', label: '🌬️ Essayer la respiration maintenant' })
          if (frequent(c, k) || forteDetresse(c)) acts.push({ kind: 'link', to: '/plus/pros?besoin=alimentation', label: 'Voir mon équipe soignante' })
          return acts
        },
      },
    },
  }
}

export const grignotage = make('grignotage')
export const compulsion = make('compulsion')
