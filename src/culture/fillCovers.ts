import { db, type CultureCategory, type CultureItem } from '../db'
import { suggest } from './suggest'
import { searchCovers } from './coverSearch'

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

// Vrai si l'image s'affiche (lien mort, site qui refuse… → faux).
function loads(url: string, timeoutMs = 8000) {
  return new Promise<boolean>((resolve) => {
    const img = new Image()
    img.referrerPolicy = 'no-referrer'
    const timer = window.setTimeout(() => resolve(false), timeoutMs)
    img.onload = () => {
      window.clearTimeout(timer)
      resolve(img.naturalWidth > 1)
    }
    img.onerror = () => {
      window.clearTimeout(timer)
      resolve(false)
    }
    img.src = url
  })
}

// Meilleure image pour un titre : d'abord une proposition au titre identique
// (iTunes, Google Livres, Wikidata…), sinon le premier résultat de la recherche
// de couverture.
async function bestCover(category: CultureCategory, title: string, signal: AbortSignal) {
  const target = norm(title)
  const { suggestions } = await suggest(category, title, signal)
  const withCover = suggestions.filter((s) => s.cover)
  const exact = withCover.find((s) => norm(s.title) === target)
  const close = withCover.find((s) => norm(s.title).startsWith(target) || target.startsWith(norm(s.title)))
  const pick = exact ?? close
  if (pick?.cover) return pick.cover
  const { hits } = await searchCovers(category, title, signal)
  return hits[0]?.url
}

export interface FillProgress {
  done: number
  total: number
  found: number
}

// Les photos importées (data:) sont gardées telles quelles.
export async function fillMissingCovers(
  items: CultureItem[],
  signal: AbortSignal,
  onProgress: (p: FillProgress) => void,
) {
  const candidates: CultureItem[] = []
  for (const item of items) {
    if (signal.aborted) break
    if (!item.cover) candidates.push(item)
    else if (!item.cover.startsWith('data:') && !(await loads(item.cover))) candidates.push(item)
  }
  const progress: FillProgress = { done: 0, total: candidates.length, found: 0 }
  onProgress(progress)
  for (const item of candidates) {
    if (signal.aborted) break
    try {
      const cover = await bestCover(item.category, item.title, signal)
      if (cover && cover !== item.cover && (await loads(cover))) {
        await db.items.update(item.id!, { cover })
        progress.found++
      }
    } catch {
      // Une œuvre introuvable n'arrête pas les autres.
    }
    progress.done++
    onProgress({ ...progress })
  }
  return progress
}
