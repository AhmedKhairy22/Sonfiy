import { useExperienceStore, useYearIndex } from '../../store/useExperienceStore'
import { voiceYear } from '../../engine/audio/SonificationEngine'
import { noteName, SONG_CHORDS } from '../../engine/data/DataMapper'

/** The year that is sounding, what was measured, and the note it became. */
export default function Readout() {
  const series = useExperienceStore((s) => s.series)!
  const entry = useExperienceStore((s) => s.entry)!
  const mode = useExperienceStore((s) => s.mode)
  const i = useYearIndex()
  const v = voiceYear(series, entry, i)
  const up = v.value >= 0
  const ocean = series.id === 'rising-seas'
  const accent = ocean || !up ? 'text-teal' : 'text-amber'
  const change = v.delta == null ? null : `${v.delta >= 0 ? 'Up' : 'Down'} ${Math.abs(v.delta).toFixed(ocean ? 1 : 2)} ${series.unit} from the year before`
  return (
    <section aria-label="Now playing" className="rounded-3xl bg-surface p-6">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">Now playing</p>
      <p className="mt-1 font-display text-6xl font-bold tabular sm:text-7xl" aria-hidden="true">{v.year}</p>
      <p className={`mt-2 text-2xl font-semibold leading-snug ${accent}`}>{entry.describe(v.value)}</p>
      {change && <p className="mt-1 text-muted tabular">{change}</p>}
      <p className="mt-4 border-t border-line pt-4 text-sm text-muted">
        {mode === 'song'
          ? <>You hear: melody note <span className="text-ink">{noteName(ocean ? v.songMidi + 12 : v.songMidi)}</span>, harmony <span className="text-ink">{SONG_CHORDS[v.chapter].name}</span>.</>
          : <>You hear: note <span className="text-ink">{noteName(v.scienceMidi)}</span>{v.clamped ? ' (at the edge of the scale)' : ''}{v.ticks.count ? `, ${v.ticks.count} ${v.ticks.direction === 'up' ? 'high' : 'low'} tick${v.ticks.count > 1 ? 's' : ''}` : ', no ticks'}.</>}
      </p>
    </section>
  )
}
