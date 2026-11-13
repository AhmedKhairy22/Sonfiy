import { useMemo, useRef } from 'react'
import { scaleLinear } from 'd3'
import { useExperienceStore, useYearIndex } from '../../store/useExperienceStore'
import { useSize } from '../../hooks/useSize'
import { usePlayerSession } from '../../hooks/usePlayerSession'
import { seriesRange } from '../../engine/audio/SonificationEngine'

const M = { t: 24, r: 18, b: 34, l: 52 }

/**
 * The song as a picture: a line for "normal", then one bar per year (one note).
 * Bars light up as their note plays; the rest wait faintly, so the whole shape is visible at rest.
 */
export default function SongChart({ compact = false }: { compact?: boolean }) {
  const series = useExperienceStore((s) => s.series)!
  const entry = useExperienceStore((s) => s.entry)!
  const isPlaying = useExperienceStore((s) => s.isPlaying)
  const idx = useYearIndex()
  const session = usePlayerSession()
  const [ref, { width }] = useSize<HTMLDivElement>()
  const dragging = useRef(false)
  const n = series.years.length
  const height = compact ? Math.max(180, Math.min(240, width * 0.4)) : Math.max(260, Math.min(440, width * 0.5))
  const unit = series.unit
  const ocean = series.id === 'rising-seas'

  const { x, y, ticks } = useMemo(() => {
    const [lo, hi] = seriesRange(series)
    const pad = (hi - lo) * 0.08
    const x = scaleLinear().domain([-0.5, n - 0.5]).range([M.l, Math.max(M.l + 10, width - M.r)])
    const y = scaleLinear().domain([lo - pad, hi + pad]).nice(4).range([height - M.b, M.t])
    return { x, y, ticks: y.ticks(4) }
  }, [series, n, width, height])

  const step = n > 1 ? x(1) - x(0) : 10
  const barW = Math.max(1.5, Math.min(14, step * 0.62))
  const colour = (v: number) => (ocean ? 'var(--color-teal)' : v >= 0 ? 'var(--color-amber)' : 'var(--color-teal)')
  const yearTicks = series.years.map((yr, i) => [yr, i] as const).filter(([yr]) => yr % (n > 60 ? (width < 560 ? 40 : 20) : (width < 560 ? 10 : 5)) === 0)
  const cur = series.values[idx]

  const seek = (e: React.PointerEvent<SVGRectElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    session.seekIndex(Math.round(x.invert(e.clientX - r.left + M.l)), { audition: true })
  }

  return (
    <div ref={ref} className="w-full">
      {width > 0 && (
        <svg width={width} height={height} className="block select-none" role="img" aria-label={`Chart of ${entry.title}: one bar per year from ${series.years[0]} to ${series.years[n - 1]}. The line marks ${entry.zeroLabel.toLowerCase()}. Bars above it are ${ocean ? 'higher' : 'warmer'}. Now at ${series.years[idx]}: ${entry.describe(cur)}.`}>
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" /></filter>
          </defs>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={M.l} x2={width - M.r} y1={y(t)} y2={y(t)} stroke="var(--color-line)" strokeDasharray={t === 0 ? undefined : '2 6'} />
              <text x={M.l - 10} y={y(t)} dy="0.32em" textAnchor="end" fontSize={12} fill="var(--color-muted)" className="tabular">{t > 0 ? `+${t}` : t === 0 ? '0' : `−${-t}`}</text>
            </g>
          ))}
          <text x={M.l - 10} y={M.t - 10} textAnchor="end" fontSize={12} fill="var(--color-muted)">{unit}</text>
          <line x1={M.l} x2={width - M.r} y1={y(0)} y2={y(0)} stroke="var(--color-ink)" strokeOpacity={0.55} strokeWidth={1.5} />
          <text x={width - M.r} y={y(0) + 16} textAnchor="end" fontSize={12} fontWeight={600} fill="var(--color-ink)" fillOpacity={0.8}>{ocean ? '1993 level' : 'Normal'}</text>
          {series.values.map((v, i) => (
            <rect key={i} x={x(i) - barW / 2} width={barW} y={Math.min(y(v), y(0))} height={Math.max(1, Math.abs(y(v) - y(0)))} rx={Math.min(3, barW / 2)}
              fill={colour(v)} opacity={i < idx ? 0.85 : i === idx ? 1 : 0.13} style={{ transition: 'opacity 240ms' }} />
          ))}
          {yearTicks.map(([yr, i]) => <text key={yr} x={x(i)} y={height - 10} textAnchor="middle" fontSize={12} fill="var(--color-muted)" className="tabular">{yr}</text>)}
          <circle cx={x(idx)} cy={y(cur)} r={11} fill={colour(cur)} opacity={0.6} filter="url(#glow)" />
          {isPlaying && <circle key={idx} cx={x(idx)} cy={y(cur)} r={6} fill="none" stroke={colour(cur)} strokeWidth={2} className="note-ring" />}
          <circle cx={x(idx)} cy={y(cur)} r={6} fill="var(--color-ink)" stroke={colour(cur)} strokeWidth={3} />
          <rect x={M.l} y={0} width={Math.max(0, width - M.l - M.r)} height={height} fill="transparent" className="cursor-pointer"
            onPointerDown={(e) => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); seek(e) }}
            onPointerMove={(e) => { if (dragging.current) seek(e) }}
            onPointerUp={() => { dragging.current = false }} />
        </svg>
      )}
    </div>
  )
}
