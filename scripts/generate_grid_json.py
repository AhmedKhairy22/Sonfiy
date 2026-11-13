"""Step 2: export browser-ready files to public/data/experiences/global-temperature/.

The grid is stored as a compact little-endian Int16 binary (hundredths of a kelvin,
-32768 = missing) next to a JSON header, because a JSON array of 2.4 million numbers
would be ~5x larger. All other files are plain JSON.
"""
from pathlib import Path
import json
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
PROC = ROOT / "data" / "processed"
DEST = ROOT / "public" / "data" / "experiences" / "global-temperature"
MISSING = -32768
SCALE = 0.01


def r(x, n=3):
    return None if pd.isna(x) else round(float(x), n)


def main() -> None:
    DEST.mkdir(parents=True, exist_ok=True)
    s = pd.read_csv(PROC / "global_annual.csv")
    info = json.loads((PROC / "preprocess_info.json").read_text())
    zones = [c for c in s.columns if c.startswith("zone_")]

    (DEST / "global-annual.json").write_text(json.dumps({
        "units": "°C (K) anomaly relative to 1951–1980",
        "years": s.year.astype(int).tolist(),
        "anomaly": [r(v, 2) for v in s.anomaly],
        "gridMean": [r(v) for v in s.grid_mean],
        "spatialStd": [r(v) for v in s.spatial_std],
        "coverage": [r(v) for v in s.coverage],
        "zones": {c[5:]: [r(v, 2) for v in s[c]] for c in zones},
    }, separators=(",", ":")))

    g = np.load(PROC / "grid_annual.npz")
    a = g["anomaly"]
    q = np.where(np.isnan(a), MISSING, np.round(a / SCALE)).astype("<i2")
    (DEST / "grid-annual.bin").write_bytes(q.tobytes(order="C"))
    (DEST / "grid-annual.json").write_text(json.dumps({
        "file": "grid-annual.bin", "dtype": "int16-le", "scale": SCALE, "missing": MISSING,
        "units": "K anomaly relative to 1951–1980",
        "shape": {"year": int(a.shape[0]), "lat": int(a.shape[1]), "lon": int(a.shape[2])},
        "order": "year, lat (south to north), lon (west to east)",
        "lat": {"first": float(g["lat"][0]), "step": float(g["lat"][1] - g["lat"][0])},
        "lon": {"first": float(g["lon"][0]), "step": float(g["lon"][1] - g["lon"][0])},
        "years": [int(g["year"][0]), int(g["year"][-1])],
        "cellAnnualRule": f"mean of monthly anomalies; requires >= {info['min_months_for_cell_annual_mean']} valid months, else missing",
    }, indent=2))

    # Diverging scale matched to NASA's GISTEMP maps (-4..+4 °C), colorblind-safe blue/red.
    (DEST / "color-scale.json").write_text(json.dumps({
        "domain": [-4, 4], "units": "°C", "missingColor": "#3a3f4b",
        "stops": [[-4, "#08306b"], [-3, "#2166ac"], [-2, "#4393c3"], [-1, "#92c5de"], [-0.25, "#e8eef2"],
                  [0.25, "#f6e8df"], [1, "#f4a582"], [2, "#d6604d"], [3, "#b2182b"], [4, "#67001f"]],
    }, indent=2))

    (DEST / "provenance.json").write_text(json.dumps({
        "dataset": "NASA GISS Surface Temperature Analysis, version 4 (GISTEMP v4)",
        "citation": [
            "GISTEMP Team, 2026: GISS Surface Temperature Analysis (GISTEMP), version 4. NASA Goddard Institute for Space Studies. Dataset accessed 2026-11-11 at https://data.giss.nasa.gov/gistemp/.",
            "Lenssen, N., G.A. Schmidt, M. Hendrickson, P. Jacobs, M. Menne, and R. Ruedy, 2024: A NASA GISTEMPv4 observational uncertainty ensemble. J. Geophys. Res. Atmos., 129, e2023JD040179, doi:10.1029/2023JD040179.",
        ],
        "sourceFiles": [
            {"file": "GLB.Ts+dSST.csv", "url": "https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv", "used_for": "official global annual mean (J-D column)"},
            {"file": "ZonAnn.Ts+dSST.csv", "url": "https://data.giss.nasa.gov/gistemp/tabledata_v4/ZonAnn.Ts+dSST.csv", "used_for": "latitude-band annual means (exported for a future experience; not yet used in sound or visuals)"},
            {"file": "gistemp1200_GHCNv4_ERSSTv5.nc.gz", "url": "https://data.giss.nasa.gov/pub/gistemp/gistemp1200_GHCNv4_ERSSTv5.nc.gz", "used_for": "2x2 degree gridded monthly anomalies (1200 km smoothing)", "history": info["netcdf_history"]},
        ],
        "baseline": "1951–1980", "units": "°C (equivalently K) — anomalies, not absolute temperatures",
        "years": info["years"], "droppedPartialYears": info["dropped_partial_years"],
        "processing": [
            "Kept complete calendar years only.",
            "Global series uses NASA's published annual (J-D) values unchanged.",
            f"Grid annual mean = mean of a cell's monthly anomalies when >= {info['min_months_for_cell_annual_mean']} of 12 months exist; otherwise the cell is marked missing (never filled with 0).",
            "Spatial variability = cos(latitude)-weighted standard deviation of the annual grid across cells with data.",
            "Coverage = cos(latitude)-weighted fraction of the Earth's surface with data that year.",
            "Grid values rounded to 0.01 K and stored as Int16.",
        ],
        "scripts": ["scripts/inspect_dataset.py", "scripts/preprocess_temperature.py", "scripts/generate_grid_json.py", "scripts/validate_data.py"],
    }, indent=2, ensure_ascii=False))
    print("exported", sorted(p.name for p in DEST.iterdir()))


if __name__ == "__main__":
    main()
