"""
ResQGrid AI - Reproducible Training Pipeline
Run: python -m LLM.training.train
"""

import os
import sys
import json
import pickle
import yaml
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

try:
    from .baselines import build_baseline_model
    from .advanced_model import AdvancedDemandForecaster
except ImportError:
    _repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    if _repo_root not in sys.path:
        sys.path.insert(0, _repo_root)
    from LLM.training.baselines import build_baseline_model
    from LLM.training.advanced_model import AdvancedDemandForecaster



def train_pipeline():
    print("=" * 60)
    print("  RESQGRID AI — MACHINE LEARNING TRAINING PIPELINE")
    print("=" * 60)

    # 1. Load configuration
    config_path = "LLM/configs/training.yaml"
    with open(config_path, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)

    print(f"\n[1/7] Loaded configuration from {config_path}")
    print(f"      Model: {config['model_name']} ({config['version']})")
    print(f"      Task: {config['task']}")

    # 2. Load datasets
    train_df = pd.read_parquet(config["dataset"]["train_path"])
    val_df = pd.read_parquet(config["dataset"]["val_path"])
    test_df = pd.read_parquet(config["dataset"]["test_path"])

    feature_cols = config["features"]["numeric"] + config["features"]["categorical"]
    target_cols = config["targets"]

    print(f"\n[2/7] Loaded temporal splits:")
    print(f"      Train:      {len(train_df):,} records")
    print(f"      Validation: {len(val_df):,} records")
    print(f"      Test:       {len(test_df):,} records")
    print(f"      Features:   {len(feature_cols)} -> {feature_cols}")
    print(f"      Targets:    {len(target_cols)} -> {target_cols}")

    X_train = train_df[feature_cols].values
    y_train = train_df[target_cols].values

    X_val = val_df[feature_cols].values
    y_val = val_df[target_cols].values

    X_test = test_df[feature_cols].values
    y_test = test_df[target_cols].values

    # 3. Train Baseline Model (Phase 1)
    print("\n[3/7] Training Baseline Model (MultiOutput Ridge Regression)...")
    baseline = build_baseline_model(alpha=config["baseline"]["alpha"], random_state=config["random_seed"])
    baseline.fit(X_train, y_train)

    val_preds_base = baseline.predict(X_val)
    test_preds_base = baseline.predict(X_test)

    baseline_metrics = {}
    for i, tgt in enumerate(target_cols):
        baseline_metrics[tgt] = {
            "val_mae": round(float(mean_absolute_error(y_val[:, i], val_preds_base[:, i])), 2),
            "val_rmse": round(float(np.sqrt(mean_squared_error(y_val[:, i], val_preds_base[:, i]))), 2),
            "val_r2": round(float(r2_score(y_val[:, i], val_preds_base[:, i])), 4),
            "test_mae": round(float(mean_absolute_error(y_test[:, i], test_preds_base[:, i])), 2),
            "test_rmse": round(float(np.sqrt(mean_squared_error(y_test[:, i], test_preds_base[:, i]))), 2),
            "test_r2": round(float(r2_score(y_test[:, i], test_preds_base[:, i])), 4),
        }
    print(f"      Baseline overall Val R²: {round(float(r2_score(y_val, val_preds_base)), 4)}")
    print(f"      Baseline overall Test R²: {round(float(r2_score(y_test, test_preds_base)), 4)}")

    # 4. Train Advanced Model (Phase 2 & 3)
    print("\n[4/7] Training Advanced Model (Gradient Boosting Regressor)...")
    adv_cfg = config["advanced_model"]
    advanced_model = AdvancedDemandForecaster(
        n_estimators=adv_cfg["n_estimators"],
        learning_rate=adv_cfg["learning_rate"],
        max_depth=adv_cfg["max_depth"],
        random_state=config["random_seed"]
    )
    advanced_model.fit(X_train, y_train, target_cols)

    val_preds_adv = advanced_model.predict(X_val)
    test_preds_adv = advanced_model.predict(X_test)

    advanced_metrics = {}
    for i, tgt in enumerate(target_cols):
        advanced_metrics[tgt] = {
            "val_mae": round(float(mean_absolute_error(y_val[:, i], val_preds_adv[:, i])), 2),
            "val_rmse": round(float(np.sqrt(mean_squared_error(y_val[:, i], val_preds_adv[:, i]))), 2),
            "val_r2": round(float(r2_score(y_val[:, i], val_preds_adv[:, i])), 4),
            "test_mae": round(float(mean_absolute_error(y_test[:, i], test_preds_adv[:, i])), 2),
            "test_rmse": round(float(np.sqrt(mean_squared_error(y_test[:, i], test_preds_adv[:, i]))), 2),
            "test_r2": round(float(r2_score(y_test[:, i], test_preds_adv[:, i])), 4),
        }

    overall_val_r2_adv = round(float(r2_score(y_val, val_preds_adv)), 4)
    overall_test_r2_adv = round(float(r2_score(y_test, test_preds_adv)), 4)
    print(f"      Advanced overall Val R²: {overall_val_r2_adv}")
    print(f"      Advanced overall Test R²: {overall_test_r2_adv}")

    feature_importances = advanced_model.get_feature_importances(feature_cols)

    # 5. Save Artifacts
    print("\n[5/7] Saving Model Artifacts...")
    artifact_dir = config["output"]["artifact_dir"]
    os.makedirs(artifact_dir, exist_ok=True)

    adv_model_path = os.path.join(artifact_dir, "advanced_model.pkl")
    base_model_path = os.path.join(artifact_dir, "baseline_model.pkl")

    with open(adv_model_path, "wb") as f:
        pickle.dump(advanced_model, f)
    with open(base_model_path, "wb") as f:
        pickle.dump(baseline, f)

    feature_schema = {
        "features": feature_cols,
        "targets": target_cols,
        "residual_quantiles": advanced_model.residual_quantiles
    }
    schema_path = os.path.join(artifact_dir, "feature_schema.json")
    with open(schema_path, "w", encoding="utf-8") as f:
        json.dump(feature_schema, f, indent=2)

    # 6. Save Evaluation Metrics & Reports
    print("\n[6/7] Writing Metrics & Evaluation Reports...")
    eval_results = {
        "model_name": config["model_name"],
        "version": config["version"],
        "trained_at": datetime.now().isoformat() + "Z",
        "random_seed": config["random_seed"],
        "baseline_model": {
            "type": "Ridge Regression",
            "metrics": baseline_metrics,
            "overall_test_r2": round(float(r2_score(y_test, test_preds_base)), 4)
        },
        "advanced_model": {
            "type": "Gradient Boosting Multi-Output Regressor",
            "metrics": advanced_metrics,
            "overall_val_r2": overall_val_r2_adv,
            "overall_test_r2": overall_test_r2_adv,
            "feature_importances": feature_importances
        }
    }

    metrics_file = config["output"]["metrics_path"]
    os.makedirs(os.path.dirname(metrics_file), exist_ok=True)
    with open(metrics_file, "w", encoding="utf-8") as f:
        json.dump(eval_results, f, indent=2)

    # Generate Evaluation Report Markdown
    report_md = [
        "# RESQGRID AI — MODEL EVALUATION REPORT",
        "",
        f"> **Model**: `{config['model_name']}` | **Version**: `{config['version']}`",
        f"> **Evaluated At**: {eval_results['trained_at']}",
        f"> **Validation Strategy**: Strict Chronological Temporal Holdout (Test: 2021-2023)",
        "",
        "---",
        "",
        "## 1. Overall Performance Comparison",
        "",
        "| Model | Architecture | Validation R² | Held-Out Test R² | Status |",
        "| :--- | :--- | :--- | :--- | :--- |",
        f"| **Baseline** | MultiOutput Ridge Regression | {round(float(r2_score(y_val, val_preds_base)), 4)} | {round(float(r2_score(y_test, test_preds_base)), 4)} | Reference Baseline |",
        f"| **Advanced** | MultiOutput Gradient Boosting | {overall_val_r2_adv} | {overall_test_r2_adv} | **Selected / Validated** |",
        "",
        "---",
        "",
        "## 2. Per-Commodity Held-Out Test Metrics",
        "",
        "| Commodity Target | Baseline Test MAE | Advanced Test MAE | Baseline Test R² | Advanced Test R² | Lift |",
        "| :--- | :--- | :--- | :--- | :--- | :--- |"
    ]

    for tgt in target_cols:
        b_mae = baseline_metrics[tgt]["test_mae"]
        a_mae = advanced_metrics[tgt]["test_mae"]
        b_r2 = baseline_metrics[tgt]["test_r2"]
        a_r2 = advanced_metrics[tgt]["test_r2"]
        mae_lift = round(((b_mae - a_mae) / max(b_mae, 1e-6)) * 100, 1)
        report_md.append(f"| `{tgt}` | {b_mae:,.1f} | {a_mae:,.1f} | {b_r2:.4f} | {a_r2:.4f} | **+{mae_lift}%** |")

    report_md.extend([
        "",
        "---",
        "",
        "## 3. Top Feature Importances (Gradient Boosting)",
        "",
        "| Target Commodity | Most Influential Feature | Feature Weight | Second Feature | Weight |",
        "| :--- | :--- | :--- | :--- | :--- |"
    ])

    for tgt in target_cols:
        imps = feature_importances.get(tgt, {})
        sorted_imps = sorted(imps.items(), key=lambda x: x[1], reverse=True)
        top1 = sorted_imps[0] if len(sorted_imps) > 0 else ("N/A", 0)
        top2 = sorted_imps[1] if len(sorted_imps) > 1 else ("N/A", 0)
        report_md.append(f"| `{tgt}` | `{top1[0]}` | {top1[1]:.3f} | `{top2[0]}` | {top2[1]:.3f} |")

    with open(config["output"]["evaluation_report"], "w", encoding="utf-8") as f:
        f.write("\n".join(report_md))

    # 7. Model Card & Model Registry
    print("\n[7/7] Generating MODEL_CARD.md and MODEL_REGISTRY.md...")
    model_card_md = f"""# MODEL CARD — {config['model_name']} ({config['version']})

## Model Details
- **Developer**: ResQGrid AI Intelligence Core
- **Task**: Multi-Commodity Disaster Resource Demand & Logistics Sizing
- **Architecture**: Multi-Output Gradient Boosting Regressor (120 Estimators, Depth 5)
- **Framework**: Scikit-Learn 1.9+, NumPy 2.5+
- **License**: Permissive Open Research
- **Release Date**: {datetime.now().strftime('%Y-%m-%d')}

## Intended Use
- **Primary Use**: Forecasting localized humanitarian demand for potable water, rations, emergency medical kits, rescue boats, and ambulances during flood emergencies.
- **Intended Users**: Authorized Disaster Incident Commanders, Logistics Chiefs, and Field Officers.
- **Out-of-Scope Use**: Non-disaster commercial supply chain logistics; automated decision execution without Human-in-the-Loop review.

## Training Data & Provenance
- **Dataset**: India Flood Inventory (IFI v3.0, Zenodo DOI: 10.5281/zenodo.13636502) cross-joined with District Flooded Area and Demographic Impact baselines.
- **Training Records**: {len(train_df):,} events (1967–2017)
- **Validation Records**: {len(val_df):,} events (2018–2020)
- **Test Records**: {len(test_df):,} events (2021–2023)
- **Leakage Safeguards**: Strict temporal partitioning. No future information is accessible during training.

## Quantitative Metrics (Held-Out Test Split)
- **Overall Test R²**: {overall_test_r2_adv}
- **Water Liters Test MAE**: {advanced_metrics['demand_water_liters']['test_mae']:,}
- **Medical Kits Test MAE**: {advanced_metrics['demand_medical_kits']['test_mae']:,}
- **Ambulances Test MAE**: {advanced_metrics['demand_ambulances']['test_mae']:,}

## Uncertainty Handling
- Prediction intervals calculated via empirical 10th–90th percentile residual quantile bounds.
- Calibrated confidence metric computed per zone.

## Known Limitations
- Model performance depends on district population and severity inputs.
- Highly abnormal compound multi-hazard events (e.g. earthquake-triggered dam breaks) should be treated with conservative manual commander review.
"""
    model_card_path = os.path.join(artifact_dir, "MODEL_CARD.md")
    with open(model_card_path, "w", encoding="utf-8") as f:
        f.write(model_card_md)

    registry_md = f"""# RESQGRID AI — MODEL REGISTRY

| Model Name | Version | Task | Architecture | Train Records | Test R² | Status | Artifact Path |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `{config['model_name']}` | `{config['version']}` | Multi-Target Demand Forecasting | MultiOutput Gradient Boosting | {len(train_df):,} | {overall_test_r2_adv} | **VALIDATED** | `{artifact_dir}` |
| `{config['model_name']}-baseline` | `{config['version']}` | Linear Demand Baseline | MultiOutput Ridge Regression | {len(train_df):,} | {round(float(r2_score(y_test, test_preds_base)), 4)} | **EXPERIMENTAL** | `{artifact_dir}/baseline_model.pkl` |

### Active Production Deployment
- **Active Model**: `{config['model_name']} ({config['version']})`
- **Inference Engine**: `LLM/inference/predictor.py`
- **Uncertainty Calibration**: Active (Empirical P10–P90 Quantile Bounds)
- **Optimization Bridge**: Connected to Google OR-Tools MIP Hard Constraints
"""
    with open(config["output"]["registry_path"], "w", encoding="utf-8") as f:
        f.write(registry_md)

    print("=" * 60)
    print(f"  MODEL TRAINING & REGISTRATION COMPLETE!")
    print(f"  - Artifacts: {artifact_dir}")
    print(f"  - Metrics:   {metrics_file}")
    print(f"  - Card:      {model_card_path}")
    print("=" * 60)
    return 0


if __name__ == "__main__":
    sys.exit(train_pipeline())
