import { HashRouter, MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import { useEffect } from 'react'
import TopNav from '../components/navigation/TopNav'
import HomePage from '../pages/HomePage'
import ExperiencePage from '../pages/ExperiencePage'
import AboutPage from '../pages/AboutPage'
import { IS_ARTIFACT } from './target'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

// HashRouter keeps links working on static hosts. Inside a Claude artifact the host owns
// the URL hash, so routing stays in memory there.
const Router = IS_ARTIFACT ? MemoryRouter : HashRouter

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <Router>
        <ScrollToTop />
        <a href="#main" className="sr-only-focusable fixed left-3 top-3 z-50 rounded-lg bg-teal px-3 py-2 font-semibold text-bg">Skip to content</a>
        <TopNav />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/listen/:id" element={<ExperiencePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </Router>
    </MotionConfig>
  )
}
