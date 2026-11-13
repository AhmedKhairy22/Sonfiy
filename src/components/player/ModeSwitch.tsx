import { useExperienceStore } from '../../store/useExperienceStore'
import { MODE_TEXT } from './ModeCards'

/** The big choice: feel it (Song) or measure it (Science). */
export default function ModeSwitch() {
  const mode = useExperienceStore((s) => s.mode)
  return (
    <div className="flex flex-col gap-2 sm:items-end">
      <div role="radiogroup" aria-label="Listening mode" className="inline-flex rounded-full bg-surface p-1">
        {(['song', 'science'] as const).map((m) => (
          <button key={m} role="radio" aria-checked={mode === m}
            onClick={() => useExperienceStore.setState({ mode: m, announcement: `${MODE_TEXT[m].name}. ${MODE_TEXT[m].line}` })}
            className={`rounded-full px-5 py-2.5 text-base font-semibold transition-colors ${mode === m ? (m === 'song' ? 'bg-amber text-bg' : 'bg-teal text-bg') : 'text-muted hover:text-ink'}`}>
            {MODE_TEXT[m].name}
            <span className="ml-1.5 hidden text-sm font-medium opacity-75 sm:inline">· {MODE_TEXT[m].short}</span>
          </button>
        ))}
      </div>
      <p className="max-w-md text-sm text-muted sm:text-right">{MODE_TEXT[mode].line}</p>
    </div>
  )
}
