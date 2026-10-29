import { useLayoutEffect, useRef, useState } from 'react'
import type { CultureItem } from '../db'
import CoverImage from './CoverImage'

interface Props {
  items: CultureItem[]
  // Œuvre à amener au centre (ex. celle qu'on vient d'ajouter).
  focusId?: number
  onCenterChange: (item: CultureItem) => void
  onOpen: (item: CultureItem) => void
}

// Carrousel 3D : défilement natif (doigt, molette, flèches) aimanté au centre,
// la couverture centrale de face et ses voisines inclinées de chaque côté.
export default function Coverflow({ items, focusId, onCenterChange, onOpen }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const centeredId = useRef<number | undefined>(undefined)
  const ids = items.map((i) => i.id).join(',')

  // La liste change (onglet, filtre, tri, ajout) : on centre l'œuvre demandée,
  // sinon on reste sur l'œuvre centrée si elle est encore là, sinon la première.
  useLayoutEffect(() => {
    const track = trackRef.current
    if (!track) return
    const wanted = items.findIndex((it) => it.id === focusId)
    const i = wanted >= 0 ? wanted : Math.max(0, items.findIndex((it) => it.id === centeredId.current))
    const slide = track.children[i] as HTMLElement | undefined
    track.scrollTo({ left: slide ? slide.offsetLeft + slide.offsetWidth / 2 - track.clientWidth / 2 : 0 })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seul l'ordre des œuvres compte
  }, [ids, focusId])

  useLayoutEffect(() => {
    const track = trackRef.current
    if (!track) return
    let frame = 0
    let current = -1

    const layout = () => {
      frame = 0
      const center = track.scrollLeft + track.clientWidth / 2
      const slides = Array.from(track.children) as HTMLElement[]
      let best = 0
      let bestDist = Infinity
      slides.forEach((slide, i) => {
        const d = (slide.offsetLeft + slide.offsetWidth / 2 - center) / slide.offsetWidth
        const abs = Math.abs(d)
        const tilt = Math.max(-1, Math.min(1, d))
        slide.style.transform =
          `perspective(900px) translateZ(${-Math.min(abs, 3) * 70}px) rotateY(${-tilt * 48}deg)`
        slide.style.zIndex = String(100 - Math.round(abs * 10))
        slide.style.opacity = String(Math.max(0.25, 1 - abs * 0.22))
        if (abs < bestDist) {
          bestDist = abs
          best = i
        }
      })
      if (best !== current && items[best]) {
        current = best
        centeredId.current = items[best].id
        setIndex(best)
        onCenterChange(items[best])
      }
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(layout)
    }

    layout()
    track.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      track.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [items, onCenterChange])

  function goTo(i: number) {
    const track = trackRef.current
    const slide = track?.children[i] as HTMLElement | undefined
    if (!track || !slide) return
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    track.scrollTo({
      left: slide.offsetLeft + slide.offsetWidth / 2 - track.clientWidth / 2,
      behavior: smooth ? 'smooth' : 'auto',
    })
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      goTo(Math.min(items.length - 1, index + 1))
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      goTo(Math.max(0, index - 1))
    }
  }

  return (
    <div className="coverflow">
      <div
        ref={trackRef}
        className="coverflow-track"
        tabIndex={0}
        role="listbox"
        aria-label="Œuvres, glisser pour parcourir"
        onKeyDown={onKey}
      >
        {items.map((item, i) => (
          <button
            key={item.id}
            type="button"
            role="option"
            aria-selected={i === index}
            className={item.priority ? 'cf-slide recommended' : 'cf-slide'}
            onClick={() => (i === index ? onOpen(item) : goTo(i))}
            aria-label={item.title}
          >
            <CoverImage item={item} />
            {item.priority && <span className="cf-ribbon">★ Conseillé</span>}
          </button>
        ))}
      </div>
      <div className="cf-nav">
        <button type="button" className="cf-arrow" onClick={() => goTo(index - 1)} disabled={index === 0} aria-label="Précédent">
          ‹
        </button>
        <span className="muted">
          {index + 1} / {items.length}
        </span>
        <button
          type="button"
          className="cf-arrow"
          onClick={() => goTo(index + 1)}
          disabled={index >= items.length - 1}
          aria-label="Suivant"
        >
          ›
        </button>
      </div>
    </div>
  )
}
