"""
ResQGrid AI - Standalone CLI Prediction and Optimization Runner
Run: python -m LLM.inference.predict
"""

import sys
import json
from .predictor import ResQGridInferenceEngine


def run_predict_cli():
    print("=" * 60)
    print("  RESQGRID AI — INFERENCE & DECISION SUPPORT CLI")
    print("=" * 60)

    engine = ResQGridInferenceEngine.get_instance()

    sample_zone_input = {
        "duration_days": 4,
        "severity_score": 7.5,
        "district_flooded_area_pct": 32.0,
        "district_population": 450000,
        "historical_mean_duration": 8.0,
        "start_month": 8
    }

    # 1. Demand Prediction
    print("\n[1/4] Predicting Multi-Commodity Demand...")
    demand_pred = engine.predict_demand(sample_zone_input)
    print(json.dumps(demand_pred, indent=2))

    # 2. Uncertainty Estimation
    print("\n[2/4] Estimating Empirical Uncertainty Intervals (P10–P90)...")
    uncertainty = engine.estimate_uncertainty(sample_zone_input)
    print(json.dumps(uncertainty, indent=2))

    # 3. Constrained Optimization
    print("\n[3/4] Running Constrained Optimization (MIP Hard Constraints)...")
    opt_input = {
        "commodity": "water",
        "warehouses": [
            {
                "id": "WH-01",
                "name": "Central Emergency Logistics Depot",
                "lat": 26.15,
                "lon": 91.74,
                "inventory": {"water": 50000}
            },
            {
                "id": "WH-02",
                "name": "Disaster Relief Staging Ground North",
                "lat": 26.22,
                "lon": 91.70,
                "inventory": {"water": 30000}
            }
        ],
        "zones": [
            {
                "id": "ZN-01",
                "name": "Riverbank Colony Sector East",
                "priority_score": 88.5,
                "lat": 26.195,
                "lon": 91.732,
                "demands": {"water": 45000}
            },
            {
                "id": "ZN-02",
                "name": "South Urban Settlement Lane 8",
                "priority_score": 74.0,
                "lat": 26.148,
                "lon": 91.745,
                "demands": {"water": 40000}
            }
        ]
    }

    opt_result = engine.optimize_resources(opt_input)
    print(json.dumps(opt_result, indent=2))

    # 4. Explanation Generation
    print("\n[4/4] Generating Grounded Operational Explanation...")
    explanation = engine.generate_explanation(opt_result)
    print(json.dumps(explanation, indent=2))

    print("\n" + "=" * 60)
    print("  INFERENCE CLI RUN COMPLETED SUCCESSFULLY")
    print("=" * 60)
    return 0


if __name__ == "__main__":
    sys.exit(run_predict_cli())
