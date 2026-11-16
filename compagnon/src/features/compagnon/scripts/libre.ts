// Scripts « J'ai juste envie d'écrire » et « J'ai une bonne nouvelle à partager » (rangés en 'libre').

import type { Script } from '../engine/script'
import { closingWords, emotionsPhrase } from './common'

export const BONNE_NOUVELLE_QUESTION = 'Bonne nouvelle'

export const libre: Script = {
  id: 'libre',
  start: 'ecrire',
  nodes: {
    ecrire: {
      say: (c) => [
        [
          c.t('Cet espace est à toi. Écris ce que tu veux, comme ça vient : il n’y a pas de bonne ou de mauvaise façon.', 'Cet espace est à vous. Écrivez ce que vous voulez, comme ça vient : il n’y a pas de bonne ou de mauvaise façon.'),
          c.t('Je t’écoute. Pose ici ce qui te traverse, sans te soucier de l’orthographe ni de la forme.', 'Je vous écoute. Posez ici ce qui vous traverse, sans vous soucier de l’orthographe ni de la forme.'),
        ],
        c.t('Ce que tu écris reste sur ton téléphone.', 'Ce que vous écrivez reste sur votre téléphone.'),
      ],
      input: (c) => ({ kind: 'text', long: true, placeholder: c.t('J’écris ce que je veux…', 'J’écris ce que je veux…') }),
      question: 'Écriture libre',
      next: 'emotion',
    },
    emotion: {
      say: (c) => [
        c.text('ecrire')
          ? [
              c.t('Merci de l’avoir déposé ici. Ça compte.', 'Merci de l’avoir déposé ici. Ça compte.'),
              c.t('Merci. Mettre des mots, c’est déjà alléger un peu les choses.', 'Merci. Mettre des mots, c’est déjà alléger un peu les choses.'),
            ]
          : null,
        c.t('Si tu devais mettre un mot sur ce que tu ressens, ce serait… ? (Tu peux passer.)', 'Si vous deviez mettre un mot sur ce que vous ressentez, ce serait… ? (Vous pouvez passer.)'),
      ],
      input: { kind: 'emotions', allowText: true },
      question: 'Émotions',
      next: 'fin',
    },
    fin: {
      say: (c) => {
        const e = emotionsPhrase(c.values('emotion'), c.text('emotion'))
        return [
          c.text('ecrire')
            ? c.t(
                `Si je résume : tu as pris le temps d’écrire ce qui te traversait${e ? `, avec ${e}` : ''}.`,
                `Si je résume : vous avez pris le temps d’écrire ce qui vous traversait${e ? `, avec ${e}` : ''}.`,
              )
            : c.t('Merci pour ce petit passage, même sans écrire beaucoup.', 'Merci pour ce petit passage, même sans écrire beaucoup.'),
          [
            c.t('Écrire, c’est une belle façon de prendre soin de soi.', 'Écrire, c’est une belle façon de prendre soin de soi.'),
            c.t('Tu pourras relire ces mots plus tard, et voir le chemin parcouru.', 'Vous pourrez relire ces mots plus tard, et voir le chemin parcouru.'),
          ],
          closingWords(c),
        ]
      },
    },
  },
}

export const bonneNouvelle: Script = {
  id: 'bonne-nouvelle',
  start: 'nouvelle',
  nodes: {
    nouvelle: {
      say: (c) => [
        [
          c.t('Oh, j’adore les bonnes nouvelles ! Raconte-moi.', 'Oh, j’adore les bonnes nouvelles ! Racontez-moi.'),
          c.t('Une bonne nouvelle ? Vas-y, je suis tout ouïe !', 'Une bonne nouvelle ? Allez-y, je suis tout ouïe !'),
        ],
      ],
      input: (c) => ({ kind: 'text', long: true, placeholder: c.t('Ma bonne nouvelle…', 'Ma bonne nouvelle…') }),
      question: BONNE_NOUVELLE_QUESTION,
      next: 'ressenti',
    },
    ressenti: {
      say: (c) => [
        c.text('nouvelle')
          ? [c.t('Ça fait vraiment plaisir à lire !', 'Ça fait vraiment plaisir à lire !'), c.t('Génial, merci de me le partager !', 'Génial, merci de me le partager !')]
          : null,
        c.t('Et qu’est-ce que ça te fait ?', 'Et qu’est-ce que ça vous fait ?'),
      ],
      input: { kind: 'emotions', allowText: true },
      question: 'Émotions',
      next: 'merite',
    },
    merite: {
      say: (c) => [
        c.t('Et toi, qu’est-ce que tu as fait pour que ça arrive ? Ta part compte, même petite.', 'Et vous, qu’est-ce que vous avez fait pour que ça arrive ? Votre part compte, même petite.'),
      ],
      input: (c) => ({ kind: 'text', placeholder: c.t('Ce que j’ai fait…', 'Ce que j’ai fait…') }),
      question: 'Ma part',
      next: 'fin',
    },
    fin: {
      say: (c) => {
        const e = emotionsPhrase(c.values('ressenti'), c.text('ressenti'))
        const part = c.text('merite')
        return [
          c.t(
            `Si je résume : tu as une bonne nouvelle${e ? `, qui t’apporte ${e}` : ''}${part ? `, et tu y es pour quelque chose : « ${part} »` : ''}.`,
            `Si je résume : vous avez une bonne nouvelle${e ? `, qui vous apporte ${e}` : ''}${part ? `, et vous y êtes pour quelque chose : « ${part} »` : ''}.`,
          ),
          [
            c.t('Bravo. Garde ce moment en tête : il pourra te servir les jours plus gris.', 'Bravo. Gardez ce moment en tête : il pourra vous servir les jours plus gris.'),
            c.t('Savoure-le. Ces moments-là, on les oublie trop vite : ici, ils sont gardés.', 'Savourez-le. Ces moments-là, on les oublie trop vite : ici, ils sont gardés.'),
          ],
          closingWords(c),
        ]
      },
    },
  },
}
