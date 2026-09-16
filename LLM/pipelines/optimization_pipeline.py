"""
ResQGrid AI - Constrained Optimization Pipeline
Orchestrates Google OR-Tools MIP solver with hard capacity and flow constraints.
"""

from typing import Dict, Any, List
from ..inference.predictor import ResQGridInferenceEngine


class ConstrainedOptimizationPipeline:
    """Solves multi-warehouse to multi-zone resource distribution with hard constraints."""

    def __init__(self):
        self.engine = ResQGridInferenceEngine.get_instance()

    def run(self, commodity: str, warehouses: List[Dict[str, Any]], zones: List[Dict[str, Any]]) -> Dict[str, Any]:
        opt_input = {
            "commodity": commodity,
            "warehouses": warehouses,
            "zones": zones
        }
        result = self.engine.optimize_resources(opt_input)
        return result
