// Réduit une photo (souvent plusieurs Mo) à une vignette JPEG légère,
// stockée en data URL dans IndexedDB : elle reste disponible hors ligne.
export async function fileToCover(file: File, maxSide = 600): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const ratio = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * ratio)
  canvas.height = Math.round(bitmap.height * ratio)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return canvas.toDataURL('image/jpeg', 0.82)
}
