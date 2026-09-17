# RESQGRID AI — MODEL EVALUATION REPORT

> **Model**: `resqgrid-demand-forecaster` | **Version**: `v1.0.0`
> **Evaluated At**: 2026-09-17T11:55:52.959983Z
> **Validation Strategy**: Strict Chronological Temporal Holdout (Test: 2021-2023)

---

## 1. Overall Performance Comparison

| Model | Architecture | Validation R² | Held-Out Test R² | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Baseline** | MultiOutput Ridge Regression | 0.4823 | -65.66 | Reference Baseline |
| **Advanced** | MultiOutput Gradient Boosting | 0.6788 | 0.3467 | **Selected / Validated** |

---

## 2. Per-Commodity Held-Out Test Metrics

| Commodity Target | Baseline Test MAE | Advanced Test MAE | Baseline Test R² | Advanced Test R² | Lift |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `demand_water_liters` | 24,429.3 | 1,346.6 | -165.4579 | 0.7003 | **+94.5%** |
| `demand_food_packs` | 3,247.0 | 193.1 | -163.8217 | 0.6901 | **+94.1%** |
| `demand_medical_kits` | 6.0 | 1.0 | 0.3801 | 0.9012 | **+83.1%** |
| `demand_rescue_boats` | 0.4 | 0.0 | 0.9218 | 0.9990 | **+100.0%** |
| `demand_ambulances` | 0.1 | 0.1 | -0.3223 | -1.5569 | **+12.5%** |

---

## 3. Top Feature Importances (Gradient Boosting)

| Target Commodity | Most Influential Feature | Feature Weight | Second Feature | Weight |
| :--- | :--- | :--- | :--- | :--- |
| `demand_water_liters` | `district_flooded_area_pct` | 0.486 | `duration_days` | 0.370 |
| `demand_food_packs` | `district_flooded_area_pct` | 0.486 | `duration_days` | 0.370 |
| `demand_medical_kits` | `district_flooded_area_pct` | 0.750 | `district_population` | 0.229 |
| `demand_rescue_boats` | `district_flooded_area_pct` | 1.000 | `duration_days` | 0.000 |
| `demand_ambulances` | `district_population` | 0.326 | `district_flooded_area_pct` | 0.232 |