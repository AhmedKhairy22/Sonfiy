import type { ExperienceEntry, Series } from '../../data/dataTypes'
import { chapterOf, deltaToTicks, sciencePitch, songPitch } from '../data/DataMapper'

export type AudioMode = 'song' | 'science'

/** Everything needed to voice one year. Pure data; no audio objects. */
export interface YearVoicing {
  index: number
  year: number
  value: number
  /** 0 at the lowest of (0, min value), 1 at the highest year */
  norm: number
  delta: number | null
  scienceMidi: number
  clamped: boolean
  songMidi: number
  chapter: number
  ticks: { count: number; direction: 'up' | 'down' | 'none' }
}

export function seriesRange(s: Series): [number, number] {
  let lo = 0, hi = 0
  for (const v of s.values) { if (v < lo) lo = v; if (v > hi) hi = v }
  return [lo, hi]
}

export function voiceYear(s: Series, entry: ExperienceEntry, index: number): YearVoicing {
  const value = s.values[index]
  const [lo, hi] = seriesRange(s)
  const norm = hi > lo ? (value - lo) / (hi - lo) : 0.5
  const delta = index > 0 ? Math.round((value - s.values[index - 1]) * 1000) / 1000 : null
  const sp = sciencePitch(value, entry.semitonesPerUnit)
  return {
    index,
    year: s.years[index],
    value,
    norm,
    delta,
    scienceMidi: sp.midi,
    clamped: sp.clamped,
    songMidi: songPitch(norm),
    chapter: chapterOf(norm),
    ticks: deltaToTicks(delta, entry.unitsPerTick),
  }
}
