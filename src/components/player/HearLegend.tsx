import { useExperienceStore } from '../../store/useExperienceStore'
import type { ExperienceId } from '../../data/dataTypes'
import type { AudioMode } from '../../engine/audio/SonificationEngine'

const TEXT: Record<ExperienceId, Record<AudioMode, [string, string][]>> = {
  'warming-planet': {
    song: [
      ['Melody', 'Each note is one year. Higher note, warmer year.'],
      ['Harmony', 'Grows fuller and more restless as the planet warms.'],
      ['Heartbeat', 'Joins in the warmer years and grows stronger.'],
      ['Sparkles', 'A year that jumped warmer than the one before.'],
    ],
    science: [
      ['Pitch', 'Exact: every +1 °C is 8 semitones higher.'],
      ['Steady hum', 'Normal (the 1951–1980 average). Notes above it are warmer.'],
      ['Ticks', 'Change since last year. High tick warmer, low tick cooler. One per 0.08 °C.'],
    ],
  },
  'rising-seas': {
    song: [
      ['Melody', 'Each note is one year. Higher note, higher sea.'],
      ['Harmony', 'A second voice joins as the water rises, over chords that grow more restless.'],
      ['Waves', 'Grow louder and brighter as the sea rises. Glass drops and a deep voice follow the water.'],
      ['Bubbles', 'How much the water rose that year.'],
    ],
    science: [
      ['Pitch', 'Exact: every +1 cm is 2 semitones higher.'],
      ['Steady hum', 'Sea level in 1993. Notes above it mean higher water.'],
      ['Ticks', 'Change since last year. One tick per 2 mm.'],
    ],
  },
}

export default function HearLegend() {
  const id = useExperienceStore((s) => s.series!.id)
  const mode = useExperienceStore((s) => s.mode)
  return (
    <section aria-labelledby="hear-title" className="rounded-3xl bg-surface p-6">
      <h2 id="hear-title" className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">What you hear</h2>
      <dl className="mt-3 grid gap-3">
        {TEXT[id][mode].map(([k, d]) => (
          <div key={k} className="grid grid-cols-[6.5rem_1fr] gap-3">
            <dt className={`font-semibold ${mode === 'song' ? 'text-amber' : 'text-teal'}`}>{k}</dt>
            <dd className="text-muted">{d}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
