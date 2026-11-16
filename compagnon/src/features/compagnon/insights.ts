// « Ce que je remarque » : calculs simples et honnêtes sur le journal.
// Aucune interprétation médicale : de simples comptages, formulés avec prudence,
// et seulement à partir de MIN_ENTREES entrées.

import type { JournalEntry, MoodCheck, Session } from '../../db'
import { DAY_NAMES, isoDate, weekday } from '../../lib/dates'
import type { T } from './voice'
import { isBonneNouvelle } from './labels'

export const MIN_ENTREES = 3

export interface Observation {
  emoji: string
  text: string
}

// Retire l'emoji éventuel en début de libellé et met en minuscule.
function clean(s: string): string {
  const sans = s.replace(/^[^\p{L}]+/u, '').trim()
  return sans.charAt(0).toLowerCase() + sans.slice(1)
}

const ARTICLE: Record<string, string> = {
  ennui: 'l’ennui',
  stress: 'le stress',
  tristesse: 'la tristesse',
  colère: 'la colère',
  solitude: 'la solitude',
  fatigue: 'la fatigue',
  anxiété: 'l’anxiété',
  frustration: 'la frustration',
  joie: 'la joie',
}
const withArticle = (e: string) => ARTICLE[e] ?? `« ${e} »`

// Nombre à une décimale, à la française (5,1).
const fr = (n: number) => (Math.round(n * 10) / 10).toLocaleString('fr-FR')

function count(items: string[]): [string, number][] {
  const m = new Map<string, number>()
  for (const i of items) m.set(i, (m.get(i) ?? 0) + 1)
  return [...m.entries()].sort((a, b) => b[1] - a[1])
}

function answersOf(entries: JournalEntry[], question: string): string[] {
  const out: string[] = []
  for (const e of entries) {
    const a = e.answers.find((x) => x.question === question)
    if (a) out.push(...a.answer.split(', ').map(clean).filter(Boolean))
  }
  return out
}

function hourMoment(ts: number): string {
  const h = new Date(ts).getHours()
  if (h < 5) return 'la nuit'
  if (h < 11) return 'le matin'
  if (h < 14) return 'vers midi'
  if (h < 18) return 'l’après-midi'
  if (h < 23) return 'le soir'
  return 'la nuit'
}

// Le plus fréquent, seulement s'il revient au moins 2 fois et se détache des autres.
function standout(c: [string, number][]): [string, number] | undefined {
  if (!c.length || c[0][1] < 2) return undefined
  if (c[1] && c[1][1] === c[0][1]) return undefined
  return c[0]
}

export function observe(entries: JournalEntry[], moods: MoodCheck[], t: T): { observations: Observation[]; manque: string[] } {
  const obs: Observation[] = []
  const manque: string[] = []

  const food = entries.filter((e) => e.type === 'grignotage' || e.type === 'compulsion')
  if (food.length >= MIN_ENTREES) {
    const N = food.length
    const emo = count(food.flatMap((e) => e.emotions.map((x) => x.toLowerCase())))
    if (emo[0] && emo[0][1] >= 2) {
      const second = emo[1] && emo[1][1] >= 2 ? `, et ${withArticle(emo[1][0])} aussi (${emo[1][1]} fois)` : ''
      obs.push({
        emoji: '💭',
        text: t(
          `On dirait que ${withArticle(emo[0][0])} revient souvent avant tes grignotages ou compulsions : ${emo[0][1]} fois sur ${N}${second}.`,
          `On dirait que ${withArticle(emo[0][0])} revient souvent avant vos grignotages ou compulsions : ${emo[0][1]} fois sur ${N}${second}.`,
        ),
      })
    }
    // Moment de la journée : la réponse donnée, sinon l'heure de l'entrée.
    const moments = food.map((e) => {
      const a = e.answers.find((x) => x.question === 'À quel moment')
      return a ? clean(a.answer) : hourMoment(e.createdAt)
    })
    const m = standout(count(moments))
    if (m) {
      obs.push({
        emoji: '🕰️',
        text: t(`On dirait que ces moments arrivent plus souvent ${m[0]} (${m[1]} fois sur ${N}).`, `On dirait que ces moments arrivent plus souvent ${m[0]} (${m[1]} fois sur ${N}).`),
      })
    }
    const d = standout(count(food.map((e) => DAY_NAMES[weekday(isoDate(new Date(e.createdAt)))].toLowerCase())))
    if (d) {
      obs.push({
        emoji: '📅',
        text: t(`Le ${d[0]} semble revenir plus souvent que les autres jours (${d[1]} fois sur ${N}).`, `Le ${d[0]} semble revenir plus souvent que les autres jours (${d[1]} fois sur ${N}).`),
      })
    }
    const trig = standout(count(answersOf(food, 'Déclencheur').filter((x) => x !== 'je ne sais pas')))
    if (trig) {
      obs.push({
        emoji: '🔎',
        text: t(`Comme déclencheur, tu as souvent noté : ${trig[0]} (${trig[1]} fois).`, `Comme déclencheur, vous avez souvent noté : ${trig[0]} (${trig[1]} fois).`),
      })
    }
  } else manque.push(`grignotages ou compulsions : ${food.length}/${MIN_ENTREES}`)

  const missed = entries.filter((e) => e.type === 'seance-manquee')
  if (missed.length >= MIN_ENTREES) {
    const r = count(answersOf(missed, 'Raison'))
    if (r[0] && r[0][1] >= 2) {
      obs.push({
        emoji: '🏃',
        text: t(
          `Pour les séances manquées, la raison qui revient le plus est « ${r[0][0]} » (${r[0][1]} fois sur ${missed.length}). Ça pourrait être une piste à explorer avec ton équipe.`,
          `Pour les séances manquées, la raison qui revient le plus est « ${r[0][0]} » (${r[0][1]} fois sur ${missed.length}). Ça pourrait être une piste à explorer avec votre équipe.`,
        ),
      })
    }
    const aide = standout(count(answersOf(missed, 'Ce qui aurait pu aider').filter((x) => x !== 'je ne sais pas')))
    if (aide) {
      obs.push({
        emoji: '💡',
        text: t(`Ce qui t’aiderait le plus souvent, d’après toi : ${aide[0]}.`, `Ce qui vous aiderait le plus souvent, d’après vous : ${aide[0]}.`),
      })
    }
  } else manque.push(`séances manquées : ${missed.length}/${MIN_ENTREES}`)

  const mou = entries.filter((e) => e.type === 'coup-de-mou')
  if (mou.length >= MIN_ENTREES) {
    const p = standout(count(answersOf(mou, 'Ce qui pèse').filter((x) => x !== 'je ne sais pas trop')))
    if (p) {
      obs.push({
        emoji: '🌧️',
        text: t(`Lors de tes coups de mou, ${p[0]} revient souvent (${p[1]} fois sur ${mou.length}).`, `Lors de vos coups de mou, ${p[0]} revient souvent (${p[1]} fois sur ${mou.length}).`),
      })
    }
  }

  const good = entries.filter(isBonneNouvelle)
  if (good.length >= 2) {
    obs.push({ emoji: '🌟', text: t(`Tu as noté ${good.length} bonnes nouvelles. Elles comptent aussi !`, `Vous avez noté ${good.length} bonnes nouvelles. Elles comptent aussi !`) })
  }

  if (moods.length >= MIN_ENTREES) {
    const avg = (k: 'moral' | 'fatigue' | 'stress') => fr(moods.reduce((s, m) => s + m[k], 0) / moods.length)
    obs.push({
      emoji: '🌤️',
      text: t(
        `Ta météo intérieure, en moyenne sur ${moods.length} jours : moral ${avg('moral')}/10, fatigue ${avg('fatigue')}/10, stress ${avg('stress')}/10.`,
        `Votre météo intérieure, en moyenne sur ${moods.length} jours : moral ${avg('moral')}/10, fatigue ${avg('fatigue')}/10, stress ${avg('stress')}/10.`,
      ),
    })
  } else manque.push(`météo intérieure : ${moods.length}/${MIN_ENTREES} jours`)

  return { observations: obs, manque }
}

// Résumé textuel à montrer à son soignant (copier / partager).
export function rdvSummary(opts: {
  weeks: number
  entries: JournalEntry[]
  sessions: Session[]
  moods: MoodCheck[]
  firstName: string
  note: string
}): string {
  const { weeks, firstName, note } = opts
  const since = isoDate(new Date(Date.now() - weeks * 7 * 86400000))
  const fmt = (iso: string) => new Date(iso + 'T12:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
  const entries = opts.entries.filter((e) => isoDate(new Date(e.createdAt)) >= since)
  const sessions = opts.sessions.filter((s) => s.date >= since && s.date <= isoDate())
  const moods = opts.moods.filter((m) => m.date >= since)
  const by = (ty: JournalEntry['type']) => entries.filter((e) => e.type === ty)
  const lines: string[] = []

  lines.push(`Mon résumé${firstName ? ` (${firstName})` : ''} — du ${fmt(since)} au ${fmt(isoDate())}`)
  lines.push('')

  const faites = sessions.filter((s) => s.status === 'faite')
  const manquees = sessions.filter((s) => s.status === 'manquee')
  lines.push(`Activité physique : ${sessions.length} séance(s) prévue(s), ${faites.length} faite(s), ${manquees.length} manquée(s).`)
  const avgOf = (k: 'envie' | 'motivation' | 'plaisir') => {
    const v = faites.map((s) => s[k]).filter((x): x is number => typeof x === 'number')
    return v.length ? `${fr(v.reduce((a, b) => a + b, 0) / v.length)}/10` : null
  }
  const ev = (['envie', 'motivation', 'plaisir'] as const).map((k) => (avgOf(k) ? `${k} ${avgOf(k)}` : null)).filter(Boolean)
  if (ev.length) lines.push(`Après les séances, en moyenne : ${ev.join(', ')}.`)
  const raisons = count(answersOf(by('seance-manquee'), 'Raison'))
  if (raisons.length) lines.push(`Raisons des séances manquées : ${raisons.map(([r, n]) => `${r} (${n})`).join(', ')}.`)
  lines.push('')

  const food = [...by('grignotage'), ...by('compulsion')]
  lines.push(`Grignotages notés : ${by('grignotage').length}. Compulsions notées : ${by('compulsion').length}.`)
  const emo = count(food.flatMap((e) => e.emotions.map((x) => x.toLowerCase())))
  if (emo.length) lines.push(`Émotions notées avant : ${emo.slice(0, 5).map(([r, n]) => `${r} (${n})`).join(', ')}.`)
  const intens = food.map((e) => e.intensity).filter((x): x is number => typeof x === 'number')
  if (intens.length) lines.push(`Intensité moyenne : ${fr(intens.reduce((a, b) => a + b, 0) / intens.length)}/10.`)
  const essais = count(answersOf(food, 'À essayer la prochaine fois'))
  if (essais.length) lines.push(`Pistes que j’ai envie d’essayer : ${essais.slice(0, 4).map(([r]) => r).join(', ')}.`)
  lines.push('')

  lines.push(`Coups de mou : ${by('coup-de-mou').length}.`)
  const pese = count(answersOf(by('coup-de-mou'), 'Ce qui pèse'))
  if (pese.length) lines.push(`Ce qui pèse : ${pese.slice(0, 4).map(([r, n]) => `${r} (${n})`).join(', ')}.`)
  if (moods.length) {
    const avg = (k: 'moral' | 'fatigue' | 'stress') => fr(moods.reduce((s, m) => s + m[k], 0) / moods.length)
    lines.push(`Météo intérieure (${moods.length} jour(s)) : moral ${avg('moral')}/10, fatigue ${avg('fatigue')}/10, stress ${avg('stress')}/10.`)
  }
  const good = entries.filter(isBonneNouvelle).length
  if (good) lines.push(`Bonnes nouvelles notées : ${good}.`)

  if (note.trim()) {
    lines.push('')
    lines.push('Ce dont j’aimerais parler :')
    lines.push(note.trim())
  }
  lines.push('')
  lines.push('(Résumé préparé avec l’application Mon Compagnon, à partir de ce que j’ai noté.)')
  return lines.join('\n')
}
