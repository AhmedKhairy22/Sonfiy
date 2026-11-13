"""Inspect the raw GISTEMP v4 files before any processing.

Usage:  python3 scripts/inspect_dataset.py
Prints variables, units, baseline, grid, time span and missing-value counts so
that no assumption about the files is hard-coded without being checked first.
"""
from pathlib import Path
import numpy as np
import pandas as pd
import xarray as xr

RAW = Path(__file__).resolve().parent.parent / "data" / "raw" / "gistemp"


def inspect_table(name: str, skip: int) -> None:
    df = pd.read_csv(RAW / name, skiprows=skip, na_values="***")
    print(f"\n== {name} ==")
    print("columns:", list(df.columns))
    print("years:", int(df.Year.min()), "-", int(df.Year.max()))
    print("missing cells per column:", df.isna().sum()[df.isna().sum() > 0].to_dict())


def main() -> None:
    inspect_table("GLB.Ts+dSST.csv", skip=1)
    inspect_table("ZonAnn.Ts+dSST.csv", skip=0)

    ds = xr.open_dataset(RAW / "gistemp1200_GHCNv4_ERSSTv5.nc")
    print("\n== gistemp1200_GHCNv4_ERSSTv5.nc ==")
    print(ds)
    print("global attrs:", ds.attrs)
    ta = ds["tempanomaly"]
    print("tempanomaly attrs:", ta.attrs, "encoding:", {k: ta.encoding.get(k) for k in ("_FillValue", "missing_value", "dtype")})
    lat, lon = ds.lat.values, ds.lon.values
    print(f"lat {lat[0]}..{lat[-1]} step {lat[1]-lat[0]} (n={lat.size});  lon {lon[0]}..{lon[-1]} step {lon[1]-lon[0]} (n={lon.size})")
    print("time:", str(ds.time.values[0])[:10], "->", str(ds.time.values[-1])[:10], f"({ds.time.size} months)")
    years = ds.time.dt.year.values
    months_per_year = pd.Series(years).value_counts().sort_index()
    print("incomplete years:", months_per_year[months_per_year < 12].to_dict())
    frac = ta.isnull().groupby("time.year").mean(...).values
    print("missing fraction by decade:", {int(y): round(float(f), 3) for y, f in zip(np.unique(years)[::10], frac[::10])})
    print("value range (K):", float(ta.min()), float(ta.max()))


if __name__ == "__main__":
    main()
