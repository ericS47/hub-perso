// Code-barres (EAN) → produit, d'après Open Products Facts : base libre de
// produits non alimentaires, ouverte aux appels depuis une page web.
// Elle connaît encore peu de puzzles : à défaut, la photo reste la solution.

// EAN-8, UPC-12 ou EAN-13 (chiffres seulement).
export const isBarcode = (s: string | undefined) => !!s && /^\d{8}$|^\d{12,13}$/.test(s.trim())

export interface BarcodeProduct {
  name?: string
  brand?: string
  image?: string
}

export async function lookupBarcode(ean: string, signal?: AbortSignal): Promise<BarcodeProduct | undefined> {
  const url = `https://world.openproductsfacts.org/api/v2/product/${ean.trim()}.json?fields=product_name,brands,image_front_url`
  const res = await fetch(url, { signal })
  if (!res.ok) return undefined
  const data = await res.json()
  if (data.status !== 1 || !data.product) return undefined
  const p = data.product
  return {
    name: p.product_name || undefined,
    brand: p.brands?.split(',')[0]?.trim() || undefined,
    image: p.image_front_url || undefined,
  }
}
