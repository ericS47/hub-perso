import { useEffect, useRef, useState } from 'react'
import { createChart, LineSeries, type UTCTimestamp } from 'lightweight-charts'
import { fetchCryptoHistory } from '../finance/coingecko'

interface Props {
  coinId: string
}

export default function PriceChart({ coinId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const chart = createChart(container, {
      autoSize: true,
      height: 180,
      layout: { background: { color: 'transparent' }, textColor: '#9ca3af' },
      grid: { vertLines: { visible: false }, horzLines: { color: 'rgba(156,163,175,0.15)' } },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false },
      localization: {
        locale: 'fr-FR',
        priceFormatter: (price: number) => `${price.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €`,
      },
    })
    const series = chart.addSeries(LineSeries, { color: '#34d399', lineWidth: 2 })

    let cancelled = false
    fetchCryptoHistory(coinId)
      .then((points) => {
        if (cancelled) return
        series.setData(points.map((p) => ({ time: p.time as UTCTimestamp, value: p.value })))
        chart.timeScale().fitContent()
      })
      .catch(() => {
        if (!cancelled) setError('Cours indisponibles pour le moment')
      })

    return () => {
      cancelled = true
      chart.remove()
    }
  }, [coinId])

  return (
    <div className="chart-wrap">
      <div ref={containerRef} className="chart" />
      {error && <p className="muted small-text">{error}</p>}
    </div>
  )
}
