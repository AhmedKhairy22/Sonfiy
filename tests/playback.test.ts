import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { PlaybackController } from '../src/engine/synchronization/PlaybackController'
import { AudioScheduler } from '../src/engine/audio/AudioScheduler'
const TEMPO = { yearsPerSecond: 4 }

let now = 0
const clock = () => now
beforeEach(() => {
  now = 100
  vi.useFakeTimers()
  vi.stubGlobal('requestAnimationFrame', (f: () => void) => setTimeout(f, 16))
  vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id))
})
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

function setup(len = 20) {
  const positions: number[] = []
  const c = new PlaybackController(len, clock, (p) => positions.push(p))
  const events: { i: number; t: number }[] = []
  const s = new AudioScheduler(c, clock, (i, t) => events.push({ i, t }))
  c.on((e) => { if (e === 'play' || e === 'seek') s.start(); else if (e !== 'speed') s.stop() })
  return { c, s, events }
}
function advance(sec: number) { for (let k = 0; k < sec / 0.025; k++) { now += 0.025; vi.advanceTimersByTime(25) } }

describe('shared timeline + scheduler', () => {
  it('schedules each year exactly once, at the time the timeline reaches it', () => {
    const { c, events } = setup(20)
    c.play()
    advance(20 / TEMPO.yearsPerSecond + 1)
    expect(events.map((e) => e.i)).toEqual([...Array(20).keys()])
    events.forEach((e) => expect(e.t).toBeCloseTo(c.timeOfPosition(e.i), 6))
  })
  it('position derived from the clock matches the audio schedule', () => {
    const { c } = setup(50)
    c.play()
    advance(2.06)
    expect(c.position()).toBeCloseTo(2 * TEMPO.yearsPerSecond, 0)
  })
  it('seek while playing continues from the start of the new year', () => {
    const { c, events } = setup(50)
    c.play(); advance(0.5)
    events.length = 0
    c.seek(30.7); advance(0.3)
    expect(events[0].i).toBe(30)
  })
  it('pause stops scheduling; play resumes from the paused year', () => {
    const { c, events } = setup(50)
    c.play(); advance(1.06)
    c.pause()
    const n = events.length
    advance(1)
    expect(events.length).toBe(n)
    const at = Math.floor(c.position())
    c.play(); advance(0.2)
    expect(events[n].i).toBe(at)
  })
  it('speed change keeps playing without repeating or skipping years', () => {
    const { c, s, events } = setup(60)
    c.play(); advance(1.03)
    c.setSpeed(2, s.nextIndex); advance(3)
    const idx = events.map((e) => e.i)
    expect(idx).toEqual([...Array(idx.length).keys()])
    const gaps = events.slice(1).map((e, k) => e.t - events[k].t)
    gaps.forEach((g) => expect(g).toBeGreaterThan(0))
  })
  it('no visual jump at the instant of a speed change', () => {
    const { c, s } = setup(60)
    c.play(); advance(1.03)
    const p0 = c.position()
    c.setSpeed(0.5, s.nextIndex)
    expect(Math.abs(c.position() - p0)).toBeLessThan(0.01)
  })
  it('stops at the end and stop() rewinds', () => {
    const { c } = setup(8)
    c.play(); advance(3)
    expect(c.isPlaying).toBe(false)
    c.stop()
    expect(c.position()).toBe(0)
  })
})
