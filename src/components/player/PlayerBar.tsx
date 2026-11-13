import { useExperienceStore, useYearIndex } from '../../store/useExperienceStore'
import { usePlayerSession } from '../../hooks/usePlayerSession'
import { SPEEDS } from '../../engine/data/DataMapper'
import Waveform from './Waveform'

const Svg = ({ d, className = 'h-5 w-5' }: { d: string; className?: string }) => (
  <svg viewBox="0 0 24 24" className={`${className} fill-current`} aria-hidden="true"><path d={d} /></svg>
)
const ICON = {
  play: 'M8 5.5v13l11-6.5z',
  pause: 'M7 5h3.5v14H7zM13.5 5H17v14h-3.5z',
  prev: 'M6 6h2v12H6zm3.5 6L18 18V6z',
  next: 'M16 6h2v12h-2zM6 18l8.5-6L6 6z',
  restart: 'M12 5a7 7 0 1 1-6.6 4.7l1.9.6A5 5 0 1 0 12 7v3L7.5 6 12 2z',
  vol: 'M4 9v6h4l5 4V5L8 9zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z',
}

/** Slim player docked to the bottom of the screen, so controls and visuals are always in view together. */
export default function PlayerBar() {
  const session = usePlayerSession()
  const series = useExperienceStore((s) => s.series)!
  const entry = useExperienceStore((s) => s.entry)!
  const isPlaying = useExperienceStore((s) => s.isPlaying)
  const speed = useExperienceStore((s) => s.speed)
  const volume = useExperienceStore((s) => s.volume)
  const position = useExperienceStore((s) => s.position)
  const idx = useYearIndex()
  const n = series.years.length
  const pct = Math.min(100, (position / Math.max(1, n - 1)) * 100)
  const btn = 'grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted hover:bg-raised hover:text-ink'

  return (
    <section aria-label="Player" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:flex-nowrap sm:px-6">
        <div className="flex items-center gap-1">
          <button className={btn} onClick={() => session.step(-1)} aria-label="Previous year"><Svg d={ICON.prev} /></button>
          <button onClick={() => session.toggle()} aria-label={isPlaying ? 'Pause' : 'Play'}
            className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-teal text-bg shadow-[0_0_28px_-6px_var(--color-teal)] transition-transform hover:scale-105">
            <Svg d={isPlaying ? ICON.pause : ICON.play} className="h-6 w-6" />
          </button>
          <button className={btn} onClick={() => session.step(1)} aria-label="Next year"><Svg d={ICON.next} /></button>
          <button className={btn} onClick={() => session.restart()} aria-label="Play from the beginning"><Svg d={ICON.restart} /></button>
        </div>

        <div className="order-last flex w-full items-center gap-3 sm:order-none sm:w-auto sm:flex-1">
          <span className="w-12 text-right text-sm text-muted tabular" aria-hidden="true">{series.years[0]}</span>
          <input type="range" min={0} max={n - 1} step={1} value={idx} aria-label="Year"
            aria-valuetext={`${series.years[idx]}: ${entry.describe(series.values[idx])}`}
            style={{ ['--fill' as string]: `linear-gradient(90deg, var(--color-teal) ${pct}%, var(--color-line) ${pct}%)` }}
            onChange={(e) => session.seekIndex(Number(e.target.value), { audition: true })}
            onKeyDown={(e) => e.stopPropagation()} />
          <span className="w-12 text-sm text-muted tabular" aria-hidden="true">{series.years[n - 1]}</span>
        </div>

        <div role="radiogroup" aria-label="Speed" className="flex rounded-full bg-bg p-1 text-sm">
          {SPEEDS.map((s) => (
            <button key={s.value} role="radio" aria-checked={speed === s.value} onClick={() => session.setSpeed(s.value)}
              className={`rounded-full px-3 py-1.5 font-medium ${speed === s.value ? 'bg-raised text-ink' : 'text-muted hover:text-ink'}`}>{s.label}</button>
          ))}
        </div>

        <label className="hidden items-center gap-2 text-muted lg:flex">
          <Svg d={ICON.vol} />
          <span className="sr-only">Volume</span>
          <input type="range" min={0} max={1} step={0.01} value={volume} className="w-24"
            style={{ ['--fill' as string]: `linear-gradient(90deg, var(--color-muted) ${volume * 100}%, var(--color-line) ${volume * 100}%)` }}
            aria-valuetext={`${Math.round(volume * 100)} percent`}
            onChange={(e) => useExperienceStore.setState({ volume: Number(e.target.value) })}
            onKeyDown={(e) => e.stopPropagation()} />
        </label>

        <div className="hidden h-10 w-28 shrink-0 overflow-hidden rounded-lg bg-bg md:block" title="Live sound wave"><Waveform /></div>
      </div>
    </section>
  )
}
