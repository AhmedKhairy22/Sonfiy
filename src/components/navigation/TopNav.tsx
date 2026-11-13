import { AppLink, AppNavLink } from './AppLink'

export function Logo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="var(--color-surface)" />
      <path d="M5 20h3v-6h3v10h3V8h3v14h3V12h3v6h3" stroke="var(--color-teal)" strokeWidth="2.2" fill="none" strokeLinejoin="round" />
    </svg>
  )
}

const link = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-surface text-ink' : 'text-muted hover:text-ink'}`

export default function TopNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/90 backdrop-blur" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <nav className="mx-auto flex max-w-6xl items-center gap-1 px-4 py-3 sm:px-6" aria-label="Main">
        <AppLink to="/" className="mr-auto flex items-center gap-2.5" aria-label="Sonify home">
          <Logo className="h-8 w-8" />
          <span className="font-display text-xl font-bold tracking-tight">Sonify</span>
        </AppLink>
        <AppNavLink to="/listen/warming-planet" className={link}><span className="hidden sm:inline">Warming planet</span><span className="sm:hidden">Warming</span></AppNavLink>
        <AppNavLink to="/listen/rising-seas" className={link}><span className="hidden sm:inline">Rising seas</span><span className="sm:hidden">Seas</span></AppNavLink>
        <AppNavLink to="/about" className={link}>About</AppNavLink>
      </nav>
    </header>
  )
}
