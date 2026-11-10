import { useEffect, useState } from 'react'
import {
  DEFAULT_CITY,
  fetchForecast,
  geocodeCity,
  getPosition,
  type Coords,
  type CurrentWeather,
  type DayForecast,
} from '../weather'

// Météo de la ville par défaut, puis position actuelle si l'utilisateur le demande.
export function useWeather() {
  const [place, setPlace] = useState<Coords | null>(null)
  const [current, setCurrent] = useState<CurrentWeather | null>(null)
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
        const f = await fetchForecast(coords.lat, coords.lon)
        if (cancelled) return
        setCurrent(f.current)
        setForecast(f.days)
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
      const f = await fetchForecast(lat, lon)
      setCurrent(f.current)
      setForecast(f.days)
    } catch {
      setError('Localisation refusée ou indisponible')
    } finally {
      setLocating(false)
    }
  }

  return { place, current, forecast, error, locating, locate }
}
