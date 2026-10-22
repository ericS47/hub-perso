// CoinGecko : API publique sans clé, limitée en nombre de requêtes.
export interface PricePoint {
  time: number // secondes depuis l'epoch, format attendu par le graphique
  value: number
}

export async function fetchCryptoHistory(coinId: string, days = 365): Promise<PricePoint[]> {
  const url = new URL(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart`)
  url.searchParams.set('vs_currency', 'eur')
  url.searchParams.set('days', String(days))
  const res = await fetch(url)
  if (!res.ok) throw new Error('Cours indisponibles')
  const data = (await res.json()) as { prices: [number, number][] }
  return data.prices.map(([ms, value]) => ({ time: Math.floor(ms / 1000), value }))
}
