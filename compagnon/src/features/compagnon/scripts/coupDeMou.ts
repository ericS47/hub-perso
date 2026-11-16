// Script « J'ai un coup de mou » : accueillir, écouter, puis proposer un petit soutien concret.

import type { Script, ScriptCtx } from '../engine/script'
import type { TurnAction } from '../engine/types'
import { closingWords } from './common'

const POIDS = [
  { value: 'fatigue', label: 'La fatigue' },
  { value: 'travail', label: 'Le travail' },
  { value: 'proches', label: 'La famille ou les proches' },
  { value: 'sante', label: 'La santé ou les douleurs' },
  { value: 'solitude', label: 'La solitude' },
  { value: 'motivation', label: 'La motivation qui s’en va' },
  { value: 'image', label: 'L’image que j’ai de moi' },
  { value: 'sais-pas', label: 'Je ne sais pas trop' },
]

const RESSOURCES = [
  { value: 'bouger', label: 'Bouger un peu' },
  { value: 'parler', label: 'Parler à quelqu’un' },
  { value: 'air', label: 'Prendre l’air' },
  { value: 'musique', label: 'La musique' },
  { value: 'repos', label: 'Me reposer' },
  { value: 'mains', label: 'Faire quelque chose de mes mains' },
  { value: 'animal', label: 'Un animal' },
  { value: 'rien', label: 'Je ne sais pas' },
]

function defis(c: ScriptCtx): string[] {
  return [
    c.t('Ouvre une fenêtre et respire l’air frais pendant une minute.', 'Ouvrez une fenêtre et respirez l’air frais pendant une minute.'),
    c.t('Marche cinq minutes, même juste autour de chez toi.', 'Marchez cinq minutes, même juste autour de chez vous.'),
    c.t('Mets une chanson que tu aimes, et bouge un peu dessus, comme ça vient.', 'Mettez une chanson que vous aimez, et bougez un peu dessus, comme ça vient.'),
    c.t('Étire-toi doucement pendant deux minutes : les bras, le dos, la nuque.', 'Étirez-vous doucement pendant deux minutes : les bras, le dos, la nuque.'),
    c.t('Envoie un petit message à quelqu’un que tu aimes bien.', 'Envoyez un petit message à quelqu’un que vous aimez bien.'),
    c.t('Écris ici une chose, même minuscule, qui s’est bien passée aujourd’hui.', 'Écrivez ici une chose, même minuscule, qui s’est bien passée aujourd’hui.'),
    c.t('Bois un grand verre d’eau, lentement, en pensant à autre chose.', 'Buvez un grand verre d’eau, lentement, en pensant à autre chose.'),
    c.t('Range un seul petit coin : un tiroir, une étagère. Pas plus.', 'Rangez un seul petit coin : un tiroir, une étagère. Pas plus.'),
  ]
}

export const coupDeMou: Script = {
  id: 'coup-de-mou',
  start: 'accueil',
  nodes: {
    accueil: {
      say: (c) => [
        [
          c.t('Je suis là. Merci de venir me voir plutôt que de garder ça pour toi.', 'Je suis là. Merci de venir me voir plutôt que de garder ça pour vous.'),
          c.t('Je suis là. Les coups de mou, ça arrive à tout le monde, et ce n’est pas un échec.', 'Je suis là. Les coups de mou, ça arrive à tout le monde, et ce n’est pas un échec.'),
          c.t('Merci de passer me voir. On prend le temps, rien ne presse.', 'Merci de passer me voir. On prend le temps, rien ne presse.'),
        ],
        c.t('Qu’est-ce qui pèse le plus en ce moment ?', 'Qu’est-ce qui pèse le plus en ce moment ?'),
      ],
      input: { kind: 'choice', multiple: true, options: POIDS, allowText: true, placeholder: 'Avec mes mots…' },
      question: 'Ce qui pèse',
      next: 'moral',
    },
    moral: {
      say: (c) => {
        const l = c.labels('accueil').filter((x) => x !== 'je ne sais pas trop')
        return [
          l.length
            ? [
                c.t(`Donc il y a ${l.join(', ')}. Je comprends que ça puisse peser lourd.`, `Donc il y a ${l.join(', ')}. Je comprends que ça puisse peser lourd.`),
                c.t(`${l.length > 1 ? 'Ça fait beaucoup de choses à porter' : 'C’est quelque chose de lourd à porter'}. Merci de me le dire.`, `${l.length > 1 ? 'Ça fait beaucoup de choses à porter' : 'C’est quelque chose de lourd à porter'}. Merci de me le dire.`),
              ]
            : c.text('accueil')
              ? c.t('Merci de l’avoir mis en mots.', 'Merci de l’avoir mis en mots.')
              : c.t('Parfois on ne sait pas trop ce qui pèse, et c’est normal aussi.', 'Parfois on ne sait pas trop ce qui pèse, et c’est normal aussi.'),
          c.t('Ton moral, là, maintenant, tu le placerais où ?', 'Votre moral, là, maintenant, vous le placeriez où ?'),
        ]
      },
      input: { kind: 'scale', minLabel: 'Au plus bas', maxLabel: 'Au top', measure: 'moral' },
      question: 'Moral (0-10)',
      next: 'passe',
    },
    passe: {
      say: (c) => {
        const m = c.num('moral')
        return [
          m === undefined
            ? null
            : m <= 4
              ? c.t('C’est un moral bien bas. Merci de me le dire franchement.', 'C’est un moral bien bas. Merci de me le dire franchement.')
              : m <= 6
                ? c.t('Un moral entre deux eaux, je vois.', 'Un moral entre deux eaux, je vois.')
                : c.t('Ça tient, même si ce n’est pas la grande forme.', 'Ça tient, même si ce n’est pas la grande forme.'),
          c.t('Les autres fois où tu as eu un coup de mou, qu’est-ce qui a aidé, même un peu ?', 'Les autres fois où vous avez eu un coup de mou, qu’est-ce qui a aidé, même un peu ?'),
        ]
      },
      input: { kind: 'choice', multiple: true, options: RESSOURCES, allowText: true, placeholder: 'Autre chose…' },
      question: 'Ce qui a déjà aidé',
      next: 'propose',
    },
    propose: {
      say: (c) => {
        const r = c.labels('passe').filter((x) => x !== 'je ne sais pas')
        return [
          r.length
            ? c.t(`Tu as déjà des ressources : ${r.join(', ')}. Ça compte, et c’est à toi.`, `Vous avez déjà des ressources : ${r.join(', ')}. Ça compte, et elles sont à vous.`)
            : c.t('Pas facile de s’en souvenir quand on est au creux de la vague. On va chercher ensemble.', 'Pas facile de s’en souvenir quand on est au creux de la vague. On va chercher ensemble.'),
          c.t('Là, maintenant, qu’est-ce qui te ferait du bien ?', 'Là, maintenant, qu’est-ce qui vous ferait du bien ?'),
        ]
      },
      input: (c) => ({
        kind: 'choice',
        options: [
          { value: 'respirer', label: `🌬️ Respirer avec ${c.name} 2 minutes` },
          { value: 'raisons', label: '💛 Me rappeler pourquoi je fais tout ça' },
          { value: 'defi', label: '🌱 Un petit défi tout doux' },
          { value: 'jeu', label: '🎲 Me changer les idées avec un jeu' },
          { value: 'rien', label: 'Juste en parler, ça me suffit' },
        ],
      }),
      question: 'Ce qui ferait du bien',
      next: (_c, a) => {
        const v = a.values?.[0]
        return v === 'respirer' || v === 'raisons' || v === 'defi' || v === 'jeu' ? v : 'fin'
      },
    },

    respirer: {
      say: (c) => [
        c.t(
          'Bonne idée. On va respirer ensemble : tu inspires quand le cercle grandit, tu expires quand il rétrécit. Rien à réussir, juste à suivre.',
          'Bonne idée. On va respirer ensemble : vous inspirez quand le cercle grandit, vous expirez quand il rétrécit. Rien à réussir, juste à suivre.',
        ),
        c.t('Touche le bouton quand tu veux, puis reviens me dire.', 'Touchez le bouton quand vous voulez, puis revenez me dire.'),
      ],
      actions: () => [{ kind: 'breathing', label: '🌬️ Commencer la respiration' }],
      input: {
        kind: 'choice',
        options: [
          { value: 'fait', label: 'C’est fait' },
          { value: 'plus-tard', label: 'Plutôt plus tard' },
        ],
      },
      question: 'Respiration',
      next: (_c, a) => (a.values?.[0] === 'fait' ? 'apres-respi' : 'fin'),
    },
    'apres-respi': {
      say: (c) => [c.t('Comment tu te sens, maintenant ?', 'Comment vous sentez-vous, maintenant ?')],
      input: {
        kind: 'choice',
        options: [
          { value: 'mieux', label: '🙂 Un peu mieux' },
          { value: 'pareil', label: '😐 Pareil' },
          { value: 'moins', label: '🙁 Moins bien' },
        ],
      },
      question: 'Après la respiration',
      next: 'fin',
    },

    raisons: {
      say: (c) => {
        const a = c.context.attentes
        return a.length
          ? [
              c.t('Tu m’avais confié ce qui compte pour toi :', 'Vous m’aviez confié ce qui compte pour vous :'),
              ...a.slice(0, 3).map((x) => `« ${x} »`),
              c.t('Qu’est-ce que ça te fait de relire ça aujourd’hui ?', 'Qu’est-ce que ça vous fait de relire ça aujourd’hui ?'),
            ]
          : [
              c.t(
                'Tu n’as pas encore noté tes attentes dans ton profil. Tu veux me dire, en quelques mots, ce qui t’a donné envie de te lancer dans ce projet ?',
                'Vous n’avez pas encore noté vos attentes dans votre profil. Vous voulez me dire, en quelques mots, ce qui vous a donné envie de vous lancer dans ce projet ?',
              ),
            ]
      },
      input: (c) =>
        c.context.attentes.length
          ? {
              kind: 'choice',
              options: [
                { value: 'elan', label: 'Ça me redonne un peu d’élan' },
                { value: 'touche', label: 'Ça me touche' },
                { value: 'pas-grand-chose', label: 'Pas grand-chose aujourd’hui' },
              ],
              allowText: true,
              placeholder: 'Avec mes mots…',
            }
          : { kind: 'text', long: true, placeholder: c.t('Ce qui compte pour moi…', 'Ce qui compte pour moi…') },
      question: 'Mes raisons',
      next: 'fin',
    },

    defi: {
      say: (c) => {
        const deja = c.answer('defi') !== undefined
        return [
          deja ? c.t('Un autre, alors :', 'Un autre, alors :') : c.t('Voilà un petit défi, tout doux :', 'Voilà un petit défi, tout doux :'),
          c.pick(defis(c)),
          c.t('Ça te dit ?', 'Ça vous dit ?'),
        ]
      },
      input: {
        kind: 'choice',
        options: [
          { value: 'ok', label: '💪 Je relève le défi' },
          { value: 'autre', label: '🔄 Un autre' },
          { value: 'non', label: 'Pas maintenant' },
        ],
      },
      question: 'Petit défi',
      next: (_c, a) => (a.values?.[0] === 'autre' ? 'defi' : 'fin'),
    },

    jeu: {
      say: (c) => [
        c.t('Bonne idée : se changer les idées, ça aide parfois à faire redescendre la pression.', 'Bonne idée : se changer les idées, ça aide parfois à faire redescendre la pression.'),
        c.t('Les jeux t’attendent juste ici. On termine d’abord ?', 'Les jeux vous attendent juste ici. On termine d’abord ?'),
      ],
      input: { kind: 'choice', options: [{ value: 'ok', label: 'D’accord' }] },
      question: 'Jeu',
      next: 'fin',
    },

    fin: {
      say: (c) => {
        const l = c.labels('accueil').filter((x) => x !== 'je ne sais pas trop')
        const m = c.num('moral')
        const choix = c.value('propose')
        const morceaux = [
          l.length ? `ce qui pèse en ce moment : ${l.join(', ')}` : null,
          m !== undefined ? `ton moral est à ${m}/10` : null,
        ].filter(Boolean) as string[]
        const morceauxVous = morceaux.map((s) => s.replace('ton moral', 'votre moral'))
        return [
          morceaux.length
            ? c.t(`Si je résume ce que tu m’as dit : ${morceaux.join(' ; ')}.`, `Si je résume ce que vous m’avez dit : ${morceauxVous.join(' ; ')}.`)
            : c.t('Merci d’avoir pris ce moment avec moi.', 'Merci d’avoir pris ce moment avec moi.'),
          choix === 'respirer' && c.value('apres-respi') === 'mieux'
            ? c.t('Et la respiration t’a fait un peu de bien : tu peux la refaire quand tu veux.', 'Et la respiration vous a fait un peu de bien : vous pouvez la refaire quand vous voulez.')
            : null,
          choix === 'defi' && c.value('defi') === 'ok'
            ? c.t('Et tu relèves un petit défi : bravo, chaque petit pas compte.', 'Et vous relevez un petit défi : bravo, chaque petit pas compte.')
            : null,
          choix === 'rien'
            ? c.t('Parfois, simplement déposer les choses, ça suffit. Ça me fait plaisir d’avoir été là.', 'Parfois, simplement déposer les choses, ça suffit. Ça me fait plaisir d’avoir été là.')
            : null,
          m !== undefined && m <= 4
            ? c.t(
                'Si ce moral bas dure plusieurs jours, parles-en à ton médecin ou au psychologue de ton équipe : ils sont là pour ça aussi.',
                'Si ce moral bas dure plusieurs jours, parlez-en à votre médecin ou au psychologue de votre équipe : ils sont là pour ça aussi.',
              )
            : null,
          [
            c.t('Les coups de mou passent, même quand on a du mal à y croire. Et tu n’as pas à les traverser sans soutien.', 'Les coups de mou passent, même quand on a du mal à y croire. Et vous n’avez pas à les traverser sans soutien.'),
            c.t('Tu as pris soin de toi en venant en parler. C’est loin d’être rien.', 'Vous avez pris soin de vous en venant en parler. C’est loin d’être rien.'),
          ],
          closingWords(c),
        ]
      },
      actions: (c) => {
        const choix = c.value('propose')
        const acts: TurnAction[] = []
        if (choix === 'jeu') acts.push({ kind: 'link', to: '/jeux', label: '🎲 Aller aux jeux' })
        if (choix === 'respirer') acts.push({ kind: 'breathing', label: '🌬️ Refaire la respiration' })
        if ((c.num('moral') ?? 10) <= 4) acts.push({ kind: 'link', to: '/plus/pros?besoin=moral', label: 'Voir mon équipe soignante' })
        if (choix === 'raisons' && !c.context.attentes.length) acts.push({ kind: 'link', to: '/profil', label: 'Compléter mon profil' })
        return acts
      },
    },
  },
}
