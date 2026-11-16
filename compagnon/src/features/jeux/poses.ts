// Poses des bonshommes bâtons (repère 100 × 100, sol à y = 94).
// Chaque pose a une image A et, si besoin, une image B : l'illustration alterne entre les deux.
export type Pt = [number, number]

export interface Frame {
  h: Pt // tête
  n: Pt // cou / épaules
  p: Pt // bassin
  // Bras : coude 1, main 1, coude 2, main 2 (le 1 est le membre « du fond », plus pâle).
  a: [Pt, Pt, Pt, Pt]
  // Jambes : genou 1, pied 1, genou 2, pied 2.
  l: [Pt, Pt, Pt, Pt]
}

export type Decor = 'chaise' | 'chaise-face' | 'mur' | 'appui-gauche' | 'appui-droite' | 'chaise-derriere'

export interface Pose {
  decor?: Decor
  souffle?: boolean
  A: Frame
  B?: Frame
}

// Debout, de face.
const FACE: Frame = {
  h: [50, 17],
  n: [50, 27],
  p: [50, 55],
  a: [[42, 40], [40, 54], [58, 40], [60, 54]],
  l: [[46, 74], [45, 93], [54, 74], [55, 93]],
}

// Debout, de profil (regard vers la droite).
const PROFIL: Frame = {
  h: [52, 17],
  n: [50, 27],
  p: [49, 55],
  a: [[51, 41], [56, 53], [53, 41], [59, 52]],
  l: [[50, 74], [48, 93], [52, 74], [51, 93]],
}

// Assis de profil sur une chaise placée à gauche.
const ASSIS: Frame = {
  h: [39, 21],
  n: [37, 31],
  p: [36, 62],
  a: [[41, 46], [50, 57], [43, 46], [52, 57]],
  l: [[57, 61], [56, 92], [59, 62], [59, 92]],
}

// Assis de face.
const ASSIS_FACE: Frame = {
  h: [50, 22],
  n: [50, 32],
  p: [50, 62],
  a: [[42, 46], [43, 60], [58, 46], [57, 60]],
  l: [[43, 70], [43, 92], [57, 70], [57, 92]],
}

type Patch = Partial<Omit<Frame, 'a' | 'l'>> & { a?: Partial<Record<0 | 1 | 2 | 3, Pt>>; l?: Partial<Record<0 | 1 | 2 | 3, Pt>>; dy?: number }

// Copie d'une image avec quelques points modifiés (et un décalage vertical éventuel).
function m(base: Frame, patch: Patch): Frame {
  const a = [...base.a] as Frame['a']
  const l = [...base.l] as Frame['l']
  for (const [k, v] of Object.entries(patch.a ?? {})) a[Number(k)] = v
  for (const [k, v] of Object.entries(patch.l ?? {})) l[Number(k)] = v
  const f: Frame = { h: patch.h ?? base.h, n: patch.n ?? base.n, p: patch.p ?? base.p, a, l }
  if (!patch.dy) return f
  const s = (pt: Pt): Pt => [pt[0], pt[1] + (patch.dy ?? 0)]
  return { h: s(f.h), n: s(f.n), p: s(f.p), a: f.a.map(s) as Frame['a'], l: [s(f.l[0]), f.l[1], s(f.l[2]), f.l[3]] }
}

export const POSES = {
  // ── Assis ──
  assis: { decor: 'chaise', A: ASSIS, B: m(ASSIS, { l: { 0: [55, 62], 2: [57, 63] } }) },
  'assis-respire': {
    decor: 'chaise',
    souffle: true,
    A: m(ASSIS, { a: { 0: [44, 45], 1: [42, 52], 2: [46, 46], 3: [43, 54] } }),
    B: m(ASSIS, { h: [39, 20], a: { 0: [45, 44], 1: [43, 52], 2: [47, 45], 3: [44, 54] } }),
  },
  'assis-genou': {
    decor: 'chaise',
    A: m(ASSIS, { l: { 0: [55, 52], 1: [59, 76] }, a: { 0: [42, 46], 1: [48, 40] } }),
    B: m(ASSIS, { l: { 2: [57, 52], 3: [61, 76] }, a: { 2: [44, 46], 3: [50, 40] } }),
  },
  'assis-boxe': {
    decor: 'chaise',
    A: m(ASSIS, { a: { 0: [44, 40], 1: [46, 33], 2: [52, 36], 3: [64, 35] } }),
    B: m(ASSIS, { a: { 0: [50, 36], 1: [62, 35], 2: [45, 41], 3: [48, 33] } }),
  },
  'assis-mains': {
    decor: 'chaise',
    A: m(ASSIS, { a: { 0: [44, 44], 1: [52, 38], 2: [45, 45], 3: [52, 39] } }),
    B: m(ASSIS, { a: { 0: [42, 40], 1: [46, 31], 2: [48, 40], 3: [58, 33] } }),
  },
  'assis-pointes': {
    decor: 'chaise',
    A: m(ASSIS, { l: { 1: [56, 89], 3: [59, 89] } }),
    B: m(ASSIS, { l: { 1: [57, 92], 3: [60, 92] }, a: { 1: [51, 58] } }),
  },
  'assis-jambe': {
    decor: 'chaise',
    A: ASSIS,
    B: m(ASSIS, { l: { 2: [60, 61], 3: [83, 58] } }),
  },
  'assis-tourne': {
    decor: 'chaise',
    A: m(ASSIS, { a: { 0: [44, 44], 1: [50, 42], 2: [45, 46], 3: [51, 44] } }),
    B: m(ASSIS, { h: [37, 21], a: { 0: [28, 40], 1: [24, 48], 2: [46, 44], 3: [40, 46] } }),
  },
  'assis-bras-haut': {
    decor: 'chaise',
    A: ASSIS,
    B: m(ASSIS, { a: { 0: [38, 18], 1: [37, 6], 2: [41, 18], 3: [42, 6] } }),
  },
  'assis-epaules': {
    decor: 'chaise-face',
    A: ASSIS_FACE,
    B: m(ASSIS_FACE, { n: [50, 30], h: [50, 22], a: { 0: [41, 42], 1: [43, 57], 2: [59, 42], 3: [57, 57] } }),
  },
  'assis-incline': {
    decor: 'chaise-face',
    A: m(ASSIS_FACE, { a: { 2: [58, 20], 3: [52, 10] } }),
    B: m(ASSIS_FACE, { n: [46, 33], h: [42, 24], a: { 0: [40, 48], 1: [42, 62], 2: [50, 18], 3: [40, 12] } }),
  },
  'assis-cou': {
    decor: 'chaise-face',
    A: m(ASSIS_FACE, { h: [47, 22] }),
    B: m(ASSIS_FACE, { h: [53, 22] }),
  },
  'assis-cercles': {
    decor: 'chaise-face',
    A: m(ASSIS_FACE, { a: { 0: [38, 36], 1: [28, 34], 2: [62, 36], 3: [72, 34] } }),
    B: m(ASSIS_FACE, { a: { 0: [38, 32], 1: [28, 28], 2: [62, 32], 3: [72, 28] } }),
  },
  'leve-chaise': {
    decor: 'chaise',
    A: m(ASSIS, { h: [44, 24], n: [41, 33], a: { 0: [46, 47], 1: [53, 57], 2: [48, 47], 3: [55, 57] } }),
    B: { h: [48, 14], n: [46, 24], p: [45, 52], a: [[49, 37], [55, 47], [51, 37], [57, 47]], l: [[48, 72], [52, 93], [50, 72], [55, 93]] },
  },
  // ── Debout ──
  marche: {
    A: m(FACE, { l: { 0: [45, 64], 1: [46, 81] }, a: { 0: [43, 40], 1: [45, 50], 2: [58, 41], 3: [62, 55] } }),
    B: m(FACE, { l: { 2: [55, 64], 3: [54, 81] }, a: { 0: [42, 41], 1: [38, 55], 2: [57, 40], 3: [55, 50] } }),
  },
  'genoux-haut': {
    A: m(FACE, { l: { 0: [43, 58], 1: [45, 75] }, a: { 0: [41, 38], 1: [42, 28], 2: [59, 42], 3: [62, 54] } }),
    B: m(FACE, { l: { 2: [57, 58], 3: [55, 75] }, a: { 0: [41, 42], 1: [38, 54], 2: [59, 38], 3: [58, 28] } }),
  },
  pointes: {
    decor: 'appui-gauche',
    A: m(FACE, { a: { 0: [38, 42], 1: [30, 52] } }),
    B: m(FACE, { dy: -4, a: { 0: [38, 39], 1: [30, 52] } }),
  },
  mur: {
    decor: 'mur',
    A: { h: [62, 20], n: [58, 29], p: [48, 56], a: [[68, 32], [78, 31], [69, 34], [78, 33]], l: [[45, 75], [40, 93], [47, 75], [43, 93]] },
    B: { h: [67, 24], n: [63, 32], p: [51, 57], a: [[66, 42], [78, 33], [67, 44], [78, 35]], l: [[46, 76], [40, 93], [48, 76], [43, 93]] },
  },
  'un-pied': {
    decor: 'appui-gauche',
    A: m(FACE, { a: { 0: [38, 42], 1: [30, 52] } }),
    B: m(FACE, { a: { 0: [38, 42], 1: [30, 52], 2: [62, 36], 3: [70, 44] }, l: { 2: [58, 66], 3: [56, 82] } }),
  },
  funambule: {
    A: m(FACE, { a: { 0: [38, 32], 1: [26, 30], 2: [62, 32], 3: [74, 30] }, l: { 1: [49, 93], 3: [51, 93] } }),
    B: m(FACE, { a: { 0: [38, 30], 1: [26, 33], 2: [62, 34], 3: [74, 27] }, l: { 2: [56, 68], 3: [55, 84] } }),
  },
  'pas-cote': {
    A: FACE,
    B: m(FACE, { a: { 0: [40, 38], 1: [34, 48], 2: [60, 38], 3: [66, 48] }, l: { 0: [42, 74], 1: [35, 93], 2: [58, 74], 3: [65, 93] } }),
  },
  'pas-chasses': {
    A: m(FACE, { h: [44, 17], n: [44, 27], p: [44, 55], a: { 0: [36, 38], 1: [30, 30], 2: [52, 40], 3: [56, 52] }, l: { 0: [38, 74], 1: [32, 93], 2: [50, 74], 3: [54, 93] } }),
    B: m(FACE, { h: [56, 17], n: [56, 27], p: [56, 55], a: { 0: [48, 40], 1: [44, 52], 2: [64, 38], 3: [70, 30] }, l: { 0: [50, 74], 1: [46, 93], 2: [62, 74], 3: [68, 93] } }),
  },
  balancier: {
    A: m(PROFIL, { a: { 0: [44, 40], 1: [38, 50], 2: [58, 36], 3: [66, 30] }, l: { 0: [52, 74], 2: [54, 74] }, dy: 2 }),
    B: m(PROFIL, { a: { 0: [58, 36], 1: [66, 30], 2: [44, 40], 3: [38, 50] } }),
  },
  'jambe-arriere': {
    decor: 'appui-droite',
    A: m(PROFIL, { a: { 0: [58, 38], 1: [68, 46], 2: [58, 40], 3: [68, 48] } }),
    B: m(PROFIL, { h: [54, 18], a: { 0: [58, 38], 1: [68, 46], 2: [58, 40], 3: [68, 48] }, l: { 0: [42, 72], 1: [34, 88] } }),
  },
  'jambe-cote': {
    decor: 'appui-gauche',
    A: m(FACE, { a: { 0: [38, 42], 1: [30, 52] } }),
    B: m(FACE, { a: { 0: [38, 42], 1: [30, 52] }, l: { 2: [60, 72], 3: [68, 90] } }),
  },
  mollet: {
    decor: 'mur',
    A: { h: [63, 21], n: [59, 30], p: [50, 57], a: [[68, 36], [78, 34], [69, 38], [78, 36]], l: [[44, 75], [36, 93], [60, 74], [62, 93]] },
    B: { h: [64, 22], n: [60, 31], p: [51, 58], a: [[68, 38], [78, 35], [69, 40], [78, 37]], l: [[44, 76], [36, 93], [62, 74], [62, 93]] },
  },
  ouverture: {
    A: m(FACE, { a: { 0: [44, 38], 1: [48, 36], 2: [56, 38], 3: [52, 36] } }),
    B: m(FACE, { a: { 0: [38, 32], 1: [26, 30], 2: [62, 32], 3: [74, 30] } }),
  },
  'bras-haut': {
    A: FACE,
    B: m(FACE, { a: { 0: [40, 18], 1: [36, 6], 2: [60, 18], 3: [64, 6] } }),
  },
  'talons-fesses': {
    A: m(PROFIL, { l: { 0: [50, 74], 1: [38, 66] }, a: { 0: [46, 40], 1: [52, 46], 2: [56, 40], 3: [60, 32] } }),
    B: m(PROFIL, { l: { 2: [52, 74], 3: [40, 66] }, a: { 0: [56, 40], 1: [60, 32], 2: [46, 40], 3: [52, 46] } }),
  },
  boxe: {
    A: m(PROFIL, { a: { 0: [56, 36], 1: [56, 28], 2: [62, 30], 3: [76, 29] }, l: { 0: [46, 74], 1: [42, 93], 2: [55, 74], 3: [58, 93] } }),
    B: m(PROFIL, { a: { 0: [62, 30], 1: [76, 29], 2: [56, 36], 3: [56, 28] }, l: { 0: [46, 74], 1: [42, 93], 2: [55, 74], 3: [58, 93] } }),
  },
  'genou-coude': {
    A: m(FACE, { n: [49, 28], a: { 0: [40, 36], 1: [44, 26], 2: [54, 50], 3: [50, 38] }, l: { 0: [53, 62], 1: [48, 78] } }),
    B: m(FACE, { n: [51, 28], a: { 0: [46, 50], 1: [50, 38], 2: [60, 36], 3: [56, 26] }, l: { 2: [47, 62], 3: [52, 78] } }),
  },
  squat: {
    decor: 'chaise-derriere',
    A: m(PROFIL, { a: { 0: [56, 38], 1: [66, 38], 2: [57, 40], 3: [67, 40] } }),
    B: { h: [58, 30], n: [54, 39], p: [40, 63], a: [[63, 45], [73, 44], [64, 47], [74, 46]], l: [[55, 70], [50, 93], [57, 71], [53, 93]] },
  },
} satisfies Record<string, Pose>

export type PoseId = keyof typeof POSES
