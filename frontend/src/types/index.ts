export type ResourceType =
  | 'water'
  | 'food'
  | 'medical_kits'
  | 'ambulances'
  | 'medical_teams'
  | 'shelter_kits'
  | 'trucks'
  | 'drones';

export type RoadStatus = 'open' | 'blocked' | 'damaged' | 'waterlogged';

export type AllocationStatus =
  | 'pending_approval'
  | 'approved'
  | 'modified'
  | 'rejected'
  | 'dispatched'
  | 'completed';

export interface DisasterEvent {
  id: string;
  event_number: string;
  type: string;
  severity: string;
  status: string;
  start_time: string;
  location: string;
  affected_population: number;
  description: string;
  rainfall_mm: number;
  river_level_meters: number;
  danger_mark_meters: number;
  created_at: string;
  updated_at: string;
}

export interface AffectedZone {
  id: string;
  event_id: string;
  name: string;
  population: number;
  affected_population: number;
  severity: number;
  vulnerability: number;
  medical_need: number;
  food_need: number;
  water_need: number;
  shelter_need: number;
  ambulances_need: number;
  medical_teams_need: number;
  lat: number;
  lon: number;
  road_accessibility: number;
  hospital_capacity: number;
  priority_score: number;
  is_critical: boolean;
  notes?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  lat: number;
  lon: number;
  capacity: number;
  operational_status: string;
  inventory: Record<string, number>;
  vehicles_available: Record<string, number>;
  personnel_available: Record<string, number>;
}

export interface Hospital {
  id: string;
  name: string;
  lat: number;
  lon: number;
  total_beds: number;
  available_beds: number;
  icu_available: number;
  status: string;
}

export interface Shelter {
  id: string;
  name: string;
  lat: number;
  lon: number;
  capacity: number;
  current_occupancy: number;
  available_capacity: number;
  status: string;
}

export interface Road {
  id: string;
  name: string;
  from_node: string;
  to_node: string;
  distance_km: number;
  standard_travel_min: number;
  status: RoadStatus;
  flood_depth_cm: number;
  speed_multiplier: number;
}

export interface AllocationItem {
  id: string;
  optimization_run_id: string;
  resource_type: string;
  source_warehouse_id: string;
  source_warehouse_name: string;
  destination_zone_id: string;
  destination_zone_name: string;
  quantity: number;
  vehicle_type: string;
  route_nodes: string[];
  distance_km: number;
  estimated_time_min: number;
  cost_index: number;
  priority_score: number;
  reason: string;
  status: AllocationStatus;
  modification_reason?: string;
  approved_by?: string;
  timestamp: string;
}

export interface ResourceGap {
  zone_id: string;
  zone_name: string;
  resource_type: string;
  required: number;
  allocated: number;
  shortage: number;
  coverage_pct: number;
  severity: 'Critical' | 'Moderate' | 'Covered';
  recommended_action: string;
}

export interface OptimizationObjectiveWeights {
  response_time: number;
  unmet_demand: number;
  travel_distance: number;
  equity: number;
  resource_priorities: Record<string, number>;
}

export interface OptimizationRun {
  id: string;
  event_id: string;
  timestamp: string;
  objective_weights: OptimizationObjectiveWeights;
  total_zones: number;
  zones_served: number;
  total_resources_allocated: number;
  unmet_demand_total: number;
  avg_response_time_min: number;
  total_travel_distance_km: number;
  resource_utilization_pct: number;
  equity_gap_score: number;
  status: string;
  runtime_ms: number;
  is_reoptimization: boolean;
  trigger_reason?: string;
  allocations: AllocationItem[];
  gaps: ResourceGap[];
}

export interface BenchmarkComparison {
  metric: string;
  baseline_value: number;
  optimized_value: number;
  improvement_pct: number;
  unit: string;
  direction: 'lower_is_better' | 'higher_is_better';
  explanation: string;
}

export interface FieldReport {
  id: string;
  reporter_name: string;
  reporter_role: string;
  location_name: string;
  lat?: number;
  lon?: number;
  raw_text: string;
  extracted_population?: number;
  extracted_needs: Record<string, number>;
  urgency: 'Critical' | 'High' | 'Medium' | 'Low';
  confidence: number;
  data_confidence_tier: string;
  status: string;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  details: string;
  metadata: Record<string, any>;
}

export interface SystemState {
  event: DisasterEvent;
  zones: AffectedZone[];
  warehouses: Warehouse[];
  hospitals: Hospital[];
  shelters: Shelter[];
  roads: Road[];
  active_allocations: AllocationItem[];
  latest_run: OptimizationRun | null;
  notifications: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
  }>;
  audit_logs_count: number;
}

export interface WorkforceTeam {
  id: string;
  name: string;
  role: string;
  skill: string;
  location: string;
  availability: 'AVAILABLE' | 'DEPLOYED' | 'UNAVAILABLE' | 'ON_DUTY' | 'OFF_DUTY';
  capacity: number;
  current_assignment?: string;
  contact?: string;
}

export interface DispatchItem {
  id: string;
  allocation_id: string;
  resource_type: string;
  quantity: number;
  team_id?: string;
  team_name?: string;
  destination_zone_id: string;
  destination_zone_name: string;
  source_warehouse_id: string;
  source_warehouse_name: string;
  vehicle_type: string;
  eta_min: number;
  status: 'PLANNED' | 'ASSIGNED' | 'DISPATCHED' | 'IN_TRANSIT' | 'ARRIVED' | 'DEPLOYED' | 'COMPLETED';
  departure_time?: string;
  completion_time?: string;
  notes?: string;
  timestamp: string;
}

export interface VerificationResult {
  status: 'VERIFIED' | 'PARTIALLY_VERIFIED' | 'CONFLICTING' | 'UNVERIFIED';
  confidence: number;
  evidence: string[];
  conflicts_detected: string[];
}

export interface ImpactAssessment {
  impact_score: number;
  impact_level: string;
  factors: Record<string, number>;
  confidence: number;
  reported_vs_estimated: Record<string, string>;
}

export interface DemandForecast {
  resource: string;
  required_quantity: number;
  current_available: number;
  shortage: number;
  forecast_horizon: string;
  confidence: number;
  is_estimated: boolean;
}

export interface ExplainableRecommendation {
  why_resource: string;
  why_location: string;
  why_quantity: string;
  why_team: string;
  why_priority: string;
  factors_summary: string[];
}

export interface IncidentCreateRequest {
  disaster_type: string;
  location: string;
  lat?: number;
  lon?: number;
  affected_population: number;
  casualties?: number;
  missing_people?: number;
  injured_people?: number;
  infrastructure_damage?: string;
  medical_needs?: number;
  water_needs?: number;
  food_needs?: number;
  shelter_needs?: number;
  urgency?: string;
  raw_text?: string;
  source?: string;
}

export interface IncidentPipelineResult {
  incident_id: string;
  incident_number: string;
  disaster_type: string;
  location: string;
  lat: number;
  lon: number;
  severity: string;
  affected_population: number;
  extraction_details: Record<string, { value: any; confidence: number; source: string }>;
  verification: VerificationResult;
  impact: ImpactAssessment;
  demand_forecasts: DemandForecast[];
  priority_score: number;
  priority_level: string;
  priority_reasons: string[];
  recommended_allocations: AllocationItem[];
  recommendation_explanation: ExplainableRecommendation;
  dispatches: DispatchItem[];
  audit_event_id: string;
  timestamp: string;
}

export interface SyntheticScenario {
  id: string;
  title: string;
  tag: string;
  disaster_type: string;
  location: string;
  rainfall_mm: number;
  river_level_meters: number;
  danger_mark_meters: number;
  affected_population: number;
  description: string;
  synthetic: boolean;
}

export interface ExecutiveReports {
  incident_report: Record<string, any>;
  allocation_report: Record<string, any>;
  performance_report: Record<string, any>;
}
