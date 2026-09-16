# RESQGRID AI — DATASET INVENTORY

> **Notice**: All dataset metrics in this inventory are calculated programmatically from local files.
> **Generated**: 2026-09-17 04:45:42 UTC

---

## India Flood Inventory (IFI v3.0)
- **Dataset ID**: `india_flood_inventory_v3`
- **Source**: HydroSense Lab, IIT Delhi (Saharia et al.)
- **Source URL**: [https://github.com/hydrosenselab/India-Flood-Inventory](https://github.com/hydrosenselab/India-Flood-Inventory)
- **Local Path**: `LLM/raw/India_Flood_Inventory_v3.csv`
- **Dataset Type**: Tabular Geospatial Historical Flood Events
- **Format**: CSV
- **File Size**: 1,801,579 bytes
- **SHA-256 Hash**: `ef9ab2cd0db7bf917dcc22c7cb094ec599f5013ef1b96ba525d816f26ff1b108`
- **Number of Records**: 6,876
- **Number of Features**: 23
- **Features**: `Unnamed: 0`, `UEI`, `Start Date`, `End Date`, `Duration(Days)`, `Main Cause`, `Location`, `Districts`, `State`, `Latitude`, `Longitude`, `Severity`...
- **Geographic Coverage**: National (All Indian States & UTs)
- **Temporal Coverage**: 1967 - 2023
- **License Classification**: **`RESEARCH/ACADEMIC`**
- **License**: Open Academic Research Data (Zenodo DOI: 10.5281/zenodo.13636502)
- **Citation**: Saharia, M. et al., India Flood Inventory (1967-2023), Zenodo, 2024.
- **Potential Use**: Flood severity classification, impact duration, and casualties prediction
- **Data Quality**: 55.3% Complete
- **Missing Values (Cells)**: 70,680 (44.69%)
- **Duplicate Records**: 0 (0.0%)
- **Known Limitations**: Historical data density increases post-1990; sparse casualties reported in early records.
- **Training Suitability**: HIGH - Multi-decadal ground-truth national historical flood catalog

---

## District-level Satellite Flooded Area (IFI v3.0)
- **Dataset ID**: `district_flooded_area`
- **Source**: HydroSense Lab, IIT Delhi (Saharia et al.)
- **Source URL**: [https://github.com/hydrosenselab/India-Flood-Inventory](https://github.com/hydrosenselab/India-Flood-Inventory)
- **Local Path**: `LLM/raw/District_FloodedArea.csv`
- **Dataset Type**: Tabular Satellite Earth Observation Aggregates
- **Format**: CSV
- **File Size**: 32,567 bytes
- **SHA-256 Hash**: `738d5edf8a29c70de520b3b7b8e148eb7eed2ce89bbd9f0ecacd3cbc17b07610`
- **Number of Records**: 732
- **Number of Features**: 4
- **Features**: `Dist_Name`, `Percent_Flooded_Area`, `Parmanent_Water`, `Corrected_Percent_Flooded_Area`
- **Geographic Coverage**: 732 Indian Districts
- **Temporal Coverage**: Historical Aggregate
- **License Classification**: **`RESEARCH/ACADEMIC`**
- **License**: Open Academic Research Data (Zenodo DOI: 10.5281/zenodo.13636502)
- **Citation**: Saharia, M. et al., India Flood Inventory (1967-2023), Zenodo, 2024.
- **Potential Use**: District inundation exposure & geographic risk modeling
- **Data Quality**: 100.0% Complete
- **Missing Values (Cells)**: 0 (0.0%)
- **Duplicate Records**: 0 (0.0%)
- **Known Limitations**: Historical data density increases post-1990; sparse casualties reported in early records.
- **Training Suitability**: HIGH - Standardized district-level geographic flood extent

---

## District Flood Impact & Vulnerability (IFI v3.0)
- **Dataset ID**: `district_flood_impact`
- **Source**: HydroSense Lab, IIT Delhi (Saharia et al.)
- **Source URL**: [https://github.com/hydrosenselab/India-Flood-Inventory](https://github.com/hydrosenselab/India-Flood-Inventory)
- **Local Path**: `LLM/raw/District_FloodImpact.csv`
- **Dataset Type**: Tabular Demographic Impact & Duration
- **Format**: CSV
- **File Size**: 19,122 bytes
- **SHA-256 Hash**: `0cc7381e8153cdd34e287540e64947e4cd2e5ff46d2461581e7b6c041b3655fb`
- **Number of Records**: 732
- **Number of Features**: 5
- **Features**: `Dist_Name`, `Human_fatality`, `Human_injured`, `Population`, `Mean_Flood_Duration`
- **Geographic Coverage**: 732 Indian Districts
- **Temporal Coverage**: Historical Aggregate
- **License Classification**: **`RESEARCH/ACADEMIC`**
- **License**: Open Academic Research Data (Zenodo DOI: 10.5281/zenodo.13636502)
- **Citation**: Saharia, M. et al., India Flood Inventory (1967-2023), Zenodo, 2024.
- **Potential Use**: Baseline district casualty, injury, and duration rate estimation
- **Data Quality**: 99.7% Complete
- **Missing Values (Cells)**: 11 (0.3%)
- **Duplicate Records**: 0 (0.0%)
- **Known Limitations**: Historical data density increases post-1990; sparse casualties reported in early records.
- **Training Suitability**: HIGH - Directly links district population to historical flood impacts

---

## EM-DAT India Disaster Profiles (Train)
- **Dataset ID**: `emdat_india_train`
- **Source**: CRED / HDX (Humanitarian Data Exchange)
- **Source URL**: [https://huggingface.co/datasets/electricsheepasia/asia-population-emdat-country-profiles-india](https://huggingface.co/datasets/electricsheepasia/asia-population-emdat-country-profiles-india)
- **Local Path**: `LLM/raw/emdat_india_train.parquet`
- **Dataset Type**: Macro Disaster Impact Time-Series
- **Format**: Parquet
- **File Size**: 10,438 bytes
- **SHA-256 Hash**: `126cd92b785227acb86eaeb20f7fc3a0bdf65d3d5bff773ddd76cc021253d736`
- **Number of Records**: 145
- **Number of Features**: 15
- **Features**: `year`, `country`, `iso`, `disaster_group`, `disaster_subroup`, `disaster_type`, `disaster_subtype`, `total_events`, `total_affected`, `total_deaths`, `total_damage_usd_original`, `total_damage_usd_adjusted`...
- **Geographic Coverage**: India National
- **Temporal Coverage**: 1900 - 2024
- **License Classification**: **`PERMISSIVE`**
- **License**: CC-BY-4.0 (Humanitarian Data Exchange)
- **Citation**: CRED EM-DAT, Disaster Country Profiles: India, HDX/ElectricSheep, 2024.
- **Potential Use**: Macro-level multi-disaster economic and humanitarian impact modeling
- **Data Quality**: 88.5% Complete
- **Missing Values (Cells)**: 249 (11.45%)
- **Duplicate Records**: 0 (0.0%)
- **Known Limitations**: Historical data density increases post-1990; sparse casualties reported in early records.
- **Training Suitability**: HIGH - Validated international humanitarian dataset

---

## EM-DAT India Disaster Profiles (Test)
- **Dataset ID**: `emdat_india_test`
- **Source**: CRED / HDX (Humanitarian Data Exchange)
- **Source URL**: [https://huggingface.co/datasets/electricsheepasia/asia-population-emdat-country-profiles-india](https://huggingface.co/datasets/electricsheepasia/asia-population-emdat-country-profiles-india)
- **Local Path**: `LLM/raw/emdat_india_test.parquet`
- **Dataset Type**: Macro Disaster Impact Time-Series (Holdout)
- **Format**: Parquet
- **File Size**: 8,106 bytes
- **SHA-256 Hash**: `c7ec8c9fe492c1fa47d57f89edf89b6b345073ddf6550ee0cfb37db9dadcfbbd`
- **Number of Records**: 37
- **Number of Features**: 15
- **Features**: `year`, `country`, `iso`, `disaster_group`, `disaster_subroup`, `disaster_type`, `disaster_subtype`, `total_events`, `total_affected`, `total_deaths`, `total_damage_usd_original`, `total_damage_usd_adjusted`...
- **Geographic Coverage**: India National
- **Temporal Coverage**: Recent Historical
- **License Classification**: **`PERMISSIVE`**
- **License**: CC-BY-4.0 (Humanitarian Data Exchange)
- **Citation**: CRED EM-DAT, Disaster Country Profiles: India, HDX/ElectricSheep, 2024.
- **Potential Use**: Out-of-sample macro validation for cross-disaster trends
- **Data Quality**: 91.3% Complete
- **Missing Values (Cells)**: 48 (8.65%)
- **Duplicate Records**: 0 (0.0%)
- **Known Limitations**: Historical data density increases post-1990; sparse casualties reported in early records.
- **Training Suitability**: HIGH - Official held-out test split

---
