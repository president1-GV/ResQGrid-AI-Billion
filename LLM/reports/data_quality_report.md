# RESQGRID AI — DATA QUALITY & PROVENANCE AUDIT REPORT

> **Generated**: 2026-09-17 04:45:42 UTC
> **Audit Engine**: ResQGrid LLM Preprocessing Quality Validator

---

### Dataset Audit: India Flood Inventory (IFI v3.0) (`india_flood_inventory_v3`)
- **File**: `LLM/raw/India_Flood_Inventory_v3.csv` | **Size**: 1,801,579 bytes
- **Total Rows**: 6,876 | **Total Columns**: 23
- **Null Percentage**: 44.69% (70,680 missing cells)
- **Duplicate Rows**: 0 (0.0%)
- **Coordinate Anomalies**: 0 out-of-range latitude/longitude coordinates
- **Numeric Columns**: 10 (Unnamed: 0, Duration(Days), Location, Latitude, Longitude, Severity...)

| Column | Non-Null Count | Null Count | Null % | Data Type | Unique Values |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `Unnamed: 0` | 6,876 | 0 | 0.0% | `int64` | 6,876 |
| `UEI` | 6,876 | 0 | 0.0% | `str` | 6,876 |
| `Start Date` | 6,856 | 20 | 0.3% | `str` | 3,684 |
| `End Date` | 6,856 | 20 | 0.3% | `str` | 3,692 |
| `Duration(Days)` | 6,857 | 19 | 0.3% | `float64` | 61 |
| `Main Cause` | 6,845 | 31 | 0.5% | `str` | 579 |
| `Location` | 0 | 6,876 | 100.0% | `float64` | 0 |
| `Districts` | 6,817 | 59 | 0.9% | `str` | 2,892 |
| `State` | 6,876 | 0 | 0.0% | `str` | 82 |
| `Latitude` | 0 | 6,876 | 100.0% | `float64` | 0 |
| `Longitude` | 0 | 6,876 | 100.0% | `float64` | 0 |
| `Severity` | 0 | 6,876 | 100.0% | `float64` | 0 |
| `Area Affected` | 0 | 6,876 | 100.0% | `float64` | 0 |
| `Human fatality` | 3,770 | 3,106 | 45.2% | `float64` | 183 |
| `Human injured` | 1,058 | 5,818 | 84.6% | `float64` | 62 |
| `Human Displaced` | 122 | 6,754 | 98.2% | `str` | 23 |
| `Animal Fatality` | 571 | 6,305 | 91.7% | `str` | 247 |
| `Description of Casualties/injured` | 3,267 | 3,609 | 52.5% | `str` | 2,487 |
| `Extent of damage ` | 3,755 | 3,121 | 45.4% | `str` | 3,612 |
| `Event Source` | 6,876 | 0 | 0.0% | `str` | 1 |
| `Event Souce ID` | 0 | 6,876 | 100.0% | `float64` | 0 |
| `District_LGD_Codes` | 6,572 | 304 | 4.4% | `str` | 2,482 |
| `State_Codes` | 6,618 | 258 | 3.8% | `str` | 65 |


### Dataset Audit: District-level Satellite Flooded Area (IFI v3.0) (`district_flooded_area`)
- **File**: `LLM/raw/District_FloodedArea.csv` | **Size**: 32,567 bytes
- **Total Rows**: 732 | **Total Columns**: 4
- **Null Percentage**: 0.0% (0 missing cells)
- **Duplicate Rows**: 0 (0.0%)
- **Coordinate Anomalies**: 0 out-of-range latitude/longitude coordinates
- **Numeric Columns**: 3 (Percent_Flooded_Area, Parmanent_Water, Corrected_Percent_Flooded_Area)

| Column | Non-Null Count | Null Count | Null % | Data Type | Unique Values |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `Dist_Name` | 732 | 0 | 0.0% | `str` | 726 |
| `Percent_Flooded_Area` | 732 | 0 | 0.0% | `float64` | 730 |
| `Parmanent_Water` | 732 | 0 | 0.0% | `float64` | 673 |
| `Corrected_Percent_Flooded_Area` | 732 | 0 | 0.0% | `float64` | 730 |


### Dataset Audit: District Flood Impact & Vulnerability (IFI v3.0) (`district_flood_impact`)
- **File**: `LLM/raw/District_FloodImpact.csv` | **Size**: 19,122 bytes
- **Total Rows**: 732 | **Total Columns**: 5
- **Null Percentage**: 0.3% (11 missing cells)
- **Duplicate Rows**: 0 (0.0%)
- **Coordinate Anomalies**: 0 out-of-range latitude/longitude coordinates
- **Numeric Columns**: 4 (Human_fatality, Human_injured, Population, Mean_Flood_Duration)

| Column | Non-Null Count | Null Count | Null % | Data Type | Unique Values |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `Dist_Name` | 732 | 0 | 0.0% | `str` | 726 |
| `Human_fatality` | 732 | 0 | 0.0% | `int64` | 234 |
| `Human_injured` | 732 | 0 | 0.0% | `int64` | 85 |
| `Population` | 732 | 0 | 0.0% | `int64` | 732 |
| `Mean_Flood_Duration` | 721 | 11 | 1.5% | `float64` | 35 |


### Dataset Audit: EM-DAT India Disaster Profiles (Train) (`emdat_india_train`)
- **File**: `LLM/raw/emdat_india_train.parquet` | **Size**: 10,438 bytes
- **Total Rows**: 145 | **Total Columns**: 15
- **Null Percentage**: 11.45% (249 missing cells)
- **Duplicate Rows**: 0 (0.0%)
- **Coordinate Anomalies**: 0 out-of-range latitude/longitude coordinates
- **Numeric Columns**: 7 (year, total_events, total_affected, total_deaths, total_damage_usd_original, total_damage_usd_adjusted...)

| Column | Non-Null Count | Null Count | Null % | Data Type | Unique Values |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `year` | 144 | 1 | 0.7% | `float64` | 26 |
| `country` | 145 | 0 | 0.0% | `str` | 2 |
| `iso` | 145 | 0 | 0.0% | `str` | 2 |
| `disaster_group` | 145 | 0 | 0.0% | `str` | 2 |
| `disaster_subroup` | 145 | 0 | 0.0% | `str` | 5 |
| `disaster_type` | 145 | 0 | 0.0% | `str` | 10 |
| `disaster_subtype` | 145 | 0 | 0.0% | `str` | 24 |
| `total_events` | 144 | 1 | 0.7% | `float64` | 10 |
| `total_affected` | 100 | 45 | 31.0% | `float64` | 95 |
| `total_deaths` | 138 | 7 | 4.8% | `float64` | 106 |
| `total_damage_usd_original` | 53 | 92 | 63.4% | `float64` | 51 |
| `total_damage_usd_adjusted` | 50 | 95 | 65.5% | `float64` | 50 |
| `cpi` | 137 | 8 | 5.5% | `float64` | 27 |
| `esa_source` | 145 | 0 | 0.0% | `str` | 1 |
| `esa_processed` | 145 | 0 | 0.0% | `str` | 1 |


### Dataset Audit: EM-DAT India Disaster Profiles (Test) (`emdat_india_test`)
- **File**: `LLM/raw/emdat_india_test.parquet` | **Size**: 8,106 bytes
- **Total Rows**: 37 | **Total Columns**: 15
- **Null Percentage**: 8.65% (48 missing cells)
- **Duplicate Rows**: 0 (0.0%)
- **Coordinate Anomalies**: 0 out-of-range latitude/longitude coordinates
- **Numeric Columns**: 7 (year, total_events, total_affected, total_deaths, total_damage_usd_original, total_damage_usd_adjusted...)

| Column | Non-Null Count | Null Count | Null % | Data Type | Unique Values |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `year` | 37 | 0 | 0.0% | `float64` | 19 |
| `country` | 37 | 0 | 0.0% | `str` | 1 |
| `iso` | 37 | 0 | 0.0% | `str` | 1 |
| `disaster_group` | 37 | 0 | 0.0% | `str` | 1 |
| `disaster_subroup` | 37 | 0 | 0.0% | `str` | 4 |
| `disaster_type` | 37 | 0 | 0.0% | `str` | 7 |
| `disaster_subtype` | 37 | 0 | 0.0% | `str` | 16 |
| `total_events` | 37 | 0 | 0.0% | `float64` | 6 |
| `total_affected` | 29 | 8 | 21.6% | `float64` | 28 |
| `total_deaths` | 35 | 2 | 5.4% | `float64` | 35 |
| `total_damage_usd_original` | 18 | 19 | 51.4% | `float64` | 18 |
| `total_damage_usd_adjusted` | 18 | 19 | 51.4% | `float64` | 18 |
| `cpi` | 37 | 0 | 0.0% | `float64` | 19 |
| `esa_source` | 37 | 0 | 0.0% | `str` | 1 |
| `esa_processed` | 37 | 0 | 0.0% | `str` | 1 |

