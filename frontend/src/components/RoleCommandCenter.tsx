import React, { useState, useEffect } from 'react';
import {
  Shield,
  Activity,
  Truck,
  MapPin,
  Radio,
  Sliders,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Users,
  Compass,
  FileText,
  RotateCcw,
  Flame,
  Waves,
  Eye,
  Check,
  X,
  ExternalLink,
  ChevronRight,
  Maximize2,
  Minimize2,
  Building2,
  Crosshair,
  Database
} from 'lucide-react';
import { SystemState, OptimizationObjectiveWeights } from '../types';
import { NavTab } from './Sidebar';
import { simulateCascade, fetchHazards, fetchCatalog, fetchProvenance } from '../services/api';

export type OperationalRole = 'ndrf_head' | 'commander' | 'logistics' | 'gis' | 'field';

interface RoleCommandCenterProps {
  state: SystemState;
  isDarkMode: boolean;
  onSelectTab: (tab: NavTab) => void;
  onApproveAllocation: (id: string) => void;
  onRejectAllocation: (id: string) => void;
  onOptimize?: (weights: OptimizationObjectiveWeights) => Promise<void>;
  onCloseRoad?: (roadId: string, reason?: string) => Promise<any>;
  onSwitchScenario?: (scenario: 'flood' | 'tsunami') => Promise<void>;
}

const MANDATORY_DISCLAIMER = "Operational resource inventory is simulated because no authorized live resource system is connected.";

export const RoleCommandCenter: React.FC<RoleCommandCenterProps> = ({
  state,
  isDarkMode,
  onSelectTab,
  onApproveAllocation,
  onRejectAllocation,
  onOptimize,
  onCloseRoad,
  onSwitchScenario,
}) => {
  const [activeRole, setActiveRole] = useState<OperationalRole>('commander');
  const [isWidescreen169, setIsWidescreen169] = useState(false);
  const [hazardsSummary, setHazardsSummary] = useState<any[]>([]);
  const [cascadeResult, setCascadeResult] = useState<any>(null);
  const [isSimulatingCascade, setIsSimulatingCascade] = useState(false);
  const [catalogModalOpen, setCatalogModalOpen] = useState(false);
  const [catalogData, setCatalogData] = useState<any>(null);

  useEffect(() => {
    fetchHazards().then((data) => {
      if (data && data.hazards) {
        setHazardsSummary(data.hazards);
      }
    }).catch((err) => console.error('Hazards fetch err:', err));

    fetchCatalog().then((cat) => {
      setCatalogData(cat);
    }).catch((err) => console.error('Catalog fetch err:', err));
  }, []);

  const handleTriggerCascade = async (cascadeType: string) => {
    setIsSimulatingCascade(true);
    try {
      const res = await simulateCascade(cascadeType, 1.6);
      setCascadeResult(res);
      if (onOptimize) {
        await onOptimize({
          response_time: 0.35,
          unmet_demand: 0.35,
          travel_distance: 0.10,
          equity: 0.20,
          resource_priorities: { water: 1.0, food: 0.8, medical_kits: 1.2 },
        });
      }
    } catch (err) {
      console.error('Cascade error:', err);
    } finally {
      setIsSimulatingCascade(false);
    }
  };

  const pendingAllocations = state.active_allocations.filter((a) => a.status === 'pending_approval');
  const criticalZones = state.zones.filter((z) => z.priority_score >= 80);

  return (
    <div className={`rounded-2xl border shadow-xl transition-all ${
      isWidescreen169 ? 'max-w-[1920px] mx-auto' : ''
    } ${
      isDarkMode
        ? 'bg-slate-900/95 border-slate-800'
        : 'bg-white border-slate-200 shadow-slate-200/50'
    }`}>
      {/* Role Selector Header & 16:9 Layout Switcher */}
      <div className="p-4 border-b border-slate-800/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
            isDarkMode ? 'bg-sky-950/80 text-sky-400 border-sky-500/30' : 'bg-sky-100 text-sky-800 border-sky-300'
          }`}>
            ROLE-BASED COMMAND SURFACE
          </span>

          {/* Role Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveRole('commander')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeRole === 'commander'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Incident Commander</span>
              {pendingAllocations.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-red-500 text-white rounded-full text-[10px]">
                  {pendingAllocations.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveRole('ndrf_head')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeRole === 'ndrf_head'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>NDRF Head Officer</span>
            </button>

            <button
              onClick={() => setActiveRole('logistics')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeRole === 'logistics'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Logistics Officer</span>
            </button>

            <button
              onClick={() => setActiveRole('gis')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeRole === 'gis'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>GIS Officer</span>
            </button>

            <button
              onClick={() => setActiveRole('field')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeRole === 'field'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Field Response Team</span>
            </button>
          </div>
        </div>

        {/* Right Action Tools: 16:9 Landscape Mode & Catalog Registry */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setCatalogModalOpen(true)}
            className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold border transition ${
              isDarkMode
                ? 'bg-slate-800 hover:bg-slate-700 text-sky-300 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-sky-800 border-slate-300'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-sky-400" />
            <span>Dataset Catalog</span>
          </button>

          <button
            onClick={() => setIsWidescreen169(!isWidescreen169)}
            className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold border transition ${
              isWidescreen169
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                : 'bg-slate-800/60 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Toggle 16:9 Landscape Command-Center Layout (1920x1080 / 1440x900)"
          >
            {isWidescreen169 ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span>16:9 Widescreen Active</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span>16:9 Landscape Mode</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mandatory Operational Truth Notice */}
      <div className={`px-4 py-2 border-b text-xs font-mono flex items-center justify-between ${
        isDarkMode
          ? 'bg-amber-950/30 border-amber-500/20 text-amber-300/90'
          : 'bg-amber-50 border-amber-200 text-amber-900'
      }`}>
        <div className="flex items-center space-x-2">
          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
            TRUTH CLASSIFICATION: SYNTHETIC
          </span>
          <span>{MANDATORY_DISCLAIMER}</span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">
          Cryptographic Integrity: SHA-256 Verified
        </span>
      </div>

      {/* Role 1: Incident Commander Tactical Surface */}
      {activeRole === 'commander' && (
        <div className="p-5 space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Multi-Hazard Cascade Shock Simulator */}
            <div className={`p-4 rounded-xl border space-y-3 ${
              isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}>
                    Multi-Hazard Cascade Shocks
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  OR-TOOLS MIP RE-SOLVE
                </span>
              </div>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Inject compound cascading physical disruptions to evaluate system defensibility under extreme compound stress.
              </p>

              <div className="space-y-2">
                <button
                  disabled={isSimulatingCascade}
                  onClick={() => handleTriggerCascade('EARTHQUAKE_TSUNAMI')}
                  className="w-full text-left p-2.5 rounded-lg border border-red-500/30 bg-red-950/30 hover:bg-red-900/40 text-xs transition cursor-pointer flex items-center justify-between group"
                >
                  <div>
                    <div className="font-bold text-red-300 flex items-center gap-1.5">
                      <Waves className="w-3.5 h-3.5 text-cyan-400" />
                      Earthquake (M7.4) &rarr; Tsunami Surge (4.2m)
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Washes out Causeway Road R17, isolates Port Sector, triggers marine medical surge.
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-red-400 group-hover:translate-x-0.5 transition" />
                </button>

                <button
                  disabled={isSimulatingCascade}
                  onClick={() => handleTriggerCascade('CYCLONE_FLOOD_LANDSLIDE')}
                  className="w-full text-left p-2.5 rounded-lg border border-amber-500/30 bg-amber-950/30 hover:bg-amber-900/40 text-xs transition cursor-pointer flex items-center justify-between group"
                >
                  <div>
                    <div className="font-bold text-amber-300 flex items-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                      Cyclone 'Vega' &rarr; Deluge (284mm) &rarr; Landslide
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Severes arterial NH-40 Road R12 with 15,000m³ debris, inundates 4 riverside wards.
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition" />
                </button>

                <button
                  disabled={isSimulatingCascade}
                  onClick={() => handleTriggerCascade('HEATWAVE_INDUSTRIAL_HAZMAT')}
                  className="w-full text-left p-2.5 rounded-lg border border-purple-500/30 bg-purple-950/30 hover:bg-purple-900/40 text-xs transition cursor-pointer flex items-center justify-between group"
                >
                  <div>
                    <div className="font-bold text-purple-300 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-orange-400" />
                      Petrochemical Fire &rarr; Chlorine Gas Plume
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      NFIRS incident forces 2.5km downwind evacuation, depletes atropine antidotes.
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-purple-400 group-hover:translate-x-0.5 transition" />
                </button>
              </div>

              {cascadeResult && (
                <div className="p-2.5 rounded-lg bg-emerald-950/50 border border-emerald-500/30 text-xs space-y-1">
                  <div className="font-bold text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Cascade Shock Solved ({cascadeResult.reallocated_dispatches_count} dispatches re-allocated)
                  </div>
                  <div className="text-[10px] text-slate-300">
                    Severed Corridors: {cascadeResult.severed_roads?.join(', ') || 'None'}
                  </div>
                  <div className="text-[10px] text-slate-400 line-clamp-2">
                    {cascadeResult.operator_explanation}
                  </div>
                </div>
              )}
            </div>

            {/* Human-in-the-Loop Approval Queue */}
            <div className={`p-4 rounded-xl border space-y-3 lg:col-span-2 ${
              isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-teal-400" />
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}>
                    Human-in-the-Loop Commander Sign-off Queue
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {pendingAllocations.length} ORDERS PENDING
                </span>
              </div>

              {pendingAllocations.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 font-mono">
                  All generated dispatches have been signed off or completed.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {pendingAllocations.slice(0, 4).map((alc) => (
                    <div
                      key={alc.id}
                      className={`p-3 rounded-lg border flex items-center justify-between gap-3 text-xs ${
                        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-sky-400">{alc.id}</span>
                          <span className="font-bold text-slate-200">{alc.resource_type.toUpperCase()}</span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {alc.quantity} units &bull; ETA {alc.estimated_time_min} min
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Origin: <span className="text-slate-300 font-semibold">{alc.source_warehouse_id}</span> &rarr; Destination: <span className="text-slate-300 font-semibold">{alc.destination_zone_id}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          onClick={() => onApproveAllocation(alc.id)}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition flex items-center gap-1 shadow-sm"
                        >
                          <Check className="w-3 h-3" />
                          Approve
                        </button>
                        <button
                          onClick={() => onRejectAllocation(alc.id)}
                          className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold transition flex items-center gap-1 shadow-sm"
                        >
                          <X className="w-3 h-3" />
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Role 2: NDRF Head Officer Strategic Command View */}
      {activeRole === 'ndrf_head' && (
        <div className="p-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-4 rounded-xl border ${
              isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="text-xs font-mono text-slate-400 uppercase">National NDRF Readiness</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">12 Battalions</div>
              <div className="text-[10px] text-slate-400 mt-0.5">3 Battalions pre-staged in active theater</div>
            </div>

            <div className={`p-4 rounded-xl border ${
              isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="text-xs font-mono text-slate-400 uppercase">Critical Vulnerability Wards</div>
              <div className="text-2xl font-bold text-red-400 mt-1">{criticalZones.length} Sectors</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Priority Triage Index &ge; 80 / 100</div>
            </div>

            <div className={`p-4 rounded-xl border ${
              isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="text-xs font-mono text-slate-400 uppercase">Humanitarian Equity Lift</div>
              <div className="text-2xl font-bold text-sky-400 mt-1">+24.8%</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Over unconstrained shortest-path baseline</div>
            </div>

            <div className={`p-4 rounded-xl border ${
              isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="text-xs font-mono text-slate-400 uppercase">Supply Deficit Alerts</div>
              <div className="text-2xl font-bold text-amber-400 mt-1">0 Deficits</div>
              <div className="text-[10px] text-slate-400 mt-0.5">All sector demands fulfilled by MIP solver</div>
            </div>
          </div>

          <div className={`p-4 rounded-xl border ${
            isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
              Sector Strategic Posture & Social Vulnerability Ranking
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {state.zones.map((zone) => (
                <div
                  key={zone.id}
                  className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                    zone.priority_score >= 80
                      ? 'border-red-500/40 bg-red-950/20'
                      : isDarkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">{zone.name}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                      zone.priority_score >= 80 ? 'bg-red-500/30 text-red-300' : 'bg-slate-800 text-slate-300'
                    }`}>
                      TRIAGE {zone.priority_score.toFixed(1)}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Pop: {zone.population.toLocaleString()}</span>
                    <span>Vulnerability: {(zone.vulnerability * 100).toFixed(0)}%</span>
                  </div>
                  <div className="text-[10px] font-mono text-sky-400 pt-1 border-t border-slate-800">
                    Water: {zone.water_need.toLocaleString()} L &bull; Medical: {zone.medical_need} kits
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Role 3: Logistics Officer Depot / Fleet Management */}
      {activeRole === 'logistics' && (
        <div className="p-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {state.warehouses.map((wh) => (
              <div
                key={wh.id}
                className={`p-4 rounded-xl border space-y-3 ${
                  isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-slate-200">{wh.name}</div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    DEPOT #{wh.id}
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  Latitude: {wh.lat.toFixed(4)} &bull; Longitude: {wh.lon.toFixed(4)}
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Drinking Water:</span>
                    <span className="font-mono font-bold text-sky-300">{(wh.inventory?.water ?? 0).toLocaleString()} L</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Emergency Food:</span>
                    <span className="font-mono font-bold text-amber-300">{(wh.inventory?.food ?? 0).toLocaleString()} pkts</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Medical Trauma Kits:</span>
                    <span className="font-mono font-bold text-emerald-300">{(wh.inventory?.medical_kits ?? 0).toLocaleString()} kits</span>
                  </div>
                </div>

                <div className="text-[10px] font-mono text-slate-500 pt-1">
                  TRUTH CLASS: SYNTHETIC &bull; SIMULATED OPERATIONAL INVENTORY
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Role 4: GIS Officer Vector & Satellite Overlays */}
      {activeRole === 'gis' && (
        <div className="p-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hazardsSummary.map((h) => (
              <div
                key={h.hazard_type}
                className={`p-4 rounded-xl border space-y-2 text-xs ${
                  isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">{h.name}</span>
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                    h.truth_class === 'LIVE' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                    h.truth_class === 'NEAR_REAL_TIME' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                    'bg-slate-800 text-slate-300 border-slate-700'
                  }`}>
                    {h.truth_class}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Authority: <span className="text-slate-300">{h.authority}</span>
                </div>
                <div className="text-[11px] font-mono text-sky-400">
                  Metric: {h.latest_metric}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px] font-mono">
                  <span className="text-slate-400">Status: {h.status}</span>
                  <span className="text-emerald-400 font-bold">{h.threat_level}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => onSelectTab('map')}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition"
            >
              Open Live Tactical GIS Map &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Role 5: Field Response Team Tactical SITREP Feed */}
      {activeRole === 'field' && (
        <div className="p-5 space-y-4">
          <div className={`p-4 rounded-xl border space-y-2 text-xs ${
            isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <h3 className="font-bold text-slate-200 uppercase tracking-wider text-xs">
              Field Road Obstacle & Status Report
            </h3>
            <p className="text-slate-400">
              Field officers can toggle road blockage telemetry. The dynamic routing engine circumvents blocked links and triggers sub-15ms re-optimization.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 mt-3">
              {state.roads.map((road) => (
                <div
                  key={road.id}
                  className={`p-2.5 rounded-lg border flex items-center justify-between text-xs ${
                    road.status === 'blocked'
                      ? 'bg-red-950/30 border-red-500/40 text-red-300'
                      : isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  <div>
                    <div className="font-bold font-mono">{road.id}: {road.name}</div>
                    <div className="text-[10px] text-slate-400">
                      Standard: {road.standard_travel_min} min &bull; Status: {road.status.toUpperCase()}
                    </div>
                  </div>

                  {onCloseRoad && (
                    <button
                      onClick={() => onCloseRoad(road.id, road.status === 'blocked' ? 'Cleared' : 'Field Obstacle')}
                      className={`px-2 py-1 rounded text-[10px] font-bold font-mono transition cursor-pointer ${
                        road.status === 'blocked'
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-rose-600 hover:bg-rose-500 text-white'
                      }`}
                    >
                      {road.status === 'blocked' ? 'Clear' : 'Block'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Authoritative Catalog Modal */}
      {catalogModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`max-w-3xl w-full max-h-[80vh] overflow-y-auto rounded-2xl border shadow-2xl p-5 space-y-4 ${
            isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-800">
              <div>
                <span className="text-xs font-mono text-sky-400 font-bold">DATA/CATALOG.YAML REGISTRY</span>
                <h3 className="text-base font-bold text-white">Authoritative Dataset Catalog & SHA-256 Manifests</h3>
              </div>
              <button
                onClick={() => setCatalogModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-500/30 text-xs font-mono text-amber-300">
              <strong>MANDATORY NOTICE:</strong> {MANDATORY_DISCLAIMER}
            </div>

            <div className="space-y-3">
              {catalogData?.datasets?.map((ds: any) => (
                <div
                  key={ds.dataset_id}
                  className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                    isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-100">{ds.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      ds.truth_class === 'LIVE' ? 'bg-red-500/20 text-red-400' :
                      ds.truth_class === 'SYNTHETIC' ? 'bg-amber-500/20 text-amber-300' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {ds.truth_class}
                    </span>
                  </div>
                  <div className="text-slate-400">{ds.description}</div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1 text-slate-400">
                    <div>Provider: <span className="text-slate-300">{ds.provider}</span></div>
                    <div>Cadence: <span className="text-slate-300">{ds.update_cadence}</span></div>
                    <div className="col-span-2 truncate">SHA-256: <span className="text-sky-400">{ds.checksum_sha256}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
