import { db, type JournalType } from '../../db'
import { getSetting } from '../../lib/settings'
import type { ConversationContext, ScriptId } from './engine/types'

// Lecture défensive de la rubrique « attentes » du profil (data est `unknown`).
// Forme attendue (profil) : { why?: string; expectations?: string; reasons?: string[] }.
export async function readAttentes(): Promise<string[]> {
  try {
    const row = await db.profile.get('attentes')
    const data: unknown = row?.data
    if (!data || typeof data !== 'object') return []
    const d = data as Record<string, unknown>
    const out: string[] = []
    const add = (v: unknown) => {
      if (typeof v === 'string' && v.trim().length >= 3) out.push(v.trim().slice(0, 160))
    }
    add(d.why)
    add(d.expectations)
    if (Array.isArray(d.reasons)) d.reasons.forEach(add)
    return [...new Set(out)]
  } catch {
    return []
  }
}

export async function loadContext(script: ScriptId, sessionId?: number): Promise<ConversationContext> {
  const [companion, firstName, attentes] = await Promise.all([getSetting('companion'), getSetting('firstName'), readAttentes()])
  const session = sessionId ? await db.sessions.get(sessionId) : undefined
  const since = Date.now() - 14 * 86400000
  const recentEntries = await db.journal.where('createdAt').above(since).toArray()
  const recent: Partial<Record<JournalType, number>> = {}
  for (const e of recentEntries) recent[e.type] = (recent[e.type] ?? 0) + 1
  return {
    script,
    voice: { tutoiement: companion.tutoiement, companionName: companion.name, firstName },
    session,
    attentes,
    recent,
  }
}
