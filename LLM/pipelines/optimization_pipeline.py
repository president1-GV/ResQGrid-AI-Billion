"""
ResQGrid AI - Constrained Optimization Pipeline
Orchestrates Google OR-Tools MIP solver with hard capacity and flow constraints.
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
