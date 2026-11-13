import { AppLink } from '../components/navigation/AppLink'
import { motion } from 'framer-motion'
import { EXPERIENCES, UPCOMING } from '../data/catalog'
import ExperienceTile from '../components/home/ExperienceTile'
import UpcomingTile from '../components/home/UpcomingTile'
import ModeCards from '../components/player/ModeCards'

export default function HomePage() {
  return (
    <main id="main" className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
      <section className="py-14 sm:py-20">
        <motion.h1 initial={{ opacity: 0.4, y: 8 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl text-5xl font-bold leading-[1.02] sm:text-7xl">
          Hear the planet <span className="text-teal">change</span>.
        </motion.h1>
        <p className="mt-6 max-w-2xl text-xl leading-relaxed text-muted sm:text-2xl">
          Sonify turns real NASA measurements into sound. Press play and listen to more than a century of change.
        </p>
      </section>

      <section aria-labelledby="exp-title">
        <h2 id="exp-title" className="sr-only">Experiences and topics in progress</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {EXPERIENCES.map((e) => <ExperienceTile key={e.id} e={e} />)}
          {UPCOMING.map((t) => <UpcomingTile key={t.title} t={t} />)}
        </div>
      </section>

      <section className="mt-20" aria-labelledby="modes-title">
        <h2 id="modes-title" className="text-4xl font-semibold sm:text-5xl">Feel it, or measure it.</h2>
        <p className="mt-3 max-w-2xl text-lg text-muted">Every experience has two ways to listen. Switch any time while it plays.</p>
        <div className="mt-8"><ModeCards /></div>
      </section>

      <footer className="mt-20 border-t border-line pt-8 text-sm leading-relaxed text-muted">
        Data from NASA: the GISS Surface Temperature Analysis, and the Goddard satellite sea level record behind the sea level indicator on NASA’s Earth Information Center.
        Sonify is an independent project and is not affiliated with NASA. <AppLink to="/about" className="text-ink underline underline-offset-4">Sources and how it works</AppLink>
      </footer>
    </main>
  )
}
