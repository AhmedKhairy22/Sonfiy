import { AppLink } from '../components/navigation/AppLink'
import { EXPERIENCES, RESOURCES } from '../data/catalog'
import ModeCards from '../components/player/ModeCards'

const TERMS: [string, string][] = [
  ['Normal', 'The average temperature of 1951–1980. Scientists compare every year with it.'],
  ['Warmer than normal', 'How far a year was above that average. +1.2 °C means 1.2 °C above it, not a temperature of 1.2 °C.'],
  ['Sea level change', 'How much higher the average ocean surface is than it was in 1993, measured by satellites.'],
  ['One note = one year', 'Every note you hear is one real yearly measurement, played in order.'],
  ['No measurements', 'Grey areas on the world map, mostly in early years. They are left silent and grey, never treated as zero.'],
]

export default function AboutPage() {
  return (
    <main id="main" className="mx-auto max-w-4xl px-4 pb-24 pt-12 sm:px-6">
      <h1 className="text-5xl font-bold">About Sonify</h1>
      <p className="mt-4 text-xl leading-relaxed text-muted">
        Sonify plays real NASA measurements as sound, one note for each year. You can listen to a century of change in under a minute.
      </p>

      <section className="mt-14" aria-labelledby="modes">
        <h2 id="modes" className="text-3xl font-semibold">Two ways to listen</h2>
        <div className="mt-6"><ModeCards /></div>
        <p className="mt-4 text-muted">
          Both modes play the same numbers in the same order. Song mode places each year on a musical scale between the lowest and highest year, and never puts a higher value on a lower note.
          Science mode uses one fixed rule, so you can compare sizes of change by ear.
        </p>
      </section>

      <section className="mt-14" aria-labelledby="terms">
        <h2 id="terms" className="text-3xl font-semibold">Words on this site</h2>
        <dl className="mt-6 grid gap-4">
          {TERMS.map(([t, d]) => (
            <div key={t} className="rounded-2xl bg-surface p-5"><dt className="font-semibold text-teal">{t}</dt><dd className="mt-1 text-muted">{d}</dd></div>
          ))}
        </dl>
      </section>

      <section className="mt-14" aria-labelledby="access">
        <h2 id="access" className="text-3xl font-semibold">Listening without the visuals</h2>
        <ul className="mt-4 list-disc space-y-2 pl-6 text-muted">
          <li>Space plays or pauses. Left and right arrows move one year; hold Shift to move ten. Home and End jump to the first and last year.</li>
          <li>When you pause or move, a screen reader announces the year and its value.</li>
          <li>Every experience has a table with all the numbers, and a “Go to” button on each year.</li>
          <li>Sound never starts on its own. Animations calm down if your device asks for reduced motion.</li>
        </ul>
      </section>

      <section className="mt-14" aria-labelledby="sources">
        <h2 id="sources" className="text-3xl font-semibold">Data and sources</h2>
        {EXPERIENCES.map((e) => (
          <div key={e.id} className="mt-6 rounded-2xl bg-surface p-6">
            <h3 className="text-xl font-semibold"><AppLink to={`/listen/${e.id}`} className="hover:underline">{e.title}</AppLink></h3>
            <p className="mt-1 text-muted">{e.about}</p>
            <ul className="mt-3 space-y-1.5 text-sm">
              {e.sources.map((s) => (
                <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer" className="text-teal underline underline-offset-2">{s.label}</a>{s.note && <span className="text-muted"> · {s.note}</span>}</li>
              ))}
            </ul>
          </div>
        ))}
        <ul className="mt-6 list-disc space-y-2 pl-6 text-sm text-muted">
          <li>Temperature: NASA’s official yearly global values, unchanged. The world map uses NASA’s 2° grid; a place-year with fewer than 9 months of data is shown as missing.</li>
          <li>Sea level: yearly averages of the satellite record (smoothed, seasonal cycle removed, glacial rebound correction applied), shown as change since 1993. The copy we used came from a NASA-GRACE GitHub repository, because NASA’s data portals were not reachable from our build machine. Its header matches the official file.</li>
          <li>Only complete years are included. Coastlines from Natural Earth.</li>
          <li>The musical idea follows Daniel Crawford and Scott St. George’s “A Song of Our Warming Planet” (2013): one note per year, pitch rising with temperature.</li>
        </ul>
        <h3 className="mt-10 text-2xl font-semibold">More from NASA</h3>
        <p className="mt-2 text-muted">NASA visualizations we used for context and inspiration. They are linked and cited here; their images and videos are not copied into Sonify, and the sounds are made only from the data files above.</p>
        <ul className="mt-4 grid gap-4">
          {Object.values(RESOURCES).map((r) => (
            <li key={r.url} className="rounded-2xl bg-surface p-5">
              <a href={r.url} target="_blank" rel="noreferrer" className="font-semibold text-teal underline underline-offset-2">{r.title}</a>
              <p className="mt-1 text-muted">{r.why}</p>
              <p className="mt-2 text-xs text-muted/80">{r.credit}</p>
            </li>
          ))}
        </ul>
        <ul className="mt-6 list-disc space-y-2 pl-6 text-sm text-muted">
          <li>Menemenlis, D., et al. (2008). ECCO2: High resolution global ocean and sea ice data synthesis. Mercator Ocean Quarterly Newsletter, 31, 13–21.</li>
          <li>NASA Scientific Visualization Studio content is credited to NASA’s Goddard Space Flight Center Scientific Visualization Studio, as each page asks.</li>
        </ul>
        <p className="mt-6 text-sm text-muted">Sonify is an independent project, not affiliated with or endorsed by NASA.</p>
      </section>
    </main>
  )
}
