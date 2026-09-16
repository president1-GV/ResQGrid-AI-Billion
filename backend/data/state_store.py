from typing import List, Dict, Optional, Any
from datetime import datetime
import json
from .seed_data import (
    get_initial_disaster_event, get_initial_zones, get_initial_warehouses,
    get_initial_hospitals, get_initial_shelters, get_initial_roads,
    get_initial_workforce, get_initial_dispatches, get_synthetic_scenarios
)
from ..models.schemas import (
    DisasterEvent, AffectedZone, Warehouse, Hospital, Shelter, Road,
    AllocationItem, OptimizationRun, FieldReport, AuditLog, RoadStatus,
    AllocationStatus, WorkforceTeam, DispatchItem
)

class StateStore:
    def __init__(self):
        self.reset_to_initial()

    def reset_to_initial(self):
        self.event: DisasterEvent = get_initial_disaster_event()
        self.zones: Dict[str, AffectedZone] = {z.id: z for z in get_initial_zones()}
        self.warehouses: Dict[str, Warehouse] = {w.id: w for w in get_initial_warehouses()}
        self.hospitals: Dict[str, Hospital] = {h.id: h for h in get_initial_hospitals()}
        self.shelters: Dict[str, Shelter] = {s.id: s for s in get_initial_shelters()}
        self.roads: Dict[str, Road] = {r.id: r for r in get_initial_roads()}
        self.workforce: Dict[str, WorkforceTeam] = {t.id: t for t in get_initial_workforce()}
        self.dispatches: List[DispatchItem] = get_initial_dispatches()
        self.demo_scenarios: Dict[str, Any] = get_synthetic_scenarios()
        self.incidents: List[Dict[str, Any]] = []
        self.allocations: List[AllocationItem] = []
        self.optimization_runs: List[OptimizationRun] = []
        self.field_reports: List[FieldReport] = [
            FieldReport(
                id="REP-001",
                reporter_name="Inspector S. Borah",
                reporter_role="NDRF Team 4 Leader",
                location_name="Riverbank Colony, Sector East",
                lat=26.195,
                lon=91.732,
                raw_text="Embankment breached near sluice gate. Sector East community hall has roughly 120 elderly persons stranded without clean water. Drinking water supply contaminated. 3 persons urgently requiring insulin and respiratory support.",
                extracted_population=120,
                extracted_needs={"water": 1500, "food": 500, "medical_kits": 25, "ambulances": 2},
                urgency="Critical",
                confidence=0.92,
                data_confidence_tier="HIGH CONFIDENCE",
                status="Verified",
                timestamp="2026-09-16T11:45:00Z"
            ),
            FieldReport(
                id="REP-002",
                reporter_name="Dr. Anita Roy",
                reporter_role="Primary Health Center MO",
                location_name="South Slum Cluster, Lane 8",
                lat=26.148,
                lon=91.745,
                raw_text="Severe waterlogging, drain backflow causing acute gastroenteritis spike. More than 200 pediatric patients exhibiting diarrhea symptoms. Clinic IV fluids exhausted. Urgent need for 500 ORS packets, clean water pouches, and 2 paramedic teams.",
                extracted_population=280,
                extracted_needs={"water": 3500, "medical_kits": 80, "medical_teams": 2, "ambulances": 3},
                urgency="Critical",
                confidence=0.88,
                data_confidence_tier="HIGH CONFIDENCE",
                status="Verified",
                timestamp="2026-09-16T12:15:00Z"
            )
        ]
        self.audit_logs: List[AuditLog] = [
            AuditLog(
                id="LOG-001",
                timestamp="2026-09-16T08:00:00Z",
                user="System",
                role="ADMIN",
                action="EVENT_INITIALIZED",
                resource_type="DisasterEvent",
                resource_id="EVT-FLOOD-2026-01",
                details="Initial Flood Emergency Event registered for Brahmaputra-Kamrup Basin Sector.",
                metadata={"severity": "Critical", "zones_count": 7}
            )
        ]
        self.notifications: List[Dict[str, Any]] = [
            {
                "id": "NOTIF-1",
                "type": "CRITICAL_ALERT",
                "title": "Severe Flood Inundation Alert",
                "message": "Brahmaputra water level reached 14.8m (2.8m above danger mark). 7 zones impacted.",
                "timestamp": "2026-09-16T08:15:00Z",
                "read": False
            },
            {
                "id": "NOTIF-2",
                "type": "WARNING",
                "title": "Road R17 Causeway Vulnerability",
                "message": "Waterlogging reported on North Bridge Causeway (Road R17). Speed limited to 60%.",
                "timestamp": "2026-09-16T09:30:00Z",
                "read": False
            }
        ]

    def log_audit(self, user: str, role: str, action: str, details: str, resource_type: Optional[str] = None, resource_id: Optional[str] = None, metadata: Optional[Dict[str, Any]] = None):
        from ..utils.time_utils import get_utc_now_iso
        log = AuditLog(
            id=f"LOG-{len(self.audit_logs) + 1:04d}",
            timestamp=get_utc_now_iso(),
            user=user,
            role=role,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details,
            metadata=metadata or {}
        )
        self.audit_logs.insert(0, log)
        return log

    def add_audit_log(self, action: str, details: str, entity_type: Optional[str] = None, entity_id: Optional[str] = None, user: str = "System", role: str = "OFFICER", metadata: Optional[Dict[str, Any]] = None):
        return self.log_audit(
            user=user,
            role=role,
            action=action,
            details=details,
            resource_type=entity_type,
            resource_id=entity_id,
            metadata=metadata
        )

    def load_demo_scenario(self, scenario_id: str):
        if scenario_id not in self.demo_scenarios:
            return None
        scenario = self.demo_scenarios[scenario_id]
        self.event.type = scenario["disaster_type"]
        self.event.location = scenario["location"]
        self.event.rainfall_mm = scenario["rainfall_mm"]
        self.event.river_level_meters = scenario["river_level_meters"]
        self.event.affected_population = scenario["affected_population"]
        self.event.description = scenario["description"]
        self.log_audit(
            user="Evaluator",
            role="SUPERVISOR",
            action="SCENARIO_LOADED",
            resource_type="SyntheticDemoScenario",
            resource_id=scenario_id,
            details=f"Loaded synthetic scenario '{scenario['title']}' ({scenario['tag']})."
        )
        return scenario

state = StateStore()
