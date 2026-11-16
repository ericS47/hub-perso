import Chips from '../../ui/Chips'
import { lireNoms } from './prefs'

interface Props {
  noms: string[]
  onChange: (noms: string[]) => void
  min?: number
  max: number
  // Libellés des choix de nombre (ex. « Solo », « À deux »).
  libelles?: string[]
  couleurs?: string[]
}

export function nomParDefaut(i: number): string {
  return `Joueur ${i + 1}`
}

// Choix du nombre de joueurs et de leurs prénoms (sur le même téléphone).
export default function Joueurs({ noms, onChange, min = 1, max, libelles, couleurs }: Props) {
  const options = Array.from({ length: max - min + 1 }, (_, i) => {
    const n = min + i
    return { value: String(n), label: libelles?.[i] ?? `${n} joueur${n > 1 ? 's' : ''}` }
  })
  const setNombre = (v: string) => {
    const n = Number(v)
    const suite = Array.from({ length: n }, (_, i) => noms[i] ?? nomParDefaut(i))
    onChange(suite)
  }
  return (
    <section className="card">
      <h2>Qui joue ?</h2>
      {max > min && <Chips label="Nombre de joueurs" options={options} value={String(noms.length)} onChange={setNombre} />}
      {noms.length > 1 && (
        <div className="jeux-noms">
          {noms.map((nom, i) => (
            <label key={i} className="field jeux-nom">
              <span>
                {couleurs && <i className="jeux-pastille" style={{ background: couleurs[i % couleurs.length] }} aria-hidden="true" />}
                Prénom du joueur {i + 1}
              </span>
              <input
                value={nom}
                maxLength={16}
                onChange={(e) => onChange(noms.map((x, k) => (k === i ? e.target.value : x)))}
                onFocus={(e) => e.target.select()}
              />
            </label>
          ))}
        </div>
      )}
    </section>
  )
}

// Joueurs de la dernière partie (au plus `max`), sinon un joueur seul.
export function nomsInitiaux(max: number): string[] {
  const l = lireNoms().slice(0, max)
  return l.length > 0 ? l : [nomParDefaut(0)]
}

// Noms nettoyés (vides remplacés par « Joueur n »).
export function nomsPropres(noms: string[]): string[] {
  return noms.map((n, i) => n.trim() || nomParDefaut(i))
}
