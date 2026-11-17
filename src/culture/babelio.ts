import { db, type CultureItem } from '../db'
import { ensureThemes } from './themes'

// Import de l'export « Mes livres » de Babelio (fichier CSV). Le format exact
// n'est pas documenté : séparateur, encodage et colonnes sont détectés.

function decode(buf: ArrayBuffer) {
  const utf8 = new TextDecoder('utf-8').decode(buf)
  // Caractères illisibles en UTF-8 : fichier enregistré en Windows-1252 (Excel).
  return utf8.includes('�') ? new TextDecoder('windows-1252').decode(buf) : utf8
}

function parseCsv(text: string) {
  const firstLine = text.slice(0, text.indexOf('\n') >>> 0)
  const sep = [';', '\t', ','].reduce((best, s) => (firstLine.split(s).length > firstLine.split(best).length ? s : best))
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"'
        i++
      } else if (c === '"') quoted = false
      else cell += c
    } else if (c === '"') quoted = true
    else if (c === sep) {
      row.push(cell)
      cell = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(cell)
      if (row.some((x) => x.trim())) rows.push(row)
      row = []
      cell = ''
    } else cell += c
  }
  row.push(cell)
  if (row.some((x) => x.trim())) rows.push(row)
  return rows
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

function column(header: string[], ...names: string[]) {
  return header.findIndex((h) => names.some((n) => norm(h).includes(n)))
}

export interface ImportResult {
  added: number
  skipped: number
  // Livres déjà présents qui ont reçu de nouveaux thèmes.
  updated: number
  total: number
}

export async function importBabelio(file: File): Promise<ImportResult> {
  const rows = parseCsv(decode(await file.arrayBuffer()).replace(/^﻿/, ''))
  const header = rows[0] ?? []
  const iTitle = column(header, 'titre', 'title')
  if (iTitle < 0) throw new Error('Colonne « Titre » introuvable : est-ce bien l’export CSV de Babelio ?')
  const iAuthor = column(header, 'auteur', 'author')
  const iIsbn = column(header, 'isbn', 'ean')
  const iCover = column(header, 'couverture', 'cover', 'image')
  const iThemes = column(header, 'theme', 'genre')

  const existing = new Map<string, CultureItem>()
  for (const i of await db.items.where('category').equals('livres').toArray()) existing.set(norm(i.title), i)
  const seenInFile = new Set<string>()
  const now = Date.now()
  const toAdd: CultureItem[] = []
  const toUpdate: CultureItem[] = []
  const allThemes = new Set<string>()
  let skipped = 0

  rows.slice(1).forEach((r, index) => {
    const title = r[iTitle]?.trim()
    if (!title) return
    const themes =
      iThemes >= 0
        ? (r[iThemes] ?? '')
            .split(/[,|]/)
            .map((t) => t.trim())
            .filter(Boolean)
        : []
    themes.forEach((t) => allThemes.add(t))
    const key = norm(title)
    if (seenInFile.has(key)) {
      skipped++
      return
    }
    seenInFile.add(key)
    // Déjà dans Maestro : on ajoute seulement les thèmes manquants.
    const known = existing.get(key)
    if (known) {
      const merged = [...new Set([...known.genres, ...themes])]
      if (merged.length > known.genres.length) toUpdate.push({ ...known, genres: merged })
      else skipped++
      return
    }
    const isbn = iIsbn >= 0 ? r[iIsbn]?.replace(/[^0-9Xx]/g, '') : ''
    toAdd.push({
      title,
      category: 'livres',
      creator: iAuthor >= 0 ? r[iAuthor]?.trim() || undefined : undefined,
      // Couverture fournie par le fichier, sinon Open Library par ISBN ;
      // à défaut, l'icône s'affiche.
      cover:
        (iCover >= 0 && /^https:\/\//.test(r[iCover]?.trim() ?? '') ? r[iCover].trim() : undefined) ??
        (isbn && isbn.length >= 10 ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false` : undefined),
      seen: false,
      priority: false,
      ownership: 'none',
      genres: themes,
      listIds: [],
      // Ordre du fichier conservé (le premier livre reste le plus récent).
      createdAt: now - index,
    })
  })

  await ensureThemes('livres', [...allThemes])
  await db.items.bulkAdd(toAdd)
  await db.items.bulkPut(toUpdate)
  return { added: toAdd.length, updated: toUpdate.length, skipped, total: toAdd.length + toUpdate.length + skipped }
}
