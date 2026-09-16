from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum

class ResourceType(str, Enum):
    WATER = "water"                      # Liters
    FOOD = "food"                        # Rations / Packets
    MEDICAL_KITS = "medical_kits"        # Kits
    AMBULANCES = "ambulances"            # Vehicles
    MEDICAL_TEAMS = "medical_teams"      # Teams of doctors/paramedics
    SHELTER_KITS = "shelter_kits"        # Tents / Beds
    TRUCKS = "trucks"                    # Cargo transport
    DRONES = "drones"                    # Recon & swift airdrop

class RoadStatus(str, Enum):
    OPEN = "open"
    BLOCKED = "blocked"
    DAMAGED = "damaged"
    WATERLOGGED = "waterlogged"

class AllocationStatus(str, Enum):
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    MODIFIED = "modified"
    REJECTED = "rejected"
    DISPATCHED = "dispatched"
    COMPLETED = "completed"

class DisasterEvent(BaseModel):
    id: str
    event_number: str
    type: str = "Flood"
    severity: str = "Critical"  # Critical, High, Moderate, Low
    status: str = "Active"
    start_time: str
    location: str
    affected_population: int
    description: str
    rainfall_mm: float = 245.0
    river_level_meters: float = 14.8
    danger_mark_meters: float = 12.0
    created_at: str
    updated_at: str

class AffectedZone(BaseModel):
    id: str
    event_id: str
    name: str
    population: int
    affected_population: int
    severity: float = Field(..., ge=0.0, le=1.0) # 0 to 1
    vulnerability: float = Field(..., ge=0.0, le=1.0) # elderly, terrain, poverty
    medical_need: int = 0
    food_need: int = 0
    water_need: int = 0
    shelter_need: int = 0
    ambulances_need: int = 0
    medical_teams_need: int = 0
    lat: float
    lon: float
    road_accessibility: float = 1.0  # 0 to 1
    hospital_capacity: int = 0
    priority_score: float = 0.0
    is_critical: bool = False
    notes: Optional[str] = None

class Warehouse(BaseModel):
    id: str
    name: str
    location: str
    lat: float
    lon: float
    capacity: int
    operational_status: str = "Operational"
    inventory: Dict[str, int] = {}
    vehicles_available: Dict[str, int] = {}
    personnel_available: Dict[str, int] = {}

class Hospital(BaseModel):
    id: str
    name: str
    lat: float
    lon: float
    total_beds: int
    available_beds: int
    icu_available: int
    status: str = "Operational"

class Shelter(BaseModel):
    id: str
    name: str
    lat: float
    lon: float
    capacity: int
    current_occupancy: int
    available_capacity: int
    status: str = "Operational"

class Road(BaseModel):
    id: str
    name: str
    from_node: str
    to_node: str
    distance_km: float
    standard_travel_min: float
    status: RoadStatus = RoadStatus.OPEN
    flood_depth_cm: float = 0.0
    speed_multiplier: float = 1.0  # slows down if waterlogged

class UserRole(str, Enum):
    ADMIN = "ADMIN"
    DISTRICT_OFFICER = "DISTRICT_OFFICER"
    OPERATIONS_OFFICER = "OPERATIONS_OFFICER"
    FIELD_RESPONDER = "FIELD_RESPONDER"
    VIEWER = "VIEWER"

class DemandEstimate(BaseModel):
    id: str
    zone_id: str
    zone_name: str
    resource_type: str
    estimated_demand: int
    confidence: float
    source: str
    timestamp: str
    model_version: str
    lower_bound: Optional[int] = None
    upper_bound: Optional[int] = None
    uncertainty_range: Optional[str] = None
    data_freshness_min: Optional[float] = None
    source_reliability: Optional[float] = None

class PriorityScore(BaseModel):
    zone_id: str
    zone_name: str
    overall_score: float
    severity_weight: float
    population_weight: float
    medical_weight: float
    vulnerability_weight: float
    accessibility_weight: float
    time_weight: float
    confidence: float
    explanation: List[str]

class AllocationItem(BaseModel):
    id: str
    optimization_run_id: str
    resource_type: str
    source_warehouse_id: str
    source_warehouse_name: str
    destination_zone_id: str
    destination_zone_name: str
    quantity: int
    vehicle_type: str
    route_nodes: List[str]
    distance_km: float
    estimated_time_min: float
    cost_index: float
    priority_score: float
    reason: str
    status: AllocationStatus = AllocationStatus.PENDING_APPROVAL
    modification_reason: Optional[str] = None
    approved_by: Optional[str] = None
    timestamp: str

class ResourceGap(BaseModel):
    zone_id: str
    zone_name: str
    resource_type: str
    required: int
    allocated: int
    shortage: int
    coverage_pct: float
    severity: str  # Critical, Moderate, Covered
    recommended_action: str

class OptimizationObjectiveWeights(BaseModel):
    response_time: float = 0.30
    unmet_demand: float = 0.35
    travel_distance: float = 0.15
    equity: float = 0.20
    resource_priorities: Dict[str, float] = {
        "medical_kits": 1.0,
        "ambulances": 1.0,
        "medical_teams": 0.95,
        "water": 0.85,
        "food": 0.70,
        "shelter_kits": 0.60,
        "trucks": 0.50,
        "drones": 0.45
    }

class OptimizationRun(BaseModel):
    id: str
    event_id: str
    timestamp: str
    objective_weights: OptimizationObjectiveWeights
    total_zones: int
    zones_served: int
    total_resources_allocated: int
    unmet_demand_total: int
    avg_response_time_min: float
    total_travel_distance_km: float
    resource_utilization_pct: float
    equity_gap_score: float
    status: str
    runtime_ms: float
    is_reoptimization: bool = False
    trigger_reason: Optional[str] = None
    allocations: List[AllocationItem] = []
    gaps: List[ResourceGap] = []

class BenchmarkComparison(BaseModel):
    metric: str
    baseline_value: float
    optimized_value: float
    improvement_pct: float
    unit: str
    direction: str  # "lower_is_better" or "higher_is_better"
    explanation: str

class FieldReport(BaseModel):
    id: str
    reporter_name: str
    reporter_role: str
    location_name: str
    lat: Optional[float] = None
    lon: Optional[float] = None
    raw_text: str
    extracted_population: Optional[int] = None
    extracted_needs: Dict[str, int] = {}
    urgency: str = "Medium"
    confidence: float = 0.85
    data_confidence_tier: str = "HIGH CONFIDENCE"  # HIGH CONFIDENCE, MEDIUM CONFIDENCE, LOW CONFIDENCE, CONFLICTING
    status: str = "Verified"
    timestamp: str

class AuditLog(BaseModel):
    id: str
    timestamp: str
    user: str
    role: str
    action: str
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    details: str
    metadata: Dict[str, Any] = {}

class SimulationScenario(BaseModel):
    id: str
    name: str
    description: str
    road_closures: List[str] = []
    demand_multipliers: Dict[str, float] = {}
    warehouse_capacity_multipliers: Dict[str, float] = {}
    disabled_vehicles: List[str] = []

class DispatchStatus(str, Enum):
    PLANNED = "PLANNED"
    ASSIGNED = "ASSIGNED"
    DISPATCHED = "DISPATCHED"
    IN_TRANSIT = "IN_TRANSIT"
    ARRIVED = "ARRIVED"
    DEPLOYED = "DEPLOYED"
    COMPLETED = "COMPLETED"

class VerificationStatus(str, Enum):
    VERIFIED = "VERIFIED"
    PARTIALLY_VERIFIED = "PARTIALLY_VERIFIED"
    CONFLICTING = "CONFLICTING"
    UNVERIFIED = "UNVERIFIED"

class WorkforceTeam(BaseModel):
    id: str
    name: str
    role: str
    skill: str
    location: str
    availability: str = "AVAILABLE"  # AVAILABLE, DEPLOYED, UNAVAILABLE, ON_DUTY, OFF_DUTY
    capacity: int = 10
    current_assignment: Optional[str] = None
    contact: Optional[str] = None

class DispatchItem(BaseModel):
    id: str
    allocation_id: str
    resource_type: str
    quantity: int
    team_id: Optional[str] = None
    team_name: Optional[str] = None
    destination_zone_id: str
    destination_zone_name: str
    source_warehouse_id: str
    source_warehouse_name: str
    vehicle_type: str
    eta_min: float
    status: DispatchStatus = DispatchStatus.PLANNED
    departure_time: Optional[str] = None
    completion_time: Optional[str] = None
    notes: Optional[str] = None
    timestamp: str

class ExtractedAttribute(BaseModel):
    value: Any
    confidence: float
    source: str

class VerificationResult(BaseModel):
    status: VerificationStatus
    confidence: float
    evidence: List[str]
    conflicts_detected: List[str] = []

class ImpactAssessment(BaseModel):
    impact_score: float
    impact_level: str
    factors: Dict[str, float]
    confidence: float
    reported_vs_estimated: Dict[str, str] = {}

class DemandForecast(BaseModel):
    resource: str
    required_quantity: int
    current_available: int
    shortage: int
    forecast_horizon: str = "24h"
    confidence: float = 0.85
    is_estimated: bool = True

class ExplainableRecommendation(BaseModel):
    why_resource: str
    why_location: str
    why_quantity: str
    why_team: str
    why_priority: str
    factors_summary: List[str]

class IncidentCreateRequest(BaseModel):
    disaster_type: str = "Flood"
    location: str
    lat: Optional[float] = None
    lon: Optional[float] = None
    affected_population: int
    casualties: int = 0
    missing_people: int = 0
    injured_people: int = 0
    infrastructure_damage: str = "Severe"
    medical_needs: int = 0
    water_needs: int = 0
    food_needs: int = 0
    shelter_needs: int = 0
    urgency: str = "High"
    raw_text: Optional[str] = None
    source: str = "Field Dispatch Form"

class IncidentPipelineResult(BaseModel):
    incident_id: str
    incident_number: str
    disaster_type: str
    location: str
    lat: float
    lon: float
    severity: str
    affected_population: int
    extraction_details: Dict[str, ExtractedAttribute]
    verification: VerificationResult
    impact: ImpactAssessment
    demand_forecasts: List[DemandForecast]
    priority_score: float
    priority_level: str
    priority_reasons: List[str]
    recommended_allocations: List[AllocationItem]
    recommendation_explanation: ExplainableRecommendation
    dispatches: List[DispatchItem]
    audit_event_id: str
    timestamp: str
