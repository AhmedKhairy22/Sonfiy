import type { ColorScaleFile } from '../../data/dataTypes'

/**
 * Every rule that turns a measurement into sound lives here. The page's explanations
 * read these constants, so what the site says always matches what you hear.
 */

/** Zero (normal / the 1993 level) always sounds on this note: D4 ≈ 294 Hz. */
export const BASELINE_MIDI = 62

/** Speeds offered in the player, as multiples of the experience's own tempo. */
export const SPEEDS = [
  { value: 0.5, label: 'Slow' },
  { value: 1, label: 'Normal' },
  { value: 2, label: 'Fast' },
] as const

/** Science mode: straight-line pitch. Clamped to a comfortable hearing range, and flagged when clamped. */
export function sciencePitch(value: number, semitonesPerUnit: number): { midi: number; clamped: boolean } {
  const raw = BASELINE_MIDI + value * semitonesPerUnit
  const midi = Math.max(38, Math.min(96, raw))
  return { midi, clamped: midi !== raw }
}

/** Song mode scale: D minor pentatonic, two and a half octaves upward from D3. */
const PENTA = [0, 3, 5, 7, 10]
export const SONG_NOTES: number[] = Array.from({ length: 13 }, (_, i) => 50 + Math.floor(i / 5) * 12 + PENTA[i % 5])

/**
 * Song mode pitch: the value's place between the lowest and highest year picks a note of
 * the scale. Order is always kept: a higher value never gets a lower note.
 */
export function songPitch(norm: number): number {
  const i = Math.round(Math.max(0, Math.min(1, norm)) * (SONG_NOTES.length - 1))
  return SONG_NOTES[i]
}

/**
 * Song mode harmony, in four chapters that climb with the data. Notes as MIDI numbers.
 * Calm minor → warmer → open → unresolved tension at the highest values.
 */
export const SONG_CHORDS: { name: string; notes: number[] }[] = [
  { name: 'calm', notes: [50, 57, 65] }, // D minor, open voicing
  { name: 'stirring', notes: [46, 53, 62, 69] }, // B♭ major 7
  { name: 'rising', notes: [43, 50, 58, 65] }, // G minor 7
  { name: 'urgent', notes: [45, 52, 61, 67] }, // A7: wants to resolve and never does
]
/** A harmony note two scale steps above the melody (stays inside the pentatonic scale). */
export function harmonyAbove(songMidi: number): number {
  const i = SONG_NOTES.indexOf(songMidi)
  if (i < 0) return songMidi + 7
  return i + 2 < SONG_NOTES.length ? SONG_NOTES[i + 2] : SONG_NOTES[i - 3] + 12
}

export const chapterOf = (norm: number) => Math.min(3, Math.floor(Math.max(0, norm) * 4))

/** Change from the year before → number of ticks (Science) or bubbles/sparkles (Song). */
export function deltaToTicks(delta: number | null, unitsPerTick: number, max = 4): { count: number; direction: 'up' | 'down' | 'none' } {
  if (delta == null || delta === 0) return { count: 0, direction: 'none' }
  const count = Math.min(max, Math.round(Math.abs(delta) / unitsPerTick))
  return { count, direction: count === 0 ? 'none' : delta > 0 ? 'up' : 'down' }
}

export function midiToHz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

const NOTE = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']
export function noteName(midi: number) {
  const r = Math.round(midi)
  return `${NOTE[((r % 12) + 12) % 12]}${Math.floor(r / 12) - 1}`
}

// ---------- colour (temperature map) ----------
function hexToRgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function makeColorLookup(cs: ColorScaleFile) {
  const stops = cs.stops.map(([v, c]) => [v, hexToRgb(c)] as const)
  const missing = hexToRgb(cs.missingColor)
  return (v: number | null): [number, number, number] => {
    if (v == null) return missing
    if (v <= stops[0][0]) return stops[0][1]
    for (let i = 1; i < stops.length; i++) {
      if (v <= stops[i][0]) {
        const [v0, c0] = stops[i - 1], [v1, c1] = stops[i]
        const t = (v - v0) / (v1 - v0)
        return [0, 1, 2].map((k) => Math.round(c0[k] + (c1[k] - c0[k]) * t)) as [number, number, number]
      }
    }
    return stops[stops.length - 1][1]
  }
}
