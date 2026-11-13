export type TransportEvent = 'play' | 'pause' | 'stop' | 'seek' | 'speed' | 'end'

/**
 * The single clock for the whole experience. Position is measured in "years from the
 * first year" (float): year index i occupies positions [i, i+1).
 *
 * While playing, position is derived from an external clock — the AudioContext's own
 * time once audio has started — so audio events and visuals cannot drift apart.
 */
export class PlaybackController {
  private pos = 0
  private playing = false
  private speed = 1
  private anchorTime = 0
  private anchorPos = 0
  private raf = 0
  /** previous mapping, used for clock times before a speed-change pivot */
  private prev: { anchorPos: number; anchorTime: number; rate: number } | null = null
  private listeners = new Set<(e: TransportEvent) => void>()

  constructor(
    readonly length: number,
    private clock: () => number,
    private onPosition: (position: number, playing: boolean) => void,
    /** seconds between scheduling a sound and hearing it (output latency) */
    private latency: () => number = () => 0,
    /** years per second at 1× speed */
    readonly baseRate = 4,
  ) {}

  setClock(clock: () => number, latency?: () => number) {
    if (this.playing) this.pause()
    this.clock = clock
    if (latency) this.latency = latency
  }

  on(fn: (e: TransportEvent) => void) { this.listeners.add(fn); return () => this.listeners.delete(fn) }
  private emit(e: TransportEvent) { this.listeners.forEach((l) => l(e)) }

  get isPlaying() { return this.playing }
  get playbackSpeed() { return this.speed }
  /** years per second of wall time */
  get rate() { return this.baseRate * this.speed }
  get stepDuration() { return 1 / this.rate }
  get anchorPosition() { return this.anchorPos }

  /** Clock time at which a given position is (or was) reached. */
  timeOfPosition(p: number) { return this.anchorTime + (p - this.anchorPos) / this.rate }

  position(): number {
    if (!this.playing) return this.pos
    const t = this.clock() - this.latency()
    if (t < this.anchorTime && this.prev) {
      return this.prev.anchorPos + (t - this.prev.anchorTime) * this.prev.rate
    }
    const p = this.anchorPos + (t - this.anchorTime) * this.rate
    return Math.max(this.anchorPos, p)
  }

  play() {
    if (this.playing) return
    let start = Math.floor(this.pos)
    if (start >= this.length - 1 && this.pos >= this.length - 1) start = 0 // restart from the top at the end
    this.anchorPos = start
    this.pos = start
    this.anchorTime = this.clock() + 0.06 // small lead-in so the first note is never late
    this.prev = null
    this.playing = true
    this.emit('play')
    this.loop()
  }

  pause() {
    if (!this.playing) return
    this.pos = Math.min(this.position(), this.length - 1e-6)
    this.playing = false
    cancelAnimationFrame(this.raf)
    this.publish()
    this.emit('pause')
  }

  stop() {
    this.playing = false
    cancelAnimationFrame(this.raf)
    this.pos = 0
    this.publish()
    this.emit('stop')
  }

  /** Jump to a position. While playing, playback continues from the start of that year. */
  seek(p: number) {
    const clamped = Math.max(0, Math.min(this.length - 1e-6, p))
    if (this.playing) {
      this.anchorPos = Math.floor(clamped)
      this.anchorTime = this.clock() + 0.04
      this.prev = null
    } else {
      this.pos = clamped
    }
    this.publish()
    this.emit('seek')
  }

  /**
   * Change speed without a jump. `pivot` is the first year not yet handed to the audio
   * scheduler: years before it keep their already-scheduled times, the new speed applies
   * from the pivot onwards, so nothing is repeated or skipped.
   */
  setSpeed(s: number, pivot?: number) {
    if (s === this.speed) return
    if (this.playing) {
      const now = this.clock()
      const p = this.anchorPos + (now - this.anchorTime) * this.rate
      const piv = Math.max(pivot ?? Math.ceil(p), Math.ceil(this.anchorPos))
      const pivotTime = this.timeOfPosition(piv)
      this.prev = { anchorPos: this.anchorPos, anchorTime: this.anchorTime, rate: this.rate }
      this.speed = s
      this.anchorPos = piv
      this.anchorTime = pivotTime
    } else {
      this.speed = s
    }
    this.emit('speed')
  }

  private publish() { this.onPosition(this.position(), this.playing) }

  private loop = () => {
    if (!this.playing) return
    const p = this.position()
    if (p >= this.length) {
      this.playing = false
      this.pos = this.length - 1e-6
      this.publish()
      this.emit('end')
      return
    }
    this.onPosition(p, true)
    this.raf = requestAnimationFrame(this.loop)
  }

  dispose() { cancelAnimationFrame(this.raf); this.playing = false; this.listeners.clear() }
}
