import { describe, expect, it } from 'vitest'
import { seas, warming } from './fixture'
import { getExperience } from '../src/data/catalog'
import { BASELINE_MIDI, chapterOf, deltaToTicks, midiToHz, sciencePitch, songPitch, SONG_NOTES } from '../src/engine/data/DataMapper'
import { voiceYear } from '../src/engine/audio/SonificationEngine'

const W = warming(), S = seas()
const we = getExperience('warming-planet')!, se = getExperience('rising-seas')!
const at = (s: typeof W, y: number) => s.years.indexOf(y)

describe('science mode', () => {
  it('zero sounds on D4', () => {
    expect(sciencePitch(0, 8).midi).toBe(BASELINE_MIDI)
    expect(midiToHz(BASELINE_MIDI)).toBeCloseTo(293.66, 1)
  })
  it('is a straight line: equal data steps give equal pitch steps', () => {
    expect(sciencePitch(1, 8).midi - sciencePitch(0, 8).midi).toBe(8)
    expect(sciencePitch(1, 2).midi - sciencePitch(0, 2).midi).toBe(2)
  })
  it('real temperature 1909 vs 2024 are far apart and in order', () => {
    const a = voiceYear(W, we, at(W, 1909)), b = voiceYear(W, we, at(W, 2024))
    expect(b.scienceMidi - a.scienceMidi).toBeGreaterThan(13)
    expect(a.clamped || b.clamped).toBe(false)
  })
  it('real sea level rises about 10 cm, about 21 semitones', () => {
    const last = voiceYear(S, se, S.years.length - 1)
    expect(last.value).toBeGreaterThan(9)
    expect(last.scienceMidi - BASELINE_MIDI).toBeCloseTo(last.value * 2, 5)
  })
  it('ticks encode year-to-year change', () => {
    expect(deltaToTicks(0.2, 0.08)).toEqual({ count: 3, direction: 'up' })
    expect(deltaToTicks(-0.1, 0.08)).toEqual({ count: 1, direction: 'down' })
    expect(deltaToTicks(null, 0.08).count).toBe(0)
  })
})

describe('song mode', () => {
  it('never puts a higher value on a lower note', () => {
    for (const [s, e] of [[W, we], [S, se]] as const) {
      const v = s.values.map((_, i) => voiceYear(s, e, i))
      const sorted = [...v].sort((a, b) => a.value - b.value)
      for (let k = 1; k < sorted.length; k++) expect(sorted[k].songMidi).toBeGreaterThanOrEqual(sorted[k - 1].songMidi)
    }
  })
  it('uses the whole scale from the lowest to the highest year', () => {
    const notes = W.values.map((_, i) => voiceYear(W, we, i).songMidi)
    expect(Math.min(...notes)).toBe(SONG_NOTES[0])
    expect(Math.max(...notes)).toBe(SONG_NOTES[SONG_NOTES.length - 1])
    expect(songPitch(0)).toBe(SONG_NOTES[0])
  })
  it('harmony climbs through four chapters as the data rises', () => {
    expect(chapterOf(0)).toBe(0)
    expect(chapterOf(1)).toBe(3)
    expect(voiceYear(W, we, at(W, 1909)).chapter).toBe(0)
    expect(voiceYear(W, we, at(W, 2024)).chapter).toBe(3)
    expect(voiceYear(S, se, 0).chapter).toBe(0)
    expect(voiceYear(S, se, S.years.length - 1).chapter).toBe(3)
  })
})

describe('data integrity', () => {
  it('sea level starts at 0 in 1993 and is complete', () => {
    expect(S.years[0]).toBe(1993)
    expect(S.values[0]).toBe(0)
    expect(S.years.every((y, i) => i === 0 || y === S.years[i - 1] + 1)).toBe(true)
  })
  it('temperature uses NASA values unchanged (2024 = +1.28 °C)', () => {
    expect(W.values[at(W, 2024)]).toBe(1.28)
  })
})

describe('rising seas harmony', () => {
  it('harmony note stays in the scale and above the melody', async () => {
    const { harmonyAbove, SONG_NOTES } = await import('../src/engine/data/DataMapper')
    for (const n of SONG_NOTES) {
      const h = harmonyAbove(n)
      expect(h).toBeGreaterThan(n)
      expect(SONG_NOTES.map((x) => x % 12)).toContain(h % 12)
    }
  })
})
