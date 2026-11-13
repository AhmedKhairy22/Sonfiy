import type { ExperienceEntry, Resource } from './dataTypes'

/** NASA resources used for context (cited, linked; their images and videos are not copied here). */
export const RESOURCES = {
  eicGallery: {
    title: 'Earth Information Center gallery',
    credit: 'NASA Scientific Visualization Studio, Goddard Space Flight Center',
    why: 'The visualizations NASA shows on the hyperwall of its Earth Information Center: land, water, air, temperature and climate, measured by satellites for more than 50 years.',
    url: 'https://svs.gsfc.nasa.gov/gallery/earth-information-center/',
  },
  currents: {
    title: 'Global Sea Surface Currents and Temperature (SVS 3912)',
    credit: 'NASA Scientific Visualization Studio, 2012. Data: ECCO2 ocean model, NASA/JPL (Menemenlis et al., 2008)',
    why: 'Shows how ocean currents carry warm water around the planet. Warmer water takes up more space, which is one of the two main reasons the sea is rising.',
    url: 'https://svs.gsfc.nasa.gov/3912/',
  },
  porthole: {
    title: 'Sea Level Through a Porthole (SVS 5620)',
    credit: 'NASA Scientific Visualization Studio, 2026. Data: TOPEX/Poseidon, Jason-1, OSTM/Jason-2, Jason-3 and Sentinel-6 satellites',
    why: 'The NASA view that inspired our porthole: the same satellite record of sea level since 1993, shown at real-world scale.',
    url: 'https://svs.gsfc.nasa.gov/5620/',
  },
  co2: {
    title: 'DYAMOND Global Carbon Dioxide (SVS 5196)',
    credit: 'NASA Scientific Visualization Studio, 2024. Visualization: AJ Christensen. Science: Lesley Ott. Model: GEOS (Goddard Earth Observing System)',
    why: 'Carbon dioxide moving through the atmosphere during 2021, from fossil fuels, fires, land and ocean. It is the gas behind most of the warming you hear in A Warming Planet.',
    url: 'https://svs.gsfc.nasa.gov/5196/',
  },
} satisfies Record<string, Resource>



const abs = (v: number, d: number) => Math.abs(v).toFixed(d)

export const EXPERIENCES: ExperienceEntry[] = [
  {
    id: 'warming-planet',
    title: 'A Warming Planet',
    category: 'Climate',
    tagline: 'Every year since 1880 is one note. Higher notes mean a warmer planet.',
    image: 'assets/images/nasa-gistemp-2025-map.png',
    imageAlt: 'NASA map of how much warmer each place was in 2025 than in 1951–1980. Almost everything is shaded warm, strongest in the Arctic.',
    imageCredit: 'Image: NASA GISS',
    timeRange: '1880–2025',
    zeroLabel: 'Normal (1951–1980 average)',
    describe: (v) => (Math.abs(v) < 0.005 ? 'Exactly normal' : `${abs(v, 2)} °C ${v > 0 ? 'warmer' : 'cooler'} than normal`),
    about:
      'How much warmer or cooler Earth’s surface was each year, compared with the 1951–1980 average. NASA combines thousands of weather stations, ships and buoys to measure it.',
    sources: [
      { label: 'NASA GISS Surface Temperature Analysis (GISTEMP v4)', url: 'https://data.giss.nasa.gov/gistemp/' },
      { label: 'Lenssen et al. (2024), J. Geophys. Res. Atmos., doi:10.1029/2023JD040179', url: 'https://doi.org/10.1029/2023JD040179' },
      { label: 'NASA Earth Information Center: Vital Signs', url: 'https://earth.gov/', note: 'Shows NASA climate indicators. We could not confirm from here which dataset its temperature page uses.' },
    ],
    learnMore: [RESOURCES.co2, RESOURCES.eicGallery],
    yearsPerSecond: 3.5,
    semitonesPerUnit: 8,
    unitsPerTick: 0.08,
  },
  {
    id: 'rising-seas',
    title: 'Rising Seas',
    category: 'Oceans',
    tagline: 'Satellites have measured the ocean since 1993. Hear the water climb.',
    image: 'assets/images/nasa-svs-porthole.webp',
    imageAlt: 'A round porthole half under water with a ruler in centimetres and inches, marking the 1993 sea level and a higher, later sea level.',
    imageCredit: 'Image: NASA Scientific Visualization Studio, “Sea Level Through a Porthole”',
    timeRange: '1993–2024',
    zeroLabel: 'Sea level in 1993',
    describe: (v) => (Math.abs(v) < 0.005 ? 'Same as 1993' : `${abs(v, 1)} cm ${v > 0 ? 'higher' : 'lower'} than in 1993`),
    about:
      'The average height of the world’s oceans, measured from space by the TOPEX/Poseidon, Jason and Sentinel-6 satellites. Shown as the change since 1993.',
    sources: [
      { label: 'NASA GSFC Global Mean Sea Level, v5.2 (doi:10.5067/GMSLM-TJ152)', url: 'https://doi.org/10.5067/GMSLM-TJ152' },
      { label: 'NASA Earth Information Center: Sea Level Vital Sign', url: 'https://earth.gov/sealevel/vital-signs/sea-level/' },
      { label: 'NASA SVS 5620: Sea Level Through a Porthole (2026)', url: 'https://svs.gsfc.nasa.gov/5620', note: 'Visual inspiration for the porthole view.' },
      { label: 'Beckley et al. (2017), J. Geophys. Res. Oceans, doi:10.1002/2017JC013090', url: 'https://doi.org/10.1002/2017JC013090' },
    ],
    learnMore: [RESOURCES.currents, RESOURCES.porthole, RESOURCES.eicGallery],
    explainer: {
      title: 'Why is the sea rising?',
      points: [
        'Warming water expands. The ocean has absorbed most of the extra heat from global warming, and warmer water takes up more space.',
        'Melting ice on land adds water. Glaciers and the ice sheets of Greenland and Antarctica pour meltwater into the ocean.',
        'The rise is speeding up: about 3 mm a year in the 1990s, more than 4 mm a year in the last decade of this record.',
      ],
      source: { label: 'NASA Earth Information Center: Sea Level', url: 'https://earth.gov/sealevel/' },
    },
    yearsPerSecond: 1.4,
    semitonesPerUnit: 2,
    unitsPerTick: 0.2,
  },
]

/** Topics without a finished experience yet, shown on the home page as "In progress". */
export type UpcomingArt = 'atmosphere' | 'land' | 'ice' | 'hazards'
export const UPCOMING: { category: string; title: string; line: string; art: UpcomingArt; preview?: Resource }[] = [
  { category: 'Atmosphere', title: 'The Air We Share', line: 'Air quality, aerosols and the gases that warm the planet.', art: 'atmosphere', preview: RESOURCES.co2 },
  { category: 'Land and Ecosystems', title: 'A Changing Green', line: 'Forests, fires and farmland, and how the green of the Earth shifts with the seasons.', art: 'land' },
  { category: 'Ice and Polar Regions', title: 'Melting Ice', line: 'Arctic sea ice and the ice sheets of Greenland and Antarctica.', art: 'ice', preview: RESOURCES.eicGallery },
  { category: 'Natural Hazards', title: 'Extreme Weather', line: 'Storms, floods, droughts and heat waves.', art: 'hazards' },
]

export const getExperience = (id: string) => EXPERIENCES.find((e) => e.id === id)
