"""Step 1: turn raw GISTEMP v4 files into clean annual series (data/processed/).

Decisions (all documented in provenance.json):
  * Only complete calendar years are kept (the current, partial year is dropped).
  * Global annual anomaly = NASA's official "J-D" column of GLB.Ts+dSST.csv.
  * Grid annual mean per 2x2 cell requires >= MIN_MONTHS valid months; otherwise
    the cell is MISSING (NaN) for that year. Missing values are never set to 0.
  * Area-weighted statistics use cos(latitude) weights over cells WITH data only.
"""
from pathlib import Path
import json
import numpy as np
import pandas as pd
import xarray as xr

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw" / "gistemp"
OUT = ROOT / "data" / "processed"
MIN_MONTHS = 9


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    glb = pd.read_csv(RAW / "GLB.Ts+dSST.csv", skiprows=1, na_values="***")
    zon = pd.read_csv(RAW / "ZonAnn.Ts+dSST.csv")

    ds = xr.open_dataset(RAW / "gistemp1200_GHCNv4_ERSSTv5.nc")
    ta = ds["tempanomaly"]
    months = ta.groupby("time.year").count("time")             # valid months per cell/year
    n_months = ds.time.groupby("time.year").count().to_series()
    complete_years = n_months[n_months == 12].index.values
    annual = ta.groupby("time.year").mean("time", skipna=True)
    annual = annual.where(months >= MIN_MONTHS)                 # NaN, not 0, when too sparse
    annual = annual.sel(year=complete_years)

    w = np.cos(np.deg2rad(ds.lat)).broadcast_like(annual.isel(year=0))
    valid = annual.notnull()
    wv = w.where(valid)
    grid_mean = (annual * w).sum(("lat", "lon")) / wv.sum(("lat", "lon"))
    spatial_std = np.sqrt((((annual - grid_mean) ** 2) * w).sum(("lat", "lon")) / wv.sum(("lat", "lon")))
    coverage = wv.sum(("lat", "lon")) / w.sum(("lat", "lon"))

    years = [int(y) for y in complete_years]
    glb = glb.set_index("Year").loc[years]
    zon = zon.set_index("Year").reindex(years)
    if glb["J-D"].isna().any():
        raise SystemExit("official J-D missing for a complete year; refusing to continue")

    series = pd.DataFrame({
        "year": years,
        "anomaly": glb["J-D"].values,
        "grid_mean": grid_mean.values,
        "spatial_std": spatial_std.values,
        "coverage": coverage.values,
        **{f"zone_{c}": zon[c].values for c in zon.columns},
    })
    series.to_csv(OUT / "global_annual.csv", index=False, float_format="%.4f")
    np.savez_compressed(OUT / "grid_annual.npz", anomaly=annual.values.astype("float32"),
                        lat=ds.lat.values, lon=ds.lon.values, year=np.array(years))
    (OUT / "preprocess_info.json").write_text(json.dumps({
        "min_months_for_cell_annual_mean": MIN_MONTHS,
        "years": [years[0], years[-1]],
        "dropped_partial_years": [int(y) for y in n_months[n_months < 12].index],
        "netcdf_history": ds.attrs.get("history"),
    }, indent=2))
    print(f"wrote {len(years)} years ({years[0]}-{years[-1]}); grid {annual.shape}")


if __name__ == "__main__":
    main()
