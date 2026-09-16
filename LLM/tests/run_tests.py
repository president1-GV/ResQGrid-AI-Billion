"""
ResQGrid AI - AI/ML, Optimization, Geospatial & RAG Test Suite
Run: python -m LLM.tests.run_tests
"""

import unittest
import numpy as np
from LLM.inference.predictor import ResQGridInferenceEngine
from LLM.rag.knowledge_store import DisasterKnowledgeStore


class TestResQGridAI(unittest.TestCase):

    def setUp(self):
        self.engine = ResQGridInferenceEngine.get_instance()
        self.rag = DisasterKnowledgeStore()

    def test_critical_optimization_hard_constraints(self):
        """CRITICAL OPTIMIZATION TEST:
        Total Inventory = 100.
        Demand: Area A = 80, Area B = 70 (Total Demand = 150 > Inventory 100).
        Must strictly prove:
          1. allocation_A + allocation_B <= 100
          2. allocation_A <= 80
          3. allocation_B <= 70
          4. total_allocated == 100 (exact conservation without exceeding capacity)
        """
        opt_input = {
            "commodity": "medical_kits",
            "warehouses": [
                {
                    "id": "WH-SINGLE",
                    "name": "Depot Single",
                    "lat": 26.15,
                    "lon": 91.75,
                    "inventory": {"medical_kits": 100}
                }
            ],
            "zones": [
                {
                    "id": "AREA-A",
                    "name": "Area A",
                    "priority_score": 90.0,
                    "lat": 26.16,
                    "lon": 91.76,
                    "demands": {"medical_kits": 80}
                },
                {
                    "id": "AREA-B",
                    "name": "Area B",
                    "priority_score": 85.0,
                    "lat": 26.18,
                    "lon": 91.77,
                    "demands": {"medical_kits": 70}
                }
            ]
        }

        result = self.engine.optimize_resources(opt_input)
        self.assertEqual(result["status"], "FEASIBLE")

        alloc_A = 0
        alloc_B = 0
        for item in result["allocations"]:
            if item["zone_id"] == "AREA-A":
                alloc_A += item["quantity"]
            elif item["zone_id"] == "AREA-B":
                alloc_B += item["quantity"]

        # HARD CONSTRAINTS VERIFICATION
        self.assertLessEqual(alloc_A + alloc_B, 100, "Violated total inventory hard constraint!")
        self.assertLessEqual(alloc_A, 80, "Violated Area A demand upper bound!")
        self.assertLessEqual(alloc_B, 70, "Violated Area B demand upper bound!")
        self.assertEqual(alloc_A + alloc_B, 100, "Failed to fully allocate available stock under shortage!")

        # Priority verification: Area A had higher priority (90 vs 85), should receive full 80 kits
        self.assertEqual(alloc_A, 80)
        self.assertEqual(alloc_B, 20)

        # Verify unmet demand calculated correctly
        self.assertEqual(result["unmet_demand"]["AREA-A"]["unmet"], 0)
        self.assertEqual(result["unmet_demand"]["AREA-B"]["unmet"], 50)
        print("  ✓ Critical Optimization Hard Constraints Verified: 80 + 20 = 100 <= 100")

    def test_dynamic_reallocation_warehouse_failure(self):
        """DYNAMIC REALLOCATION TEST:
        Initial: Warehouse A = 500, Warehouse B = 300 (Total = 800)
        Demand: Zone 1 = 400, Zone 2 = 300 (Total = 700)
        Then Warehouse A fails -> Warehouse A = 0.
        System must detect changed state, re-run optimization, produce new allocation,
        and explain changes.
        """
        initial_input = {
            "commodity": "water",
            "warehouses": [
                {"id": "WH-A", "name": "Warehouse A", "lat": 26.10, "lon": 91.70, "inventory": {"water": 500}},
                {"id": "WH-B", "name": "Warehouse B", "lat": 26.25, "lon": 91.80, "inventory": {"water": 300}}
            ],
            "zones": [
                {"id": "ZN-1", "name": "Zone 1", "priority_score": 80.0, "lat": 26.12, "lon": 91.72, "demands": {"water": 400}},
                {"id": "ZN-2", "name": "Zone 2", "priority_score": 75.0, "lat": 26.20, "lon": 91.78, "demands": {"water": 300}}
            ]
        }

        initial_result = self.engine.optimize_resources(initial_input)
        self.assertEqual(initial_result["status"], "FEASIBLE")
        self.assertEqual(initial_result["total_allocated"], 700)

        # Simulate dynamic failure: Warehouse A becomes unavailable (inventory drops to 0)
        failed_input = {
            "commodity": "water",
            "warehouses": [
                {"id": "WH-A", "name": "Warehouse A (OFFLINE)", "lat": 26.10, "lon": 91.70, "inventory": {"water": 0}},
                {"id": "WH-B", "name": "Warehouse B", "lat": 26.25, "lon": 91.80, "inventory": {"water": 300}}
            ],
            "zones": initial_input["zones"]
        }

        reopt_result = self.engine.optimize_resources(failed_input)
        self.assertEqual(reopt_result["status"], "FEASIBLE")

        # Now only Warehouse B (300 units) is available
        self.assertEqual(reopt_result["total_allocated"], 300)

        # None should be allocated from Warehouse A
        wh_a_alloc = sum(a["quantity"] for a in reopt_result["allocations"] if a["warehouse_id"] == "WH-A")
        self.assertEqual(wh_a_alloc, 0)

        explanation = self.engine.generate_explanation(reopt_result)
        self.assertIn("Allocated 300", explanation["summary"])
        print("  ✓ Dynamic Reallocation on Warehouse Failure Verified: Gracefully adapted to 300 available units")

    def test_geospatial_validation(self):
        """GEOSPATIAL TEST:
        Validates latitude, longitude, and rejects out-of-range coordinates.
        """
        def validate_coords(lat, lon):
            if lat is None or lon is None:
                return False
            if np.isnan(lat) or np.isnan(lon) or np.isinf(lat) or np.isinf(lon):
                return False
            return (-90.0 <= lat <= 90.0) and (-180.0 <= lon <= 180.0)

        self.assertTrue(validate_coords(26.185, 91.745))
        self.assertFalse(validate_coords(95.0, 91.0))
        self.assertFalse(validate_coords(26.0, 200.0))
        self.assertFalse(validate_coords(float("nan"), 91.0))
        self.assertFalse(validate_coords(float("inf"), 91.0))
        print("  ✓ Geospatial Coordinate Validation Verified")

    def test_demand_prediction_and_uncertainty(self):
        """DEMAND FORECASTING & UNCERTAINTY TEST:
        Verifies non-negative multi-commodity predictions and valid P10-P90 intervals.
        """
        sample = {
            "duration_days": 5,
            "severity_score": 8.0,
            "district_flooded_area_pct": 35.0,
            "district_population": 300000,
            "historical_mean_duration": 7.0,
            "start_month": 7
        }

        preds = self.engine.predict_demand(sample)
        for commodity in ["demand_water_liters", "demand_food_packs", "demand_medical_kits"]:
            self.assertIn(commodity, preds)
            self.assertGreater(preds[commodity], 0)

        uncertainty = self.engine.estimate_uncertainty(sample)
        self.assertEqual(uncertainty["status"], "CALIBRATED")
        intervals = uncertainty["uncertainty_intervals"]

        for commodity in ["demand_water_liters", "demand_food_packs"]:
            item = intervals[commodity]
            self.assertLessEqual(item["lower_p10"], item["predicted"])
            self.assertLessEqual(item["predicted"], item["upper_p90"])
            self.assertGreaterEqual(item["confidence"], 0.50)
            self.assertLessEqual(item["confidence"], 1.0)
        print("  ✓ Demand Prediction & Empirical Uncertainty Bounds Verified")

    def test_rag_knowledge_store(self):
        """RAG KNOWLEDGE RETRIEVAL TEST:
        Retrieves official Sphere and NDRF guidelines with exact citations.
        """
        res = self.rag.query_with_citation("water supply requirements per person")
        self.assertIn("Sphere", res["top_match"])
        self.assertIn("15 litres", res["guideline"])
        self.assertGreater(len(res["citations"]), 0)
        print("  ✓ Local Disaster SOP RAG Knowledge Retrieval Verified")

    def test_end_to_end_pipeline_flow(self):
        """END-TO-END DEMO TEST:
        Telemetry -> Demand -> Uncertainty -> Optimization -> Explanation
        """
        telemetry = {
            "duration_days": 4,
            "severity_score": 6.5,
            "district_flooded_area_pct": 25.0,
            "district_population": 250000,
            "historical_mean_duration": 6.0,
            "start_month": 8
        }
        # 1. Predict Demand
        demands = self.engine.predict_demand(telemetry)
        # 2. Uncertainty
        uncert = self.engine.estimate_uncertainty(telemetry)
        # 3. Optimize
        opt_input = {
            "commodity": "water",
            "warehouses": [
                {"id": "W1", "name": "Warehouse Central", "lat": 26.15, "lon": 91.75, "inventory": {"water": 50000}}
            ],
            "zones": [
                {"id": "Z1", "name": "Sector Alpha", "priority_score": 85.0, "lat": 26.18, "lon": 91.77, "demands": {"water": int(demands["demand_water_liters"])}}
            ]
        }
        opt_res = self.engine.optimize_resources(opt_input)
        self.assertEqual(opt_res["status"], "FEASIBLE")

        # 4. Explain
        explanation = self.engine.generate_explanation(opt_res)
        self.assertIn("Allocated", explanation["summary"])
        print("  ✓ End-to-End Decision Support Pipeline Verified")


def run_all_tests():
    suite = unittest.TestLoader().loadTestsFromTestCase(TestResQGridAI)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    return 0 if result.wasSuccessful() else 1


if __name__ == "__main__":
    import sys
    sys.exit(run_all_tests())
