import type { Script } from '../engine/script'
import { scriptProvider } from '../engine/script'
import type { ScriptId } from '../engine/types'
import { withSafety } from '../engine/withSafety'
import { compulsion, grignotage } from './alimentation'
import { coupDeMou } from './coupDeMou'
import { bonneNouvelle, libre } from './libre'
import { seanceManquee } from './seanceManquee'

export const SCRIPTS: Record<ScriptId, Script> = {
  'seance-manquee': seanceManquee,
  grignotage,
  compulsion,
  'coup-de-mou': coupDeMou,
  libre,
  'bonne-nouvelle': bonneNouvelle,
}

export function isScriptId(v: string | undefined): v is ScriptId {
  return !!v && v in SCRIPTS
}

// Fournisseur utilisé par l'écran de conversation : les scripts, derrière le filet de sécurité.
// Pour brancher une IA plus tard : withSafety(aiProvider) (voir engine/types.ts).
export const provider = withSafety(scriptProvider(SCRIPTS))
