import Chips from '../../ui/Chips'
import { nomParDefaut } from './prefs'

interface Props {
  noms: string[]
  onChange: (noms: string[]) => void
  min?: number
  max: number
  // Libellés des choix de nombre (ex. « Solo », « À deux »).
  libelles?: string[]
  couleurs?: string[]
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
