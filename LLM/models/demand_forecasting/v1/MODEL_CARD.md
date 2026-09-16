# MODEL CARD — resqgrid-demand-forecaster (v1.0.0)

## Model Details
- **Developer**: ResQGrid AI Intelligence Core
- **Task**: Multi-Commodity Disaster Resource Demand & Logistics Sizing
- **Architecture**: Multi-Output Gradient Boosting Regressor (120 Estimators, Depth 5)
- **Framework**: Scikit-Learn 1.9+, NumPy 2.5+
- **License**: Permissive Open Research
- **Release Date**: 2026-09-17

## Intended Use
- **Primary Use**: Forecasting localized humanitarian demand for potable water, rations, emergency medical kits, rescue boats, and ambulances during flood emergencies.
- **Intended Users**: Authorized Disaster Incident Commanders, Logistics Chiefs, and Field Officers.
- **Out-of-Scope Use**: Non-disaster commercial supply chain logistics; automated decision execution without Human-in-the-Loop review.

## Training Data & Provenance
- **Dataset**: India Flood Inventory (IFI v3.0, Zenodo DOI: 10.5281/zenodo.13636502) cross-joined with District Flooded Area and Demographic Impact baselines.
- **Training Records**: 6,307 events (1967–2017)
- **Validation Records**: 213 events (2018–2020)
- **Test Records**: 794 events (2021–2023)
- **Leakage Safeguards**: Strict temporal partitioning. No future information is accessible during training.

## Quantitative Metrics (Held-Out Test Split)
- **Overall Test R²**: 0.3467
- **Water Liters Test MAE**: 1,346.58
- **Medical Kits Test MAE**: 1.01
- **Ambulances Test MAE**: 0.07

## Uncertainty Handling
- Prediction intervals calculated via empirical 10th–90th percentile residual quantile bounds.
- Calibrated confidence metric computed per zone.

## Known Limitations
- Model performance depends on district population and severity inputs.
- Highly abnormal compound multi-hazard events (e.g. earthquake-triggered dam breaks) should be treated with conservative manual commander review.
