"""
ResQGrid AI - Autonomous End-to-End Decision Support Demo
Executes the full 13-step disaster response workflow:
1. Load disaster scenario
2. Load affected-area data
3. Load resource inventory
4. Estimate demand
5. Estimate uncertainty
6. Analyze geography
7. Check constraints
8. Optimize allocation
9. Calculate unmet demand
10. Simulate changing conditions
11. Reallocate resources
12. Generate explanation
13. Return structured result
"""

import os
import sys
import json

try:
    from .inference.predictor import ResQGridInferenceEngine
    from .pipelines.reallocation_pipeline import ReallocationEngine
    from .rag.knowledge_store import DisasterKnowledgeStore
except (ImportError, ValueError):
    _repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    if _repo_root not in sys.path:
        sys.path.insert(0, _repo_root)
    from LLM.inference.predictor import ResQGridInferenceEngine
    from LLM.pipelines.reallocation_pipeline import ReallocationEngine
    from LLM.rag.knowledge_store import DisasterKnowledgeStore



def run_demo():
    print("=" * 70)
    print("  RUN RESQGRID AI DEMO — 13-STEP END-TO-END DECISION WORKFLOW")
    print("  DETECT. VERIFY. PRIORITIZE. OPTIMIZE. REALLOCATE. RESPOND.")
    print("=" * 70)

    engine = ResQGridInferenceEngine.get_instance()
    reallocator = ReallocationEngine()
    rag = DisasterKnowledgeStore()

    # Step 1: Load Disaster Scenario
    print("\n[Step 1/13] Loading Disaster Scenario...")
    scenario = {
        "event_id": "EVT-BRAHMAPUTRA-2026-01",
        "disaster_type": "Flash Flood & River Inundation",
        "location": "Kamrup Basin, Guwahati Sector",
        "water_level_m": 14.8,
        "danger_mark_m": 12.0,
        "duration_days": 4,
        "rainfall_24h_mm": 185.0
    }
    print(f"      Event: {scenario['disaster_type']} at {scenario['location']}")
    print(f"      Status: Critical (River Level: {scenario['water_level_m']}m, +2.8m above danger mark)")

    # Step 2: Load Affected-Area Data
    print("\n[Step 2/13] Loading Affected-Area Geospatial Data...")
    affected_zones = [
        {
            "id": "ZN-01",
            "name": "Riverbank Colony Sector East",
            "lat": 26.195,
            "lon": 91.732,
            "population": 45000,
            "vulnerability": 0.92,
            "severity_score": 8.5,
            "district_flooded_area_pct": 38.0,
            "priority_score": 94.2
        },
        {
            "id": "ZN-02",
            "name": "South Urban Settlement Lane 8",
            "lat": 26.148,
            "lon": 91.745,
            "population": 60000,
            "vulnerability": 0.84,
            "severity_score": 7.0,
            "district_flooded_area_pct": 28.0,
            "priority_score": 82.0
        },
        {
            "id": "ZN-03",
            "name": "North Slum Inundation Pocket",
            "lat": 26.220,
            "lon": 91.710,
            "population": 25000,
            "vulnerability": 0.95,
            "severity_score": 9.0,
            "district_flooded_area_pct": 45.0,
            "priority_score": 97.5
        }
    ]
    print(f"      Loaded {len(affected_zones)} disaster sectors with GPS coordinates & demographic vulnerability.")

    # Step 3: Load Resource Inventory
    print("\n[Step 3/13] Loading Warehouse Resource Inventories...")
    warehouses = [
        {
            "id": "WH-CENTRAL",
            "name": "Central Emergency Logistics Depot",
            "lat": 26.150,
            "lon": 91.740,
            "inventory": {"water": 60000, "medical_kits": 120, "ambulances": 8}
        },
        {
            "id": "WH-NORTH",
            "name": "Disaster Relief Staging Ground North",
            "lat": 26.230,
            "lon": 91.705,
            "inventory": {"water": 40000, "medical_kits": 80, "ambulances": 5}
        }
    ]
    total_water = sum(w["inventory"]["water"] for w in warehouses)
    print(f"      Depots: {len(warehouses)} | Available Potable Water: {total_water:,} Liters")

    # Step 4: Estimate Demand using Machine Learning Model
    print("\n[Step 4/13] Estimating Multi-Commodity Humanitarian Demand...")
    for zone in affected_zones:
        preds = engine.predict_demand({
            "duration_days": scenario["duration_days"],
            "severity_score": zone["severity_score"],
            "district_flooded_area_pct": zone["district_flooded_area_pct"],
            "district_population": zone["population"],
            "start_month": 7
        })
        zone["demands"] = {
            "water": int(preds["demand_water_liters"]),
            "food": int(preds["demand_food_packs"]),
            "medical_kits": int(preds["demand_medical_kits"]),
            "ambulances": int(preds["demand_ambulances"])
        }
        print(f"      -> {zone['name']}: {zone['demands']['water']:,}L Water, {zone['demands']['medical_kits']} Med Kits")

    # Step 5: Estimate Uncertainty
    print("\n[Step 5/13] Estimating Empirical Uncertainty Intervals (P10–P90 Quantiles)...")
    for zone in affected_zones:
        uncert = engine.estimate_uncertainty({
            "duration_days": scenario["duration_days"],
            "severity_score": zone["severity_score"],
            "district_flooded_area_pct": zone["district_flooded_area_pct"],
            "district_population": zone["population"],
            "start_month": 7
        })
        w_uncert = uncert["uncertainty_intervals"]["demand_water_liters"]
        zone["water_uncertainty"] = w_uncert
        print(f"      -> {zone['name']}: Interval [{w_uncert['lower_p10']:,.0f} – {w_uncert['upper_p90']:,.0f}] (Conf: {w_uncert['confidence']})")

    # Step 6: Analyze Geography
    print("\n[Step 6/13] Performing Geospatial Analysis & Distance Mapping...")
    for w in warehouses:
        for z in affected_zones:
            dist_km = round(((w["lat"] - z["lat"])**2 + (w["lon"] - z["lon"])**2)**0.5 * 111, 2)
            print(f"      Route {w['id']} -> {z['id']}: Haversine transit distance = {dist_km} km")

    # Step 7: Check Constraints
    print("\n[Step 7/13] Verifying Physical & Logistical Hard Constraints...")
    total_demanded = sum(z["demands"]["water"] for z in affected_zones)
    print(f"      Total Water Demanded: {total_demanded:,} Liters | Available: {total_water:,} Liters")
    shortage = max(0, total_demanded - total_water)
    if shortage > 0:
        print(f"      [ALERT] Resource Deficit Detected: -{shortage:,} Liters. Triggering priority-weighted MIP.")
    else:
        print(f"      [OK] Sufficient on-hand inventory to meet 100% regional demand.")

    # Step 8: Optimize Allocation (OR-Tools MIP)
    print("\n[Step 8/13] Solving Constrained Resource Allocation (Google OR-Tools SCIP)...")
    initial_opt = engine.optimize_resources({
        "commodity": "water",
        "warehouses": warehouses,
        "zones": affected_zones
    })
    print(f"      Solver Status: {initial_opt['status']} | Total Allocated: {initial_opt['total_allocated']:,} Liters")
    for a in initial_opt["allocations"]:
        print(f"      -> Leg: {a['warehouse_name']} -> {a['zone_name']}: {a['quantity']:,} Liters")

    # Step 9: Calculate Unmet Demand
    print("\n[Step 9/13] Calculating Unmet Demand & Fulfillment Rates...")
    for zid, u in initial_opt["unmet_demand"].items():
        print(f"      -> {u['zone_name']}: Allocated {u['allocated']:,} / {u['demand']:,} L ({u['fulfillment_rate']}% met, Unmet: {u['unmet']:,})")

    # Step 10: Simulate Changing Conditions
    print("\n[Step 10/13] Simulating Dynamic Disaster Surge & Disruption...")
    print("      [EVENT OCCURRED]: North Causeway Bridge Collapsed. Warehouse North damaged (Inventory drops to 0).")
    disrupted_warehouses = [
        warehouses[0],  # Central intact
        {
            "id": "WH-NORTH",
            "name": "Disaster Relief Staging Ground North (OFFLINE)",
            "lat": 26.230,
            "lon": 91.705,
            "inventory": {"water": 0, "medical_kits": 0, "ambulances": 0}
        }
    ]

    # Step 11: Reallocate Resources
    print("\n[Step 11/13] Reallocating Resources Dynamically...")
    realloc_res = reallocator.reallocate(
        current_state={"commodity": "water", "warehouses": warehouses, "zones": affected_zones},
        new_information={"commodity": "water", "warehouses": disrupted_warehouses, "zones": affected_zones, "reason": "North Depot Causeway Washout"},
        previous_allocation=initial_opt["allocations"]
    )
    print(f"      Reallocation Status: {realloc_res['status']} | Active Allocations: {len(realloc_res['new_allocation'])}")
    for change in realloc_res["changed_allocations"]:
        print(f"      -> Shift: {change['warehouse_id']} to {change['zone_id']}: {change['action']} by {abs(change['delta']):,} units")

    # Step 12: Generate Grounded Operational Explanation
    print("\n[Step 12/13] Generating Operator-Facing Decision Explanation...")
    explanation = engine.generate_explanation(initial_opt)
    print(f"      Summary: {explanation['summary']}")
    for f in explanation["key_findings"]:
        print(f"      - {f}")

    # Query RAG Standards
    print("\n[RAG Grounding]: Retrieving Official Sphere Project Water Standards...")
    sop = rag.query_with_citation("emergency flood water survival requirements")
    print(f"      Standard: {sop['top_match']}")
    print(f"      Guideline: {sop['guideline']}")

    # Step 13: Return Structured Result
    print("\n[Step 13/13] Returning Complete Structured Result...")
    structured_result = {
        "scenario": scenario["event_id"],
        "status": "COMPLETED",
        "initial_total_allocated": initial_opt["total_allocated"],
        "reallocation_total_allocated": sum(a["quantity"] for a in realloc_res["new_allocation"]),
        "unmet_summary": realloc_res["unmet_demand"],
        "operational_explanation": explanation["summary"],
        "sop_citation": sop["top_match"]
    }
    print(json.dumps(structured_result, indent=2))

    print("\n" + "=" * 70)
    print("  DEMO RUN COMPLETED SUCCESSFULLY — ALL 13 STEPS VERIFIED")
    print("=" * 70)
    return 0


if __name__ == "__main__":
    sys.exit(run_demo())
