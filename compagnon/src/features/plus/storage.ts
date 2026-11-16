import { useCallback, useEffect, useRef, useState } from 'react'

// Stockage local (localStorage) des données propres à l'onglet « Plus » qui n'ont pas
// de table dans la base : demandes de contact, intérêt pour le coaching.
// Clés toutes préfixées 'compagnon.plus.'. Tout reste sur le téléphone.
const PREFIX = 'compagnon.plus.'
const EVENT = 'compagnon-plus-storage'

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // Stockage indisponible (navigation privée…) : on ignore sans bloquer l'écran.
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: key }))
}

// Valeur lue et écrite dans localStorage, synchronisée entre les composants.
export function useLocal<T>(key: string, fallback: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => read(key, fallback))
  // Valeur par défaut figée au premier rendu (souvent un littéral recréé à chaque rendu).
  const fallbackRef = useRef(fallback)
  useEffect(() => {
    const onChange = () => setValue(read(key, fallbackRef.current))
    window.addEventListener(EVENT, onChange)
    window.addEventListener('storage', onChange)
    return () => {
      window.removeEventListener(EVENT, onChange)
      window.removeEventListener('storage', onChange)
    }
  }, [key])
  const set = useCallback((v: T) => write(key, v), [key])
  return [value, set]
}

export interface ContactRequest {
  id: string
  proId: string
  motifs: string[]
  texte: string
  creneau: string
  createdAt: number
}

export const REQUESTS_KEY = 'demandes'

export interface CoachPrefs {
  partage: string[]
  prevenir: boolean
  updatedAt?: number
}

export const COACH_KEY = 'coach'
export const COACH_DEFAULT: CoachPrefs = { partage: [], prevenir: false }
