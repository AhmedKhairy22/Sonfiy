"""Step 3: sanity-check the exported browser data against the raw files."""
from pathlib import Path
import json
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
DEST = ROOT / "public" / "data" / "experiences" / "global-temperature"
RAW = ROOT / "data" / "raw" / "gistemp"
fail = []


def check(cond, msg):
    print(("PASS " if cond else "FAIL ") + msg)
    if not cond:
        fail.append(msg)


g = json.loads((DEST / "global-annual.json").read_text())
hdr = json.loads((DEST / "grid-annual.json").read_text())
years = np.array(g["years"])
anom = np.array(g["anomaly"], dtype=float)
check(np.all(np.diff(years) == 1), f"years contiguous {years[0]}-{years[-1]}")
check(not np.isnan(anom).any(), "no missing global annual values")

raw = pd.read_csv(RAW / "GLB.Ts+dSST.csv", skiprows=1, na_values="***").set_index("Year")
check(np.allclose(anom, raw.loc[years, "J-D"].values), "global series equals NASA J-D column exactly")

base = anom[(years >= 1951) & (years <= 1980)].mean()
check(abs(base) < 0.02, f"1951-1980 mean of global series ~ 0 (got {base:+.3f})")

sh = hdr["shape"]
q = np.frombuffer((DEST / "grid-annual.bin").read_bytes(), dtype="<i2")
check(q.size == sh["year"] * sh["lat"] * sh["lon"], f"binary size matches header {sh}")
grid = np.where(q == hdr["missing"], np.nan, q * hdr["scale"]).reshape(sh["year"], sh["lat"], sh["lon"])
check(not np.any(grid == 0.0) or np.mean(grid == 0.0) < 0.01, "zeros are not used as missing-value filler")
lat = hdr["lat"]["first"] + hdr["lat"]["step"] * np.arange(sh["lat"])
w = np.cos(np.deg2rad(lat))[None, :, None] * np.ones_like(grid)
w = np.where(np.isnan(grid), 0, w)
gm = np.nansum(grid * w, axis=(1, 2)) / w.sum(axis=(1, 2))
diff = gm - anom
recent = years >= 1960
check(np.abs(diff[recent]).max() < 0.08, f"area-weighted grid mean tracks official series since 1960 (max |diff| {np.abs(diff[recent]).max():.3f} °C)")
check(np.corrcoef(gm, anom)[0, 1] > 0.98, f"correlation grid mean vs official {np.corrcoef(gm, anom)[0, 1]:.4f}")
print(f"\nmax |diff| all years {np.abs(diff).max():.3f} °C (early-year gaps expected: GISS averages zonal bands, we average available cells)")
print("warmest years:", [int(y) for y in years[np.argsort(anom)[-3:][::-1]]], "coolest:", int(years[np.argmin(anom)]))
raise SystemExit(1 if fail else 0)
