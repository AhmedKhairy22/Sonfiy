import { useEffect } from 'react'
import type { PlayerSession } from '../engine/synchronization/PlayerSession'

/** Space/K play-pause · ←/→ ±1 year (Shift ±10) · Home/End · S stop · R restart */
export function useKeyboardShortcuts(session: PlayerSession | null) {
  useEffect(() => {
    if (!session) return
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (t.closest('input, select, textarea, [role="application"], summary, a')) return
      if (t.tagName === 'BUTTON' && (e.key === ' ' || e.key === 'Enter')) return // let buttons work normally
      const n = session.controller.length
      switch (e.key) {
        case ' ': case 'k': case 'K': e.preventDefault(); session.toggle(); break
        case 'ArrowLeft': e.preventDefault(); session.step(e.shiftKey ? -10 : -1); break
        case 'ArrowRight': e.preventDefault(); session.step(e.shiftKey ? 10 : 1); break
        case 'Home': e.preventDefault(); session.seekIndex(0, { audition: true }); break
        case 'End': e.preventDefault(); session.seekIndex(n - 1, { audition: true }); break
        case 's': case 'S': session.stop(); break
        case 'r': case 'R': session.restart(); break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [session])
}
