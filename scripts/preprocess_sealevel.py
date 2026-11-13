"""Global mean sea level (NASA GSFC, satellite altimetry) -> annual series for the browser.

Source file: GMSL_TPJAOS_5.2.txt (DOI 10.5067/GMSLM-TJ152), ~10-day cycles since 1993.
Column 12 = GMSL with GIA applied, 60-day smoothing, annual + semi-annual cycles removed:
the series NASA plots on its sea level "Vital Sign". Units in the file: mm, relative to the
1996-2016 TOPEX/Jason mean. We report annual means in cm relative to the 1993 mean, the
same reference the NASA SVS "Sea Level Through a Porthole" visualization labels.
Only complete calendar years are kept. Missing flag 99900 is dropped, never zeroed.
"""
from pathlib import Path
import json
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data/raw/sealevel/GMSL_TPJAOS_5.2.txt"
DEST = ROOT / "public/data/experiences/sea-level"
MIRROR = ("https://github.com/NASA-GRACE/GRACE-Analysis-Tutorials/blob/"
          "b40eed27cbac8f860874592548ff8e240f4cadb2/GRACE_RESOURCES/GMSL_TPJAOS_5.2.txt")

rows = [l.split() for l in RAW.read_text().splitlines() if l.strip() and not l.startswith("HDR")]
df = pd.DataFrame([[float(r[2]), float(r[11])] for r in rows], columns=["t", "gmsl_mm"])
df = df[df.gmsl_mm < 99000]
df["year"] = np.floor(df.t).astype(int)
counts = df.groupby("year").size()
last_t = df.t.max()
complete = [y for y in counts.index if y >= 1993 and (y + 1) <= last_t]
annual = df[df.year.isin(complete)].groupby("year").gmsl_mm.mean()
rel_cm = (annual - annual.loc[1993]) / 10.0

DEST.mkdir(parents=True, exist_ok=True)
years = [int(y) for y in rel_cm.index]
out = {
    "units": "cm, relative to the 1993 average",
    "years": years,
    "values": [round(float(v), 2) for v in rel_cm.values],
    "cyclesPerYear": [int(counts.loc[y]) for y in years],
}
(DEST / "annual.json").write_text(json.dumps(out, separators=(",", ":")))
(DEST / "provenance.json").write_text(json.dumps({
    "dataset": "Global Mean Sea Level Trend from Integrated Multi-Mission Ocean Altimeters TOPEX/Poseidon, Jason-1, OSTM/Jason-2, Jason-3, and Sentinel-6A, Version 5.2 (NASA Goddard Space Flight Center)",
    "citation": [
        "GSFC. 2024. Global Mean Sea Level Trend from Integrated Multi-Mission Ocean Altimeters TOPEX/Poseidon, Jason-1, OSTM/Jason-2, Jason-3, and Sentinel-6A Version 5.2. PO.DAAC, CA, USA. https://doi.org/10.5067/GMSLM-TJ152",
        "Beckley, B. D., et al. (2017). On the 'cal-mode' correction to TOPEX satellite altimetry and its effect on the global mean sea level time series. J. Geophys. Res. Oceans, 122. https://doi.org/10.1002/2017JC013090",
    ],
    "retrievedFrom": MIRROR,
    "retrievalNote": "Copied from a NASA-GRACE GitHub repository because PO.DAAC and earth.gov were not reachable from the build environment. File header and DOI identify it as the official GSFC v5.2 product.",
    "column": "12: smoothed GMSL, GIA applied, annual and semi-annual signals removed (mm)",
    "processing": [
        "Annual mean of the ~10-day satellite cycles in each calendar year.",
        f"Only complete years kept ({years[0]}–{years[-1]}); {int(np.floor(last_t))} is partial and left out.",
        "Shown as change since the 1993 average, in centimetres.",
    ],
    "years": [years[0], years[-1]],
}, indent=2))
print(years[0], years[-1], len(years), "values:", out["values"][:3], "...", out["values"][-3:])
d = np.diff(out["values"])
print("rate first decade %.2f mm/yr, last decade %.2f mm/yr" % (np.mean(d[:10]) * 10, np.mean(d[-10:]) * 10))
