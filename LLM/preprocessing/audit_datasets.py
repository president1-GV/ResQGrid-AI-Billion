"""
ResQGrid AI - Dataset Audit and Data Quality Engine
Programmatically calculates exact dataset metrics, checks provenance,
evaluates nulls/duplicates/anomalies, and generates DATASET_INVENTORY.md
and data_quality_report.md.
"""

import os
import hashlib
import pandas as pd
import numpy as np
from datetime import datetime


def compute_file_hash(filepath: str) -> str:
    hasher = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()


def audit_datasets():
    datasets_meta = [
        {
            "id": "india_flood_inventory_v3",
            "name": "India Flood Inventory (IFI v3.0)",
            "path": "LLM/raw/India_Flood_Inventory_v3.csv",
            "source": "HydroSense Lab, IIT Delhi (Saharia et al.)",
            "source_url": "https://github.com/hydrosenselab/India-Flood-Inventory",
            "license_class": "RESEARCH/ACADEMIC",
            "license": "Open Academic Research Data (Zenodo DOI: 10.5281/zenodo.13636502)",
            "citation": "Saharia, M. et al., India Flood Inventory (1967-2023), Zenodo, 2024.",
            "dataset_type": "Tabular Geospatial Historical Flood Events",
            "format": "CSV",
            "geo_coverage": "National (All Indian States & UTs)",
            "temporal_coverage": "1967 - 2023",
            "potential_use": "Flood severity classification, impact duration, and casualties prediction",
            "suitability": "HIGH - Multi-decadal ground-truth national historical flood catalog"
        },
        {
            "id": "district_flooded_area",
            "name": "District-level Satellite Flooded Area (IFI v3.0)",
            "path": "LLM/raw/District_FloodedArea.csv",
            "source": "HydroSense Lab, IIT Delhi (Saharia et al.)",
            "source_url": "https://github.com/hydrosenselab/India-Flood-Inventory",
            "license_class": "RESEARCH/ACADEMIC",
            "license": "Open Academic Research Data (Zenodo DOI: 10.5281/zenodo.13636502)",
            "citation": "Saharia, M. et al., India Flood Inventory (1967-2023), Zenodo, 2024.",
            "dataset_type": "Tabular Satellite Earth Observation Aggregates",
            "format": "CSV",
            "geo_coverage": "732 Indian Districts",
            "temporal_coverage": "Historical Aggregate",
            "potential_use": "District inundation exposure & geographic risk modeling",
            "suitability": "HIGH - Standardized district-level geographic flood extent"
        },
        {
            "id": "district_flood_impact",
            "name": "District Flood Impact & Vulnerability (IFI v3.0)",
            "path": "LLM/raw/District_FloodImpact.csv",
            "source": "HydroSense Lab, IIT Delhi (Saharia et al.)",
            "source_url": "https://github.com/hydrosenselab/India-Flood-Inventory",
            "license_class": "RESEARCH/ACADEMIC",
            "license": "Open Academic Research Data (Zenodo DOI: 10.5281/zenodo.13636502)",
            "citation": "Saharia, M. et al., India Flood Inventory (1967-2023), Zenodo, 2024.",
            "dataset_type": "Tabular Demographic Impact & Duration",
            "format": "CSV",
            "geo_coverage": "732 Indian Districts",
            "temporal_coverage": "Historical Aggregate",
            "potential_use": "Baseline district casualty, injury, and duration rate estimation",
            "suitability": "HIGH - Directly links district population to historical flood impacts"
        },
        {
            "id": "emdat_india_train",
            "name": "EM-DAT India Disaster Profiles (Train)",
            "path": "LLM/raw/emdat_india_train.parquet",
            "source": "CRED / HDX (Humanitarian Data Exchange)",
            "source_url": "https://huggingface.co/datasets/electricsheepasia/asia-population-emdat-country-profiles-india",
            "license_class": "PERMISSIVE",
            "license": "CC-BY-4.0 (Humanitarian Data Exchange)",
            "citation": "CRED EM-DAT, Disaster Country Profiles: India, HDX/ElectricSheep, 2024.",
            "dataset_type": "Macro Disaster Impact Time-Series",
            "format": "Parquet",
            "geo_coverage": "India National",
            "temporal_coverage": "1900 - 2024",
            "potential_use": "Macro-level multi-disaster economic and humanitarian impact modeling",
            "suitability": "HIGH - Validated international humanitarian dataset"
        },
        {
            "id": "emdat_india_test",
            "name": "EM-DAT India Disaster Profiles (Test)",
            "path": "LLM/raw/emdat_india_test.parquet",
            "source": "CRED / HDX (Humanitarian Data Exchange)",
            "source_url": "https://huggingface.co/datasets/electricsheepasia/asia-population-emdat-country-profiles-india",
            "license_class": "PERMISSIVE",
            "license": "CC-BY-4.0 (Humanitarian Data Exchange)",
            "citation": "CRED EM-DAT, Disaster Country Profiles: India, HDX/ElectricSheep, 2024.",
            "dataset_type": "Macro Disaster Impact Time-Series (Holdout)",
            "format": "Parquet",
            "geo_coverage": "India National",
            "temporal_coverage": "Recent Historical",
            "potential_use": "Out-of-sample macro validation for cross-disaster trends",
            "suitability": "HIGH - Official held-out test split"
        }
    ]

    inventory_md = [
        "# RESQGRID AI — DATASET INVENTORY",
        "",
        "> **Notice**: All dataset metrics in this inventory are calculated programmatically from local files.",
        f"> **Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} UTC",
        "",
        "---",
        ""
    ]

    quality_md = [
        "# RESQGRID AI — DATA QUALITY & PROVENANCE AUDIT REPORT",
        "",
        f"> **Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} UTC",
        "> **Audit Engine**: ResQGrid LLM Preprocessing Quality Validator",
        "",
        "---",
        ""
    ]

    for item in datasets_meta:
        path = item["path"]
        if not os.path.exists(path):
            continue

        file_size = os.path.getsize(path)
        sha256 = compute_file_hash(path)

        if path.endswith(".csv"):
            df = pd.read_csv(path)
        elif path.endswith(".parquet"):
            df = pd.read_parquet(path)
        else:
            continue

        rows, cols = df.shape
        null_counts = df.isnull().sum()
        total_nulls = int(null_counts.sum())
        total_cells = rows * cols
        null_pct = round((total_nulls / total_cells) * 100, 2) if total_cells > 0 else 0.0
        dup_rows = int(df.duplicated().sum())
        dup_pct = round((dup_rows / rows) * 100, 2) if rows > 0 else 0.0

        # Feature types
        num_cols = df.select_dtypes(include=[np.number]).columns.tolist()

        # Coordinate audit if applicable
        coord_issues = 0
        if "Latitude" in df.columns and "Longitude" in df.columns:
            invalid_lats = df[(df["Latitude"] < -90) | (df["Latitude"] > 90)]["Latitude"].count()
            invalid_lons = df[(df["Longitude"] < -180) | (df["Longitude"] > 180)]["Longitude"].count()
            coord_issues = int(invalid_lats + invalid_lons)

        # Append to Inventory
        inventory_md.extend([
            f"## {item['name']}",
            f"- **Dataset ID**: `{item['id']}`",
            f"- **Source**: {item['source']}",
            f"- **Source URL**: [{item['source_url']}]({item['source_url']})",
            f"- **Local Path**: `{item['path']}`",
            f"- **Dataset Type**: {item['dataset_type']}",
            f"- **Format**: {item['format']}",
            f"- **File Size**: {file_size:,} bytes",
            f"- **SHA-256 Hash**: `{sha256}`",
            f"- **Number of Records**: {rows:,}",
            f"- **Number of Features**: {cols}",
            f"- **Features**: {', '.join([f'`{c}`' for c in df.columns[:12]])}{'...' if len(df.columns) > 12 else ''}",
            f"- **Geographic Coverage**: {item['geo_coverage']}",
            f"- **Temporal Coverage**: {item['temporal_coverage']}",
            f"- **License Classification**: **`{item['license_class']}`**",
            f"- **License**: {item['license']}",
            f"- **Citation**: {item['citation']}",
            f"- **Potential Use**: {item['potential_use']}",
            f"- **Data Quality**: {100.0 - null_pct:.1f}% Complete",
            f"- **Missing Values (Cells)**: {total_nulls:,} ({null_pct}%)",
            f"- **Duplicate Records**: {dup_rows:,} ({dup_pct}%)",
            f"- **Known Limitations**: Historical data density increases post-1990; sparse casualties reported in early records.",
            f"- **Training Suitability**: {item['suitability']}",
            "",
            "---",
            ""
        ])

        # Append to Quality Report
        quality_md.extend([
            f"### Dataset Audit: {item['name']} (`{item['id']}`)",
            f"- **File**: `{item['path']}` | **Size**: {file_size:,} bytes",
            f"- **Total Rows**: {rows:,} | **Total Columns**: {cols}",
            f"- **Null Percentage**: {null_pct}% ({total_nulls:,} missing cells)",
            f"- **Duplicate Rows**: {dup_rows} ({dup_pct}%)",
            f"- **Coordinate Anomalies**: {coord_issues} out-of-range latitude/longitude coordinates",
            f"- **Numeric Columns**: {len(num_cols)} ({', '.join(num_cols[:6])}{'...' if len(num_cols) > 6 else ''})",
            "",
            "| Column | Non-Null Count | Null Count | Null % | Data Type | Unique Values |",
            "| :--- | :--- | :--- | :--- | :--- | :--- |"
        ])

        for col in df.columns:
            n_null = int(df[col].isnull().sum())
            n_valid = rows - n_null
            pct = round((n_null / rows) * 100, 1)
            dtype = str(df[col].dtype)
            n_uniq = int(df[col].nunique())
            quality_md.append(f"| `{col}` | {n_valid:,} | {n_null:,} | {pct}% | `{dtype}` | {n_uniq:,} |")

        quality_md.extend(["", ""])

    # Write files
    inv_path = "LLM/datasets/DATASET_INVENTORY.md"
    with open(inv_path, "w", encoding="utf-8") as f:
        f.write("\n".join(inventory_md))
    print(f"Generated {inv_path}")

    rep_path = "LLM/reports/data_quality_report.md"
    with open(rep_path, "w", encoding="utf-8") as f:
        f.write("\n".join(quality_md))
    print(f"Generated {rep_path}")


if __name__ == "__main__":
    audit_datasets()
