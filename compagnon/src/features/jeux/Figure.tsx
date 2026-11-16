import { POSES, type Decor, type Frame, type Pose, type PoseId } from './poses'

interface Props {
  pose: PoseId
  couleur?: string
  size?: number
  // Anime l'alternance des deux images (désactivé dans les petites vignettes si besoin).
  anime?: boolean
  label?: string
}

function Corps({ f, couleur }: { f: Frame; couleur: string }) {
  const [e1, h1, e2, h2] = f.a
  const [k1, p1, k2, p2] = f.l
  const seg = (pts: [number, number][]) => pts.map((p) => p.join(',')).join(' ')
  return (
    <g stroke={couleur} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" fill="none">
      {/* Membres du fond, plus pâles */}
      <g opacity={0.45}>
        <polyline points={seg([f.n, e1, h1])} />
        <polyline points={seg([f.p, k1, p1])} />
      </g>
      <polyline points={seg([f.n, f.p])} />
      <polyline points={seg([f.p, k2, p2])} />
      <polyline points={seg([f.n, e2, h2])} />
      <circle cx={f.h[0]} cy={f.h[1]} r={7} fill={couleur} stroke="none" />
    </g>
  )
}

function DecorSvg({ decor }: { decor: Decor }) {
  const s = { stroke: '#a89a84', strokeWidth: 3, strokeLinecap: 'round' as const, fill: 'none' }
  switch (decor) {
    case 'chaise':
      return <path d="M24 36 V94 M24 64 H50 M48 64 V94" {...s} />
    case 'chaise-derriere':
      return <path d="M22 44 V94 M22 70 H42 M40 70 V94" {...s} />
    case 'chaise-face':
      return <path d="M34 64 H66 M36 64 V94 M64 64 V94" {...s} />
    case 'mur':
      return <path d="M80 12 V94" {...s} strokeWidth={4} />
    case 'appui-gauche':
      return <path d="M22 52 H32 M26 52 V94" {...s} />
    case 'appui-droite':
      return <path d="M62 50 H76 M70 50 V94" {...s} />
  }
}

// Bonhomme bâton schématique ; deux images qui alternent doucement.
export default function Figure({ pose, couleur = '#1f6f6b', size = 120, anime = true, label }: Props) {
  const p: Pose = POSES[pose]
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className="jeux-figure"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <line x1={8} y1={95} x2={92} y2={95} stroke="#d8cdb9" strokeWidth={2} strokeLinecap="round" />
      {p.decor && <DecorSvg decor={p.decor} />}
      {/* Image fixe : la B, plus parlante. */}
      <g className={p.B && anime ? 'jeux-fig-a anime' : 'jeux-fig-a'}>
        <Corps f={anime ? p.A : (p.B ?? p.A)} couleur={couleur} />
      </g>
      {p.B && anime && (
        <g className="jeux-fig-b">
          <Corps f={p.B} couleur={couleur} />
        </g>
      )}
      {p.souffle && (
        <g className="jeux-souffle" stroke={couleur} strokeWidth={2} strokeLinecap="round" fill="none" opacity={0.6}>
          <path d="M50 22 q4 -3 8 0 t8 0" />
          <path d="M51 28 q4 -3 8 0 t8 0" />
        </g>
      )}
    </svg>
  )
}
