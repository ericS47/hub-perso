import type { ActivityBlock, OnapsData } from './types'

// Résumé DESCRIPTIF des réponses au questionnaire d'activité physique (inspiré de l'ONAPS-PAQ).
// Ce n'est pas un score clinique validé : simples additions de minutes, comparées au repère
// usuel de 150 min/semaine d'activité modérée (1 min d'intensité élevée ≈ 2 min modérées).
// Le libellé exact des questions et ce mode de calcul sont à faire valider par l'équipe soignante.

export const WEEKLY_TARGET_MIN = 150

function weekly(b: ActivityBlock | undefined): number {
  if (!b?.yes || !b.days || !b.minPerDay) return 0
  return b.days * b.minPerDay
}

export interface OnapsSummary {
  moderateMin: number
  vigorousMin: number
  // Équivalent en minutes d'activité modérée (élevée comptée double).
  equivalentMin: number
  byDomain: { travail: number; deplacements: number; loisirs: number }
  sittingHours?: number
  screenHours?: number
  answered: boolean
}

export function summarizeOnaps(d: OnapsData): OnapsSummary {
  const workV = weekly(d.workVigorous)
  const workM = weekly(d.workModerate)
  const travel = weekly(d.travelActive)
  const leisureV = weekly(d.leisureVigorous)
  const leisureM = weekly(d.leisureModerate) + weekly(d.homeModerate)
  const vigorousMin = workV + leisureV
  const moderateMin = workM + travel + leisureM
  const blocks = [d.workVigorous, d.workModerate, d.travelActive, d.leisureVigorous, d.leisureModerate, d.homeModerate]
  return {
    moderateMin,
    vigorousMin,
    equivalentMin: moderateMin + 2 * vigorousMin,
    byDomain: { travail: workV + workM, deplacements: travel, loisirs: leisureV + leisureM },
    sittingHours: d.sittingHoursPerDay,
    screenHours: d.screenHoursPerDay,
    answered: blocks.some((b) => b?.yes !== undefined) || d.sittingHoursPerDay !== undefined,
  }
}
