"""
ResQGrid AI - Dynamic Reallocation Engine
Detects changing conditions (warehouse disruptions, road blocks, demand surges)
and computes optimal differential dispatches with explainable rationale.
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



class ReallocationEngine:
    """Calculates updated dispatches when operational constraints change dynamically."""

    def __init__(self):
        self.engine = ResQGridInferenceEngine.get_instance()

    def reallocate(
        self,
        current_state: Dict[str, Any],
        new_information: Dict[str, Any],
        previous_allocation: List[Dict[str, Any]],
        constraints: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        commodity = new_information.get("commodity", current_state.get("commodity", "water"))
        warehouses = new_information.get("warehouses", current_state.get("warehouses", []))
        zones = new_information.get("zones", current_state.get("zones", []))

        # Re-solve optimization under updated conditions
        new_result = self.engine.optimize_resources({
            "commodity": commodity,
            "warehouses": warehouses,
            "zones": zones
        })

        if new_result.get("status") != "FEASIBLE":
            return {
                "status": "INFEASIBLE",
                "new_allocation": [],
                "changed_allocations": [],
                "reason": "Updated operational constraints rendered the allocation problem mathematically infeasible.",
                "objective_change": 0.0,
                "constraint_status": "VIOLATED"
            }

        new_allocations = new_result.get("allocations", [])

        # Build differential map between previous and new dispatches
        prev_map = {
            (a["warehouse_id"], a["zone_id"], a["commodity"]): a["quantity"]
            for a in previous_allocation
        }
        new_map = {
            (a["warehouse_id"], a["zone_id"], a["commodity"]): a["quantity"]
            for a in new_allocations
        }

        all_keys = set(prev_map.keys()).union(set(new_map.keys()))
        changed_allocations = []

        for key in all_keys:
            w_id, z_id, comm = key
            prev_qty = prev_map.get(key, 0)
            new_qty = new_map.get(key, 0)
            diff = new_qty - prev_qty

            if diff != 0:
                changed_allocations.append({
                    "warehouse_id": w_id,
                    "zone_id": z_id,
                    "commodity": comm,
                    "previous_quantity": prev_qty,
                    "new_quantity": new_qty,
                    "delta": diff,
                    "action": "INCREASED" if diff > 0 else "DECREASED" if new_qty > 0 else "CANCELLED"
                })

        explanation = self.engine.generate_explanation(new_result)
        reason = new_information.get("reason", "Dynamic operational update (e.g. inventory shift or road condition change).")

        return {
            "status": "FEASIBLE",
            "new_allocation": new_allocations,
            "changed_allocations": changed_allocations,
            "reason": reason,
            "objective_value": new_result.get("objective_value", 0.0),
            "unmet_demand": new_result.get("unmet_demand", {}),
            "constraint_status": "SATISFIED",
            "explanation": explanation
        }
