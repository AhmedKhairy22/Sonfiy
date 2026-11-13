import type { UpcomingArt } from '../../data/catalog'

/** Drawn illustrations for topics in progress. Decorative only: no data behind them yet. */
export default function TopicArt({ art }: { art: UpcomingArt }) {
  const common = { viewBox: '0 0 320 180', className: 'h-full w-full', 'aria-hidden': true, preserveAspectRatio: 'xMidYMid slice' } as const
  switch (art) {
    case 'atmosphere':
      return (
        <svg {...common}>
          <rect width="320" height="180" fill="#0d1a2a" />
          <circle cx="160" cy="300" r="190" fill="#142536" />
          {[0, 1, 2, 3, 4].map((i) => (
            <circle key={i} cx="160" cy="300" r={205 + i * 16} fill="none" stroke="#65D9C4" strokeOpacity={0.55 - i * 0.1} strokeWidth="2" strokeDasharray={i % 2 ? '3 7' : undefined} />
          ))}
          {[[60, 70], [110, 45], [205, 55], [255, 85], [150, 30]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3" fill="#94A3B8" opacity="0.7" />)}
        </svg>
      )
    case 'land':
      return (
        <svg {...common}>
          <rect width="320" height="180" fill="#0d1a2a" />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <path key={i} d={`M -10 ${150 - i * 18} C 60 ${120 - i * 18}, 110 ${170 - i * 18}, 170 ${135 - i * 18} S 280 ${110 - i * 18}, 330 ${140 - i * 18}`}
              fill="none" stroke={i < 3 ? '#65D9C4' : '#E9A66A'} strokeOpacity={0.25 + (i % 3) * 0.2} strokeWidth="2" />
          ))}
        </svg>
      )
    case 'ice':
      return (
        <svg {...common}>
          <rect width="320" height="180" fill="#0d1a2a" />
          <path d="M0 110 L60 92 L95 104 L140 86 L190 98 L230 80 L275 95 L320 88 V180 H0 Z" fill="#142536" />
          <path d="M70 70 L105 58 L130 72 L118 92 L84 94 Z" fill="#F1F5F9" fillOpacity="0.85" />
          <path d="M150 62 L190 54 L205 70 L180 84 L156 80 Z" fill="#F1F5F9" fillOpacity="0.6" />
          <path d="M220 66 L248 60 L262 72 L240 80 Z" fill="#F1F5F9" fillOpacity="0.4" />
          <path d="M0 110 L60 92 L95 104 L140 86 L190 98 L230 80 L275 95 L320 88" fill="none" stroke="#65D9C4" strokeWidth="2" />
        </svg>
      )
    case 'hazards':
      return (
        <svg {...common}>
          <rect width="320" height="180" fill="#0d1a2a" />
          {[0, 1, 2, 3, 4].map((i) => (
            <path key={i} d={`M160 90 m ${-20 - i * 18} 0 a ${20 + i * 18} ${14 + i * 12} 0 1 1 ${40 + i * 36} 0`}
              fill="none" stroke={i % 2 ? '#E9A66A' : '#65D9C4'} strokeOpacity={0.75 - i * 0.12} strokeWidth="2.5"
              transform={`rotate(${i * 38} 160 90)`} />
          ))}
          <circle cx="160" cy="90" r="6" fill="#F1F5F9" />
        </svg>
      )
  }
}
