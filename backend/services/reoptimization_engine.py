from typing import Dict, List, Any, Optional
from datetime import datetime
from ..models.schemas import (
    RoadStatus, OptimizationRun, AllocationItem, Road
)
from ..data.state_store import state
from .optimization_engine import optimization_engine
from .priority_engine import priority_engine

class ReOptimizationEngine:
    def __init__(self):
        pass

    def trigger_road_closure(self, road_id: str, reason: str = "Inundated by flood surge") -> Dict[str, Any]:
        """
        Closes a road, updates road status, triggers automated re-optimization,
        and computes delta difference with previous allocation.
        """
        if road_id not in state.roads:
            raise ValueError(f"Road {road_id} not found")

        target_road = state.roads[road_id]
        old_status = target_road.status
        target_road.status = RoadStatus.BLOCKED

        state.log_audit(
            user="Field Dispatch / Sensor",
            role="DISPATCHER",
            action="ROAD_BLOCKED",
            resource_type="Road",
            resource_id=road_id,
            details=f"Road {target_road.name} ({road_id}) closed: {reason}",
            metadata={"previous_status": old_status, "road_name": target_road.name}
        )

        # Grab latest active run to compare
        previous_run = state.optimization_runs[0] if state.optimization_runs else None

        # Execute re-optimization
        new_run = optimization_engine.solve(
            zones=list(state.zones.values()),
            warehouses=list(state.warehouses.values()),
            roads=list(state.roads.values()),
            is_reoptimization=True,
            trigger_reason=f"Road Closure: {target_road.name} ({road_id})"
        )

        state.optimization_runs.insert(0, new_run)
        state.allocations = new_run.allocations

        # Compute delta analysis
        delta = self._compute_run_delta(previous_run, new_run, trigger=f"Road Block: {target_road.name}")

        from ..utils.time_utils import get_utc_now_iso, get_utc_timestamp
        state.notifications.insert(0, {
            "id": f"NOTIF-{int(get_utc_timestamp())}",
            "type": "REOPTIMIZATION_COMPLETE",
            "title": "Dynamic Re-Optimization Finished",
            "message": f"{target_road.name} closed. Re-routed allocations from alternative depots. Response time: {new_run.avg_response_time_min}m.",
            "timestamp": get_utc_now_iso(),
            "read": False
        })

        return {
            "reoptimization_run": new_run,
            "delta": delta,
            "road_closed": target_road
        }

    def trigger_demand_spike(self, zone_id: str, multiplier: float = 1.5, reason: str = "Secondary flood breach") -> Dict[str, Any]:
        """
        Simulates sudden influx of casualties/evacuees into a zone.
        """
        if zone_id not in state.zones:
            raise ValueError(f"Zone {zone_id} not found")

        zone = state.zones[zone_id]
        zone.affected_population = int(zone.affected_population * multiplier)
        zone.medical_need = int(zone.medical_need * multiplier)
        zone.water_need = int(zone.water_need * multiplier)
        zone.food_need = int(zone.food_need * multiplier)
        zone.ambulances_need = int(zone.ambulances_need * multiplier)

        # Recalculate priority
        priority_engine.calculate_zone_priority(zone)

        state.log_audit(
            user="Command Center",
            role="SUPERVISOR",
            action="DEMAND_SPIKE_TRIGGERED",
            resource_type="AffectedZone",
            resource_id=zone_id,
            details=f"Demand surged by {int(multiplier * 100)}% in {zone.name} due to {reason}",
            metadata={"zone_name": zone.name, "multiplier": multiplier}
        )

        previous_run = state.optimization_runs[0] if state.optimization_runs else None

        new_run = optimization_engine.solve(
            zones=list(state.zones.values()),
            warehouses=list(state.warehouses.values()),
            roads=list(state.roads.values()),
            is_reoptimization=True,
            trigger_reason=f"Demand Surge: {zone.name} (+{int((multiplier-1)*100)}%)"
        )

        state.optimization_runs.insert(0, new_run)
        state.allocations = new_run.allocations

        delta = self._compute_run_delta(previous_run, new_run, trigger=f"Demand Surge in {zone.name}")

        return {
            "reoptimization_run": new_run,
            "delta": delta,
            "affected_zone": zone
        }

    def trigger_warehouse_reduction(self, warehouse_id: str, resource_type: str, fraction_remaining: float = 0.4) -> Dict[str, Any]:
        if warehouse_id not in state.warehouses:
            raise ValueError(f"Warehouse {warehouse_id} not found")

        wh = state.warehouses[warehouse_id]
        current = wh.inventory.get(resource_type, 0)
        wh.inventory[resource_type] = int(current * fraction_remaining)

        state.log_audit(
            user="Inventory Logistics",
            role="DISPATCHER",
            action="WAREHOUSE_STOCK_REDUCED",
            resource_type="Warehouse",
            resource_id=warehouse_id,
            details=f"Depot {wh.name} {resource_type} reduced to {wh.inventory[resource_type]:,} units",
            metadata={"warehouse": wh.name, "resource": resource_type}
        )

        previous_run = state.optimization_runs[0] if state.optimization_runs else None

        new_run = optimization_engine.solve(
            zones=list(state.zones.values()),
            warehouses=list(state.warehouses.values()),
            roads=list(state.roads.values()),
            is_reoptimization=True,
            trigger_reason=f"Stock Depletion: {wh.name} ({resource_type})"
        )

        state.optimization_runs.insert(0, new_run)
        state.allocations = new_run.allocations
        delta = self._compute_run_delta(previous_run, new_run, trigger=f"Stock Depletion: {wh.name}")

        return {
            "reoptimization_run": new_run,
            "delta": delta,
            "warehouse": wh
        }

    def _compute_run_delta(self, old_run: Optional[OptimizationRun], new_run: OptimizationRun, trigger: str) -> Dict[str, Any]:
        if not old_run:
            return {
                "trigger": trigger,
                "response_time_diff": 0.0,
                "unmet_demand_diff": 0,
                "distance_diff": 0.0,
                "changed_routes_count": len(new_run.allocations),
                "summary": "Initial baseline optimization established."
            }

        time_diff = round(new_run.avg_response_time_min - old_run.avg_response_time_min, 1)
        unmet_diff = new_run.unmet_demand_total - old_run.unmet_demand_total
        dist_diff = round(new_run.total_travel_distance_km - old_run.total_travel_distance_km, 1)

        # Compare allocations to find altered routes
        old_map = {(a.destination_zone_id, a.resource_type): a for a in old_run.allocations}
        rerouted = []
        for a in new_run.allocations:
            key = (a.destination_zone_id, a.resource_type)
            if key in old_map:
                prev = old_map[key]
                if prev.source_warehouse_id != a.source_warehouse_id or prev.distance_km != a.distance_km:
                    rerouted.append({
                        "zone": a.destination_zone_name,
                        "resource": a.resource_type,
                        "old_source": prev.source_warehouse_name,
                        "new_source": a.source_warehouse_name,
                        "old_eta": prev.estimated_time_min,
                        "new_eta": a.estimated_time_min
                    })

        return {
            "trigger": trigger,
            "response_time_diff": time_diff,
            "unmet_demand_diff": unmet_diff,
            "distance_diff": dist_diff,
            "rerouted_allocations": rerouted,
            "changed_routes_count": len(rerouted),
            "summary": (
                f"Dynamic re-optimization recalculated {len(new_run.allocations)} dispatch legs. "
                f"Response time shifted by {time_diff:+}m, unmet demand shifted by {unmet_diff:+d} units."
            )
        }

reoptimization_engine = ReOptimizationEngine()
