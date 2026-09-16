"""
ResQGrid AI - Standalone Evaluation Script
Run: python -m LLM.evaluation.evaluate
"""

import os
import sys
import json
import time
import pickle
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


def run_evaluation():
    print("=" * 60)
    print("  RESQGRID AI — HELD-OUT TEST EVALUATION & UNCERTAINTY BENCHMARK")
    print("=" * 60)

    model_path = "LLM/models/demand_forecasting/v1/advanced_model.pkl"
    schema_path = "LLM/models/demand_forecasting/v1/feature_schema.json"
    test_path = "LLM/processed/test.parquet"

    if not os.path.exists(model_path):
        print(f"[ERROR] Model file missing: {model_path}. Run python -m LLM.training.train first.")
        sys.exit(1)

    # 1. Load Model & Metadata
    with open(model_path, "rb") as f:
        model = pickle.load(f)
    with open(schema_path, "r", encoding="utf-8") as f:
        schema = json.load(f)

    test_df = pd.read_parquet(test_path)
    feature_cols = [
        "duration_days", "severity_score", "district_flooded_area_pct",
        "district_population", "historical_mean_duration", "start_month", "is_monsoon"
    ]
    target_cols = schema["targets"]

    X_test = test_df[feature_cols].values
    y_test = test_df[target_cols].values

    print(f"\n[1/4] Loaded model from: {model_path}")
    print(f"      Evaluated on {len(test_df):,} held-out records (Years 2021–2023)")

    # 2. Measure Inference Latency
    start_time = time.perf_counter()
    preds = model.predict(X_test)
    total_time = (time.perf_counter() - start_time) * 1000
    latency_per_sample = total_time / len(X_test)

    print(f"\n[2/4] Inference Performance:")
    print(f"      Total Batch Time: {total_time:.2f} ms ({len(X_test)} samples)")
    print(f"      Latency per Item: {latency_per_sample:.4f} ms")

    # 3. Uncertainty Coverage Evaluation
    print(f"\n[3/4] Evaluating Empirical Uncertainty Bounds (P10–P90 Coverage)...")
    uncertainty_results = model.predict_with_uncertainty(X_test)

    coverages = {}
    for i, tgt in enumerate(target_cols):
        inside = 0
        for row_idx in range(len(X_test)):
            y_actual = y_test[row_idx, i]
            low = uncertainty_results[row_idx][tgt]["lower_p10"]
            high = uncertainty_results[row_idx][tgt]["upper_p90"]
            if low <= y_actual <= high:
                inside += 1
        coverages[tgt] = round((inside / len(X_test)) * 100, 1)

    # 4. Print Scorecard
    print(f"\n[4/4] Target Metric Scorecard:")
    print("-" * 75)
    print(f"{'Target Commodity':<24} | {'MAE':<10} | {'RMSE':<10} | {'R²':<8} | {'P10-P90 Coverage':<10}")
    print("-" * 75)

    summary_metrics = {}
    for i, tgt in enumerate(target_cols):
        mae = float(mean_absolute_error(y_test[:, i], preds[:, i]))
        rmse = float(np.sqrt(mean_squared_error(y_test[:, i], preds[:, i])))
        r2 = float(r2_score(y_test[:, i], preds[:, i]))
        cov = coverages[tgt]
        summary_metrics[tgt] = {
            "mae": round(mae, 2),
            "rmse": round(rmse, 2),
            "r2": round(r2, 4),
            "coverage_pct": cov
        }
        print(f"{tgt:<24} | {mae:<10.1f} | {rmse:<10.1f} | {r2:<8.4f} | {cov}%")
    print("-" * 75)
    print(f"Overall Test Multi-Output R²: {round(float(r2_score(y_test, preds)), 4)}")
    print("=" * 60)
    print("  EVALUATION COMPLETED SUCCESSFULLY!")
    print("=" * 60)
    return 0


if __name__ == "__main__":
    sys.exit(run_evaluation())
