# RESQGRID AI — MODEL REGISTRY

| Model Name | Version | Task | Architecture | Train Records | Test R² | Status | Artifact Path |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `resqgrid-demand-forecaster` | `v1.0.0` | Multi-Target Demand Forecasting | MultiOutput Gradient Boosting | 6,307 | 0.3467 | **VALIDATED** | `LLM/models/demand_forecasting/v1` |
| `resqgrid-demand-forecaster-baseline` | `v1.0.0` | Linear Demand Baseline | MultiOutput Ridge Regression | 6,307 | -65.66 | **EXPERIMENTAL** | `LLM/models/demand_forecasting/v1/baseline_model.pkl` |

### Active Production Deployment
- **Active Model**: `resqgrid-demand-forecaster (v1.0.0)`
- **Inference Engine**: `LLM/inference/predictor.py`
- **Uncertainty Calibration**: Active (Empirical P10–P90 Quantile Bounds)
- **Optimization Bridge**: Connected to Google OR-Tools MIP Hard Constraints
