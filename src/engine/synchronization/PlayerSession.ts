import type { ExperienceEntry, Series } from '../../data/dataTypes'
import { useExperienceStore, selectIndex } from '../../store/useExperienceStore'
import { AudioEngine } from '../audio/AudioEngine'
import { AudioScheduler } from '../audio/AudioScheduler'
import { voiceYear } from '../audio/SonificationEngine'
import { PlaybackController } from './PlaybackController'

const store = useExperienceStore

/**
 * Wires the shared timeline (PlaybackController) to the audio engine and the store.
 * Visual components never talk to audio; they read the store and call these methods.
 */
export class PlayerSession {
  readonly controller: PlaybackController
  readonly audio: AudioEngine
  private scheduler: AudioScheduler
  private unsub: (() => void)[] = []

  constructor(private series: Series, private entry: ExperienceEntry) {
    this.audio = new AudioEngine(series.id)
    this.controller = new PlaybackController(
      series.years.length,
      () => performance.now() / 1000,
      (position, isPlaying) => store.setState({ position, isPlaying }),
      () => 0,
      entry.yearsPerSecond,
    )
    this.scheduler = new AudioScheduler(this.controller, () => this.audio.now(), (i, t, dur) => {
      this.audio.playYear(voiceYear(this.series, this.entry, i), t, dur)
    })
    this.unsub.push(this.controller.on((e) => {
      switch (e) {
        case 'play':
          this.audio.open(this.controller.timeOfPosition(this.controller.anchorPosition))
          this.scheduler.start()
          break
        case 'seek':
          if (this.controller.isPlaying) { this.audio.cancelPending(); this.scheduler.start() }
          break
        case 'pause':
        case 'stop':
        case 'end':
          this.scheduler.stop()
          this.audio.close()
          this.announceCurrent(e === 'end' ? 'Finished. ' : e === 'stop' ? 'Back to the start. ' : 'Paused. ')
          break
      }
    }))
    const s = store.getState()
    this.audio.setVolume(s.volume)
    this.audio.setMode(s.mode)
    this.unsub.push(store.subscribe((n, p) => {
      if (n.volume !== p.volume) this.audio.setVolume(n.volume)
      if (n.mode !== p.mode) this.audio.setMode(n.mode)
    }))
  }

  async ensureAudio() {
    if (this.audio.ready) return
    await this.audio.init()
    this.controller.setClock(() => this.audio.now(), () => this.audio.outputLatency())
    store.setState({ audioReady: true })
  }

  async play() { await this.ensureAudio(); this.controller.play() }
  pause() { this.controller.pause() }
  async toggle() { if (this.controller.isPlaying) this.pause(); else await this.play() }
  stop() { this.controller.stop() }
  async restart() { this.controller.stop(); await this.play() }

  seekIndex(i: number, opts: { audition?: boolean } = {}) {
    const n = this.series.years.length
    const idx = Math.max(0, Math.min(n - 1, Math.round(i)))
    this.controller.seek(idx)
    if (!this.controller.isPlaying) {
      if (opts.audition && this.audio.ready) this.audio.audition(voiceYear(this.series, this.entry, idx))
      this.announceCurrent()
    }
  }
  step(delta: number) { this.seekIndex(selectIndex(store.getState()) + delta, { audition: true }) }

  setSpeed(s: number) { this.controller.setSpeed(s, this.scheduler.nextIndex); store.setState({ speed: s }) }

  announceCurrent(prefix = '') {
    const i = selectIndex(store.getState())
    store.setState({ announcement: `${prefix}${this.series.years[i]}: ${this.entry.describe(this.series.values[i])}.` })
  }

  dispose() {
    this.scheduler.stop()
    this.controller.dispose()
    this.unsub.forEach((u) => u())
    this.audio.dispose()
  }
}
