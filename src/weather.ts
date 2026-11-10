// Open-Meteo : API gratuite, sans clé, usage non commercial.
export interface Coords {
  lat: number
  lon: number
  name: string
}

export interface DayForecast {
  date: string
  tempMax: number
  tempMin: number
  code: number
  // Risque de pluie du jour, en %.
  rain: number | null
}

export interface CurrentWeather {
  temp: number
  code: number
}

export interface Forecast {
  current: CurrentWeather
  days: DayForecast[]
}

export const DEFAULT_CITY = 'Saint-Sulpice-la-Pointe'

export async function geocodeCity(name: string): Promise<Coords | null> {
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search')
  url.searchParams.set('name', name)
  url.searchParams.set('count', '1')
  url.searchParams.set('language', 'fr')
  url.searchParams.set('country', 'FR')
  const res = await fetch(url)
  if (!res.ok) throw new Error('Géocodage indisponible')
  const data = await res.json()
  const hit = data.results?.[0]
  if (!hit) return null
  return { lat: hit.latitude, lon: hit.longitude, name: hit.name }
}

export async function fetchForecast(lat: number, lon: number): Promise<Forecast> {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', String(lat))
  url.searchParams.set('longitude', String(lon))
  url.searchParams.set('current', 'temperature_2m,weather_code')
  url.searchParams.set(
    'daily',
    'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
  )
  url.searchParams.set('timezone', 'Europe/Paris')
  url.searchParams.set('forecast_days', '3')
  const res = await fetch(url)
  if (!res.ok) throw new Error('Météo indisponible')
  const data = await res.json()
  const rain: (number | null)[] = data.daily.precipitation_probability_max ?? []
  return {
    current: {
      temp: Math.round(data.current.temperature_2m),
      code: data.current.weather_code,
    },
    days: data.daily.time.map((date: string, i: number) => ({
      date,
      tempMax: Math.round(data.daily.temperature_2m_max[i]),
      tempMin: Math.round(data.daily.temperature_2m_min[i]),
      code: data.daily.weather_code[i],
      rain: rain[i] ?? null,
    })),
  }
}

// Codes WMO vers un libellé en français.
export function weatherLabel(code: number): string {
  if (code === 0) return 'Ensoleillé'
  if (code === 1) return 'Peu nuageux'
  if (code === 2) return 'Partiellement nuageux'
  if (code === 3) return 'Couvert'
  if (code <= 48) return 'Brouillard'
  if (code <= 57) return 'Bruine'
  if (code <= 67) return 'Pluie'
  if (code <= 77) return 'Neige'
  if (code <= 82) return 'Averses'
  if (code <= 86) return 'Averses de neige'
  return 'Orage'
}

// Codes WMO simplifiés vers une icône.
export function weatherIcon(code: number): string {
  if (code === 0) return '☀️'
  if (code <= 3) return '⛅'
  if (code <= 48) return '🌫️'
  if (code <= 67) return '🌧️'
  if (code <= 77) return '🌨️'
  if (code <= 82) return '🌦️'
  return '⛈️'
}

export function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Géolocalisation non disponible'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 10000,
    })
  })
}
