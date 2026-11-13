/** Shapes of the preprocessed files in public/data/experiences/<id>/ */

export interface GlobalAnnualFile {
  units: string
  years: number[]
  /** NASA's official annual (J-D) global anomaly, °C vs 1951–1980 */
  anomaly: number[]
  gridMean: number[]
  spatialStd: number[]
  coverage: number[]
  zones: Record<string, (number | null)[]>
}

export interface GridHeader {
  file: string
  dtype: 'int16-le'
  /** optional: 'base64' when the Int16 bytes are stored as base64 text */
  encoding?: 'base64'
  scale: number
  missing: number
  units: string
  shape: { year: number; lat: number; lon: number }
  order: string
  lat: { first: number; step: number }
  lon: { first: number; step: number }
  years: [number, number]
  cellAnnualRule: string
}

export interface ColorScaleFile {
  domain: [number, number]
  units: string
  missingColor: string
  stops: [number, string][]
}

export interface SeaLevelFile {
  units: string
  years: number[]
  values: number[]
  cyclesPerYear: number[]
}

export interface TemperatureGrid {
  header: GridHeader
  values: Int16Array
  colorScale: ColorScaleFile
}

export type ExperienceId = 'warming-planet' | 'rising-seas'

/** One annual series, the common shape every experience plays. */
export interface Series {
  id: ExperienceId
  years: number[]
  /** the measurements, unchanged, in `unit` */
  values: number[]
  unit: '°C' | 'cm'
  /** temperature map grid (warming planet only) */
  grid?: TemperatureGrid
}

export interface Source {
  label: string
  url: string
  note?: string
}

/** A NASA visualization or page that adds context. Linked and cited, never used as data. */
export interface Resource {
  title: string
  /** who made it, when: shown as the citation line */
  credit: string
  /** what it shows and how it connects to this experience, in one or two plain sentences */
  why: string
  url: string
}

export interface ExperienceEntry {
  id: ExperienceId
  title: string
  category: string
  /** one short line */
  tagline: string
  image: string
  imageAlt: string
  imageCredit: string
  timeRange: string
  /** what zero means, in plain words */
  zeroLabel: string
  /** sentence describing a value, e.g. "1.28 °C warmer than normal" */
  describe: (v: number) => string
  /** what the measurement is, in one or two plain sentences */
  about: string
  sources: Source[]
  /** NASA visualizations to explore next */
  learnMore: Resource[]
  /** optional short explainer shown under "About the data" */
  explainer?: { title: string; points: string[]; source: Source }
  /** years played per second at Normal speed */
  yearsPerSecond: number
  /** Science mode: semitones per unit (°C or cm) */
  semitonesPerUnit: number
  /** Science mode: one tick per this much change from the year before */
  unitsPerTick: number
}
