import { db, type Session } from '../../db'
import { addDays, isoDate } from '../../lib/dates'

// Nombre de semaines créées à l'avance pour une séance répétée.
const HORIZON_DAYS = 8 * 7

type SessionData = Pick<Session, 'activity' | 'durationMin' | 'date' | 'start'>

// Crée les séances manquantes de chaque répétition, jusqu'à l'horizon (jamais dans le passé).
export async function extendSeries(today = isoDate()): Promise<void> {
  const limit = addDays(today, HORIZON_DAYS)
  await db.transaction('rw', db.series, db.sessions, async () => {
    for (const s of await db.series.toArray()) {
      if (s.id === undefined) continue
      const end = s.until && s.until < limit ? s.until : limit
      if (s.generatedUntil >= end) continue
      const rows: Session[] = []
      for (let d = s.from; d <= end; d = addDays(d, 7)) {
        if (d <= s.generatedUntil || d < today) continue
        rows.push({ activity: s.activity, durationMin: s.durationMin, date: d, start: s.start, status: 'prevue', seriesId: s.id, createdAt: Date.now() })
      }
      if (rows.length) await db.sessions.bulkAdd(rows)
      await db.series.update(s.id, { generatedUntil: end })
    }
  })
}

// Nouvelle répétition hebdomadaire à partir de cette séance (créée avec ses suivantes).
// Renvoie la première séance créée.
export async function createSeries(first: SessionData): Promise<Session> {
  const createdAt = Date.now()
  const session = await db.transaction('rw', db.series, db.sessions, async () => {
    const seriesId = await db.series.add({
      activity: first.activity,
      durationMin: first.durationMin,
      start: first.start,
      from: first.date,
      generatedUntil: first.date,
      createdAt,
    })
    const row: Session = { ...first, status: 'prevue', seriesId, createdAt }
    return { ...row, id: await db.sessions.add(row) }
  })
  await extendSeries()
  return session
}

// Arrête une répétition à partir d'une date : les séances encore prévues à partir de ce jour disparaissent.
export async function stopSeriesFrom(seriesId: number, date: string): Promise<void> {
  await db.transaction('rw', db.series, db.sessions, async () => {
    await db.series.update(seriesId, { until: addDays(date, -1) })
    await db.sessions
      .where('seriesId')
      .equals(seriesId)
      .filter((s) => s.date >= date && s.status === 'prevue')
      .delete()
  })
}
