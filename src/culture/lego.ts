// Numéro de set LEGO (celui de la boîte : 75192, 10497…) → image de la boîte,
// d'après la base Rebrickable qui range ses photos par numéro de set.

// « 75192 » → « 75192-1 » (la première version du set, la plus courante).
export function legoRef(input: string | undefined) {
  const m = input?.trim().match(/^(\d{3,7})(?:-(\d{1,2}))?$/)
  return m ? `${m[1]}-${m[2] ?? '1'}` : undefined
}

export const legoImage = (ref: string) => `https://cdn.rebrickable.com/media/sets/${ref}.jpg`
