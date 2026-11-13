import { useEffect, useRef, useState } from 'react'
import type { GeoProjection } from 'd3'
import { useExperienceStore, useYearIndex } from '../../store/useExperienceStore'
import { useSize } from '../../hooks/useSize'
import { cellFromLatLon, formatLatLon, formatSigned, gridValue } from '../../engine/data/DataProcessor'
import { drawAnomalyMap } from './anomalyImage'

/** World map of the same year: how much warmer or cooler each place was than normal. */
export default function Map2D() {
  const series = useExperienceStore((s) => s.series)!
  const grid = series.grid
  const idx = useYearIndex()
  const [wrapRef, { width }] = useSize<HTMLDivElement>()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const projRef = useRef<GeoProjection | null>(null)
  const [hover, setHover] = useState<{ x: number; y: number; label: string } | null>(null)
  const h = width / 2

  useEffect(() => {
    const c = canvasRef.current
    if (!c || width === 0 || !grid) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    c.width = Math.round(width * dpr)
    c.height = Math.round(h * dpr)
    const ctx = c.getContext('2d')!
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    projRef.current = drawAnomalyMap(ctx, grid, idx, width, h)
  }, [grid, idx, width, h])

  if (!grid) return null
  const legend = grid.colorScale
  const grad = legend.stops.map(([v, c]) => `${c} ${((v + 4) / 8) * 100}%`).join(', ')
  return (
    <figure className="w-full">
      <div ref={wrapRef} className="relative w-full">
        <canvas
          ref={canvasRef}
          style={{ width, height: h }}
          className="block w-full rounded-2xl bg-surface"
          role="img"
          aria-label={`World map for ${series.years[idx]}. Warm colours show places warmer than normal, blue shows cooler, grey means no measurements.`}
          onPointerMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect()
            const p = projRef.current?.invert?.([e.clientX - r.left, e.clientY - r.top])
            if (!p) return setHover(null)
            const cell = cellFromLatLon(grid, p[1], p[0])
            const v = gridValue(grid, idx, cell.latIdx, cell.lonIdx)
            setHover({ x: e.clientX - r.left, y: e.clientY - r.top, label: `${formatLatLon(cell)}: ${v == null ? 'no data' : formatSigned(v, '°C', 1)}` })
          }}
          onPointerLeave={() => setHover(null)}
        />
        {hover && (
          <div className="pointer-events-none absolute z-10 rounded-lg bg-bg/95 px-2.5 py-1.5 text-sm tabular shadow-lg" style={{ left: Math.min(hover.x + 12, width - 170), top: Math.max(hover.y - 40, 0) }} aria-hidden="true">
            {hover.label}
          </div>
        )}
      </div>
      <figcaption className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
        <span className="flex min-w-56 flex-1 items-center gap-2">
          <span className="tabular">−4 °C</span>
          <span className="h-2.5 flex-1 rounded-full" style={{ background: `linear-gradient(90deg, ${grad})` }} />
          <span className="tabular">+4 °C</span>
        </span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-4 rounded-sm" style={{ background: legend.missingColor }} />No measurements</span>
      </figcaption>
    </figure>
  )
}
