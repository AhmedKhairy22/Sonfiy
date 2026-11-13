import { AppLink } from '../components/navigation/AppLink'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getExperience } from '../data/catalog'
import { loadSeries } from '../data/dataLoader'
import { initialExperienceState, useExperienceStore } from '../store/useExperienceStore'
import { PlayerSession } from '../engine/synchronization/PlayerSession'
import { PlayerSessionContext } from '../hooks/usePlayerSession'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import SongChart from '../components/visualization/SongChart'
import Map2D from '../components/visualization/Map2D'
import Porthole from '../components/visualization/Porthole'
import PlayerBar from '../components/player/PlayerBar'
import Readout from '../components/player/Readout'
import HearLegend from '../components/player/HearLegend'
import ModeSwitch from '../components/player/ModeSwitch'
import DataTable from '../components/accessibility/DataTable'
import LiveRegion from '../components/accessibility/LiveRegion'
import LearnMore from '../components/player/LearnMore'

export default function ExperiencePage() {
  const { id = '' } = useParams()
  const entry = getExperience(id)
  const loadState = useExperienceStore((s) => s.loadState)
  const error = useExperienceStore((s) => s.error)
  const series = useExperienceStore((s) => s.series)
  const [session, setSession] = useState<PlayerSession | null>(null)

  useEffect(() => {
    if (!entry) return
    let alive = true
    let created: PlayerSession | null = null
    useExperienceStore.setState({ ...initialExperienceState, entry, loadState: 'loading' })
    loadSeries(entry.id)
      .then((s) => {
        if (!alive) return
        useExperienceStore.setState({ series: s, loadState: 'ready' })
        created = new PlayerSession(s, entry)
        created.controller.seek(s.years.length - 1) // open on the latest year; Play starts from the first
        setSession(created)
      })
      .catch((e: Error) => alive && useExperienceStore.setState({ loadState: 'error', error: e.message }))
    return () => {
      alive = false
      created?.dispose()
      setSession(null)
      useExperienceStore.setState({ ...initialExperienceState })
    }
  }, [entry])

  useKeyboardShortcuts(session)

  if (!entry) return <main id="main" className="mx-auto max-w-3xl px-4 py-24 text-center"><h1 className="text-3xl font-semibold">Not found</h1><AppLink to="/" className="mt-4 inline-block underline">Back home</AppLink></main>
  if (loadState === 'error') return <main id="main" className="mx-auto max-w-3xl px-4 py-24 text-center"><h1 className="text-2xl font-semibold">The data could not load</h1><p className="mt-2 text-muted">{error}</p></main>
  // Until this experience's own data and player exist, show Loading. Right after switching
  // experiences the store briefly still holds the previous one.
  if (!series || !session || series.id !== entry.id) return <main id="main" className="mx-auto max-w-6xl px-4 py-24 text-center text-lg text-muted" role="status">Loading NASA data…</main>

  const ocean = entry.id === 'rising-seas'
  return (
    <PlayerSessionContext.Provider value={session}>
      <LiveRegion />
      <main id="main" className="mx-auto max-w-6xl px-4 pb-40 pt-8 sm:px-6">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-teal">{entry.category} · {entry.timeRange}</p>
            <h1 className="mt-1 text-4xl font-bold sm:text-5xl">{entry.title}</h1>
            <p className="mt-2 max-w-xl text-lg text-muted">{entry.tagline}</p>
          </div>
          <ModeSwitch />
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-4">
            {ocean ? (
              <>
                <div className="rounded-3xl bg-surface/40 p-2 sm:p-4"><Porthole /></div>
                <div className="rounded-3xl bg-surface/40 p-2 sm:p-4"><SongChart compact /></div>
              </>
            ) : (
              <>
                <div className="rounded-3xl bg-surface/40 p-2 sm:p-4"><Map2D /></div>
                <div className="rounded-3xl bg-surface/40 p-2 sm:p-4"><SongChart compact /></div>
              </>
            )}
          </div>
          <div className="min-w-0 space-y-4">
            <Readout />
            <HearLegend />
          </div>
        </div>

        <section className="mt-12 grid gap-6 lg:grid-cols-2" aria-label="About the data">
          <div className="rounded-3xl bg-surface p-6">
            <h2 className="text-xl font-semibold">About the data</h2>
            <p className="mt-2 leading-relaxed text-muted">{entry.about}</p>
            <p className="mt-3 text-sm text-muted"><span className="text-ink">Zero means:</span> {entry.zeroLabel.toLowerCase()}.</p>
            <h3 className="mt-5 text-sm font-semibold uppercase tracking-[0.14em] text-muted">Sources</h3>
            <ul className="mt-2 space-y-1.5 text-sm">
              {entry.sources.map((s) => (
                <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer" className="text-teal underline underline-offset-2">{s.label}</a>{s.note && <span className="text-muted"> · {s.note}</span>}</li>
              ))}
            </ul>
          </div>
          <div className="min-w-0 space-y-6">
            {entry.explainer && (
              <div className="rounded-3xl bg-surface p-6">
                <h2 className="text-xl font-semibold">{entry.explainer.title}</h2>
                <ul className="mt-3 space-y-2.5 text-muted">
                  {entry.explainer.points.map((p) => <li key={p} className="flex gap-3"><span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal" aria-hidden="true" />{p}</li>)}
                </ul>
                <p className="mt-3 text-sm text-muted">Source: <a href={entry.explainer.source.url} target="_blank" rel="noreferrer" className="text-teal underline underline-offset-2">{entry.explainer.source.label}</a></p>
              </div>
            )}
            <DataTable />
          </div>
        </section>
        <LearnMore items={entry.learnMore} />
        <p className="mt-6 text-sm text-muted">Keys: Space plays or pauses. Left and right arrows move one year (with Shift, ten). <AppLink to="/about" className="underline underline-offset-2">More about listening</AppLink></p>
      </main>
      <PlayerBar />
    </PlayerSessionContext.Provider>
  )
}
