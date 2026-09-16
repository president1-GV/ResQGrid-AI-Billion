from fastapi import FastAPI, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Any, Optional
from datetime import datetime
import json
import asyncio

from .models.schemas import (
    OptimizationObjectiveWeights, OptimizationRun, AllocationStatus,
    RoadStatus
)
from .data.state_store import state
from .services.priority_engine import priority_engine
from .services.demand_estimator import demand_estimator
from .services.optimization_engine import optimization_engine
from .services.reoptimization_engine import reoptimization_engine
from .services.nlp_extractor import nlp_extractor
from .services.data_adapters import weather_adapter, geospatial_adapter
from .utils.time_utils import get_utc_now_iso

app = FastAPI(
    title="ResQGrid AI - Disaster Resource Allocation & Re-Optimization Engine",
    version="1.0.0",
    description="Explainable, constraint-aware disaster resource decision support platform."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup: Calculate initial priorities and run initial optimization
@app.on_event("startup")
def startup_event():
    # Compute initial demand estimates and priorities
    demand_estimator.update_zone_demands(list(state.zones.values()), state.event.rainfall_mm)
    priority_engine.compute_all_priorities(list(state.zones.values()))

    # Run initial optimization so system starts in primed operational state
    initial_run = optimization_engine.solve(
        zones=list(state.zones.values()),
        warehouses=list(state.warehouses.values()),
        roads=list(state.roads.values()),
        is_reoptimization=False,
        trigger_reason="Initial Disaster Event Deployment Plan"
    )
    state.optimization_runs.append(initial_run)
    state.allocations = initial_run.allocations

@app.get("/api/health")
def get_health():
    return {
        "status": "ONLINE",
        "backend": "ONLINE",
        "database": "ONLINE",
        "optimization_engine": "ONLINE (Google OR-Tools MIP / SCIP)",
        "routing_engine": "ONLINE (Dijkstra Road Graph)",
        "nlp_extractor": "ONLINE (Lexical & Regex Entity Engine)",
        "gis_data": "ONLINE (OpenStreetMap GeoJSON Ready)",
        "data_adapters": "ONLINE (Open-Meteo Level 1 Active)",
        "timestamp": get_utc_now_iso()
    }

@app.get("/api/state")
def get_full_state():
    return {
        "event": state.event,
        "zones": list(state.zones.values()),
        "warehouses": list(state.warehouses.values()),
        "hospitals": list(state.hospitals.values()),
        "shelters": list(state.shelters.values()),
        "roads": list(state.roads.values()),
        "active_allocations": state.allocations,
        "latest_run": state.optimization_runs[0] if state.optimization_runs else None,
        "notifications": state.notifications,
        "audit_logs_count": len(state.audit_logs)
    }

@app.get("/api/disaster")
def get_disaster_event():
    return state.event

@app.get("/api/zones")
def get_zones():
    return list(state.zones.values())

@app.get("/api/warehouses")
def get_warehouses():
    return list(state.warehouses.values())

@app.get("/api/roads")
def get_roads():
    return list(state.roads.values())

class OptimizeRequest(BaseModel):
    weights: Optional[OptimizationObjectiveWeights] = None

@app.post("/api/optimize")
def run_optimization(req: OptimizeRequest):
    weights = req.weights or OptimizationObjectiveWeights()
    state.log_audit(
        user="Officer in Command",
        role="SUPERVISOR",
        action="OPTIMIZATION_STARTED",
        details="Triggered multi-objective OR-Tools optimization run",
        metadata={"weights": weights.dict()}
    )

    run = optimization_engine.solve(
        zones=list(state.zones.values()),
        warehouses=list(state.warehouses.values()),
        roads=list(state.roads.values()),
        weights=weights,
        is_reoptimization=False,
        trigger_reason="User Triggered Optimization"
    )
    state.optimization_runs.insert(0, run)
    state.allocations = run.allocations

    state.log_audit(
        user="Optimization Engine",
        role="SYSTEM",
        action="OPTIMIZATION_COMPLETED",
        details=f"Run {run.id} generated {len(run.allocations)} allocations with runtime {run.runtime_ms}ms.",
        metadata={"avg_response_time": run.avg_response_time_min, "unmet_demand": run.unmet_demand_total}
    )

    return run

@app.post("/api/benchmark")
def run_benchmark():
    state.log_audit(
        user="System Evaluator",
        role="ANALYST",
        action="BENCHMARK_EXECUTED",
        details="Executed baseline greedy vs. ResQGrid OR-Tools comparative benchmark."
    )
    resqgrid_run, comparisons = optimization_engine.run_baseline_benchmark(
        zones=list(state.zones.values()),
        warehouses=list(state.warehouses.values()),
        roads=list(state.roads.values())
    )
    return {
        "resqgrid_run": resqgrid_run,
        "comparisons": comparisons
    }

class RoadClosureRequest(BaseModel):
    road_id: str
    reason: Optional[str] = "Severe inundation and debris blockage"

@app.post("/api/reoptimize/road-closure")
def road_closure(req: RoadClosureRequest):
    return reoptimization_engine.trigger_road_closure(req.road_id, req.reason)

class DemandSpikeRequest(BaseModel):
    zone_id: str
    multiplier: float = 1.4
    reason: Optional[str] = "Flash flood surge"

@app.post("/api/reoptimize/demand-spike")
def demand_spike(req: DemandSpikeRequest):
    return reoptimization_engine.trigger_demand_spike(req.zone_id, req.multiplier, req.reason)

class WarehouseReductionRequest(BaseModel):
    warehouse_id: str
    resource_type: str = "water"
    fraction_remaining: float = 0.3

@app.post("/api/reoptimize/warehouse-shortage")
def warehouse_shortage(req: WarehouseReductionRequest):
    return reoptimization_engine.trigger_warehouse_reduction(
        req.warehouse_id, req.resource_type, req.fraction_remaining
    )

class AllocationActionRequest(BaseModel):
    action: str # "APPROVE", "MODIFY", "REJECT", "DISPATCH"
    officer_name: str = "Chief Dispatch Officer"
    reason: Optional[str] = None
    modified_quantity: Optional[int] = None

@app.post("/api/allocations/{allocation_id}/action")
def allocation_action(allocation_id: str, req: AllocationActionRequest):
    target = None
    for a in state.allocations:
        if a.id == allocation_id:
            target = a
            break

    if not target:
        raise HTTPException(status_code=404, detail="Allocation item not found")

    old_status = target.status
    if req.action.upper() == "APPROVE":
        target.status = AllocationStatus.APPROVED
        target.approved_by = req.officer_name
    elif req.action.upper() == "REJECT":
        target.status = AllocationStatus.REJECTED
        target.modification_reason = req.reason or "Rejected by commander review"
    elif req.action.upper() == "DISPATCH":
        target.status = AllocationStatus.DISPATCHED
    elif req.action.upper() == "MODIFY":
        if not req.reason:
            raise HTTPException(status_code=400, detail="Modification reason is mandatory for human-in-the-loop override")
        target.status = AllocationStatus.MODIFIED
        target.modification_reason = req.reason
        if req.modified_quantity is not None:
            target.quantity = req.modified_quantity

    state.log_audit(
        user=req.officer_name,
        role="SUPERVISOR",
        action=f"ALLOCATION_{req.action.upper()}",
        resource_type="AllocationItem",
        resource_id=allocation_id,
        details=f"Allocation {allocation_id} for {target.destination_zone_name} ({target.resource_type}) set to {target.status}. Reason: {req.reason or 'Operational consensus'}.",
        metadata={"old_status": old_status, "new_status": target.status, "quantity": target.quantity}
    )

    return target

@app.get("/api/field-reports")
def get_field_reports():
    return state.field_reports

class FieldReportCreateRequest(BaseModel):
    reporter_name: str
    reporter_role: str
    location_name: str
    raw_text: str
    lat: Optional[float] = None
    lon: Optional[float] = None

@app.post("/api/field-reports")
def submit_field_report(req: FieldReportCreateRequest):
    # Run NLP extraction pipeline
    extracted = nlp_extractor.extract(req.raw_text, req.location_name)

    report_id = f"REP-{len(state.field_reports) + 1:03d}"
    from .utils.time_utils import get_utc_now_iso
    now_str = get_utc_now_iso()

    report = FieldReport(
        id=report_id,
        reporter_name=req.reporter_name,
        reporter_role=req.reporter_role,
        location_name=req.location_name,
        lat=req.lat or 26.18,
        lon=req.lon or 91.75,
        raw_text=req.raw_text,
        extracted_population=extracted["extracted_population"],
        extracted_needs=extracted["extracted_needs"],
        urgency=extracted["urgency"],
        confidence=extracted["confidence"],
        data_confidence_tier=extracted["data_confidence_tier"],
        status="Verified",
        timestamp=now_str
    )

    state.field_reports.insert(0, report)

    # If report maps to known zone, update demand signals dynamically
    matched_zone = None
    for z in state.zones.values():
        if z.name.lower() in req.location_name.lower() or req.location_name.lower() in z.name.lower():
            matched_zone = z
            break

    if matched_zone and extracted["extracted_needs"]:
        for r_name, q in extracted["extracted_needs"].items():
            attr = f"{r_name}_need"
            if hasattr(matched_zone, attr):
                current_val = getattr(matched_zone, attr)
                setattr(matched_zone, attr, max(current_val, q))
        priority_engine.calculate_zone_priority(matched_zone)

    state.log_audit(
        user=req.reporter_name,
        role="FIELD_RESPONDER",
        action="FIELD_REPORT_SUBMITTED",
        resource_type="FieldReport",
        resource_id=report_id,
        details=f"Report submitted from {req.location_name}. Extracted urgency: {report.urgency} ({report.data_confidence_tier}).",
        metadata={"extracted_needs": extracted["extracted_needs"]}
    )

    return report

@app.get("/api/audit-logs")
def get_audit_logs():
    return state.audit_logs

@app.get("/api/weather")
def get_weather():
    return weather_adapter.fetch_live_weather()

@app.get("/api/analytics")
def get_analytics():
    zones = list(state.zones.values())
    warehouses = list(state.warehouses.values())
    allocations = state.allocations

    # Compute resource totals: Required vs Available vs Allocated
    resource_keys = ["water", "food", "medical_kits", "ambulances", "medical_teams", "shelter_kits"]
    comparison_data = []

    for r in resource_keys:
        total_req = sum(getattr(z, f"{r}_need", 0) for z in zones)
        total_avail = sum(w.inventory.get(r, 0) for w in warehouses)
        total_alloc = sum(a.quantity for a in allocations if a.resource_type == r)
        comparison_data.append({
            "resource": r.replace('_', ' ').title(),
            "required": total_req,
            "available": total_avail,
            "allocated": total_alloc,
            "gap": max(0, total_req - total_alloc)
        })

    # Zone priorities and coverages
    zone_metrics = []
    for z in zones:
        zone_allocs = [a for a in allocations if a.destination_zone_id == z.id]
        zone_metrics.append({
            "zone": z.name,
            "severity": int(z.severity * 100),
            "priority": z.priority_score,
            "affected_population": z.affected_population,
            "allocations_count": len(zone_allocs),
            "accessibility": int(z.road_accessibility * 100)
        })

    # Optimization run trends
    run_history = []
    for r in state.optimization_runs[:8]:
        run_history.append({
            "run_id": r.id,
            "timestamp": r.timestamp,
            "response_time": r.avg_response_time_min,
            "unmet_demand": r.unmet_demand_total,
            "utilization": r.resource_utilization_pct,
            "equity_gap": r.equity_gap_score,
            "is_reopt": r.is_reoptimization
        })

    return {
        "resource_comparison": comparison_data,
        "zone_metrics": zone_metrics,
        "run_history": run_history,
        "active_disaster_summary": {
            "name": state.event.type,
            "affected_population": state.event.affected_population,
            "critical_zones": len([z for z in zones if z.priority_score >= 80]),
            "roads_open_pct": round(len([rd for rd in state.roads.values() if rd.status == RoadStatus.OPEN]) / max(1, len(state.roads)) * 100, 1)
        }
    }

@app.post("/api/reset")
def reset_state():
    state.reset_to_initial()
    startup_event()
    state.log_audit(
        user="System Admin",
        role="ADMIN",
        action="SYSTEM_RESET",
        details="Reset operational state back to pristine flood disaster baseline."
    )
    return {"status": "SUCCESS", "message": "State reset to initial flood scenario."}
