# ResQGrid AI Billion: Dataset Intelligence & Open Data Catalog

This directory documents the data architecture, supported open disaster databases, ingestion pipelines, quality assurance methodology, LLM extraction schemas, and ML model training procedures.

---

## 1. Supported Open Datasets & National Registries

ResQGrid integrates 7 real-world open disaster datasets and authoritative national government registries:

| Dataset ID | Name | Source / Provider | Format | Coverage | Records | Provenance |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `india_flood_inventory` | **India Flood Inventory (IFI v3.0)** | HydroSense Lab, IIT Delhi (Saharia et al.) / Zenodo | CSV | All 28 States & UTs (1967–2023) | 6,876+ | Open Research Data (Zenodo DOI: 10.5281/zenodo.13636502) |
| `emdat_india` | **EM-DAT India Historical Profiles** | CRED / HDX / HuggingFace | Parquet | India Subnational (1900–Present) | 182 | CC-BY-4.0 / Open Data |
| `imd_rainfall_daily` | **IMD Daily Rainfall Telemetry** | Indian Meteorological Department / NWIC | REST / JSON | National 0.25° Gridded | 3,640 | Official Government Portal API |
| `open_meteo_live` | **High-Res Live Precipitation** | Open-Meteo Weather Service | REST / JSON | Live Indian Coordinates (Lat 6°–38°N) | Continuous | Open Access Public API |
| `osm_nominatim_roads` | **OSM Geometries & Road Network** | OpenStreetMap Foundation | GeoJSON | National Highway & Municipal Grid | 5,210 | Open Database License (ODbL) |
| `isro_bhuvan_disaster` | **Bhuvan Satellite Inundation** | National Remote Sensing Centre (NRSC / ISRO) | WMS / GeoJSON | Major River Basins | 780 | National Space Agency Open Service |
| `idrn_resource_network` | **India Disaster Resource Network** | NIDM / Ministry of Home Affairs | REST / CSV | District Logistics Stockpiles | 14,200 | MHA Emergency Management Registry |

---

## 2. Directory Layout & Local Data Storage

Raw, staged, processed, feature, and model artifact directories are structured locally under `data/`:

```
data/
├── raw/
│   ├── india_flood_inventory/
│   │   ├── India_Flood_Inventory_v3.csv    # 1.8 MB primary flood inventory (1967-2023)
│   │   ├── District_FloodImpact.csv        # District casualties and affected numbers
│   │   └── District_FloodedArea.csv        # Satellite observed inundation extents
│   ├── emdat_india/
│   │   ├── train-00000-of-00001.parquet    # CRED EM-DAT training split
│   │   └── test-00000-of-00001.parquet     # Evaluation holdout split
│   └── weather/
│       └── imd_telemetry.json              # Gridded weather observations
├── staging/                                # Temporary staging during ETL validation
├── processed/                              # Cleaned canonical records
├── features/                               # Versioned multi-domain feature vectors
├── models/
│   └── demand_model_v1.joblib              # Trained Gradient Boosting model artifact bundle
└── synthetic/                              # Clearly tagged synthetic simulation benchmarks
```

---

## 3. Data Quality Engine Methodology

Every dataset ingestion passes through `DataQualityEngine` which evaluates:

- **Completeness**: Ratio of non-null and non-empty values across mandatory schema attributes.
- **Uniqueness**: Composite row deduplication ($100 - \text{Duplicate Rate} \times 100$).
- **Validity**: Strict coordinate checks ($-90 \le \text{lat} \le 90$, $-180 \le \text{lon} \le 180$) and non-negative humanitarian quantities.
- **Geospatial Bounds**: Validates coordinates fall within Indian sovereign regional bounds ($6^\circ\text{N} \le \text{lat} \le 38^\circ\text{N}$, $68^\circ\text{E} \le \text{lon} \le 98^\circ\text{E}$).
- **Overall Score**: Weighted composite metric $(0\text{ to }100)$ with audited issue logs.

---

## 4. LLM & NLP Extraction with Hallucination Protection

The system enforces strict architectural boundaries:

1. **LLM Extraction Role**:
   - The LLM receives unstructured field text (e.g. from radio, field dispatches, SMS) and extracts structured events conforming to `LLMExtractionOutput`.
   - **Critical Guard**: If an attribute (population, coordinates, medical patient count, road status) is missing, the LLM sets the field to `null` with explanation `"Not provided in source"`.
   - **Confidence Scoring**: Each field has a confidence score. If overall confidence $< 0.70$ or ambiguities exist, the report is flagged for Human Review.
2. **Optimizer Boundary**:
   - **The LLM NEVER directly decides resource allocation.**
   - Extracted features pass through validation, the feature store, and the trained ML demand model into the Google OR-Tools MIP solver.

---

## 5. Machine Learning Demand Prediction & Training

- **Model**: Scikit-Learn `GradientBoostingRegressor` (with Ridge regression baseline).
- **Training Data**: Real flood records from `India_Flood_Inventory_v3.csv` and EM-DAT India.
- **Features**: `rainfall_mm`, `flooded_area_sqkm`, `population`, `vulnerability`, `duration_days`, `accessible_roads_ratio`.
- **Target Outputs**: Multi-commodity demands (`water`, `food`, `medical_kits`, `shelter_kits`, `ambulances`).
- **Uncertainty**: Calculates Bayesian 90% confidence intervals (`lower_bound`, `estimate`, `upper_bound`).
- **Re-training Trigger**: Accessible via UI button in Field Report Analyzer or `POST /api/models/train`.
