import type { ReactNode } from 'react'
import { LETTRES, bateauEn, nomCase, type Camp } from './logique'

interface Props {
  camp: Camp
  taille: number
  // 'attaque' : on ne voit que ses tirs ; 'flotte' : on voit ses bateaux.
  vue: 'attaque' | 'flotte'
  onCase?: (index: number) => void
  dernier?: number | null
  petite?: boolean
  label: string
  // Cases mises en avant (placement en cours).
  surbrillance?: number[]
}

// Grille de bataille navale accessible : chaque case est un bouton nommé (ex. « C4, à l'eau »).
export default function Grille({ camp, taille, vue, onCase, dernier, petite, label, surbrillance }: Props) {
  const cases = Array.from({ length: taille * taille }, (_, i) => i)
  return (
    <div
      className={`jeux-nav-grille${petite ? ' petite' : ''}`}
      style={{ gridTemplateColumns: `1.1em repeat(${taille}, 1fr)` }}
      role="group"
      aria-label={label}
    >
      <span />
      {Array.from({ length: taille }, (_, x) => (
        <span key={x} className="jeux-nav-entete" aria-hidden="true">
          {LETTRES[x]}
        </span>
      ))}
      {cases.map((i) => {
        const x = i % taille
        const tir = camp.tirs[i]
        const b = vue === 'flotte' ? bateauEn(camp, i) : undefined
        const etat = tir ?? (b ? 'bateau' : 'vide')
        const libelle = `${nomCase(i, taille)}, ${
          tir === 'eau' ? 'à l’eau' : tir === 'touche' ? 'touché' : tir === 'coule' ? 'coulé' : b ? b.nom : 'non visée'
        }`
        const cls = `jeux-nav-case ${etat}${b && vue === 'flotte' ? ' bateau' : ''}${dernier === i ? ' dernier' : ''}${
          surbrillance?.includes(i) ? ' surb' : ''
        }`
        return (
          <FragmentLigne key={i} x={x} y={Math.floor(i / taille)}>
            <button
              type="button"
              className={cls}
              aria-label={libelle}
              disabled={!onCase || (vue === 'attaque' && tir !== null)}
              onClick={() => onCase?.(i)}
            >
              {tir === 'eau' ? '•' : tir === 'touche' ? '✕' : tir === 'coule' ? '✕' : ''}
            </button>
          </FragmentLigne>
        )
      })}
    </div>
  )
}

// Ajoute le numéro de ligne devant la première case de chaque ligne.
function FragmentLigne({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  return (
    <>
      {x === 0 && (
        <span className="jeux-nav-entete" aria-hidden="true">
          {y + 1}
        </span>
      )}
      {children}
    </>
  )
}
