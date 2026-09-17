"""
ResQGrid AI - Demand Forecasting Pipeline
Orchestrates multi-commodity demand prediction and uncertainty estimation.
"""

import os
import sys
from typing import Dict, Any, List

try:
    from ..inference.predictor import ResQGridInferenceEngine
except (ImportError, ValueError):
    _repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    if _repo_root not in sys.path:
        sys.path.insert(0, _repo_root)
    from LLM.inference.predictor import ResQGridInferenceEngine



class DemandForecastingPipeline:
    """Manages feature extraction, model inference, and uncertainty estimation."""

    def __init__(self):
        self.engine = ResQGridInferenceEngine.get_instance()

    def run(self, zones_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        results = []
        for zone in zones_data:
            input_features = {
                "duration_days": zone.get("duration_days", 3),
                "severity_score": zone.get("severity_score", zone.get("severity", 6.0)),
                "district_flooded_area_pct": zone.get("flooded_area_pct", 25.0),
                "district_population": zone.get("population", 100000),
                "historical_mean_duration": zone.get("mean_duration", 7.0),
                "start_month": zone.get("month", 7)
            }
            predictions = self.engine.predict_demand(input_features)
            uncertainty = self.engine.estimate_uncertainty(input_features)

            results.append({
                "zone_id": zone.get("id", "ZN-01"),
                "zone_name": zone.get("name", "Zone"),
                "predicted_demands": predictions,
                "uncertainty_bounds": uncertainty.get("uncertainty_intervals", {}),
                "model_used": predictions.get("model"),
                "fallback_active": predictions.get("fallback_active", False)
            })
        return results
