import React, { useState } from 'react';
import {
  Activity,
  Radio,
  Layers,
  ShieldCheck,
  Cpu,
  Sliders,
  Zap,
  UserCheck,
  Truck,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  Database,
  MapPin,
  Flame,
  FileSpreadsheet,
  AlertTriangle,
  HelpCircle,
  Clock,
  Compass,
  FileCheck2,
  Info,
  X
} from 'lucide-react';
import { NavTab } from './Sidebar';

interface MasterOperationalWorkflowProps {
  currentScenario: string;
  onSelectTab: (tab: NavTab) => void;
  isDarkMode?: boolean;
}

export type TruthClass =
  | 'LIVE'
  | 'NEAR_REAL_TIME'
  | 'PUBLIC'
  | 'HISTORICAL'
  | 'SYNTHETIC'
  | 'SIMULATION'
  | 'MANUAL'
  | 'AUTHORIZED';

export interface WorkflowStage {
  id: string;
  number: string;
  title: string;
  shortTitle: string;
  subtext: string;
  truthClass: TruthClass;
  icon: React.ComponentType<{ className?: string }>;
  status: string;
  statusColor: string;
  badge: string;
  tab: NavTab;
  algorithm: string;
  inputs: string[];
  outputs: string[];
  disclaimer?: string;
  description: string;
}

const MANDATORY_DISCLAIMER = "Operational resource inventory is simulated because no authorized live resource system is connected.";

export const MasterOperationalWorkflow: React.FC<MasterOperationalWorkflowProps> = ({
  currentScenario,
  onSelectTab,
  isDarkMode = true,
}) => {
  const [selectedStage, setSelectedStage] = useState<WorkflowStage | null>(null);

  const stages: WorkflowStage[] = [
    {
      id: 'data',
      number: '01',
      title: 'DATA',
      shortTitle: 'Data Ingestion',
      subtext: 'USGS, IMD, NASA FIRMS/IMERG, NOAA',
      truthClass: 'LIVE',
      icon: Radio,
      status: 'INGESTED',
      statusColor: isDarkMode ? 'text-red-400 bg-red-950/50 border-red-500/40' : 'text-red-800 bg-red-100 border-red-300',
      badge: '9 HAZARDS',
      tab: 'datasets',
      algorithm: 'REST Telemetry Ingestion + SHA-256 Manifest Verification',
      inputs: ['USGS Real-Time GeoJSON', 'IMD Daily Gridded Rainfall', 'NASA FIRMS VIIRS Hotspots', 'NOAA IBTrACS Tracks'],
      outputs: ['data/raw/ immutable storage with manifest checksums'],
      description: 'Ingests primary observational sensor feeds across all 9 disaster hazards from authoritative open science repositories.'
    },
    {
      id: 'data_fusion',
      number: '02',
      title: 'DATA FUSION',
      shortTitle: 'Multi-Source Fusion',
      subtext: 'Confidence scoring & deduplication',
      truthClass: 'PUBLIC',
      icon: Database,
      status: 'ALIGNED',
      statusColor: isDarkMode ? 'text-sky-400 bg-sky-950/50 border-sky-500/40' : 'text-sky-800 bg-sky-100 border-sky-300',
      badge: 'QC ENGINE',
      tab: 'datasets',
      algorithm: 'DataQualityEngine (Pydantic validation, coordinate bounds, deduplication)',
      inputs: ['Raw observations', 'Historical baselines', 'Field sensor packets'],
      outputs: ['Cleaned feature vectors', 'Data Quality Reports (Completeness, Uniqueness, Timeliness)'],
      description: 'Standardizes disparate temporal-spatial resolutions and evaluates data cleanliness before operational use.'
    },
    {
      id: 'situational_awareness',
      number: '03',
      title: 'SITUATIONAL AWARENESS',
      shortTitle: 'Common Operating Picture',
      subtext: 'Dynamic map layers & GIS status',
      truthClass: 'LIVE',
      icon: Compass,
      status: 'LIVE COP',
      statusColor: isDarkMode ? 'text-cyan-400 bg-cyan-950/50 border-cyan-500/40' : 'text-cyan-800 bg-cyan-100 border-cyan-300',
      badge: 'GIS COP',
      tab: 'map',
      algorithm: 'Real-time Leaflet WebGIS + Keyless Cartography Engine',
      inputs: ['OSM base layers', 'Hydrological river levels', 'Active dispatch breadcrumbs'],
      outputs: ['GeoJSON FeatureCollections', 'Multi-layer Common Operating Picture'],
      description: 'Provides commanders with visual intelligence across sectors, bridges, and infrastructure nodes.'
    },
    {
      id: 'hazard_analysis',
      number: '04',
      title: 'HAZARD ANALYSIS',
      shortTitle: 'Intensity & Cascade Physics',
      subtext: 'Earthquake M6.8 • Deluge 284mm • Cat 4',
      truthClass: 'NEAR_REAL_TIME',
      icon: Flame,
      status: 'CRITICAL',
      statusColor: isDarkMode ? 'text-orange-400 bg-orange-950/50 border-orange-500/40' : 'text-orange-800 bg-orange-100 border-orange-300',
      badge: 'PHYSICS',
      tab: 'simulation',
      algorithm: 'MultiHazardEngine (Peak ground acceleration, surge height, fire radiative power)',
      inputs: ['Focal depth & magnitude', 'Rainfall departure percent', 'Wind velocity knots'],
      outputs: ['Hazard intensity vectors', 'Compound cascading disaster trigger flags'],
      description: 'Models the physical propagation of disaster energy and computes secondary hazard vulnerability thresholds.'
    },
    {
      id: 'affected_area',
      number: '05',
      title: 'AFFECTED-AREA IDENTIFICATION',
      shortTitle: 'Impact Geometries',
      subtext: 'Inundation polygons & buffer zones',
      truthClass: 'SIMULATION',
      icon: MapPin,
      status: 'MAPPED',
      statusColor: isDarkMode ? 'text-amber-400 bg-amber-950/50 border-amber-500/40' : 'text-amber-800 bg-amber-100 border-amber-300',
      badge: 'SPATIAL JOIN',
      tab: 'map',
      algorithm: 'PostGIS spatial containment & bounding box polygon intersection',
      inputs: ['Satellite SAR flood extents', 'Topographic DEM elevation', 'Administrative ward borders'],
      outputs: ['Impacted municipal ward polygons', 'Vulnerability exposure buffers'],
      description: 'Delineates high-risk boundary polygons to isolate isolated zones and identify road bottlenecks.'
    },
    {
      id: 'population_vulnerability',
      number: '06',
      title: 'POPULATION / VULNERABILITY',
      shortTitle: 'Social Vulnerability (SVI)',
      subtext: 'Elderly, children, poverty, terrain',
      truthClass: 'HISTORICAL',
      icon: Activity,
      status: 'INDEXED',
      statusColor: isDarkMode ? 'text-pink-400 bg-pink-950/50 border-pink-500/40' : 'text-pink-800 bg-pink-100 border-pink-300',
      badge: 'SVI INDEX',
      tab: 'gaps',
      algorithm: 'Weighted Social Vulnerability Index (SVI = 0.40*Pop + 0.35*Elderly + 0.25*Poverty)',
      inputs: ['Subdistrict census records', 'Healthcare access distances', 'Slum density registries'],
      outputs: ['Zone vulnerability coefficients (0.0 to 1.0)'],
      description: 'Quantifies societal risk multipliers to guarantee relief equity for underprivileged sectors.'
    },
    {
      id: 'demand_estimation',
      number: '07',
      title: 'DEMAND ESTIMATION',
      shortTitle: 'ML Commodity Forecasting',
      subtext: 'SPHERE standards + GBM + Uncertainty',
      truthClass: 'SIMULATION',
      icon: Cpu,
      status: 'PREDICTED',
      statusColor: isDarkMode ? 'text-blue-400 bg-blue-950/50 border-blue-500/40' : 'text-blue-800 bg-blue-100 border-blue-300',
      badge: 'P10-P90 CI',
      tab: 'analyzer',
      algorithm: 'Gradient Boosting Regressor + Log-Residual Empirical Quantiles',
      inputs: ['Affected population', 'Rainfall mm', 'Severity score', 'Vulnerability coefficient'],
      outputs: ['Water (liters)', 'Food packets', 'Medical kits', 'Shelter tarpaulins', 'Ambulances needed'],
      description: 'Forecasts required humanitarian relief units with rigorous statistical uncertainty intervals.'
    },
    {
      id: 'priority_engine',
      number: '08',
      title: 'PRIORITY ENGINE',
      shortTitle: 'Multi-Criteria Triage',
      subtext: 'NDRF SOP triage scoring (0-100)',
      truthClass: 'SIMULATION',
      icon: Sliders,
      status: 'RANKED',
      statusColor: isDarkMode ? 'text-purple-400 bg-purple-950/50 border-purple-500/40' : 'text-purple-800 bg-purple-100 border-purple-300',
      badge: 'SOP TRIAGE',
      tab: 'dashboard',
      algorithm: 'Multi-Criteria Triage Index (0.35*Severity + 0.25*Pop + 0.20*Vuln + 0.20*HospitalDeficit)',
      inputs: ['Sector severity score', 'Estimated casualty influx', 'Accessibility index'],
      outputs: ['Priority ranking 0-100', 'Triage classification (Critical, High, Moderate, Low)'],
      description: 'Directs immediate resource allocation to the most fragile sectors under strict operational triage rules.'
    },
    {
      id: 'resource_inventory',
      number: '09',
      title: 'RESOURCE INVENTORY',
      shortTitle: 'Depot Stock Readiness',
      subtext: 'Warehouses, boats, ambulances, blood',
      truthClass: 'SYNTHETIC',
      disclaimer: MANDATORY_DISCLAIMER,
      icon: Layers,
      status: 'SIMULATED',
      statusColor: isDarkMode ? 'text-amber-300 bg-amber-950/50 border-amber-500/40' : 'text-amber-800 bg-amber-100 border-amber-300',
      badge: 'SYNTHETIC',
      tab: 'resources',
      algorithm: 'Dynamic Stock Ledger & Fleet Availability Tracker',
      inputs: ['Depot stockpiles', 'Vehicle fleet status', 'Hospital bed availability'],
      outputs: ['Live available capacity per commodity', 'Depot exhaustion estimates'],
      description: 'Tracks ready-state emergency equipment and supplies across regional supply nodes.'
    },
    {
      id: 'gis_analysis',
      number: '10',
      title: 'GIS ANALYSIS',
      shortTitle: 'Network Connectivity',
      subtext: 'Road obstructions & bridge bottlenecks',
      truthClass: 'PUBLIC',
      icon: MapPin,
      status: 'EVALUATED',
      statusColor: isDarkMode ? 'text-emerald-400 bg-emerald-950/50 border-emerald-500/40' : 'text-emerald-800 bg-emerald-100 border-emerald-300',
      badge: 'GRAPH TOPOLOGY',
      tab: 'map',
      algorithm: 'Road Network Graph Traversal & Elevation Cut Analysis',
      inputs: ['OpenStreetMap highway geometries', 'Flood vector intersections', 'Reported blockages'],
      outputs: ['Traversable road segments', 'Degraded travel time matrices'],
      description: 'Identifies severed arterial links and dynamically penalizes waterlogged road corridors.'
    },
    {
      id: 'routing',
      number: '11',
      title: 'ROUTING',
      shortTitle: 'Safe Corridor Dijkstra',
      subtext: 'Hazard-avoidance shortest safe paths',
      truthClass: 'SIMULATION',
      icon: Compass,
      status: 'SAFE-PATH',
      statusColor: isDarkMode ? 'text-teal-400 bg-teal-950/50 border-teal-500/40' : 'text-teal-800 bg-teal-100 border-teal-300',
      badge: 'DIJKSTRA',
      tab: 'map',
      algorithm: 'Constrained Dijkstra / Safe-Path Graph Search with Penalty Multipliers',
      inputs: ['Active road graph', 'Warehouse origins', 'Disaster zone destinations'],
      outputs: ['Optimal route polylines', 'Estimated travel times (minutes)'],
      description: 'Computes reliable transit routes circumventing washed-out causeways and debris fields.'
    },
    {
      id: 'constrained_optimization',
      number: '12',
      title: 'CONSTRAINED OPTIMIZATION',
      shortTitle: 'Google OR-Tools MIP',
      subtext: 'SCIP solver: min travel time + equity',
      truthClass: 'SIMULATION',
      icon: Zap,
      status: 'SOLVED (15ms)',
      statusColor: isDarkMode ? 'text-amber-300 bg-amber-950/60 border-amber-400/50' : 'text-amber-900 bg-amber-200 border-amber-400',
      badge: 'OR-TOOLS SCIP',
      tab: 'optimization',
      algorithm: 'Mixed-Integer Linear Programming (MIP) via Google OR-Tools SCIP 9.10',
      inputs: ['Warehouse supply limits', 'Zone demand caps', 'Route travel times', 'Priority weights'],
      outputs: ['Optimal integer dispatch matrix x[w, z, c]'],
      description: 'Mathematically solves multi-commodity supply allocation minimizing response latency and eliminating humanitarian deficits.'
    },
    {
      id: 'resource_allocation',
      number: '13',
      title: 'RESOURCE ALLOCATION',
      shortTitle: 'Dispatch Matrix',
      subtext: 'Depot-to-zone allocations with disclaimers',
      truthClass: 'SYNTHETIC',
      disclaimer: MANDATORY_DISCLAIMER,
      icon: Truck,
      status: 'PRIMED',
      statusColor: isDarkMode ? 'text-sky-300 bg-sky-950/50 border-sky-500/40' : 'text-sky-800 bg-sky-100 border-sky-300',
      badge: 'DISPATCH PLAN',
      tab: 'optimization',
      algorithm: 'Multi-Commodity Supply-Demand Mapping',
      inputs: ['OR-Tools optimal solution', 'Vehicle convoy capacities'],
      outputs: ['Individual allocation orders ALC-XXXX', 'Commodity quantity breakdown'],
      description: 'Converts mathematical solver decisions into concrete logistics deployment instructions.'
    },
    {
      id: 'resource_gap',
      number: '14',
      title: 'RESOURCE GAP',
      shortTitle: 'Deficit Analysis',
      subtext: 'Unmet demand & bottleneck detection',
      truthClass: 'SIMULATION',
      icon: AlertTriangle,
      status: 'ANALYZED',
      statusColor: isDarkMode ? 'text-rose-400 bg-rose-950/50 border-rose-500/40' : 'text-rose-800 bg-rose-100 border-rose-300',
      badge: 'DEFICIT ALERT',
      tab: 'gaps',
      algorithm: 'Slack Variable Deficit Accounting (Gap = Total Demand - Total Allocated)',
      inputs: ['Zone demands', 'Optimal dispatches'],
      outputs: ['Unmet demand percentages per commodity', 'Emergency procurement recommendations'],
      description: 'Flags critical supply shortages where regional stocks are insufficient to meet emergency needs.'
    },
    {
      id: 'explainable_recommendation',
      number: '15',
      title: 'EXPLAINABLE RECOMMENDATION',
      shortTitle: 'Operator Transparency',
      subtext: 'Clear operational rationale & math',
      truthClass: 'SIMULATION',
      icon: Info,
      status: 'EXPLAINED',
      statusColor: isDarkMode ? 'text-indigo-400 bg-indigo-950/50 border-indigo-500/40' : 'text-indigo-800 bg-indigo-100 border-indigo-300',
      badge: 'EXPLAINABLE AI',
      tab: 'optimization',
      algorithm: 'Dual Variable Sensitivity Analysis & Constraint Shadow Price Explainability',
      inputs: ['Binding constraints', 'Active route penalties', 'Priority weight rankings'],
      outputs: ['Natural language tactical summary', 'Constraint impact breakdown'],
      description: 'Explains exactly why specific warehouses were selected and how road disruptions altered supply routes.'
    },
    {
      id: 'commander_approval',
      number: '16',
      title: 'COMMANDER APPROVAL',
      shortTitle: 'Human-in-the-Loop Sign-off',
      subtext: 'Approve, modify, or reject orders',
      truthClass: 'AUTHORIZED',
      icon: UserCheck,
      status: 'SIGN-OFF GATE',
      statusColor: isDarkMode ? 'text-teal-300 bg-teal-950/50 border-teal-500/40' : 'text-teal-800 bg-teal-100 border-teal-300',
      badge: 'COMMAND GATE',
      tab: 'optimization',
      algorithm: 'Zero-Trust RBAC + Cryptographic Audit Logging',
      inputs: ['Incident Commander credentials', 'Operational rationale', 'Optional manual overrides'],
      outputs: ['Approved dispatch orders', 'Immutable SHA-256 audit event records'],
      description: 'Enforces human oversight so automated systems cannot dispatch live assets without officer validation.'
    },
    {
      id: 'dispatch_state',
      number: '17',
      title: 'DISPATCH STATE',
      shortTitle: 'Execution & Tracking',
      subtext: 'NDRF teams, convoys, live telemetry',
      truthClass: 'SYNTHETIC',
      disclaimer: MANDATORY_DISCLAIMER,
      icon: Truck,
      status: 'DISPATCHED',
      statusColor: isDarkMode ? 'text-cyan-300 bg-cyan-950/50 border-cyan-500/40' : 'text-cyan-800 bg-cyan-100 border-cyan-300',
      badge: 'LIVE FLEET',
      tab: 'resources',
      algorithm: 'Asset State Lifecycle Engine (PENDING -> DISPATCHED -> IN_TRANSIT -> DELIVERED)',
      inputs: ['Approved allocations', 'Assigned workforce units', 'GPS telemetry'],
      outputs: ['Vehicle tracking status', 'ETA calculations'],
      description: 'Manages physical deployment states and tracks convoy progress towards delivery targets.'
    },
    {
      id: 'feedback_reoptimization',
      number: '18',
      title: 'FIELD FEEDBACK & RE-OPTIMIZE',
      shortTitle: 'Dynamic Closed-Loop',
      subtext: 'SITREPs trigger sub-second re-solve',
      truthClass: 'LIVE',
      icon: RotateCcw,
      status: 'CLOSED-LOOP',
      statusColor: isDarkMode ? 'text-emerald-400 bg-emerald-950/60 border-emerald-400/50' : 'text-emerald-900 bg-emerald-200 border-emerald-400',
      badge: 'ADAPTIVE LOOP',
      tab: 'simulation',
      algorithm: 'Event-Driven Re-Optimization Engine with State Differential Triggers',
      inputs: ['Field SITREP reports', 'Unexpected road cuts', 'Secondary hazard cascades'],
      outputs: ['Dynamic re-allocation dispatches', 'Differential audit logs'],
      description: 'Closes the loop: when field conditions change or shocks occur, the system immediately recalculates optimal paths.'
    }
  ];

  return (
    <div className={`p-5 rounded-2xl border shadow-xl space-y-4 transition-all ${
      isDarkMode
        ? 'bg-slate-900/95 border-slate-800'
        : 'bg-white border-slate-200 shadow-slate-200/50'
    }`}>
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 ${
        isDarkMode ? 'border-slate-800/60' : 'border-slate-200'
      }`}>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
              isDarkMode ? 'text-sky-400' : 'text-sky-700 font-extrabold'
            }`}>
              18-Stage End-to-End Operational Architecture
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
              isDarkMode
                ? 'bg-sky-950/80 border-sky-500/40 text-sky-300'
                : 'bg-sky-100 border-sky-300 text-sky-800'
            }`}>
              COMMON CORE MULTI-HAZARD ENGINE
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
              isDarkMode
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                : 'bg-emerald-100 border-emerald-300 text-emerald-800'
            }`}>
              CLOSED-LOOP FEEDBACK: ONLINE
            </span>
          </div>
          <h2 className={`text-base font-bold tracking-tight mt-0.5 ${
            isDarkMode ? 'text-white' : 'text-slate-900'
          }`}>
            Target Operational Chain: Data &rarr; Demand &rarr; Optimization &rarr; Commander Approval &rarr; Dynamic Re-Optimization
          </h2>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className={`text-xs font-mono font-semibold ${
            isDarkMode ? 'text-slate-300' : 'text-slate-700'
          }`}>
            18 / 18 STAGES PRIMED
          </span>
        </div>
      </div>

      {/* Horizontal Scrollable Stepper Chain */}
      <div className="overflow-x-auto pb-3 scrollbar-thin">
        <div className="flex items-center min-w-max space-x-2">
          {stages.map((stage, idx) => {
            const Icon = stage.icon;
            const isSelected = selectedStage?.id === stage.id;
            return (
              <React.Fragment key={stage.id}>
                <button
                  onClick={() => setSelectedStage(stage)}
                  className={`group relative p-2.5 rounded-xl border text-left transition-all cursor-pointer hover:scale-[1.02] flex flex-col justify-between w-44 shrink-0 ${
                    isSelected
                      ? (isDarkMode ? 'bg-sky-950/90 border-sky-400 ring-2 ring-sky-500/30' : 'bg-sky-50 border-sky-500 ring-2 ring-sky-400/30')
                      : (isDarkMode
                        ? 'bg-slate-950/80 hover:bg-slate-800/80 border-slate-800 hover:border-sky-500/40'
                        : 'bg-slate-50 hover:bg-sky-50/50 border-slate-200 hover:border-sky-400 shadow-sm')
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[10px] font-mono font-bold ${
                      isDarkMode ? 'text-slate-500 group-hover:text-sky-400' : 'text-slate-500 group-hover:text-sky-700'
                    }`}>
                      {stage.number}
                    </span>
                    <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                      stage.truthClass === 'LIVE' ? (isDarkMode ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-red-100 text-red-900 border-red-300') :
                      stage.truthClass === 'NEAR_REAL_TIME' ? (isDarkMode ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-amber-100 text-amber-900 border-amber-300') :
                      stage.truthClass === 'SYNTHETIC' ? (isDarkMode ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-amber-100 text-amber-900 border-amber-300') :
                      stage.truthClass === 'AUTHORIZED' ? (isDarkMode ? 'bg-teal-500/20 text-teal-300 border-teal-500/30' : 'bg-teal-100 text-teal-900 border-teal-300') :
                      (isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-200 text-slate-800 border-slate-300')
                    }`}>
                      {stage.truthClass}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5 my-1">
                    <div className={`p-1.5 rounded-lg shrink-0 ${
                      isDarkMode ? 'bg-slate-800 text-sky-400' : 'bg-white text-sky-700 shadow-sm border border-slate-200'
                    }`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="overflow-hidden">
                      <div className={`text-[11px] font-bold truncate ${
                        isDarkMode ? 'text-white' : 'text-slate-900'
                      }`}>
                        {stage.shortTitle}
                      </div>
                    </div>
                  </div>

                  <div className={`text-[9px] line-clamp-1 mt-0.5 leading-tight ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    {stage.subtext}
                  </div>

                  <div className={`text-[8px] font-mono font-bold mt-2 pt-1 border-t flex items-center justify-between ${
                    isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
                  }`}>
                    <span className="flex items-center gap-1 truncate">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                      {stage.status}
                    </span>
                    <span className="text-sky-400 shrink-0">Details</span>
                  </div>
                </button>

                {idx < stages.length - 1 && (
                  <ArrowRight className={`w-3 h-3 shrink-0 ${
                    isDarkMode ? 'text-slate-600' : 'text-slate-400'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Selected Stage Detail Inspector */}
      {selectedStage && (
        <div className={`p-4 rounded-xl border animate-in fade-in slide-in-from-top-2 duration-200 transition-all ${
          isDarkMode ? 'bg-slate-950/90 border-sky-500/30' : 'bg-sky-50/50 border-sky-200'
        }`}>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className={`text-xs font-mono font-bold ${isDarkMode ? 'text-sky-400' : 'text-sky-700'}`}>
                  STAGE {selectedStage.number} OF 18
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border font-mono ${
                  selectedStage.truthClass === 'SYNTHETIC'
                    ? (isDarkMode ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-amber-100 text-amber-900 border-amber-300')
                    : selectedStage.truthClass === 'LIVE'
                    ? (isDarkMode ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-red-100 text-red-900 border-red-300')
                    : selectedStage.truthClass === 'AUTHORIZED'
                    ? (isDarkMode ? 'bg-teal-500/20 text-teal-300 border-teal-500/30' : 'bg-teal-100 text-teal-900 border-teal-300')
                    : (isDarkMode ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-100 text-emerald-900 border-emerald-300')
                }`}>
                  TRUTH CLASS: {selectedStage.truthClass}
                </span>
                <span className={`text-xs font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Algorithm: {selectedStage.algorithm}
                </span>
              </div>
              <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {selectedStage.title} &mdash; {selectedStage.shortTitle}
              </h3>
              <p className={`text-xs leading-relaxed max-w-4xl ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                {selectedStage.description}
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => onSelectTab(selectedStage.tab)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white transition shadow-sm"
              >
                Open Subsystem &rarr;
              </button>
              <button
                onClick={() => setSelectedStage(null)}
                className={`p-1 rounded-lg transition ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-600'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {selectedStage.disclaimer && (
            <div className={`mt-3 p-2.5 rounded-lg border text-xs font-mono flex items-center space-x-2 ${
              isDarkMode
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                : 'bg-amber-50 border-amber-300 text-amber-900'
            }`}>
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
              <span>
                <strong>MANDATORY TRUTH NOTICE:</strong> {selectedStage.disclaimer}
              </span>
            </div>
          )}

          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t text-xs ${
            isDarkMode ? 'border-slate-800/60' : 'border-sky-200'
          }`}>
            <div>
              <span className={`font-mono font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-700'}`}>Inputs to this stage:</span>
              <ul className={`list-disc list-inside mt-1 space-y-0.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                {selectedStage.inputs.map((inp, i) => (
                  <li key={i}>{inp}</li>
                ))}
              </ul>
            </div>
            <div>
              <span className={`font-mono font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-700'}`}>Outputs generated:</span>
              <ul className={`list-disc list-inside mt-1 space-y-0.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                {selectedStage.outputs.map((out, i) => (
                  <li key={i}>{out}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
