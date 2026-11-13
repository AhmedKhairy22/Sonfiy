import { geoEquirectangular, geoPath } from 'd3'
import { feature } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import landTopo from 'world-atlas/land-110m.json'
import type { TemperatureGrid } from '../../data/dataTypes'
import { makeColorLookup } from '../../engine/data/DataMapper'

/** Coastlines (Natural Earth 1:110m via world-atlas): context only, not data. */
const topo = landTopo as unknown as Topology<{ land: GeometryCollection }>
export const land = feature(topo, topo.objects.land)

const lookups = new WeakMap<TemperatureGrid, ReturnType<typeof makeColorLookup>>()
function colorLookup(g: TemperatureGrid) {
  let l = lookups.get(g)
  if (!l) { l = makeColorLookup(g.colorScale); lookups.set(g, l) }
  return l
}

/** One pixel per grid cell, north up. Missing cells get the "no data" colour, never the colour of 0. */
function anomalyImageData(g: TemperatureGrid, yearIdx: number): ImageData {
  const { lat: nLat, lon: nLon } = g.header.shape
  const img = new ImageData(nLon, nLat)
  const color = colorLookup(g)
  const base = yearIdx * nLat * nLon
  for (let y = 0; y < nLat; y++) {
    const row = nLat - 1 - y
    for (let x = 0; x < nLon; x++) {
      const raw = g.values[base + row * nLon + x]
      const [r, gg, b] = color(raw === g.header.missing ? null : raw * g.header.scale)
      const o = (y * nLon + x) * 4
      img.data[o] = r; img.data[o + 1] = gg; img.data[o + 2] = b; img.data[o + 3] = 255
    }
  }
  return img
}

const scratch = typeof document !== 'undefined' ? document.createElement('canvas') : null

export function drawAnomalyMap(ctx: CanvasRenderingContext2D, g: TemperatureGrid, yearIdx: number, w: number, h: number) {
  const img = anomalyImageData(g, yearIdx)
  scratch!.width = img.width
  scratch!.height = img.height
  scratch!.getContext('2d')!.putImageData(img, 0, 0)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(scratch!, 0, 0, w, h)
  const proj = geoEquirectangular().fitSize([w, h], { type: 'Sphere' })
  ctx.beginPath()
  geoPath(proj, ctx)(land)
  ctx.lineWidth = w < 500 ? 0.5 : 0.8
  ctx.strokeStyle = 'rgba(8,14,25,0.8)'
  ctx.stroke()
  return proj
}
