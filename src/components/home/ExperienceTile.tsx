import { AppLink } from '../navigation/AppLink'
import type { ExperienceEntry } from '../../data/dataTypes'
import { assetUrl } from '../../app/target'

export default function ExperienceTile({ e }: { e: ExperienceEntry }) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl bg-surface">
      <div className="relative aspect-[16/9] overflow-hidden bg-bg">
        <img src={assetUrl(e.image)} alt={e.imageAlt} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-teal">{e.category} · {e.timeRange}</p>
        <h3 className="text-3xl font-semibold sm:text-4xl">
          {e.title}
        </h3>
        <p className="text-lg leading-relaxed text-muted">{e.tagline}</p>
        <AppLink to={`/listen/${e.id}`} aria-label={`Listen to ${e.title}`}
          className="mt-auto inline-flex w-fit items-center gap-2 rounded-full bg-teal px-5 py-3 font-semibold text-bg transition-transform hover:translate-x-1">
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" /></svg> Listen
        </AppLink>
        <p className="text-xs text-muted/80">{e.imageCredit}</p>
      </div>
    </article>
  )
}
