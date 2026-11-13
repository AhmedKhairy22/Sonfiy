# How Sonify turns NASA data into sound

This document explains, step by step, how Sonify turns measurements into music: which tools it uses, which
rules and algorithms, and why we chose them. Every number below is the one the code actually uses
(`src/engine/data/DataMapper.ts`, `src/engine/audio/`).

---

## 1. The idea in one paragraph

Sonify uses **parameter-mapping sonification**: each year is one data point, and each data point becomes
one note. The measurement controls properties of the sound (pitch, loudness, brightness, harmony, rhythm),
and years play in order, so time in the data becomes time in the music. We did not convert pictures into
sound: every sound comes from the numbers in NASA's data files. The pictures (map, chart, porthole) are
drawn from the same numbers at the same moment.

## 2. Step by step

### Step 1: Get the data (Python)

| Experience | NASA dataset | What we take |
|---|---|---|
| A Warming Planet | GISS Surface Temperature Analysis v4 (GISTEMP) | Official yearly global value (column "J-D" of `GLB.Ts+dSST.csv`) and the 2°×2° monthly map grid (`gistemp1200_GHCNv4_ERSSTv5.nc`) |
| Rising Seas | GSFC Global Mean Sea Level v5.2 (doi:10.5067/GMSLM-TJ152) | Column 12: smoothed sea level, seasonal cycle removed, glacial rebound correction applied |

Tools: **pandas** and **numpy** for tables, **xarray** and **netCDF4** for the gridded climate file.

### Step 2: Clean and check it (Python)

- Keep only **complete calendar years** (a partial year would sound like a false dip or jump).
- Temperature: use NASA's yearly global values **unchanged**. For the map, a grid cell's yearly value is the
  mean of its monthly values, and only if at least 9 of the 12 months exist. Otherwise it is **missing**,
  never 0.
- Sea level: average the ~10-day satellite cycles in each year, then subtract the 1993 average and convert
  mm to cm. Zero then means "sea level in 1993".
- Validation (`scripts/validate_data.py`): the exported series must equal NASA's file exactly. A
  cos(latitude) area-weighted average of our map grid must agree with NASA's official global value. It
  agrees within 0.018 °C since 1960 (correlation 0.9996).

### Step 3: Package it for the browser

Small JSON files for the yearly series. The map grid is stored as 16-bit integers (hundredths of a degree),
because 2.4 million numbers as text would be about five times larger. In the one-file version, everything
is embedded inside the HTML page.

### Step 4: One clock for everything (TypeScript)

`PlaybackController` is the single source of truth for time. While playing:

```
position (in years) = anchorPosition + (audioClockNow − anchorTime) × yearsPerSecond × speed
```

- The clock is the **Web Audio clock**, which is sample-accurate. JavaScript timers drift by milliseconds.
- `yearsPerSecond` is 3.5 for A Warming Planet (146 years ≈ 42 s) and 1.4 for Rising Seas (32 years ≈ 23 s).
  Speeds are ×0.5, ×1 and ×2.
- The charts, map and porthole read this position on every animation frame. The audio output delay is
  subtracted, so what you see matches what you hear.
- When you change the speed, the clock re-anchors at the next unplayed year. No year is repeated or skipped.

### Step 5: Schedule the notes (look-ahead scheduler)

A timer wakes every **25 ms** and schedules, on the audio clock, only the notes that start in the next
**150 ms**. Each year is scheduled exactly once. On pause, stop or seek, queued notes are **cancelled**, not
just muted, so an old year can never sound after you move. This is the standard "two clocks" technique for
web audio. It gives exact timing without flooding the audio engine with events.

### Step 6: Turn one year into sound parameters (pure function, unit-tested)

For year *i* with value *v* (°C or cm):

```
change  Δ    = v[i] − v[i−1]
range        lo = min(0, all values),  hi = max(0, all values)
position norm = (v − lo) / (hi − lo)            → 0 for the lowest year, 1 for the highest
chapter       = min(3, floor(norm × 4))          → 0 calm, 1 stirring, 2 rising, 3 urgent
```

#### Science mode: "measure it"

| Data | Sound | Rule |
|---|---|---|
| Value | Pitch | `MIDI note = 62 + v × k`, with k = 8 semitones per °C or 2 per cm. Note 62 is D4 (293.7 Hz). Frequency = 440 × 2^((note − 69)/12) |
| Zero (normal, or the 1993 level) | Steady hum | A quiet sine at D4, the pitch of zero |
| Change from last year | Ticks | `ticks = round(|Δ| / u)`, at most 4, with u = 0.08 °C or 0.2 cm. High tick (1760 Hz) for up, low tick (660 Hz) for down |

The rule is **linear**, so equal steps in pitch always mean equal steps in the data. Pitch is clamped to
MIDI 38–96 to stay audible, and the page says so whenever a value hits the edge.

#### Song mode: "feel it"

| Data | Sound | Rule |
|---|---|---|
| Value | Melody note | `SONG_NOTES[round(norm × 12)]`, a 13-note **D minor pentatonic** scale from D3 to G5 (MIDI 50 53 55 57 60 62 65 67 69 72 74 77 79). Pentatonic has no clashing intervals, so any sequence sounds musical |
| Value | Harmony | Four chord "chapters" that climb with the data: D minor (calm) → B♭maj7 (stirring) → Gm7 (rising) → A7 (urgent, a chord that wants to resolve and never does) |
| Value | Loudness and brightness | Velocity `0.45 + 0.5 × norm`; low-pass filter `700 + 2600 × norm` Hz on the melody |
| Zero | Deep drone | A low D two octaves under the zero pitch |
| Change from last year | Sparkles or bubbles | Same tick count as Science mode, voiced musically |

**A Warming Planet (Song):** a bowed, cello-like melody (three slightly detuned sawtooth oscillators with
vibrato). Soft pad chords. A heartbeat (a pitched drum) that enters when norm > 0.25 and grows stronger
with warming. Sparkles an octave above for years that jumped warmer.

**Rising Seas (Song):** the same harmonic structure as the warming song, with the sea around it.
- **Melody**: a warm, sustained voice (three slightly detuned triangle oscillators through a gentle chorus) sings one note per year, one octave up.
- **Harmony voice**: from the "stirring" chapter onward, a second voice sings two scale steps above the
  melody. Two-part harmony appears *because* the water has risen.
- **Chords**: the same four-chapter journey as A Warming Planet (calm D minor → B♭maj7 → Gm7 → unresolved A7), re-struck every 4 years.
- **Waves**: pink noise through a low-pass filter (400 → 2400 Hz with norm), swelling with a 0.11 Hz
  tremolo, about one wave every 9 seconds. Its loudness grows from 0.15 to 0.75 with norm.
- **Glass drops**: a soft FM bell two octaves above the melody, on the off-beat of each year.
- **Deep voice**: a sine two octaves under the melody that glides (0.8 s portamento) to each new level, like
  the water pushing up.
- **Bubbles**: short upward sine glides, one per 2 mm the sea rose that year.

**Shared output chain:** 6-second reverb (38% wet) → compressor (−20 dB threshold, 3:1) → limiter (−1 dB).
Quiet passages stay audible and loud ones never distort.

### Step 7: Draw the same numbers

- **Song chart**: one bar per year from the zero line. Bars light up as their note plays, and the sounding
  year glows. Amber means warmer than normal, teal means cooler, or water.
- **World map**: each year's 2° grid is drawn as an image, using a blue-to-red scale from −4 to +4 °C.
  Missing cells are grey.
- **Porthole**: the water line sits at the measured centimetres for that year, on a ruler in cm and inches,
  after NASA SVS "Sea Level Through a Porthole".

### Step 8: Verify it

- **Unit tests (Vitest, 18 tests)**: the mapping is linear and monotonic; Song mode never puts a higher
  value on a lower note; each year is scheduled exactly once; speed changes neither skip nor repeat; real
  NASA values pass through unchanged.
- **Browser tests (Playwright + Chromium)**: we read the real audio output with an `AnalyserNode` and an FFT.
  In Science mode, 1909 (−0.48 °C) measured 237 Hz against about 235 Hz expected, and 2024 (+1.28 °C) measured
  538 Hz against 530 Hz expected. Both are within one FFT bin. Output is silent before Play and after Pause.
  The Rising Seas Song-mode level was measured (previous version) at about 0.16 to 0.20 RMS with peaks under 0.65, so there is
  no clipping.

## 3. Tools

| Purpose | Tool |
|---|---|
| Data processing | Python, pandas, numpy, xarray, netCDF4 |
| App | TypeScript, React, Vite, Tailwind CSS, Zustand (shared state) |
| Sound | Web Audio API + Tone.js (synthesizers, effects, scheduling on the audio clock) |
| Graphics | SVG, Canvas, D3 (scales and map projection), Natural Earth coastlines via world-atlas |
| Testing | Vitest (logic), Playwright + Chromium (real audio and screens) |

## 4. Why this approach

1. **Pitch for "how much".** Pitch is the sound property people judge most precisely, and listeners
   naturally hear "higher pitch = more" for quantities like temperature (Walker, 2002). Rising pitch for
   rising temperature or sea level needs no explanation.
2. **One note per year.** Yearly values remove the seasonal ups and downs, so what is left is the long-term
   change. The notes are also slow enough to follow. It is the same idea as Crawford and St. George's
   "A Song of Our Warming Planet" (2013).
3. **Two modes, because beauty and precision pull in different directions.** A strictly linear scale is
   accurate but can sound mechanical. A musical scale is moving but rounds values. Offering both
   (and saying which is which) lets people *feel* the change and *measure* it, without one pretending to be
   the other.
4. **Honest music.** Song mode's rounding is **monotonic**: order is always preserved, and a warmer year
   never sounds lower. Harmony and intensity are driven only by the data's position in its own range. They
   add emotion but never add events that are not in the data. Missing data stays silent; it is never played
   as zero.
5. **A reference you can hear.** The steady hum at "zero" works like a gridline on a chart: you always hear
   whether a note is above or below normal.
6. **Generated live, in the browser.** Because the sound is synthesized from the numbers, every seek, pause
   and speed change is exact. The app works offline from a single file, and nothing is a pre-recorded
   soundtrack.
7. **Sample-accurate sync.** Scheduling on the audio clock (not JavaScript timers) keeps sound and visuals
   locked together, which matters when a note *is* a data point.

## 5. Limits to keep in mind

- Song mode places values within *each dataset's own range*, so its pitches cannot be compared between the
  two experiences. Science mode is the one to use for comparisons.
- Chord "chapters" are an artistic framing of the data's position (low → high), not a separate measurement.
- The sea level file was copied from a NASA-GRACE GitHub repository, because NASA's portals were not
  reachable from the build machine. Its header and DOI match the official product.

## 6. References

- GISTEMP Team (2026). GISS Surface Temperature Analysis (GISTEMP), version 4. NASA Goddard Institute for Space Studies. https://data.giss.nasa.gov/gistemp/
- Lenssen, N., et al. (2024). A NASA GISTEMPv4 observational uncertainty ensemble. J. Geophys. Res. Atmos., 129, e2023JD040179.
- GSFC (2024). Global Mean Sea Level Trend from Integrated Multi-Mission Ocean Altimeters, Version 5.2. PO.DAAC. https://doi.org/10.5067/GMSLM-TJ152
- Beckley, B. D., et al. (2017). On the "cal-mode" correction to TOPEX satellite altimetry and its effect on the global mean sea level time series. J. Geophys. Res. Oceans, 122.
- NASA Scientific Visualization Studio: Sea Level Through a Porthole (SVS 5620, 2026); Global Sea Surface Currents and Temperature (SVS 3912, 2012); DYAMOND Global Carbon Dioxide (SVS 5196, 2024); Earth Information Center gallery.
- Menemenlis, D., et al. (2008). ECCO2: High resolution global ocean and sea ice data synthesis. Mercator Ocean Quarterly Newsletter, 31, 13–21.
- NASA Earth Information Center: https://earth.gov/
- Walker, B. N. (2002). Magnitude estimation of conceptual data dimensions for use in sonification. Journal of Experimental Psychology: Applied, 8(4), 211–221.
- Crawford, D., & St. George, S. (2013). A Song of Our Warming Planet. University of Minnesota.
- Wilson, C. (2013). A Tale of Two Clocks: Scheduling Web Audio with Precision. HTML5 Rocks.
