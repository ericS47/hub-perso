import type { ScriptCtx } from '../engine/script'

// Mot de la fin commun à toutes les conversations.
export function closingWords(c: ScriptCtx): readonly string[] {
  return [
    c.t('Je garde tout ça dans ton journal, sur ton téléphone. Reviens quand tu veux, je suis là.', 'Je garde tout ça dans votre journal, sur votre téléphone. Revenez quand vous voulez, je suis là.'),
    c.t('C’est noté dans ton journal. Tu pourras le relire, ou le montrer à ton soignant si tu en as envie.', 'C’est noté dans votre journal. Vous pourrez le relire, ou le montrer à votre soignant si vous en avez envie.'),
    c.t('Je range ça dans ton journal. Merci de ta confiance, à bientôt.', 'Je range ça dans votre journal. Merci de votre confiance, à bientôt.'),
  ]
}

// Reformulation d'une liste d'émotions (« de l'ennui et du stress »).
const ARTICLES: Record<string, string> = {
  ennui: 'de l’ennui',
  stress: 'du stress',
  tristesse: 'de la tristesse',
  colere: 'de la colère',
  solitude: 'de la solitude',
  fatigue: 'de la fatigue',
  anxiete: 'de l’anxiété',
  frustration: 'de la frustration',
  joie: 'de la joie',
}

export function emotionsPhrase(values: string[], text?: string): string {
  const parts = values.map((v) => ARTICLES[v]).filter(Boolean)
  if (text) parts.push(`« ${text} »`)
  if (parts.length <= 1) return parts.join('')
  return `${parts.slice(0, -1).join(', ')} et ${parts[parts.length - 1]}`
}
