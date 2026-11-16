// Script « Je n'ai pas fait ma séance ».
// Esprit : écoute active et entretien motivationnel. Jamais de « tu aurais dû ».

import { formatDay, isoDate } from '../../../lib/dates'
import type { Script, ScriptCtx } from '../engine/script'
import { closingWords } from './common'

const RAISONS = [
  { value: 'fatigue', label: '😴 La fatigue', nom: 'la fatigue' },
  { value: 'temps', label: '⏱️ Le manque de temps', nom: 'le manque de temps' },
  { value: 'douleur', label: '🤕 Une douleur', nom: 'une douleur' },
  { value: 'moral', label: '🌧️ Le moral', nom: 'le moral' },
  { value: 'meteo', label: '☔ La météo', nom: 'la météo' },
  { value: 'imprevu', label: '📞 Un imprévu', nom: 'un imprévu' },
  { value: 'envie', label: '🛋️ Pas envie', nom: 'le manque d’envie' },
  { value: 'autre', label: '💭 Autre chose', nom: 'autre chose' },
]

const raisonNom = (v: string | undefined) => RAISONS.find((r) => r.value === v)?.nom

function seanceDe(c: ScriptCtx): string | null {
  const s = c.context.session
  if (!s) return null
  const quand = s.date === isoDate() ? 'aujourd’hui' : formatDay(s.date)
  return c.t(
    `On parle de ta séance « ${s.activity} » prévue ${quand}.`,
    `On parle de votre séance « ${s.activity} » prévue ${quand}.`,
  )
}

export const seanceManquee: Script = {
  id: 'seance-manquee',
  start: 'accueil',
  nodes: {
    accueil: {
      say: (c) => [
        [
          c.t(
            'Merci de venir m’en parler. Une séance qui saute, ça arrive à tout le monde, vraiment.',
            'Merci de venir m’en parler. Une séance qui saute, ça arrive à tout le monde, vraiment.',
          ),
          c.t(
            'Ça me fait plaisir que tu passes me voir. Ici, pas de reproche : on regarde juste ce qui s’est passé.',
            'Merci de passer me voir. Ici, pas de reproche : on regarde simplement ce qui s’est passé.',
          ),
          c.t(
            'Ça arrive, et c’est bien d’en parler plutôt que de garder ça pour toi.',
            'Ça arrive, et c’est bien d’en parler plutôt que de garder ça pour vous.',
          ),
        ],
        seanceDe(c),
        c.t('Qu’est-ce qui s’est passé ?', 'Qu’est-ce qui s’est passé ?'),
      ],
      input: (c) => ({
        kind: 'choice',
        options: RAISONS.map(({ value, label }) => ({ value, label })),
        allowText: true,
        placeholder: c.t('Ou raconte avec tes mots…', 'Ou racontez avec vos mots…'),
      }),
      question: 'Raison',
      next: (_c, a) => {
        if (a.skipped) return 'aide'
        const v = a.values?.[0]
        if (v && v !== 'autre') return v
        return a.text ? 'aide' : 'autre'
      },
    },

    fatigue: {
      say: (c) => [
        [
          c.t('La fatigue, ça coupe vraiment les jambes. Ton corps t’a envoyé un message.', 'La fatigue, ça coupe vraiment les jambes. Votre corps vous a envoyé un message.'),
          c.t('Quand on est à plat, même une petite séance paraît une montagne. Je comprends.', 'Quand on est à plat, même une petite séance paraît une montagne. Je comprends.'),
        ],
        c.t('Tu dirais que c’est plutôt une fatigue du corps, de la tête, ou un peu des deux ?', 'Vous diriez que c’est plutôt une fatigue du corps, de la tête, ou un peu des deux ?'),
      ],
      input: {
        kind: 'choice',
        options: [
          { value: 'corps', label: 'Du corps' },
          { value: 'tete', label: 'De la tête' },
          { value: 'deux', label: 'Les deux' },
          { value: 'sommeil', label: 'J’ai mal dormi' },
          { value: 'sais-pas', label: 'Je ne sais pas' },
        ],
      },
      question: 'Quelle fatigue',
      next: 'aide',
    },

    temps: {
      say: (c) => [
        [
          c.t('Les journées qui débordent, ça arrive. Tu n’as pas pu tout caser, et c’est humain.', 'Les journées qui débordent, ça arrive. Vous n’avez pas pu tout caser, et c’est humain.'),
          c.t('Le temps file parfois plus vite que prévu. Qu’est-ce qui a pris la place ?', 'Le temps file parfois plus vite que prévu. Qu’est-ce qui a pris la place ?'),
        ],
        c.t('Qu’est-ce qui a occupé ce moment-là ?', 'Qu’est-ce qui a occupé ce moment-là ?'),
      ],
      input: {
        kind: 'choice',
        multiple: true,
        options: [
          { value: 'travail', label: 'Le travail' },
          { value: 'famille', label: 'La famille' },
          { value: 'maison', label: 'La maison' },
          { value: 'rdv', label: 'Un rendez-vous' },
          { value: 'trajets', label: 'Les trajets' },
        ],
        allowText: true,
        placeholder: 'Autre chose…',
      },
      question: 'Ce qui a pris la place',
      next: 'aide',
    },

    douleur: {
      say: (c) => [
        c.t('Merci de me le dire, c’est important.', 'Merci de me le dire, c’est important.'),
        c.t('Où est-ce que tu as mal ?', 'Où avez-vous mal ?'),
      ],
      input: (c) => ({ kind: 'text', placeholder: c.t('Par exemple : le genou, le dos…', 'Par exemple : le genou, le dos…') }),
      question: 'Où est la douleur',
      next: 'douleur-intensite',
    },
    'douleur-intensite': {
      say: (c) => [
        c.text('douleur')
          ? c.t(`D’accord, ${c.text('douleur')}. Elle est forte comment, de 0 à 10 ?`, `D’accord, ${c.text('douleur')}. Elle est forte comment, de 0 à 10 ?`)
          : c.t('Elle est forte comment, de 0 à 10 ?', 'Elle est forte comment, de 0 à 10 ?'),
      ],
      input: { kind: 'scale', minLabel: 'Presque rien', maxLabel: 'Très forte', measure: 'intensity' },
      question: 'Intensité de la douleur',
      next: 'douleur-conseil',
    },
    'douleur-conseil': {
      say: (c) => [
        c.t(
          'Je ne peux pas évaluer une douleur : ça, c’est le rôle de ton kiné ou de ton médecin.',
          'Je ne peux pas évaluer une douleur : ça, c’est le rôle de votre kiné ou de votre médecin.',
        ),
        (c.num('douleur-intensite') ?? 0) >= 6
          ? c.t(
              'Avec une douleur à ce niveau, ce serait vraiment bien de leur en parler rapidement. Ils pourront t’aider à adapter tes séances.',
              'Avec une douleur à ce niveau, ce serait vraiment bien de leur en parler rapidement. Ils pourront vous aider à adapter vos séances.',
            )
          : c.t(
              'Si elle dure, revient ou t’inquiète, parles-en-leur : ils pourront adapter tes séances pour que tu bouges sans te faire mal.',
              'Si elle dure, revient ou vous inquiète, parlez-leur-en : ils pourront adapter vos séances pour que vous bougiez sans vous faire mal.',
            ),
      ],
      actions: () => [{ kind: 'link', to: '/plus/pros', label: 'Contacter mon équipe' }],
      input: {
        kind: 'choice',
        options: [
          { value: 'ok', label: 'D’accord' },
          { value: 'deja', label: 'C’est déjà prévu' },
        ],
      },
      question: 'En parler au kiné ou au médecin',
      next: 'aide',
    },

    moral: {
      say: (c) => [
        [
          c.t('Le moral qui flanche, ça rend tout plus lourd, même ce qu’on aime bien.', 'Le moral qui flanche, ça rend tout plus lourd, même ce qu’on aime bien.'),
          c.t('Quand le cœur n’y est pas, le corps suit difficilement. C’est normal.', 'Quand le cœur n’y est pas, le corps suit difficilement. C’est normal.'),
        ],
        c.t('Ton moral, là, tout de suite, tu le placerais où ?', 'Votre moral, là, tout de suite, vous le placeriez où ?'),
      ],
      input: { kind: 'scale', minLabel: 'Au plus bas', maxLabel: 'Au top', measure: 'moral' },
      question: 'Moral (0-10)',
      next: 'moral-quoi',
    },
    'moral-quoi': {
      say: (c) => [
        c.t('Tu veux me dire ce qui pèse en ce moment ? Juste quelques mots, si tu en as envie.', 'Vous voulez me dire ce qui pèse en ce moment ? Juste quelques mots, si vous en avez envie.'),
      ],
      input: (c) => ({ kind: 'text', long: true, placeholder: c.t('Ce qui me pèse…', 'Ce qui me pèse…') }),
      question: 'Ce qui pèse',
      next: 'aide',
    },

    meteo: {
      say: (c) => [
        c.t('Pluie, froid ou chaleur : la météo peut vraiment couper l’élan. C’était quoi, plutôt ?', 'Pluie, froid ou chaleur : la météo peut vraiment couper l’élan. C’était quoi, plutôt ?'),
      ],
      input: {
        kind: 'choice',
        options: [
          { value: 'pluie', label: '🌧️ La pluie' },
          { value: 'froid', label: '🥶 Le froid' },
          { value: 'chaleur', label: '🥵 La chaleur' },
          { value: 'vent', label: '🌬️ Le vent' },
          { value: 'nuit', label: '🌙 Il faisait nuit' },
        ],
      },
      question: 'Quelle météo',
      next: 'aide',
    },

    imprevu: {
      say: (c) => [
        c.t('Un imprévu, ça ne se commande pas. Tu veux me raconter ce qui est arrivé ?', 'Un imprévu, ça ne se commande pas. Vous voulez me raconter ce qui est arrivé ?'),
      ],
      input: (c) => ({ kind: 'text', placeholder: c.t('Ce qui est arrivé…', 'Ce qui est arrivé…') }),
      question: 'L’imprévu',
      next: 'aide',
    },

    envie: {
      say: (c) => [
        [
          c.t('Merci pour ton honnêteté, ce n’est pas toujours facile à dire.', 'Merci pour votre honnêteté, ce n’est pas toujours facile à dire.'),
          c.t('Pas envie : c’est une vraie information, pas un défaut.', 'Pas envie : c’est une vraie information, pas un défaut.'),
        ],
        c.t('D’après toi, qu’est-ce qui faisait que l’envie n’était pas là ?', 'D’après vous, qu’est-ce qui faisait que l’envie n’était pas là ?'),
      ],
      input: {
        kind: 'choice',
        multiple: true,
        options: [
          { value: 'activite', label: 'L’activité ne me plaît pas trop' },
          { value: 'solo', label: 'En solo, c’est dur de s’y mettre' },
          { value: 'lassitude', label: 'Un peu de lassitude' },
          { value: 'peur', label: 'Une appréhension' },
          { value: 'sais-pas', label: 'Je ne sais pas trop' },
        ],
        allowText: true,
        placeholder: 'Autre chose…',
      },
      question: 'Pourquoi pas envie',
      next: 'aide',
    },

    autre: {
      say: (c) => [c.t('Je t’écoute. Qu’est-ce qui s’est passé ?', 'Je vous écoute. Qu’est-ce qui s’est passé ?')],
      input: (c) => ({ kind: 'text', long: true, placeholder: c.t('Raconte avec tes mots…', 'Racontez avec vos mots…') }),
      question: 'Ce qui s’est passé',
      next: 'aide',
    },

    aide: {
      say: (c) => {
        const nom = raisonNom(c.value('accueil'))
        return [
          nom && nom !== 'autre chose'
            ? [
                c.t(`Si je comprends bien, c’est surtout ${nom} qui a coupé l’élan cette fois.`, `Si je comprends bien, c’est surtout ${nom} qui a coupé l’élan cette fois.`),
                c.t(`Donc cette fois, c’était ${nom}. Merci de l’avoir mis en mots.`, `Donc cette fois, c’était ${nom}. Merci de l’avoir mis en mots.`),
              ]
            : c.t('Merci de m’avoir raconté. Ça aide à y voir plus clair.', 'Merci de m’avoir raconté. Ça aide à y voir plus clair.'),
          c.t('Avec un peu de recul, qu’est-ce qui aurait pu t’aider ?', 'Avec un peu de recul, qu’est-ce qui aurait pu vous aider ?'),
        ]
      },
      input: {
        kind: 'choice',
        multiple: true,
        options: [
          { value: 'horaire', label: 'Un autre horaire' },
          { value: 'court', label: 'Une séance plus courte' },
          { value: 'quelquun', label: 'Quelqu’un avec moi' },
          { value: 'rappel', label: 'Un rappel' },
          { value: 'activite', label: 'Une autre activité' },
          { value: 'repos', label: 'Du repos avant' },
          { value: 'rien', label: 'Je ne sais pas' },
        ],
        allowText: true,
        placeholder: 'Autre idée…',
      },
      question: 'Ce qui aurait pu aider',
      next: 'pas',
    },

    pas: {
      say: (c) => {
        const douleur = c.value('accueil') === 'douleur'
        const idees = c.labels('aide').filter((l) => l !== 'je ne sais pas')
        return [
          idees.length
            ? c.t(`${idees.length > 1 ? 'Ce sont de bonnes pistes' : 'C’est une bonne piste'}, et c’est toi qui l’as trouvée${idees.length > 1 ? 's' : ''}.`, `${idees.length > 1 ? 'Ce sont de bonnes pistes' : 'C’est une bonne piste'}, et c’est vous qui l’avez trouvée${idees.length > 1 ? 's' : ''}.`)
            : c.t('Ce n’est pas toujours évident à dire, et c’est normal.', 'Ce n’est pas toujours évident à dire, et c’est normal.'),
          [
            c.t('Une séance manquée n’efface pas tout ce que tu as déjà fait. C’est une info pour mieux organiser la suite.', 'Une séance manquée n’efface pas tout ce que vous avez déjà fait. C’est une info pour mieux organiser la suite.'),
            c.t('Ce n’est pas une séance perdue : c’est une info pour mieux t’organiser la prochaine fois.', 'Ce n’est pas une séance perdue : c’est une info pour mieux vous organiser la prochaine fois.'),
          ],
          douleur
            ? c.t('Avec une douleur, on écoute son corps d’abord : pas question de forcer. Tu veux replacer la séance plus tard ?', 'Avec une douleur, on écoute son corps d’abord : pas question de forcer. Vous voulez replacer la séance plus tard ?')
            : c.t('Tu voudrais tenter un petit pas ? Rien d’obligatoire.', 'Vous voudriez tenter un petit pas ? Rien d’obligatoire.'),
        ]
      },
      input: (c) => ({
        kind: 'choice',
        options: [
          ...(c.value('accueil') === 'douleur' ? [] : [{ value: 'marche', label: '🚶 10 minutes de marche aujourd’hui' }]),
          { value: 'replacer', label: '📅 Replacer la séance un autre jour' },
          { value: 'rien', label: 'Pas aujourd’hui, et c’est d’accord' },
        ],
      }),
      question: 'Petit pas',
      next: 'fin',
    },

    fin: {
      say: (c) => {
        const nom = raisonNom(c.value('accueil'))
        const pas = c.value('pas')
        const aide = c.labels('aide').filter((l) => l !== 'je ne sais pas')
        const resume = [
          nom && nom !== 'autre chose'
            ? c.t(`ta séance n’a pas pu avoir lieu, surtout à cause de ${nom}`, `votre séance n’a pas pu avoir lieu, surtout à cause de ${nom}`)
            : c.t('ta séance n’a pas pu avoir lieu', 'votre séance n’a pas pu avoir lieu'),
          aide.length ? c.t(`ce qui aurait pu t’aider : ${aide.join(', ')}`, `ce qui aurait pu vous aider : ${aide.join(', ')}`) : null,
          pas === 'marche' ? c.t('et tu tentes 10 minutes de marche aujourd’hui', 'et vous tentez 10 minutes de marche aujourd’hui') : null,
          pas === 'replacer' ? c.t('et tu vas replacer la séance dans ton agenda', 'et vous allez replacer la séance dans votre agenda') : null,
        ].filter(Boolean)
        return [
          c.t(`Si je résume ce que tu m’as dit : ${resume.join(' ; ')}.`, `Si je résume ce que vous m’avez dit : ${resume.join(' ; ')}.`),
          pas === 'marche'
            ? [
                c.t('Dix minutes, c’est déjà bouger. Vas-y à ton rythme, sans rien forcer.', 'Dix minutes, c’est déjà bouger. Allez-y à votre rythme, sans rien forcer.'),
                c.t('Un petit tour, même tranquille, ça compte vraiment.', 'Un petit tour, même tranquille, ça compte vraiment.'),
              ]
            : null,
          pas === 'rien'
            ? c.t('Et se reposer quand on en a besoin, c’est aussi prendre soin de soi.', 'Et se reposer quand on en a besoin, c’est aussi prendre soin de soi.')
            : null,
          [
            c.t('Prendre le temps d’en parler, c’est déjà prendre soin de toi. Bravo pour ça.', 'Prendre le temps d’en parler, c’est déjà prendre soin de vous. Bravo pour ça.'),
            c.t('Tu as regardé la situation en face, sans te juger : c’est une vraie force.', 'Vous avez regardé la situation en face, sans vous juger : c’est une vraie force.'),
            c.t('Revenir m’en parler plutôt que de laisser tomber, ça montre que tu tiens à ton projet.', 'Revenir m’en parler plutôt que de laisser tomber, ça montre que vous tenez à votre projet.'),
          ],
          closingWords(c),
        ]
      },
      actions: (c) => {
        const acts: { kind: 'link'; to: string; label: string }[] = []
        if (c.value('pas') === 'replacer') acts.push({ kind: 'link', to: '/agenda', label: '📅 Ouvrir l’agenda' })
        if (c.value('accueil') === 'douleur') acts.push({ kind: 'link', to: '/plus/pros', label: 'Contacter mon équipe' })
        return acts
      },
    },
  },
}
