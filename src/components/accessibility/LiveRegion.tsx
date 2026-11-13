import { useExperienceStore } from '../../store/useExperienceStore'

/** Polite screen-reader announcements (year/value on pause, seek, location changes). */
export default function LiveRegion() {
  const msg = useExperienceStore((s) => s.announcement)
  return <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{msg}</div>
}
