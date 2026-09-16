import unittest
from backend.models.schemas import (
    AffectedZone, Warehouse, Road, RoadStatus, AllocationStatus,
    OptimizationObjectiveWeights
)
from backend.data.seed_data import (
    get_initial_zones, get_initial_warehouses, get_initial_roads, get_initial_disaster_event,
    get_initial_hospitals, get_initial_shelters
)
from backend.data.state_store import state
from backend.services.priority_engine import priority_engine
from backend.services.demand_estimator import demand_estimator
from backend.services.routing_engine import routing_engine, haversine_distance_km
from backend.services.optimization_engine import optimization_engine
from backend.services.reoptimization_engine import reoptimization_engine
from backend.services.nlp_extractor import nlp_extractor
from backend.services.gis_service import gis_service
from backend.services.routing_engine import routing_service, offline_demo_routing_service

class TestResQGridCoreEngines(unittest.TestCase):
    def setUp(self):
        state.reset_to_initial()

    def test_priority_engine(self):
        zones = get_initial_zones()
        scores = priority_engine.compute_all_priorities(zones)

        # Priority scores must be bounded between 0 and 100
        for z_id, score in scores.items():
            self.assertGreaterEqual(score.overall_score, 0.0)
            self.assertLessEqual(score.overall_score, 100.0)
            self.assertTrue(len(score.explanation) > 0)

        # Critical zone (Riverbank Colony or South Slum) must have higher score than safe Green Valley
        slum_score = scores["zone_4"].overall_score
        green_valley_score = scores["zone_6"].overall_score
        self.assertGreater(slum_score, green_valley_score)
        print(f"Priority Engine verified: Slum ({slum_score}) > Green Valley ({green_valley_score})")

    def test_demand_estimator(self):
        zones = get_initial_zones()
        demand_estimator.update_zone_demands(zones, rainfall_mm=245.0)

        for z in zones:
            self.assertGreater(z.water_need, 0)
            self.assertGreater(z.food_need, 0)
            self.assertGreater(z.medical_need, 0)
            self.assertGreaterEqual(z.ambulances_need, 1)

        print(f"Demand Estimator verified across all {len(zones)} disaster sectors.")

    def test_routing_engine_and_closure(self):
        roads = get_initial_roads()
        # Normal open path from WH-NORTH to zone_3
        r_open = routing_engine.find_shortest_route("WH-NORTH", "zone_3", roads, avoid_blocked=True)
        self.assertTrue(r_open["found"])
        self.assertIn("ROAD-R17", r_open["edges_used"])

        # Block ROAD-R17
        for rd in roads:
            if rd.id == "ROAD-R17":
                rd.status = RoadStatus.BLOCKED

        # Solver must avoid blocked road
        r_blocked = routing_engine.find_shortest_route("WH-NORTH", "zone_3", roads, avoid_blocked=True)
        self.assertNotIn("ROAD-R17", r_blocked.get("edges_used", []))
        print("Routing Engine verified: Successfully circumvented blocked road ROAD-R17.")

    def test_optimization_engine_hard_constraints(self):
        zones = get_initial_zones()
        warehouses = get_initial_warehouses()
        roads = get_initial_roads()

        run = optimization_engine.solve(zones, warehouses, roads)

        self.assertEqual(run.status, "OPTIMIZED")
        self.assertGreater(len(run.allocations), 0)
        self.assertGreater(run.total_resources_allocated, 0)
        self.assertLess(run.avg_response_time_min, 40.0)

        # Constraint Verification 1: Warehouse stock cannot be negative or overdrawn
        allocated_by_wh = {}
        for a in run.allocations:
            key = (a.source_warehouse_id, a.resource_type)
            allocated_by_wh[key] = allocated_by_wh.get(key, 0) + a.quantity

        wh_map = {w.id: w for w in warehouses}
        for (w_id, r_type), qty in allocated_by_wh.items():
            avail = wh_map[w_id].inventory.get(r_type, 0)
            self.assertLessEqual(qty, avail, f"Warehouse {w_id} exceeded stock for {r_type}: {qty} > {avail}")

        # Constraint Verification 2: Equity threshold for critical zones
        for gap in run.gaps:
            zone = next(z for z in zones if z.id == gap.zone_id)
            if zone.priority_score >= 80.0 and gap.resource_type in ["medical_kits", "water"]:
                self.assertGreaterEqual(gap.coverage_pct, 40.0, f"Critical zone {zone.name} was starved below equity bound")

        print(f"OR-Tools MIP Hard Constraints verified! Allocations: {len(run.allocations)}, Runtime: {run.runtime_ms}ms")

    def test_reoptimization_delta(self):
        res = reoptimization_engine.trigger_road_closure("ROAD-R17", "Flash flood breach")
        self.assertIn("reoptimization_run", res)
        self.assertIn("delta", res)
        delta = res["delta"]
        self.assertEqual(delta["trigger"], "Road Block: North Bridge Causeway")
        print(f"Dynamic Re-Optimization verified: Response time diff: {delta['response_time_diff']}m, rerouted legs: {delta['changed_routes_count']}")

    def test_nlp_field_report_extraction(self):
        raw_dispatch = (
            "Sector 4 Lowland primary school has 420 stranded people. "
            "Need 1500 liters drinking water, 50 medical kits, and 3 ambulances urgently."
        )
        extracted = nlp_extractor.extract(raw_dispatch, location_hint="Sector 4 Lowland")

        self.assertEqual(extracted["extracted_population"], 420)
        self.assertEqual(extracted["extracted_needs"].get("water"), 1500)
        self.assertEqual(extracted["extracted_needs"].get("medical_kits"), 50)
        self.assertEqual(extracted["extracted_needs"].get("ambulances"), 3)
        self.assertEqual(extracted["urgency"], "Critical")
        self.assertEqual(extracted["data_confidence_tier"], "HIGH CONFIDENCE")
        print(f"NLP Extractor verified: Extracted {extracted['extracted_needs']} with {extracted['data_confidence_tier']}")

    def test_baseline_benchmark(self):
        zones = get_initial_zones()
        warehouses = get_initial_warehouses()
        roads = get_initial_roads()

        resqgrid_run, comparisons = optimization_engine.run_baseline_benchmark(zones, warehouses, roads)

        self.assertTrue(len(comparisons) >= 4)
        for c in comparisons:
            self.assertIsNotNone(c.improvement_pct)
            print(f"Benchmark metric '{c.metric}': Baseline={c.baseline_value}, Optimized={c.optimized_value} -> {c.improvement_pct}% lift")

    def test_hard_evaluator_test(self):
        res = reoptimization_engine.run_hard_evaluator_test()
        self.assertEqual(res["status"], "SUCCESS")
        self.assertIn("delta", res)
        self.assertIn("explanation", res)
        self.assertGreater(len(res["delta"]["rerouted_allocations"]), 0)
        self.assertEqual(res["explanation"]["road_closure"]["new_status"], "BLOCKED")
        self.assertEqual(res["explanation"]["demand_surge"]["surge_pct"], 40.0)
        self.assertEqual(res["explanation"]["inventory_reduction"]["reduction_pct"], -20.0)
        print(f"Hard-Evaluator Test verified: Rerouted {len(res['delta']['rerouted_allocations'])} legs; Response time diff: {res['delta']['response_time_diff']}m")

    def test_gis_service(self):
        zones = get_initial_zones()
        whs = get_initial_warehouses()
        roads = get_initial_roads()
        hosps = get_initial_hospitals()
        shelters = get_initial_shelters()

        nearest, dist = gis_service.find_nearest_warehouse(zones[0], whs)
        self.assertIsNotNone(nearest)
        self.assertGreater(dist, 0.0)

        inter = gis_service.roads_intersecting_flood(roads)
        self.assertEqual(len(inter), len(roads))

        pop_data = gis_service.affected_population_in_polygon(zones)
        self.assertGreater(pop_data["total_affected_population"], 0)

        matrix = gis_service.generate_travel_time_matrix(whs, zones, roads)
        self.assertEqual(len(matrix["origins"]), len(whs))
        self.assertEqual(len(matrix["destinations"]), len(zones))

        layers = gis_service.get_geojson_layers(zones, whs, hosps, shelters, roads)
        self.assertEqual(layers["type"], "FeatureCollection")
        self.assertGreater(len(layers["features"]), 5)
        print(f"GIS Service verified: {len(layers['features'])} GeoJSON features rendered.")

    def test_routing_service(self):
        roads = get_initial_roads()
        r1 = offline_demo_routing_service.calculate_route('WH-NORTH', 26.220, 91.700, 'zone_3', 26.210, 91.758, roads)
        self.assertTrue(r1["found"])
        self.assertIn("DEMO", r1["service_provider"])

        # Cached route test
        r2 = offline_demo_routing_service.calculate_route('WH-NORTH', 26.220, 91.700, 'zone_3', 26.210, 91.758, roads)
        self.assertTrue(r2["cached"])

        d = routing_service.calculate_distance(26.220, 91.700, 26.210, 91.758)
        self.assertGreater(d, 0.0)
        print("Routing Service & Offline Demo Adapter verified.")

    def test_demand_uncertainty(self):
        zones = get_initial_zones()
        ests = demand_estimator.estimate_zone_demand(zones[0], rainfall_mm=245.0)
        for r_name, est in ests.items():
            self.assertIsNotNone(est.lower_bound)
            self.assertIsNotNone(est.upper_bound)
            self.assertLessEqual(est.lower_bound, est.estimated_demand)
            self.assertGreaterEqual(est.upper_bound, est.estimated_demand)
            self.assertGreaterEqual(est.confidence, 0.70)
            self.assertLessEqual(est.confidence, 1.0)
            self.assertIn("–", est.uncertainty_range)
        print(f"Demand Uncertainty Engine verified: Zone 1 Water Range: {ests['water'].uncertainty_range} (Conf: {ests['water'].confidence})")

    def test_human_approval_workflow(self):
        zones = get_initial_zones()
        whs = get_initial_warehouses()
        roads = get_initial_roads()
        run = optimization_engine.solve(zones, whs, roads)
        state.allocations = run.allocations

        alloc = state.allocations[0]
        self.assertEqual(alloc.status, AllocationStatus.PENDING_APPROVAL)

        # Simulate approval with officer role
        alloc.status = AllocationStatus.APPROVED
        alloc.approved_by = "Major General Sharma (OPERATIONS_OFFICER)"
        log = state.log_audit(
            user="Major General Sharma",
            role="OPERATIONS_OFFICER",
            action="ALLOCATION_APPROVED",
            resource_type="AllocationItem",
            resource_id=alloc.id,
            details=f"Allocation {alloc.id} verified and approved."
        )
        self.assertEqual(alloc.status, AllocationStatus.APPROVED)
        self.assertIn("OPERATIONS_OFFICER", log.role)
        print(f"Human-in-the-loop workflow verified: Allocation {alloc.id} approved with audit event #{log.id}.")

if __name__ == "__main__":
    unittest.main()

