const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[30, 30], [70, 70]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[30, 30], [70, 30], [30, 70], [70, 70]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[30, 26], [70, 26], [30, 50], [70, 50], [30, 74], [70, 74]],
}

// Face de dé en SVG.
export default function De({ valeur, roule }: { valeur: number; roule?: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className={roule ? 'jeux-de roule' : 'jeux-de'} aria-hidden="true">
      <rect x={4} y={4} width={92} height={92} rx={20} fill="#fff" stroke="#22302f" strokeWidth={5} />
      {PIPS[valeur]?.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={9} fill="#22302f" />
      ))}
    </svg>
  )
}
