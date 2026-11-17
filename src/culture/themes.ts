import { db, type CultureCategory, type CultureItem } from '../db'

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()

// Crée les thèmes manquants d'un type (ex. un genre venu d'une proposition).
export async function ensureThemes(category: CultureCategory, names: string[]) {
  const existing = await db.themes.where('category').equals(category).toArray()
  const now = Date.now()
  const missing = names.filter(
    (n, i) => !existing.some((t) => same(t.name, n)) && names.findIndex((m) => same(m, n)) === i,
  )
  if (missing.length) await db.themes.bulkAdd(missing.map((name, i) => ({ category, name, createdAt: now + i })))
}

// Le nom change aussi sur toutes les œuvres de ce type qui portent le thème.
export async function renameTheme(id: number, name: string) {
  const theme = await db.themes.get(id)
  const clean = name.trim()
  if (!theme || !clean || clean === theme.name) return
  await db.transaction('rw', db.themes, db.items, async () => {
    await db.themes.update(id, { name: clean })
    await db.items
      .where('genres')
      .equals(theme.name)
      .filter((i) => i.category === theme.category)
      .modify((i: CultureItem) => {
        i.genres = [...new Set(i.genres.map((g) => (g === theme.name ? clean : g)))]
      })
  })
}

// Les œuvres sont conservées, elles perdent seulement ce thème.
export async function deleteTheme(id: number) {
  const theme = await db.themes.get(id)
  if (!theme) return
  await db.transaction('rw', db.themes, db.items, async () => {
    await db.items
      .where('genres')
      .equals(theme.name)
      .filter((i) => i.category === theme.category)
      .modify((i: CultureItem) => {
        i.genres = i.genres.filter((g) => g !== theme.name)
      })
    await db.themes.delete(id)
  })
}
