import { useState } from 'react'

// Petite image de produit ; si elle ne se charge pas, une étiquette à la place.
export default function Thumb({ src }: { src?: string }) {
  const [broken, setBroken] = useState(false)
  if (!src || broken) return <span aria-hidden="true">🏷️</span>
  return <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setBroken(true)} />
}
