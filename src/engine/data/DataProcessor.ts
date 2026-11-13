import type { TemperatureGrid } from '../../data/dataTypes'

/** Read-only helpers for the temperature map grid. Missing values are `null`, never 0. */

export function gridValue(g: TemperatureGrid, yearIdx: number, latIdx: number, lonIdx: number): number | null {
  const { lat, lon } = g.header.shape
  const raw = g.values[yearIdx * lat * lon + latIdx * lon + lonIdx]
  return raw === g.header.missing ? null : raw * g.header.scale
}

export function cellFromLatLon(g: TemperatureGrid, lat: number, lon: number) {
  const h = g.header
  const clampI = (v: number, hi: number) => Math.max(0, Math.min(hi, v))
  const latIdx = clampI(Math.floor((lat - (h.lat.first - h.lat.step / 2)) / h.lat.step), h.shape.lat - 1)
  const L = ((((lon + 180) % 360) + 360) % 360) - 180
  const lonIdx = clampI(Math.floor((L - (h.lon.first - h.lon.step / 2)) / h.lon.step), h.shape.lon - 1)
  return { latIdx, lonIdx, lat: h.lat.first + latIdx * h.lat.step, lon: h.lon.first + lonIdx * h.lon.step }
}

export function formatLatLon(c: { lat: number; lon: number }): string {
  return `${Math.abs(c.lat).toFixed(0)}°${c.lat >= 0 ? 'N' : 'S'}, ${Math.abs(c.lon).toFixed(0)}°${c.lon >= 0 ? 'E' : 'W'}`
}

export function formatSigned(v: number | null | undefined, unit: string, digits = 2): string {
  if (v == null || Number.isNaN(v)) return 'no data'
  return `${v < 0 ? '−' : '+'}${Math.abs(v).toFixed(digits)} ${unit}`
}
