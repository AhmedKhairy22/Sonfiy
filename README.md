# Sonify

![Sonify](brand/sonify-logo-for-dark-backgrounds.png)

Hear the planet change. Sonify turns real NASA measurements into sound, one note per year.

| Experience | Data | Years |
|---|---|---|
| A Warming Planet | NASA GISS GISTEMP v4 global temperature (+ 2° world map) | 1880–2025 |
| Rising Seas | NASA GSFC global mean sea level from satellite altimetry, v5.2 (doi:10.5067/GMSLM-TJ152) | 1993–2024 |

Two ways to listen:

- **Song mode (feel it).** Each year is placed on a D minor pentatonic scale between the lowest and highest year, so order is always kept. The harmony climbs through four chapters as the data rises. Warming uses a bowed melody and a heartbeat. Rising Seas uses glass drops, waves that swell, bubbles for yearly rise and a deep voice under the water.
- **Science mode (measure it).** Pitch is linear: D4 = zero, +8 semitones per °C or +2 per cm. A steady hum marks zero, and ticks count the change from the year before.

## Deploy on Vercel

This folder is the project root (`package.json` is here). Import the repo in Vercel and keep the detected
**Vite** preset: build command `npm run build`, output directory `dist`. No other settings are needed.

## Offline version

`Sonify-offline.html` is the whole app in one file. Double-click it to open it in a browser, no install needed.

## How the sound works

See [docs/SONIFICATION.md](docs/SONIFICATION.md) for the full step-by-step method, tools and references.

## Run

```bash
npm install
npm run dev          # local dev server
npm test             # mappings + timeline tests on the real data
npm run build        # static site in dist/
npx vite build --mode artifact && python3 scripts/build_artifact.py   # single self-contained HTML page
```

## Data scripts

```bash
python3 scripts/preprocess_temperature.py && python3 scripts/generate_grid_json.py && python3 scripts/validate_data.py
python3 scripts/preprocess_sealevel.py
```

The sea level file was copied from a NASA-GRACE GitHub repository because PO.DAAC and earth.gov were not
reachable from the build machine. Its header and DOI match the official GSFC v5.2 product. Swap in a fresh
download from PO.DAAC to update it.

Architecture: `engine/data/DataMapper.ts` (all mapping rules) → `engine/audio/SonificationEngine.ts` (pure, tested)
→ `engine/audio/AudioEngine.ts` (Tone.js). One clock, `engine/synchronization/PlaybackController.ts`, drives
the sound, the charts and the porthole together.

Not affiliated with NASA. Coastlines: Natural Earth.
