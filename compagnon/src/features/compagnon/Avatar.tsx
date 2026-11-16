import type { CompanionSettings } from '../../db'

interface Props {
  companion: CompanionSettings
  size?: number
  mood?: 'neutre' | 'content' | 'attentif' | 'encourageant'
}

// Avatar du compagnon (provisoire, remplacé par la fonctionnalité compagnon).
export default function Avatar({ companion, size = 64 }: Props) {
  return (
    <span
      aria-hidden="true"
      style={{ display: 'inline-block', width: size, height: size, borderRadius: '50%', background: companion.color }}
    />
  )
}
