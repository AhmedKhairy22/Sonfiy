import type { UPCOMING } from '../../data/catalog'
import TopicArt from './TopicArt'

/** Same size and layout as a real experience card, clearly marked as not ready yet. */
export default function UpcomingTile({ t }: { t: (typeof UPCOMING)[number] }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-3xl bg-surface" aria-label={`${t.title}, in progress`}>
      <div className="relative aspect-[16/9] overflow-hidden bg-bg">
        <TopicArt art={t.art} />
        <span className="absolute left-4 top-4 rounded-full bg-bg/85 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-amber backdrop-blur">In progress</span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-teal">{t.category}</p>
        <h3 className="text-3xl font-semibold text-ink/80 sm:text-4xl">{t.title}</h3>
        <p className="text-lg leading-relaxed text-muted">{t.line}</p>
        {t.preview && (
          <p className="text-sm text-muted">
            Preview from NASA: <a href={t.preview.url} target="_blank" rel="noreferrer" className="text-teal underline underline-offset-2">{t.preview.title}</a>
          </p>
        )}
        <span className="mt-auto inline-flex w-fit items-center gap-2 rounded-full border border-dashed border-line px-5 py-3 font-semibold text-muted">
          Coming soon
        </span>
      </div>
    </article>
  )
}
