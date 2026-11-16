// Filet de sécurité placé DEVANT n'importe quel fournisseur de dialogue (script ou, plus tard, IA).
// Si la dernière réponse contient des mots de détresse ou un moral ≤ 2, la conversation
// est interrompue par un message de sécurité (voir safety.ts pour la liste d'expressions).

import { moralInquietant, NUMEROS_AIDE, texteInquietant } from '../safety'
import { makeT, pick } from '../voice'
import type { ConversationState, DialogueProvider, Exchange, Turn } from './types'

export const SAFETY_TURN = 'securite'

export function needsSafety(ex: Exchange | undefined): boolean {
  if (!ex || ex.turnId === SAFETY_TURN || ex.answer.skipped) return false
  if (texteInquietant(ex.answer.text)) return true
  return ex.input.kind === 'scale' && ex.input.measure === 'moral' && moralInquietant(ex.answer.number)
}

export function safetyTurn(state: ConversationState): Turn {
  const t = makeT(state.context.voice.tutoiement)
  const already = state.exchanges.some((e) => e.turnId === SAFETY_TURN)
  const prenom = state.context.voice.firstName
  return {
    id: SAFETY_TURN,
    tone: 'safety',
    messages: [
      already
        ? t('Je m’arrête encore un instant sur ce que tu viens de me dire.', 'Je m’arrête encore un instant sur ce que vous venez de me dire.')
        : pick([
            t(
              `${prenom ? `${prenom}, merci` : 'Merci'} de me l’avoir dit. Ce que tu traverses a l’air vraiment lourd.`,
              `${prenom ? `${prenom}, merci` : 'Merci'} de me l’avoir dit. Ce que vous traversez a l’air vraiment lourd.`,
            ),
            t(
              'Merci de ta confiance. Ce que tu ressens compte, et ça mérite qu’on s’y arrête.',
              'Merci de votre confiance. Ce que vous ressentez compte, et ça mérite qu’on s’y arrête.',
            ),
          ]),
      t(
        'Je ne suis qu’une application : je ne peux pas t’aider comme une personne le ferait. Mais quelqu’un peut t’écouter, maintenant.',
        'Je ne suis qu’une application : je ne peux pas vous aider comme une personne le ferait. Mais quelqu’un peut vous écouter, maintenant.',
      ),
      t(
        'Le 3114 répond jour et nuit, gratuitement. Ce sont des professionnels, et tu peux les appeler même juste pour parler, même sans savoir si c’est « assez grave ».',
        'Le 3114 répond jour et nuit, gratuitement. Ce sont des professionnels, et vous pouvez les appeler même juste pour parler, même sans savoir si c’est « assez grave ».',
      ),
      t(
        'Si tu es en danger maintenant, appelle le 15 ou le 112. Et si tu le peux, préviens ton soignant ou un proche : tu n’as pas à porter ça sans personne.',
        'Si vous êtes en danger maintenant, appelez le 15 ou le 112. Et si vous le pouvez, prévenez votre soignant ou un proche : vous n’avez pas à porter ça sans personne.',
      ),
      t(
        'Si j’ai mal compris, tant mieux. On peut reprendre où on en était, ou s’arrêter là, comme tu préfères.',
        'Si j’ai mal compris, tant mieux. On peut reprendre où on en était, ou s’arrêter là, comme vous préférez.',
      ),
    ],
    actions: [
      ...NUMEROS_AIDE.map((n) => ({ kind: 'tel' as const, number: n.numero, label: n.titre, detail: n.detail })),
      {
        kind: 'share',
        label: t('Prévenir un proche', 'Prévenir un proche'),
        text: 'Je traverse un moment difficile. Est-ce que tu peux m’appeler quand tu vois ce message ?',
      },
      { kind: 'link', to: '/plus/pros', label: t('Contacter mon équipe soignante', 'Contacter mon équipe soignante') },
    ],
    input: {
      kind: 'choice',
      options: [
        { value: 'continuer', label: t('Je veux continuer à parler', 'Je veux continuer à parler') },
        { value: 'stop', label: t('Je préfère m’arrêter là', 'Je préfère m’arrêter là') },
      ],
    },
    question: 'Message de sécurité',
    skippable: false,
  }
}

function closingTurn(state: ConversationState): Turn {
  const t = makeT(state.context.voice.tutoiement)
  return {
    id: 'securite-fin',
    tone: 'safety',
    messages: [
      t(
        'D’accord, on s’arrête là. Ce que tu m’as confié est gardé dans ton journal, sur ton téléphone uniquement.',
        'D’accord, on s’arrête là. Ce que vous m’avez confié est gardé dans votre journal, sur votre téléphone uniquement.',
      ),
      t(
        'Les numéros restent juste au-dessus. Prends soin de toi, et n’hésite pas à revenir quand tu veux.',
        'Les numéros restent juste au-dessus. Prenez soin de vous, et n’hésitez pas à revenir quand vous voulez.',
      ),
    ],
    end: true,
  }
}

export function withSafety(inner: DialogueProvider): DialogueProvider {
  return {
    nextTurn(state) {
      const last = state.exchanges[state.exchanges.length - 1]
      if (needsSafety(last)) return safetyTurn(state)
      if (last?.turnId === SAFETY_TURN) {
        if (last.answer.values?.[0] === 'stop') return closingTurn(state)
      }
      // Le fournisseur ne voit pas les échanges de sécurité : il reprend là où il en était.
      return inner.nextTurn({ ...state, exchanges: state.exchanges.filter((e) => e.turnId !== SAFETY_TURN) })
    },
  }
}
