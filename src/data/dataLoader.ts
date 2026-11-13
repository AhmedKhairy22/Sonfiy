import type {
  ColorScaleFile, ExperienceId, GlobalAnnualFile, GridHeader, SeaLevelFile, Series,
} from './dataTypes'
import { embeddedData } from '../app/target'

const base = `${import.meta.env.BASE_URL}data/experiences/`

/** Fetch a bundled data file, or read it from the page when the build embedded it. */
async function getFile<T>(rel: string, as: 'json' | 'text' = 'json'): Promise<T> {
  const inline = embeddedData<T>(`data/experiences/${rel}`)
  if (inline !== undefined) return inline
  const r = await fetch(base + rel)
  if (!r.ok) throw new Error(`Could not load ${rel} (${r.status})`)
  return (as === 'json' ? r.json() : r.text()) as Promise<T>
}

const fromB64 = (t: string) => Uint8Array.from(atob(t.trim()), (c) => c.charCodeAt(0)).buffer

async function loadWarming(): Promise<Series> {
  const dir = 'global-temperature/'
  const [g, header, colorScale] = await Promise.all([
    getFile<GlobalAnnualFile>(dir + 'global-annual.json'),
    getFile<GridHeader>(dir + 'grid-annual.json'),
    getFile<ColorScaleFile>(dir + 'color-scale.json'),
  ])
  let buf: ArrayBuffer
  const inline = embeddedData<string>(`data/experiences/${dir}${header.file}`)
  if (inline !== undefined) buf = fromB64(inline)
  else {
    const r = await fetch(base + dir + header.file)
    if (!r.ok) throw new Error(`Could not load the temperature map (${r.status})`)
    buf = header.encoding === 'base64' ? fromB64(await r.text()) : await r.arrayBuffer()
  }
  const { year, lat, lon } = header.shape
  if (buf.byteLength !== year * lat * lon * 2) throw new Error('Temperature map file is damaged (wrong size)')
  if (g.years.length !== year) throw new Error('Map and chart cover different years')
  return { id: 'warming-planet', years: g.years, values: g.anomaly, unit: '°C', grid: { header, values: new Int16Array(buf), colorScale } }
}

async function loadSeas(): Promise<Series> {
  const s = await getFile<SeaLevelFile>('sea-level/annual.json')
  return { id: 'rising-seas', years: s.years, values: s.values, unit: 'cm' }
}

const cache = new Map<ExperienceId, Promise<Series>>()
export function loadSeries(id: ExperienceId): Promise<Series> {
  if (!cache.has(id)) {
    const p = id === 'warming-planet' ? loadWarming() : loadSeas()
    p.catch(() => cache.delete(id))
    cache.set(id, p)
  }
  return cache.get(id)!
}
