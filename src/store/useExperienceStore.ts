import { create } from 'zustand'
import type { ExperienceEntry, Series } from '../data/dataTypes'
import type { AudioMode } from '../engine/audio/SonificationEngine'

export type View = 'chart' | 'map'

/**
 * Shared source of truth for the open experience. The PlaybackController writes
 * `position` and `isPlaying`; everything else is a listener setting.
 */
export interface ExperienceState {
  entry: ExperienceEntry | null
  series: Series | null
  loadState: 'idle' | 'loading' | 'ready' | 'error'
  error: string | null
  position: number
  isPlaying: boolean
  speed: number
  volume: number
  mode: AudioMode
  view: View
  audioReady: boolean
  /** polite screen-reader announcement */
  announcement: string
}

export const initialExperienceState: ExperienceState = {
  entry: null,
  series: null,
  loadState: 'idle',
  error: null,
  position: 0,
  isPlaying: false,
  speed: 1,
  volume: 0.8,
  mode: 'song',
  view: 'chart',
  audioReady: false,
  announcement: '',
}

export const useExperienceStore = create<ExperienceState>()(() => ({ ...initialExperienceState }))

export const selectIndex = (s: ExperienceState) =>
  s.series ? Math.min(s.series.years.length - 1, Math.max(0, Math.floor(s.position))) : 0

export const useYearIndex = () => useExperienceStore(selectIndex)
