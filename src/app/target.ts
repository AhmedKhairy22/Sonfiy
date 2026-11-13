/**
 * Build target. "artifact" produces one self-contained HTML page (all code and data
 * inline) for hosts that only allow inline scripts; it leaves out the Cesium globe,
 * which is too large to inline.
 */
export const IS_ARTIFACT = import.meta.env.VITE_TARGET === 'artifact'

type Embedded = { data?: Record<string, unknown>; assets?: Record<string, string> }
const embedded = (): Embedded => (window as unknown as { __EJ__?: Embedded }).__EJ__ ?? {}

/** URL of a static asset: an inline data: URI when embedded, else a path under the site base. */
export function assetUrl(path: string): string {
  return embedded().assets?.[path] ?? `${import.meta.env.BASE_URL}${path}`
}

/** Data file embedded in the page, if any (keyed by its path under public/). */
export function embeddedData<T>(path: string): T | undefined {
  return embedded().data?.[path] as T | undefined
}
