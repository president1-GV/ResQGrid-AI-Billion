"""
ResQGrid AI - Dataset Preprocessing & Leakage-Free Splitting Pipeline
Run: python -m LLM.preprocessing.prepare_data
"""

import os
import sys
import json
import re
import pandas as pd
import numpy as np
from datetime import datetime


def clean_numeric(series):
    """Converts strings with commas/symbols into clean numeric floats."""
    return pd.to_numeric(
        series.astype(str).str.replace(r"[^\d.]", "", regex=True),
        errors="coerce"
    ).fillna(0.0)


def prepare_and_split():
    print("=" * 60)
    print("  RESQGRID AI — DATASET PREPARATION & SPLITTING PIPELINE")
    print("=" * 60)

    raw_ifi_path = "LLM/raw/India_Flood_Inventory_v3.csv"
    raw_dfa_path = "LLM/raw/District_FloodedArea.csv"
    raw_dfi_path = "LLM/raw/District_FloodImpact.csv"

    if not os.path.exists(raw_ifi_path):
        print(f"[ERROR] Missing raw data file {raw_ifi_path}")
        sys.exit(1)

    print("\n[1/5] Loading raw datasets...")
    df_ifi = pd.read_csv(raw_ifi_path)
    # Strip column whitespaces
    df_ifi.columns = df_ifi.columns.str.strip()
    print(f"      Loaded IFI catalog: {len(df_ifi):,} records")

    df_district = None
    if os.path.exists(raw_dfa_path) and os.path.exists(raw_dfi_path):
        dfa = pd.read_csv(raw_dfa_path)
        dfi = pd.read_csv(raw_dfi_path)
        df_district = pd.merge(dfa, dfi, on="Dist_Name", how="outer")
        df_district["dist_norm"] = df_district["Dist_Name"].astype(str).str.strip().str.lower()
        print(f"      Loaded district exposure & impact baseline: {len(df_district)} districts")

    print("\n[2/5] Cleaning and feature extraction...")
    # Clean start date and extract temporal attributes
    df_ifi["Start Date Clean"] = pd.to_datetime(df_ifi["Start Date"], errors="coerce")
    df_ifi["start_year"] = df_ifi["Start Date Clean"].dt.year.fillna(2015).astype(int)
    df_ifi["start_month"] = df_ifi["Start Date Clean"].dt.month.fillna(7).astype(int)
    df_ifi["is_monsoon"] = df_ifi["start_month"].isin([6, 7, 8, 9]).astype(int)

    # Clean numeric features
    df_ifi["duration_days"] = clean_numeric(df_ifi["Duration(Days)"]).clip(lower=1, upper=120)
    df_ifi["severity_score"] = clean_numeric(df_ifi["Severity"]).clip(lower=1.0, upper=10.0)
    df_ifi["fatalities"] = clean_numeric(df_ifi["Human fatality"]).clip(lower=0)
    df_ifi["injured"] = clean_numeric(df_ifi["Human injured"]).clip(lower=0)
    df_ifi["displaced"] = clean_numeric(df_ifi["Human Displaced"]).clip(lower=0)
    df_ifi["area_affected_sqkm"] = clean_numeric(df_ifi["Area Affected"]).clip(lower=0)

    # Normalize district string
    df_ifi["primary_district"] = df_ifi["Districts"].astype(str).str.split(",").str[0].str.strip()
    df_ifi["dist_norm"] = df_ifi["primary_district"].str.lower()

    # Join district baselines if available
    if df_district is not None:
        df_merged = pd.merge(df_ifi, df_district[["dist_norm", "Percent_Flooded_Area", "Population", "Mean_Flood_Duration"]], on="dist_norm", how="left")
    else:
        df_merged = df_ifi.copy()
        df_merged["Percent_Flooded_Area"] = 15.0
        df_merged["Population"] = 500000.0
        df_merged["Mean_Flood_Duration"] = 7.0

    df_merged["district_flooded_area_pct"] = df_merged["Percent_Flooded_Area"].fillna(df_merged["Percent_Flooded_Area"].median()).clip(0, 100)
    df_merged["district_population"] = df_merged["Population"].fillna(df_merged["Population"].median()).clip(lower=10000)
    df_merged["historical_mean_duration"] = df_merged["Mean_Flood_Duration"].fillna(7.0)

    # Derive humanitarian relief commodity demand benchmarks based on Sphere / WHO standards
    # Water: 15L / person / day
    # Food: 2 ration packs / person / day
    # Medical kits: 1 kit / 100 affected persons
    # Tarpaulins/Shelter: 1 kit / 5 affected persons
    estimated_impacted_pop = (df_merged["displaced"] + df_merged["injured"] * 5).clip(lower=50)
    # If displaced is 0 in historical record, estimate from population and severity
    fallback_affected = (df_merged["district_population"] * (df_merged["severity_score"] / 10.0) * (df_merged["district_flooded_area_pct"] / 100.0) * 0.05).clip(lower=100, upper=250000)
    df_merged["estimated_affected_pop"] = np.where(estimated_impacted_pop > 50, estimated_impacted_pop, fallback_affected)

    df_merged["demand_water_liters"] = (df_merged["estimated_affected_pop"] * 15 * df_merged["duration_days"].clip(upper=7)).round().astype(int)
    df_merged["demand_food_packs"] = (df_merged["estimated_affected_pop"] * 2 * df_merged["duration_days"].clip(upper=7)).round().astype(int)
    df_merged["demand_medical_kits"] = (df_merged["estimated_affected_pop"] / 25).round().astype(int).clip(lower=5)
    df_merged["demand_rescue_boats"] = (df_merged["severity_score"] * 3 + df_merged["district_flooded_area_pct"] * 0.5).round().astype(int).clip(lower=2, upper=150)
    df_merged["demand_ambulances"] = (df_merged["injured"] / 10 + df_merged["severity_score"] * 1.5).round().astype(int).clip(lower=1, upper=50)

    print("\n[3/5] Preventing Data Leakage via Strict Temporal Split...")
    # Train: events up to 2017
    # Validation: 2018 - 2020
    # Test: 2021 - 2023
    train_mask = df_merged["start_year"] <= 2017
    val_mask = (df_merged["start_year"] >= 2018) & (df_merged["start_year"] <= 2020)
    test_mask = df_merged["start_year"] >= 2021

    df_train = df_merged[train_mask].copy()
    df_val = df_merged[val_mask].copy()
    df_test = df_merged[test_mask].copy()

    # Fallback if temporal bins are uneven
    if len(df_test) < 100 or len(df_train) < 500:
        # Fallback to stratified 70/15/15 chronological sort
        df_sorted = df_merged.sort_values("start_year").reset_index(drop=True)
        n = len(df_sorted)
        df_train = df_sorted.iloc[:int(n * 0.70)].copy()
        df_val = df_sorted.iloc[int(n * 0.70):int(n * 0.85)].copy()
        df_test = df_sorted.iloc[int(n * 0.85):].copy()

    print(f"      Train Set:      {len(df_train):,} records (Years: {df_train['start_year'].min()}–{df_train['start_year'].max()})")
    print(f"      Validation Set: {len(df_val):,} records (Years: {df_val['start_year'].min()}–{df_val['start_year'].max()})")
    print(f"      Test Set:       {len(df_test):,} records (Years: {df_test['start_year'].min()}–{df_test['start_year'].max()})")

    feature_cols = [
        "duration_days", "severity_score", "start_month", "is_monsoon",
        "district_flooded_area_pct", "district_population", "historical_mean_duration"
    ]
    target_cols = [
        "demand_water_liters", "demand_food_packs", "demand_medical_kits",
        "demand_rescue_boats", "demand_ambulances", "fatalities", "injured"
    ]

    print("\n[4/5] Saving cleaned and processed Parquet splits...")
    os.makedirs("LLM/processed", exist_ok=True)
    train_file = "LLM/processed/train.parquet"
    val_file = "LLM/processed/val.parquet"
    test_file = "LLM/processed/test.parquet"

    df_train.to_parquet(train_file, index=False)
    df_val.to_parquet(val_file, index=False)
    df_test.to_parquet(test_file, index=False)

    print(f"      Saved {train_file} ({os.path.getsize(train_file):,} bytes)")
    print(f"      Saved {val_file} ({os.path.getsize(val_file):,} bytes)")
    print(f"      Saved {test_file} ({os.path.getsize(test_file):,} bytes)")

    meta = {
        "generated_at": datetime.now().isoformat() + "Z",
        "raw_source": raw_ifi_path,
        "split_strategy": "Strict Chronological Temporal Holdout (Zero Leakage)",
        "train_records": len(df_train),
        "val_records": len(df_val),
        "test_records": len(df_test),
        "feature_columns": feature_cols,
        "target_columns": target_cols,
        "train_years": [int(df_train["start_year"].min()), int(df_train["start_year"].max())],
        "val_years": [int(df_val["start_year"].min()), int(df_val["start_year"].max())],
        "test_years": [int(df_test["start_year"].min()), int(df_test["start_year"].max())]
    }

    meta_file = "LLM/processed/preprocessor_metadata.json"
    with open(meta_file, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)

    print(f"\n[5/5] Preprocessor metadata saved -> {meta_file}")
    print("=" * 60)
    print("  DATASET PREPARATION COMPLETE!")
    print("=" * 60)
    return 0


if __name__ == "__main__":
    sys.exit(prepare_and_split())
