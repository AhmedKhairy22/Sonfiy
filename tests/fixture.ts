import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Series } from '../src/data/dataTypes'

const dir = resolve(__dirname, '../public/data/experiences')
const j = (f: string) => JSON.parse(readFileSync(resolve(dir, f), 'utf8'))

/** The real exported data, exactly as the browser receives it. */
export function warming(): Series {
  const g = j('global-temperature/global-annual.json')
  return { id: 'warming-planet', years: g.years, values: g.anomaly, unit: '°C' }
}
export function seas(): Series {
  const s = j('sea-level/annual.json')
  return { id: 'rising-seas', years: s.years, values: s.values, unit: 'cm' }
}
