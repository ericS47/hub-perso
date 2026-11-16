import { useId } from 'react'
import type { CompanionSettings } from '../../db'
import { shade } from './voice'
import './compagnon.css'

type Mood = 'neutre' | 'content' | 'attentif' | 'encourageant'

interface Props {
  companion: CompanionSettings
  size?: number
  mood?: Mood
}

interface FaceProps {
  cx: number
  eyeY: number
  gap: number
  mouthY: number
  mood: Mood
  ink: string
  // Reflet dans les yeux (absent quand les yeux sont clairs sur fond sombre).
  glint?: string
  cheek: string
  cheekY: number
  cheekGap: number
}

// Visage commun : yeux, sourcils, bouche et joues changent selon l'humeur.
function Face({ cx, eyeY, gap, mouthY, mood, ink, glint, cheek, cheekY, cheekGap }: FaceProps) {
  const eyes = [cx - gap, cx + gap]
  const stroke = { stroke: ink, strokeWidth: 2.6, strokeLinecap: 'round' as const, fill: 'none' }
  return (
    <g>
      {/* Joues */}
      {eyes.map((_, i) => (
        <ellipse
          key={i}
          cx={i === 0 ? cx - cheekGap : cx + cheekGap}
          cy={cheekY}
          rx={4.6}
          ry={3}
          fill={cheek}
          opacity={mood === 'neutre' ? 0.35 : 0.6}
        />
      ))}

      {/* Yeux */}
      {mood === 'content' ? (
        eyes.map((x) => <path key={x} d={`M${x - 4} ${eyeY + 1.5} Q${x} ${eyeY - 4} ${x + 4} ${eyeY + 1.5}`} {...stroke} />)
      ) : (
        <g className="compagnon-av-eyes">
          {eyes.map((x) => (
            <g key={x}>
              <circle cx={x} cy={eyeY} r={mood === 'attentif' ? 4.3 : mood === 'encourageant' ? 4 : 3.6} fill={ink} />
              {glint && <circle cx={x + 1.3} cy={eyeY - 1.4} r={1.2} fill={glint} />}
            </g>
          ))}
        </g>
      )}

      {/* Sourcils : levés quand le compagnon écoute ou encourage */}
      {(mood === 'attentif' || mood === 'encourageant') &&
        eyes.map((x, i) => (
          <path
            key={`b${x}`}
            d={
              mood === 'attentif'
                ? `M${x - 3.5} ${eyeY - 8 + (i === 0 ? 1 : -1)} Q${x} ${eyeY - 10} ${x + 3.5} ${eyeY - 8 + (i === 0 ? -1 : 1)}`
                : `M${x - 3.5} ${eyeY - 8} Q${x} ${eyeY - 10.5} ${x + 3.5} ${eyeY - 8}`
            }
            {...stroke}
            strokeWidth={2}
          />
        ))}

      {/* Bouche */}
      {mood === 'neutre' && <path d={`M${cx - 4.5} ${mouthY} Q${cx} ${mouthY + 3.5} ${cx + 4.5} ${mouthY}`} {...stroke} />}
      {mood === 'content' && <path d={`M${cx - 6.5} ${mouthY - 1} Q${cx} ${mouthY + 6} ${cx + 6.5} ${mouthY - 1}`} {...stroke} />}
      {mood === 'attentif' && <ellipse cx={cx} cy={mouthY + 1} rx={2.4} ry={2} fill={ink} />}
      {mood === 'encourageant' && (
        <path d={`M${cx - 6.5} ${mouthY - 1.5} Q${cx} ${mouthY + 9} ${cx + 6.5} ${mouthY - 1.5} Z`} fill={ink} strokeLinejoin="round" stroke={ink} strokeWidth={1.5} />
      )}
    </g>
  )
}

const CHEEK = '#f29a9a'

function Doudou({ color, mood }: { color: string; mood: Mood }) {
  const light = shade(color, 0.45)
  const lighter = shade(color, 0.75)
  const ink = shade(color, -0.7)
  return (
    <g>
      <ellipse cx={50} cy={97} rx={30} ry={17} fill={color} />
      <ellipse cx={50} cy={99} rx={17} ry={11} fill={lighter} />
      {[24, 76].map((x) => (
        <g key={x}>
          <circle cx={x} cy={25} r={12} fill={color} />
          <circle cx={x} cy={25} r={6.5} fill={light} />
        </g>
      ))}
      <circle cx={50} cy={50} r={30} fill={color} />
      <ellipse cx={50} cy={63} rx={13.5} ry={10.5} fill={lighter} />
      <ellipse cx={50} cy={58.5} rx={4.2} ry={3} fill={ink} />
      {/* Petite couture sur le front */}
      <path d="M44 27 l2 2 M48 26 l2 2 M52 26 l2 2" stroke={light} strokeWidth={1.4} strokeLinecap="round" />
      <Face cx={50} eyeY={47} gap={11} mouthY={64} mood={mood} ink={ink} glint="#ffffff" cheek={CHEEK} cheekY={57} cheekGap={20} />
    </g>
  )
}

function Robot({ color, mood }: { color: string; mood: Mood }) {
  const dark = shade(color, -0.62)
  const mid = shade(color, -0.2)
  const light = shade(color, 0.6)
  return (
    <g>
      <rect x={30} y={79} width={40} height={30} rx={10} fill={color} />
      <circle cx={50} cy={90} r={4} fill="#f2b84b" />
      <line x1={50} y1={14} x2={50} y2={25} stroke={dark} strokeWidth={2.5} strokeLinecap="round" />
      <circle className="compagnon-av-antenna" cx={50} cy={12} r={4.2} fill="#f2b84b" />
      <rect x={14} y={42} width={9} height={17} rx={3.5} fill={mid} />
      <rect x={77} y={42} width={9} height={17} rx={3.5} fill={mid} />
      <rect x={21} y={24} width={58} height={51} rx={15} fill={color} />
      <rect x={28} y={32} width={44} height={34} rx={10} fill={dark} />
      <rect x={31} y={34} width={12} height={3} rx={1.5} fill={light} opacity={0.35} />
      <Face cx={50} eyeY={46} gap={9.5} mouthY={55} mood={mood} ink={light} cheek="#f7a6b6" cheekY={53} cheekGap={16} />
    </g>
  )
}

function Doc({ color, mood }: { color: string; mood: Mood }) {
  const skin = '#f2d3b8'
  const hair = '#5b4033'
  const ink = '#3a2b24'
  return (
    <g>
      {/* Blouse blanche sur une tunique de la couleur choisie */}
      <path d="M16 104 Q18 79 50 76 Q82 79 84 104 Z" fill="#ffffff" stroke="#cfd8d6" strokeWidth={1.5} />
      <path d="M41 77 L50 92 L59 77 Z" fill={color} />
      <path d="M39 78 Q38 96 50 97 Q62 96 61 78" stroke="#6b7a78" strokeWidth={2} fill="none" strokeLinecap="round" />
      <circle cx={50} cy={97} r={3.4} fill="#9fb0ad" stroke="#6b7a78" strokeWidth={1.2} />
      <rect x={63} y={86} width={11} height={6} rx={1.5} fill={color} />
      <rect x={44} y={64} width={12} height={14} rx={4} fill={skin} />
      <circle cx={26.5} cy={49} r={4.5} fill={skin} />
      <circle cx={73.5} cy={49} r={4.5} fill={skin} />
      <circle cx={50} cy={47} r={24} fill={skin} />
      <path d="M25 47 Q24 20 50 20 Q76 20 75 47 Q71 33 56 31 Q52 37 41 35 Q30 36 25 47 Z" fill={hair} />
      {/* Bandeau de la couleur choisie */}
      <path d="M27 36 Q50 24 73 36" stroke={color} strokeWidth={4} fill="none" strokeLinecap="round" />
      <Face cx={50} eyeY={48} gap={9} mouthY={58} mood={mood} ink={ink} glint="#ffffff" cheek={CHEEK} cheekY={55} cheekGap={14} />
    </g>
  )
}

function Animal({ color, mood }: { color: string; mood: Mood }) {
  const inner = shade(color, -0.35)
  const cream = '#fff7ee'
  const ink = shade(color, -0.75)
  return (
    <g>
      <ellipse cx={50} cy={97} rx={26} ry={16} fill={color} />
      <ellipse cx={50} cy={98} rx={12} ry={12} fill={cream} />
      <path d="M23 42 L27 9 L47 28 Z" fill={color} strokeLinejoin="round" stroke={color} strokeWidth={3} />
      <path d="M29 34 L30.5 18 L41 28 Z" fill={inner} />
      <path d="M77 42 L73 9 L53 28 Z" fill={color} strokeLinejoin="round" stroke={color} strokeWidth={3} />
      <path d="M71 34 L69.5 18 L59 28 Z" fill={inner} />
      <path d="M18 47 Q18 23 50 23 Q82 23 82 47 Q82 65 50 80 Q18 65 18 47 Z" fill={color} />
      <path d="M19 52 Q34 55 50 60 Q66 55 81 52 Q76 67 50 80 Q24 67 19 52 Z" fill={cream} />
      <ellipse cx={50} cy={68} rx={4} ry={3} fill={ink} />
      <Face cx={50} eyeY={45} gap={12} mouthY={72} mood={mood} ink={ink} glint="#ffffff" cheek={CHEEK} cheekY={57} cheekGap={20} />
    </g>
  )
}

function Bulle({ color, mood, gradId }: { color: string; mood: Mood; gradId: string }) {
  return (
    <g>
      <defs>
        <radialGradient id={gradId} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor={shade(color, 0.45)} />
          <stop offset="100%" stopColor={color} />
        </radialGradient>
      </defs>
      <path
        d="M50 13 C74 13 89 30 88 53 C87 77 71 91 50 91 C28 91 12 77 12 53 C12 29 27 13 50 13 Z"
        fill={`url(#${gradId})`}
      />
      <ellipse cx={34} cy={29} rx={8} ry={4.5} fill="#ffffff" opacity={0.35} transform="rotate(-25 34 29)" />
      <Face cx={50} eyeY={50} gap={10} mouthY={61} mood={mood} ink="#ffffff" cheek="#ffffff" cheekY={58} cheekGap={18} />
    </g>
  )
}

// Avatar du compagnon : cinq personnages en SVG, dans la couleur choisie.
// Respiration discrète (coupée si l'utilisateur préfère réduire les animations).
export default function Avatar({ companion, size = 64, mood = 'neutre' }: Props) {
  const gradId = `compagnon-g${useId().replace(/:/g, '')}`
  const { color, kind } = companion
  return (
    <svg
      className="compagnon-avatar"
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
    >
      <g className="compagnon-av-breathe">
        <g transform={mood === 'attentif' ? 'rotate(-5 50 70)' : undefined}>
          {kind === 'doudou' && <Doudou color={color} mood={mood} />}
          {kind === 'robot' && <Robot color={color} mood={mood} />}
          {kind === 'doc' && <Doc color={color} mood={mood} />}
          {kind === 'animal' && <Animal color={color} mood={mood} />}
          {kind === 'bulle' && <Bulle color={color} mood={mood} gradId={gradId} />}
        </g>
      </g>
    </svg>
  )
}
