import { useCallback, useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type ProfileSection, type ProfileSectionId } from '../../db'
import { CONSTRAINT_SOURCES, foyerConstraints, travailConstraints } from './constraints'
import type { SectionDataMap, SectionStatus } from './types'

// Lecteurs et écriture du profil. Les autres fonctionnalités importent d'ici
// (getProfileSection, useProfileSection, useProfileProgress, PROFILE_SECTIONS).

export interface SectionMeta {
  id: ProfileSectionId
  title: string
  icon: string
  group: string
  hint: string
}

export const PROFILE_SECTIONS: SectionMeta[] = [
  { id: 'identite', title: 'Qui je suis', icon: '🪪', group: 'Qui je suis', hint: 'Naissance, taille, poids et son évolution' },
  { id: 'sport', title: 'Mon histoire du sport', icon: '🏅', group: 'Qui je suis', hint: 'École, club, aujourd’hui' },
  { id: 'onaps', title: 'Suis-je actif au quotidien ?', icon: '🚶', group: 'Qui je suis', hint: 'Travail, déplacements, loisirs, temps assis' },
  { id: 'foyer', title: 'Mon foyer', icon: '🏡', group: 'Qui je suis', hint: 'Couple, enfants, parents' },
  { id: 'travail', title: 'Mon travail', icon: '💼', group: 'Qui je suis', hint: 'Horaires et planning' },
  { id: 'sante', title: 'Ma santé', icon: '🩺', group: 'Ma santé', hint: 'Pathologies, traitements, famille' },
  { id: 'douleurs', title: 'Mes douleurs', icon: '🩹', group: 'Ma santé', hint: 'Où, et à quel moment' },
  { id: 'alimentation', title: 'Mon alimentation', icon: '🍽️', group: 'Mon alimentation', hint: 'Mes repas, mon plateau' },
  { id: 'hydratation', title: 'Mon hydratation', icon: '💧', group: 'Mon hydratation', hint: 'Eau, boissons chaudes et froides, alcool' },
  { id: 'sommeil', title: 'Mon sommeil', icon: '😴', group: 'Mon sommeil', hint: 'Horaires, nuits, rituels du coucher' },
  { id: 'moral', title: 'Mon moral', icon: '🌤️', group: 'Mon moral', hint: 'Comment je me sens' },
  { id: 'attentes', title: 'Mes attentes', icon: '🎯', group: 'Mes attentes', hint: 'Pourquoi je viens ici' },
]

export function sectionMeta(id: ProfileSectionId): SectionMeta {
  return PROFILE_SECTIONS.find((s) => s.id === id) ?? PROFILE_SECTIONS[0]
}

export function isSectionId(v: string | undefined): v is ProfileSectionId {
  return PROFILE_SECTIONS.some((s) => s.id === v)
}

// ───── Lecture ─────
export async function getProfileSection<K extends ProfileSectionId>(id: K): Promise<SectionDataMap[K] | undefined> {
  const row = await db.profile.get(id)
  return row?.data as SectionDataMap[K] | undefined
}

// Contenu en direct d'une rubrique : undefined pendant le chargement, null si jamais remplie.
export function useProfileSection<K extends ProfileSectionId>(id: K): SectionDataMap[K] | null | undefined {
  return useLiveQuery(async () => (await getProfileSection(id)) ?? null, [id])
}

function hasContent(data: unknown): boolean {
  if (data == null) return false
  if (Array.isArray(data)) return data.some(hasContent)
  if (typeof data === 'object') return Object.values(data as Record<string, unknown>).some(hasContent)
  if (typeof data === 'string') return data.trim() !== ''
  return true
}

export function statusOf(row: ProfileSection | undefined): SectionStatus {
  if (!row) return 'todo'
  if (row.done) return 'done'
  return hasContent(row.data) ? 'progress' : 'todo'
}

export interface ProfileProgress {
  statuses: Record<ProfileSectionId, SectionStatus>
  doneCount: number
  total: number
  // Proportion de 0 à 1 (une rubrique en cours compte pour moitié).
  ratio: number
  next?: SectionMeta
}

export function computeProgress(rows: ProfileSection[]): ProfileProgress {
  const byId = new Map(rows.map((r) => [r.section, r]))
  const statuses = {} as Record<ProfileSectionId, SectionStatus>
  let score = 0
  let doneCount = 0
  for (const s of PROFILE_SECTIONS) {
    const st = statusOf(byId.get(s.id))
    statuses[s.id] = st
    if (st === 'done') {
      score += 1
      doneCount += 1
    } else if (st === 'progress') score += 0.5
  }
  const next =
    PROFILE_SECTIONS.find((s) => statuses[s.id] === 'progress') ?? PROFILE_SECTIONS.find((s) => statuses[s.id] !== 'done')
  return { statuses, doneCount, total: PROFILE_SECTIONS.length, ratio: score / PROFILE_SECTIONS.length, next }
}

export function useProfileProgress(): ProfileProgress | undefined {
  return useLiveQuery(async () => computeProgress(await db.profile.toArray()), [])
}

// ───── Écriture ─────
// File d'attente : les écritures s'enchaînent dans l'ordre (pas de course entre deux réponses rapides).
let queue: Promise<unknown> = Promise.resolve()

export function saveProfileSection<K extends ProfileSectionId>(id: K, data: SectionDataMap[K], done: boolean): Promise<void> {
  const run = () =>
    db.transaction('rw', db.profile, db.constraints, async () => {
      await db.profile.put({ section: id, data, done, updatedAt: Date.now() })
      // Travail et foyer : on remplace toutes les contraintes de leurs sources (jamais de doublons).
      const sid: ProfileSectionId = id
      const sources = sid === 'travail' || sid === 'foyer' ? CONSTRAINT_SOURCES[sid] : undefined
      if (sources) {
        const rows =
          id === 'travail'
            ? travailConstraints(data as SectionDataMap['travail'])
            : foyerConstraints(data as SectionDataMap['foyer'])
        await db.constraints.where('source').anyOf(sources).delete()
        if (rows.length) await db.constraints.bulkAdd(rows)
      }
    })
  const p = queue.then(run, run)
  queue = p.catch(() => undefined)
  return p
}

export type Updater<T> = Partial<T> | ((prev: T) => T)

export interface SectionEditor<K extends ProfileSectionId> {
  data: SectionDataMap[K]
  done: boolean
  update: (patch: Updater<SectionDataMap[K]>) => void
  setDone: (done: boolean) => Promise<void>
}

// Édition d'une rubrique : état local (saisie fluide) + enregistrement immédiat à chaque réponse.
export function useSectionEditor<K extends ProfileSectionId>(id: K): SectionEditor<K> | undefined {
  const [state, setState] = useState<{ id: K; data: SectionDataMap[K]; done: boolean } | null>(null)
  const ref = useRef(state)

  useEffect(() => {
    let alive = true
    void db.profile.get(id).then((row) => {
      if (!alive) return
      const next = { id, data: (row?.data ?? {}) as SectionDataMap[K], done: row?.done ?? false }
      ref.current = next
      setState(next)
    })
    return () => {
      alive = false
    }
  }, [id])

  const update = useCallback(
    (patch: Updater<SectionDataMap[K]>) => {
      const cur = ref.current
      if (!cur || cur.id !== id) return
      const data = typeof patch === 'function' ? patch(cur.data) : { ...cur.data, ...patch }
      const next = { ...cur, data }
      ref.current = next
      setState(next)
      void saveProfileSection(id, data, next.done)
    },
    [id],
  )

  const setDone = useCallback(
    async (done: boolean) => {
      const cur = ref.current
      if (!cur || cur.id !== id) return
      const next = { ...cur, done }
      ref.current = next
      setState(next)
      await saveProfileSection(id, next.data, done)
    },
    [id],
  )

  if (!state || state.id !== id) return undefined
  return { data: state.data, done: state.done, update, setDone }
}

// Identifiant court pour les éléments de liste.
export function newId(): string {
  return Math.random().toString(36).slice(2, 10)
}

// ───── Position dans le questionnaire (pratique uniquement, perdue sans dommage) ─────
export function readStep(id: ProfileSectionId): number {
  try {
    return Number(localStorage.getItem(`profil-etape-${id}`)) || 0
  } catch {
    return 0
  }
}

export function writeStep(id: ProfileSectionId, step: number): void {
  try {
    localStorage.setItem(`profil-etape-${id}`, String(step))
  } catch {
    // Stockage indisponible : on reprendra au début.
  }
}

export function clearSteps(): void {
  try {
    for (const s of PROFILE_SECTIONS) localStorage.removeItem(`profil-etape-${s.id}`)
  } catch {
    // Rien à faire.
  }
}
