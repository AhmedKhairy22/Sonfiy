import type { Resource } from '../../data/dataTypes'

/** NASA visualizations to explore next, each with its citation. */
export default function LearnMore({ items, title = 'Explore more from NASA' }: { items: Resource[]; title?: string }) {
  return (
    <section aria-labelledby="learn-title" className="mt-6">
      <h2 id="learn-title" className="text-xl font-semibold">{title}</h2>
      <ul className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((r) => (
          <li key={r.url} className="flex flex-col gap-2 rounded-3xl bg-surface p-6">
            <a href={r.url} target="_blank" rel="noreferrer" className="text-lg font-semibold text-teal underline-offset-4 hover:underline">
              {r.title} <span aria-hidden="true">↗</span><span className="sr-only">(opens NASA website)</span>
            </a>
            <p className="leading-relaxed text-muted">{r.why}</p>
            <p className="mt-auto pt-2 text-xs text-muted/80">{r.credit}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
