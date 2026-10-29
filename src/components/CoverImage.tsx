import { useState } from 'react'
import type { CultureItem } from '../db'
import { categoryOf } from '../culture/categories'

// Couverture, ou à défaut l'icône du type et le titre (lien cassé compris).
export default function CoverImage({ item }: { item: Pick<CultureItem, 'title' | 'category' | 'cover'> }) {
  const [broken, setBroken] = useState<string>()
  const icon = categoryOf(item.category)?.icon ?? '🎞️'

  return (
    <div className="cover">
      {item.cover && broken !== item.cover ? (
        <img
          src={item.cover}
          alt=""
          loading="lazy"
          draggable={false}
          referrerPolicy="no-referrer"
          onError={() => setBroken(item.cover)}
        />
      ) : (
        <div className="cover-placeholder">
          <span aria-hidden="true">{icon}</span>
          <span className="cover-placeholder-title">{item.title}</span>
        </div>
      )}
    </div>
  )
}
