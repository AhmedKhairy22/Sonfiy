import * as Tone from 'tone'
import { BASELINE_MIDI, harmonyAbove, midiToHz, SONG_CHORDS } from '../data/DataMapper'
import type { ExperienceId } from '../../data/dataTypes'
import type { AudioMode, YearVoicing } from './SonificationEngine'

type Mono = Tone.Synth | Tone.FMSynth | Tone.MembraneSynth

/** Cancel every event a monophonic synth has queued after `t`, and release it. */
function cancelMono(s: Mono, t: number) {
  s.envelope.cancel(t)
  ;(s as Tone.FMSynth).modulationEnvelope?.cancel(t)
  s.frequency.cancelScheduledValues(t)
  s.envelope.triggerRelease(t)
}

/** A few mono voices used in turn, so notes can overlap yet stay cancellable. */
class Voices {
  private i = 0
  constructor(readonly v: Mono[]) {}
  connect(n: Tone.InputNode) { this.v.forEach((x) => x.connect(n)); return this }
  play(hz: number, dur: number, t: number, vel: number) { this.v[this.i++ % this.v.length].triggerAttackRelease(hz, dur, t, vel) }
  cancel(t: number) { this.v.forEach((x) => cancelMono(x, t)) }
}

/**
 * Owns every Web Audio / Tone.js object. It receives a YearVoicing (pure data) and a time
 * on the audio clock and turns it into sound. It knows nothing about the page.
 */
export class AudioEngine {
  ready = false
  analyser: AnalyserNode | null = null
  private initPromise: Promise<void> | null = null
  private nodes: { dispose(): unknown }[] = []
  private master!: Tone.Volume
  private gate!: Tone.Gain
  private reverb!: Tone.Reverb
  private open_ = false
  private mode: AudioMode = 'song'
  private volume = 0.8
  private lastChapter = -1

  // Science mode (both experiences)
  private sci!: { lead: Tone.Synth; tick: Tone.Synth; drone: Tone.Oscillator; droneGain: Tone.Gain }
  // Song mode, warming planet
  private warm!: { cello: Voices; celloFilter: Tone.Filter; pad: Voices; pulse: Tone.MembraneSynth; sparkle: Tone.Synth; bass: Tone.Oscillator; bassGain: Tone.Gain }
  // Song mode, rising seas
  private sea!: { melody: Voices; melody2: Voices; melodyFilter: Tone.Filter; glass: Voices; whale: Tone.Synth; bubble: Tone.Synth; surfFilter: Tone.Filter; surfGain: Tone.Gain; pad: Voices; bassGain: Tone.Gain; bass: Tone.Oscillator }

  constructor(private kind: ExperienceId) {}

  /** Must be called from a click or key press (browser autoplay rule). */
  init(): Promise<void> {
    if (!this.initPromise) this.initPromise = this.build()
    return this.initPromise
  }

  private keep<T extends { dispose(): unknown }>(n: T): T { this.nodes.push(n); return n }

  private async build() {
    await Tone.start()
    const ctx = Tone.getContext()
    ctx.lookAhead = 0 // we schedule ahead ourselves
    const k = this.keep.bind(this)

    // Gentle compression and a limiter let quiet passages be heard and loud ones never clip.
    const limiter = k(new Tone.Limiter(-1).toDestination())
    const comp = k(new Tone.Compressor({ threshold: -20, ratio: 3, attack: 0.02, release: 0.25 }).connect(limiter))
    this.master = k(new Tone.Volume(this.toDb(this.volume)).connect(comp))
    const raw = ctx.rawContext as unknown as AudioContext
    this.analyser = raw.createAnalyser()
    this.analyser.fftSize = 2048
    this.master.connect(this.analyser as unknown as Tone.InputNode)
    this.gate = k(new Tone.Gain(0).connect(this.master))
    this.reverb = k(new Tone.Reverb({ decay: 6, wet: 0.38 }))
    await this.reverb.generate()
    this.reverb.connect(this.gate)
    const base = midiToHz(BASELINE_MIDI)

    // ---- Science: plain, predictable tones ----
    const lead = k(new Tone.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.08 }, volume: -12 }).connect(this.gate))
    const tick = k(new Tone.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.04, sustain: 0, release: 0.02 }, volume: -16 }).connect(this.gate))
    const droneGain = k(new Tone.Gain(0).connect(this.gate))
    const drone = k(new Tone.Oscillator(base, 'sine').connect(droneGain).start())
    this.sci = { lead, tick, drone, droneGain }

    if (this.kind === 'warming-planet') {
      // ---- Song: a bowed melody over a slowly climbing harmony, with a heartbeat that grows ----
      const celloFilter = k(new Tone.Filter({ type: 'lowpass', frequency: 1400, Q: 0.6 }))
      const vib = k(new Tone.Vibrato(5.2, 0.06))
      celloFilter.chain(vib, this.reverb)
      const cello = new Voices([0, 1].map(() => k(new Tone.Synth({
        oscillator: { type: 'fatsawtooth', count: 3, spread: 18 },
        envelope: { attack: 0.07, decay: 0.2, sustain: 0.75, release: 0.7 },
        volume: -14,
      })))).connect(celloFilter)
      const pad = new Voices([0, 1, 2, 3].map(() => k(new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 1.4, decay: 0.5, sustain: 0.8, release: 3 },
        volume: -20,
      })))).connect(this.reverb)
      const pulse = k(new Tone.MembraneSynth({ pitchDecay: 0.05, octaves: 3, envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.1 }, volume: -14 }).connect(this.gate))
      const sparkle = k(new Tone.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.002, decay: 0.25, sustain: 0, release: 0.2 }, volume: -22 }).connect(this.reverb))
      const bassGain = k(new Tone.Gain(0).connect(this.reverb))
      const bass = k(new Tone.Oscillator(base / 4, 'sine').connect(bassGain).start())
      this.warm = { cello, celloFilter, pad, pulse, sparkle, bass, bassGain }
    } else {
      // ---- Song: a warm sung melody in harmony over the same chord journey as the warming song,
      //      with the sea around it: waves, glass drops, bubbles and a deep voice ----
      const surfFilter = k(new Tone.Filter({ type: 'lowpass', frequency: 500, Q: 0.4 }))
      const swell = k(new Tone.Tremolo(0.11, 0.7).start())
      const surfGain = k(new Tone.Gain(0))
      k(new Tone.Noise('pink').start()).chain(surfFilter, swell, surfGain, this.reverb)
      const melodyFilter = k(new Tone.Filter({ type: 'lowpass', frequency: 1800, Q: 0.5 }))
      const chorus = k(new Tone.Chorus(0.6, 3, 0.35).start())
      melodyFilter.chain(chorus, this.reverb)
      const voice = (vol: number) => new Voices([0, 1].map(() => k(new Tone.Synth({
        oscillator: { type: 'fattriangle', count: 3, spread: 16 },
        envelope: { attack: 0.09, decay: 0.25, sustain: 0.8, release: 0.9 },
        volume: vol,
      })))).connect(melodyFilter)
      const melody = voice(-6)
      const melody2 = voice(-12)
      const glass = new Voices([0, 1].map(() => k(new Tone.FMSynth({
        harmonicity: 3.01, modulationIndex: 2.5,
        envelope: { attack: 0.004, decay: 1.4, sustain: 0, release: 1 },
        modulationEnvelope: { attack: 0.002, decay: 0.4, sustain: 0, release: 0.3 },
        volume: -16,
      })))).connect(this.reverb)
      const whale = k(new Tone.Synth({ oscillator: { type: 'sine' }, portamento: 0.8, envelope: { attack: 0.5, decay: 0.3, sustain: 0.9, release: 1.5 }, volume: -9 }).connect(this.reverb))
      const bubble = k(new Tone.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.002, decay: 0.07, sustain: 0, release: 0.03 }, volume: -16 }).connect(this.reverb))
      const pad = new Voices([0, 1, 2, 3, 4].map(() => k(new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 1.2, decay: 0.5, sustain: 0.85, release: 3 },
        volume: -13,
      })))).connect(this.reverb)
      const bassGain = k(new Tone.Gain(0).connect(this.reverb))
      const bass = k(new Tone.Oscillator(base / 4, 'sine').connect(bassGain).start())
      this.sea = { melody, melody2, melodyFilter, glass, whale, bubble, surfFilter, surfGain, pad, bass, bassGain }
    }
    this.ready = true
  }

  now() { return Tone.immediate() }
  outputLatency() {
    const raw = Tone.getContext().rawContext as unknown as AudioContext
    return (raw.outputLatency || 0) + (raw.baseLatency || 0)
  }
  private toDb(v: number) { return v <= 0.0001 ? -Infinity : 20 * Math.log10(v) }

  setVolume(v: number) {
    this.volume = v
    if (this.ready) this.master.volume.rampTo(this.toDb(v), 0.05)
  }

  setMode(m: AudioMode) {
    if (m === this.mode) return
    this.mode = m
    this.lastChapter = -1
    if (this.ready && this.open_) { const t = this.now(); this.cancelPending(t); this.applyBeds(t) }
  }

  /** Continuous layers (drones, waves) for the current mode. */
  private applyBeds(t: number) {
    const science = this.mode === 'science'
    this.sci.droneGain.gain.cancelScheduledValues(t).rampTo(science ? 0.05 : 0, 0.3, t)
    const songBass = this.kind === 'warming-planet' ? this.warm.bassGain : this.sea.bassGain
    songBass.gain.cancelScheduledValues(t).rampTo(science ? 0 : 0.08, 0.8, t)
    if (this.kind === 'rising-seas' && science) this.sea.surfGain.gain.cancelScheduledValues(t).rampTo(0, 0.5, t)
  }

  /** Start sounding at time t (start of playback). */
  open(t: number) {
    if (!this.ready) return
    this.cancelPending()
    this.open_ = true
    this.lastChapter = -1
    this.gate.gain.cancelScheduledValues(t)
    this.gate.gain.setValueAtTime(1, t)
    this.applyBeds(t)
  }

  /** Silence now (pause/stop), including notes already queued. */
  close() {
    if (!this.ready) return
    this.open_ = false
    const t = this.now()
    this.gate.gain.cancelScheduledValues(t)
    this.gate.gain.setTargetAtTime(0, t, 0.04)
    this.cancelPending(t)
  }

  /** Drop every queued note, so a stale year never sounds after the timeline moved. */
  cancelPending(t = this.now()) {
    if (!this.ready) return
    cancelMono(this.sci.lead, t)
    cancelMono(this.sci.tick, t)
    if (this.warm) {
      this.warm.cello.cancel(t); this.warm.pad.cancel(t)
      cancelMono(this.warm.pulse, t); cancelMono(this.warm.sparkle, t)
      this.warm.celloFilter.frequency.cancelScheduledValues(t)
    }
    if (this.sea) {
      this.sea.melody.cancel(t); this.sea.melody2.cancel(t); this.sea.glass.cancel(t); this.sea.pad.cancel(t)
      this.sea.melodyFilter.frequency.cancelScheduledValues(t)
      cancelMono(this.sea.whale, t); cancelMono(this.sea.bubble, t)
      this.sea.surfFilter.frequency.cancelScheduledValues(t)
      this.sea.surfGain.gain.cancelScheduledValues(t)
    }
    this.lastChapter = -1
  }

  /** Render one year at audio time t; `dur` is the time until the next year. */
  playYear(v: YearVoicing, t: number, dur: number) {
    if (!this.ready) return
    if (this.mode === 'science') return this.playScience(v, t, dur)
    if (this.kind === 'warming-planet') this.playWarmSong(v, t, dur)
    else this.playSeaSong(v, t, dur)
  }

  private playScience(v: YearVoicing, t: number, dur: number) {
    this.sci.lead.triggerAttackRelease(midiToHz(v.scienceMidi), dur * 0.85, t, 0.8)
    const hz = v.ticks.direction === 'up' ? 1760 : 660
    for (let k = 0; k < v.ticks.count; k++) {
      this.sci.tick.triggerAttackRelease(hz, 0.03, t + (dur * (k + 1)) / (v.ticks.count + 1), 0.7)
    }
  }

  private chord(pad: Voices, v: YearVoicing, t: number, dur: number, vel: number, set = SONG_CHORDS, every = 8) {
    if (v.chapter === this.lastChapter && v.index % every !== 0) return
    this.lastChapter = v.chapter
    const notes = set[v.chapter].notes
    notes.forEach((n, i) => pad.play(midiToHz(n), Math.max(dur * every, 2.5), t + i * 0.035, vel))
  }

  private playWarmSong(v: YearVoicing, t: number, dur: number) {
    const w = this.warm
    const loud = 0.45 + 0.5 * v.norm
    w.celloFilter.frequency.setValueAtTime(700 + 2600 * v.norm, t)
    w.cello.play(midiToHz(v.songMidi), dur * 1.15, t, loud)
    this.chord(w.pad, v, t, dur, 0.25 + 0.45 * v.norm)
    // heartbeat: barely there in calm years, insistent in the warmest
    if (v.norm > 0.25) w.pulse.triggerAttackRelease(55, 0.2, t, 0.2 + 0.7 * (v.norm - 0.25))
    if (v.ticks.direction === 'up') {
      for (let k = 0; k < v.ticks.count; k++) w.sparkle.triggerAttackRelease(midiToHz(v.songMidi + 24), 0.15, t + (dur * (k + 1)) / (v.ticks.count + 1), 0.5)
    }
  }

  private playSeaSong(v: YearVoicing, t: number, dur: number) {
    const s = this.sea
    const loud = 0.5 + 0.45 * v.norm
    // the song: a warm melody, then a harmony voice once the water has risen
    s.melodyFilter.frequency.setValueAtTime(900 + 2400 * v.norm, t)
    s.melody.play(midiToHz(v.songMidi + 12), dur * 1.2, t, loud)
    if (v.chapter >= 1) s.melody2.play(midiToHz(harmonyAbove(v.songMidi) + 12), dur * 1.2, t + 0.015, loud * 0.75)
    // the same four-chapter chord journey as the warming song (calm → urgent)
    this.chord(s.pad, v, t, dur, 0.4 + 0.4 * v.norm, SONG_CHORDS, 4)
    // the sea around it
    s.surfGain.gain.setTargetAtTime(0.15 + 0.6 * v.norm, t, 0.5)
    s.surfFilter.frequency.setTargetAtTime(400 + 2000 * v.norm, t, 0.5)
    s.glass.play(midiToHz(v.songMidi + 24), dur * 0.8, t + dur * 0.5, 0.3 + 0.3 * v.norm)
    s.whale.triggerAttackRelease(midiToHz(v.songMidi - 24), dur * 0.95, t, 0.65)
    for (let k = 0; k < v.ticks.count; k++) {
      const bt = t + (dur * (k + 0.5)) / (v.ticks.count + 0.5)
      const f = 900 + 500 * k
      s.bubble.triggerAttackRelease(f, 0.06, bt, 0.6)
      s.bubble.frequency.exponentialRampToValueAtTime(f * 2.2, bt + 0.06)
    }
  }

  /** Short preview of one year while paused. */
  audition(v: YearVoicing) {
    if (!this.ready) return
    const t = this.now() + 0.02
    this.gate.gain.cancelScheduledValues(t)
    this.gate.gain.setValueAtTime(1, t)
    this.gate.gain.setTargetAtTime(0, t + 0.6, 0.1)
    if (this.mode === 'science') this.sci.lead.triggerAttackRelease(midiToHz(v.scienceMidi), 0.4, t, 0.8)
    else if (this.kind === 'warming-planet') this.warm.cello.play(midiToHz(v.songMidi), 0.5, t, 0.7)
    else this.sea.melody.play(midiToHz(v.songMidi + 12), 0.5, t, 0.7)
  }

  dispose() {
    if (!this.ready) { this.initPromise = null; return }
    this.close()
    this.nodes.forEach((n) => n.dispose())
    this.analyser?.disconnect()
    this.ready = false
    this.initPromise = null
  }
}
