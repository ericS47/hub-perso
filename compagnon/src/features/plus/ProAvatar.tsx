import { proInitials, type Pro } from './pros'

// Pastille colorée avec les initiales (pas de photo).
export default function ProAvatar({ pro, size = 48 }: { pro: Pro; size?: number }) {
  const initials = proInitials(pro)
  return (
    <span
      className="plus-avatar"
      aria-hidden="true"
      style={{ background: pro.couleur, width: size, height: size, fontSize: size * (initials.length > 1 ? 0.36 : 0.44) }}
    >
      {initials}
    </span>
  )
}
