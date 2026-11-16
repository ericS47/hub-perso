import { useLiveQuery } from 'dexie-react-hooks'
import { db, type SettingsMap } from '../db'

export const DEFAULT_SETTINGS: SettingsMap = {
  companion: { kind: 'doudou', name: 'Bondi', color: '#1f6f6b', tutoiement: true },
  reminders: { enabled: false, planningDay: 6, planningTime: '18:00', beforeSessionMin: 30, encouragements: true },
  firstName: '',
  welcomeDone: false,
  plan: 'gratuite',
}

export async function getSetting<K extends keyof SettingsMap>(key: K): Promise<SettingsMap[K]> {
  const row = await db.settings.get(key)
  return (row?.value as SettingsMap[K] | undefined) ?? DEFAULT_SETTINGS[key]
}

export async function setSetting<K extends keyof SettingsMap>(key: K, value: SettingsMap[K]): Promise<void> {
  await db.settings.put({ key, value })
}

// Valeur en direct d'un réglage. undefined tant que la base n'a pas répondu.
export function useSetting<K extends keyof SettingsMap>(key: K): SettingsMap[K] | undefined {
  return useLiveQuery(() => getSetting(key), [key])
}
