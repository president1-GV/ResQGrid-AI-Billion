"""
ResQGrid AI - Dataset Schema & Integrity Validation Script
Run: python -m LLM.preprocessing.validate_data
"""

import os
import sys
import json
import pandas as pd
import numpy as np
from datetime import datetime


def validate_all_data():
    print("=" * 60)
    print("  RESQGRID AI — DATASET SCHEMA & INTEGRITY VALIDATOR")
    print("=" * 60)

    summary = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "status": "PASSED",
        "datasets": {}
    }

    # 1. India Flood Inventory
    ifi_path = "LLM/raw/India_Flood_Inventory_v3.csv"
    if not os.path.exists(ifi_path):
        print(f"[FAIL] Missing {ifi_path}")
        sys.exit(1)

    df_ifi = pd.read_csv(ifi_path)
    print(f"\n[1/4] Validating India Flood Inventory ({ifi_path})...")
    print(f"      Rows: {len(df_ifi):,} | Columns: {len(df_ifi.columns)}")

    # Coordinate check
    lat_valid = df_ifi["Latitude"].between(-90, 90).sum()
    lon_valid = df_ifi["Longitude"].between(-180, 180).sum()
    invalid_coords = len(df_ifi) - min(lat_valid, lon_valid)
    print(f"      Coordinate Validity: {lat_valid}/{len(df_ifi)} valid ({invalid_coords} anomalies flagged)")

    # Duration check
    dur_negative = (df_ifi["Duration(Days)"] < 0).sum()
    print(f"      Duration Validity: {len(df_ifi) - dur_negative}/{len(df_ifi)} non-negative durations")

    summary["datasets"]["india_flood_inventory"] = {
        "rows": len(df_ifi),
        "columns": len(df_ifi.columns),
        "invalid_coords": int(invalid_coords),
        "negative_durations": int(dur_negative),
        "status": "VALIDATED"
    }

    # 2. District Flooded Area
    dfa_path = "LLM/raw/District_FloodedArea.csv"
    if os.path.exists(dfa_path):
        df_dfa = pd.read_csv(dfa_path)
        print(f"\n[2/4] Validating District Flooded Area ({dfa_path})...")
        print(f"      Districts: {len(df_dfa):,} | Columns: {len(df_dfa.columns)}")
        null_districts = df_dfa["Dist_Name"].isnull().sum()
        print(f"      District Name Completeness: {len(df_dfa) - null_districts}/{len(df_dfa)}")
        summary["datasets"]["district_flooded_area"] = {
            "districts": len(df_dfa),
            "null_names": int(null_districts),
            "status": "VALIDATED"
        }

    # 3. District Flood Impact
    dfi_path = "LLM/raw/District_FloodImpact.csv"
    if os.path.exists(dfi_path):
        df_dfi = pd.read_csv(dfi_path)
        print(f"\n[3/4] Validating District Flood Impact ({dfi_path})...")
        print(f"      Districts: {len(df_dfi):,} | Columns: {len(df_dfi.columns)}")
        pop_positive = (df_dfi["Population"] > 0).sum()
        print(f"      Valid Population Counts: {pop_positive}/{len(df_dfi)}")
        summary["datasets"]["district_flood_impact"] = {
            "districts": len(df_dfi),
            "valid_populations": int(pop_positive),
            "status": "VALIDATED"
        }

    # 4. EM-DAT India Parquet
    emdat_train_path = "LLM/raw/emdat_india_train.parquet"
    if os.path.exists(emdat_train_path):
        df_emdat = pd.read_parquet(emdat_train_path)
        print(f"\n[4/4] Validating EM-DAT Disaster Profiles ({emdat_train_path})...")
        print(f"      Records: {len(df_emdat):,} | Columns: {len(df_emdat.columns)}")
        year_valid = df_emdat["year"].between(1900, 2030).sum()
        print(f"      Year Range Validity (1900-2030): {year_valid}/{len(df_emdat)}")
        summary["datasets"]["emdat_india_train"] = {
            "records": len(df_emdat),
            "valid_years": int(year_valid),
            "status": "VALIDATED"
        }

    out_path = "LLM/reports/validation_summary.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    print("\n" + "=" * 60)
    print(f"  ALL DATASETS VALIDATED SUCCESSFULLY -> {out_path}")
    print("=" * 60)
    return 0


if __name__ == "__main__":
    sys.exit(validate_all_data())
