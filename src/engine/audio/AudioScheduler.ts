import type { PlaybackController } from '../synchronization/PlaybackController'

/**
 * Look-ahead scheduler ("a tale of two clocks"): a coarse JS timer wakes every 25 ms and
 * schedules, on the precise audio clock, only the year-notes that fall inside the next
 * 150 ms. Each year is scheduled exactly once, so no redundant audio events are created.
 */
export class AudioScheduler {
  private timer: ReturnType<typeof setInterval> | null = null
  private next = 0
  private readonly horizon = 0.15

  constructor(
    private controller: PlaybackController,
    private now: () => number,
    private onYear: (index: number, time: number, duration: number) => void,
  ) {}

  /** (Re)start from the controller's current anchor. Call on play, seek and speed change. */
  start() {
    this.stop()
    this.next = Math.max(0, Math.ceil(this.controller.anchorPosition - 1e-9))
    this.pump()
    this.timer = setInterval(this.pump, 25)
  }

  /** First year index not yet scheduled. */
  get nextIndex() { return this.next }

  stop() {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
  }

  private pump = () => {
    if (!this.controller.isPlaying) return
    const now = this.now()
    const until = now + this.horizon
    while (this.next < this.controller.length) {
      const t = this.controller.timeOfPosition(this.next)
      if (t > until) break
      if (t >= now - 0.05) this.onYear(this.next, Math.max(t, now), this.controller.stepDuration)
      this.next++
    }
  }
}
