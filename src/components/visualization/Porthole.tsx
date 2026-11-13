import { useExperienceStore, useYearIndex } from '../../store/useExperienceStore'

const SIZE = 400, R = 190, C = SIZE / 2
const TOP_CM = 20, BOTTOM_CM = -12
const K = (2 * R) / (TOP_CM - BOTTOM_CM)      // pixels per cm
const yOf = (cm: number) => C + R - (cm - BOTTOM_CM) * K

/**
 * A round window onto the sea, after NASA SVS "Sea Level Through a Porthole" (5620).
 * The water line is drawn from the satellite measurement for the current year; the ruler
 * is in centimetres (left) and inches (right).
 */
export default function Porthole() {
  const series = useExperienceStore((s) => s.series)!
  const idx = useYearIndex()
  const year = series.years[idx]
  const cm = series.values[idx]
  const wl = yOf(cm), base = yOf(0)
  const wave = (amp: number, len: number, y0: number) => {
    let d = `M -200 ${y0}`
    for (let x = -200, k = 0; x <= SIZE + 400; x += len / 2, k++) d += ` q ${len / 4} ${k % 2 ? amp : -amp} ${len / 2} 0`
    return d + ` V ${SIZE + 400} H -200 Z`
  }
  const ink = (y: number) => (y < wl ? '#0a2540' : '#ffffff') // dark text on sky, white under water
  const pill = (text: string, y: number, strong: boolean) => (
    <g style={{ transition: 'transform 600ms ease-out' }} transform={`translate(${C + 50} ${y})`}>
      <rect x={-6} y={-13} width={text.length * 8.6 + 12} height={26} rx={13} fill={strong ? '#65D9C4' : '#080E19'} opacity={strong ? 1 : 0.82} />
      <text x={0} y={0} dy="0.34em" fontSize={14} fontWeight={700} fill={strong ? '#080E19' : '#F1F5F9'}>{text}</text>
    </g>
  )
  const cmTicks = Array.from({ length: TOP_CM - BOTTOM_CM + 1 }, (_, i) => BOTTOM_CM + i)
  const inTicks = Array.from({ length: 13 }, (_, i) => i - 4).filter((i) => i * 2.54 >= BOTTOM_CM && i * 2.54 <= TOP_CM)
  return (
    <figure className="mx-auto w-full max-w-[460px]">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="block h-auto w-full" role="img"
        aria-label={`Porthole view. In ${year} the sea stands ${cm.toFixed(1)} centimetres above its 1993 level.`}>
        <defs>
          <clipPath id="port"><circle cx={C} cy={C} r={R} /></clipPath>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8fbdf0" /><stop offset="1" stopColor="#e4f2ff" /></linearGradient>
          <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1ea7e8" /><stop offset="0.45" stopColor="#0d64ad" /><stop offset="1" stopColor="#06213f" /></linearGradient>
        </defs>
        <circle cx={C} cy={C} r={R + 8} fill="#0d1a2a" stroke="#2b4560" strokeWidth={3} />
        <g clipPath="url(#port)">
          <rect width={SIZE} height={SIZE} fill="url(#sky)" />
          <g style={{ transform: `translateY(${wl - base}px)`, transition: 'transform 600ms ease-out' }}>
            <path d={wave(4, 100, base - 2)} fill="#5fc4f5" opacity={0.55} className="wave-drift-slow" />
            <path d={wave(3, 50, base)} fill="url(#sea)" className="wave-drift" />
          </g>
          {/* ruler */}
          <line x1={C} x2={C} y1={0} y2={wl} stroke="#0a2540" strokeWidth={2.5} opacity={0.85} />
          <line x1={C} x2={C} y1={wl} y2={SIZE} stroke="#fff" strokeWidth={2.5} opacity={0.95} />
          {cmTicks.map((t) => (
            <g key={`c${t}`}>
              <line x1={C - (t % 5 === 0 ? 12 : 6)} x2={C} y1={yOf(t)} y2={yOf(t)} stroke={ink(yOf(t))} strokeWidth={t % 5 === 0 ? 1.6 : 1} />
              {t % 5 === 0 && <text x={C - 16} y={yOf(t)} dy="0.32em" textAnchor="end" fontSize={11} fontWeight={600} fill={ink(yOf(t))}>{t} cm</text>}
            </g>
          ))}
          {inTicks.map((i) => (
            <g key={`i${i}`}>
              <line x1={C} x2={C + (i % 2 === 0 ? 12 : 6)} y1={yOf(i * 2.54)} y2={yOf(i * 2.54)} stroke={ink(yOf(i * 2.54))} strokeWidth={i % 2 === 0 ? 1.6 : 1} />
              {i % 2 === 0 && i !== 0 && <text x={C + 16} y={yOf(i * 2.54)} dy="0.32em" fontSize={11} fontWeight={600} fill={ink(yOf(i * 2.54))}>{i} in</text>}
            </g>
          ))}
          {/* markers */}
          <line x1={C - 22} x2={C + 22} y1={base} y2={base} stroke="#fff" strokeWidth={2.5} />
          <line x1={C - 22} x2={C + 22} y1={wl} y2={wl} stroke="#65D9C4" strokeWidth={3} style={{ transition: 'all 600ms ease-out' }} />
          <line x1={C + 2} x2={C + 2} y1={wl} y2={base} stroke="#65D9C4" strokeWidth={3} />
          {pill(`${year} sea level`, Math.min(wl, base - 30), true)}
          {pill('1993 sea level', Math.max(base, wl + 30), false)}
        </g>
      </svg>
      <figcaption className="mt-2 text-center text-xs text-muted">Drawn from the satellite measurement for each year. After NASA SVS “Sea Level Through a Porthole”.</figcaption>
    </figure>
  )
}
