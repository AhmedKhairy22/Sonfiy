import { useExperienceStore } from '../../store/useExperienceStore'
import { usePlayerSession } from '../../hooks/usePlayerSession'

/** Every number as text: the way to read the data without seeing or hearing it. */
export default function DataTable() {
  const series = useExperienceStore((s) => s.series)!
  const entry = useExperienceStore((s) => s.entry)!
  const session = usePlayerSession()
  const ocean = series.id === 'rising-seas'
  return (
    <details className="rounded-3xl bg-surface">
      <summary className="cursor-pointer select-none px-6 py-4 font-semibold">See all {series.years.length} years as numbers</summary>
      <div className="max-h-96 overflow-auto border-t border-line">
        <table className="w-full text-sm tabular">
          <caption className="sr-only">{entry.title}: value for each year, compared with {entry.zeroLabel.toLowerCase()}</caption>
          <thead className="sticky top-0 bg-raised text-left text-xs uppercase tracking-wide text-muted">
            <tr><th scope="col" className="px-6 py-2">Year</th><th scope="col" className="px-3 py-2">{ocean ? 'Change since 1993' : 'Compared with normal'}</th><th scope="col" className="px-3 py-2"><span className="sr-only">Listen</span></th></tr>
          </thead>
          <tbody>
            {series.years.map((y, i) => (
              <tr key={y} className="border-t border-line/60">
                <th scope="row" className="px-6 py-1.5 text-left font-medium">{y}</th>
                <td className="whitespace-nowrap px-3 py-1.5">{entry.describe(series.values[i])}</td>
                <td className="px-3 py-1.5 text-right"><button className="text-teal underline underline-offset-2" onClick={() => session.seekIndex(i, { audition: true })}>Go to {y}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}
