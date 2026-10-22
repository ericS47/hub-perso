import { useEffect, useState } from 'react'
import {
  DEFAULT_CITY,
  fetchForecast,
  geocodeCity,
  getPosition,
  type Coords,
  type DayForecast,
} from '../weather'

// Météo de la ville par défaut, puis position actuelle si l'utilisateur le demande.
export function useWeather() {
  const [place, setPlace] = useState<Coords | null>(null)
  const [forecast, setForecast] = useState<DayForecast[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const coords = await geocodeCity(DEFAULT_CITY)
        if (!coords) throw new Error('Ville introuvable')
        if (cancelled) return
        setPlace(coords)
        setForecast(await fetchForecast(coords.lat, coords.lon))
      } catch {
        if (!cancelled) setError('Météo indisponible')
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  async function locate() {
    setLocating(true)
    setError(null)
    try {
      const pos = await getPosition()
      const { latitude: lat, longitude: lon } = pos.coords
      setPlace({ lat, lon, name: 'Ma position' })
      setForecast(await fetchForecast(lat, lon))
    } catch {
      setError('Localisation refusée ou indisponible')
    } finally {
      setLocating(false)
    }
  }

  return { place, forecast, error, locating, locate }
}
