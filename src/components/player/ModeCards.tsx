/** "Feel it or measure it": the two listening modes, explained in plain words. */
export const MODE_TEXT = {
  song: {
    name: 'Song mode',
    short: 'Feel it',
    line: 'Music made from the data. As the numbers climb, the melody rises, the harmony grows and the sound gets fuller.',
  },
  science: {
    name: 'Science mode',
    short: 'Measure it',
    line: 'One plain note per year on an exact scale. Equal steps in pitch mean equal steps in the data, and a steady hum marks zero.',
  },
} as const

export default function ModeCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {(['song', 'science'] as const).map((m) => (
        <div key={m} className="rounded-3xl bg-surface p-6 sm:p-8">
          <p className={`text-sm font-semibold uppercase tracking-[0.14em] ${m === 'song' ? 'text-amber' : 'text-teal'}`}>{MODE_TEXT[m].short}</p>
          <h3 className="mt-2 text-2xl font-semibold sm:text-3xl">{MODE_TEXT[m].name}</h3>
          <p className="mt-3 text-base leading-relaxed text-muted sm:text-lg">{MODE_TEXT[m].line}</p>
        </div>
      ))}
    </div>
  )
}
