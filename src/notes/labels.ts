import type { NoteLabel } from '../db'

// Chemin d'une étiquette, de la racine jusqu'à elle (ex. Travail, puis Réunions).
export function labelPath(labels: NoteLabel[], id: number): NoteLabel[] {
  const byId = new Map(labels.map((l) => [l.id, l]))
  const path: NoteLabel[] = []
  let current = byId.get(id)
  // Garde-fou contre une boucle de parents, qui ne devrait jamais exister.
  while (current && path.length < 50) {
    path.unshift(current)
    current = current.parentId ? byId.get(current.parentId) : undefined
  }
  return path
}

export function labelPathName(labels: NoteLabel[], id: number): string {
  return labelPath(labels, id).map((l) => l.name).join(' › ')
}

// Toutes les étiquettes, triées par chemin complet, pour une liste de choix.
export function labelOptions(labels: NoteLabel[]) {
  return labels
    .map((l) => ({ id: l.id as number, name: labelPathName(labels, l.id as number) }))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
}
