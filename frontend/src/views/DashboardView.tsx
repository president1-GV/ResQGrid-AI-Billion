import React from 'react';
import {
  AlertOctagon,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  Navigation,
  ArrowRight,
  ShieldAlert,
  Zap,
  Check,
  X,
  Moon,
  Sun,
  PlusCircle,
  Truck
} from 'lucide-react';
import { SystemState } from '../types';
import { NavTab } from '../components/Sidebar';
import { MasterOperationalWorkflow } from '../components/MasterOperationalWorkflow';
import { EvaluatorLiveTestbench } from '../components/EvaluatorLiveTestbench';
import { OptimizationObjectiveWeights } from '../types';

interface DashboardViewProps {
  state: SystemState;
  onSelectTab: (tab: NavTab) => void;
  onApproveAllocation: (id: string) => void;
  onRejectAllocation: (id: string) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenCreateIncident?: () => void;
  onOptimize?: (weights: OptimizationObjectiveWeights) => Promise<void>;
  onCloseRoad?: (roadId: string, reason?: string) => Promise<any>;
  onSwitchScenario?: (scenario: 'flood' | 'tsunami') => Promise<void>;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  state,
  onSelectTab,
  onApproveAllocation,
  onRejectAllocation,
  isDarkMode,
  onToggleTheme,
  onOpenCreateIncident,
  onOptimize,
  onCloseRoad,
  onSwitchScenario,
}) => {
  const latestRun = state.latest_run;
  const criticalZones = state.zones.filter((z) => z.priority_score >= 80);
  const pendingAllocations = state.active_allocations.filter((a) => a.status === 'pending_approval');

  return (
    <div className="space-y-6">
      {/* Top Banner with Night/Light Mode & Incident Creation */}
      <div className={`p-6 rounded-2xl border shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all ${
        isDarkMode
          ? 'bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border-sky-500/20'
          : 'bg-white border-slate-200 shadow-slate-200/50'
      }`}>
        <div className="flex items-start space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-white p-1 border border-sky-500/40 shadow-xl shadow-sky-500/10 shrink-0 hidden sm:flex items-center justify-center overflow-hidden">
            <img
              src="/resqgrid-logo.png"
              alt="ResQGrid AI"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                isDarkMode
                  ? 'bg-red-500/20 text-red-400 border-red-500/30'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                PRIORITY LEVEL 1: CRITICAL INUNDATION
              </span>
              <span className={`text-xs font-mono font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Event #{state.event.event_number}
              </span>
              <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold border ${
                isDarkMode
                  ? 'bg-sky-950 border-sky-500/30 text-sky-300'
                  : 'bg-sky-50 border-sky-200 text-sky-800'
              }`}>
                DETECT &bull; VERIFY &bull; PRIORITIZE &bull; OPTIMIZE &bull; RESPOND
              </span>
              <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold border ${
                isDarkMode
                  ? 'bg-emerald-950 border-emerald-500/30 text-emerald-300'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}>
                INTELLIGENCE FOR EVERY RESPONSE.
              </span>
            </div>
            <h1 className={`text-2xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {state.event.location} Emergency Command Center
            </h1>
            <p className={`text-sm max-w-3xl leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600 font-medium'}`}>
              {state.event.description}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Dashboard Theme Switcher Option */}
          <button
            onClick={onToggleTheme}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Night Mode'}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all shadow-sm cursor-pointer ${
              isDarkMode
                ? 'bg-slate-800 hover:bg-slate-700 text-sky-300 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-amber-700 border-slate-300 shadow-slate-200'
            }`}
          >
            {isDarkMode ? (
              <>
                <Moon className="w-3.5 h-3.5 text-sky-400" />
                <span>Night Mode</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                <span>Light Mode</span>
              </>
            )}
          </button>

          {onOpenCreateIncident && (
            <button
              onClick={onOpenCreateIncident}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-lg shadow-sky-500/25 transition-all cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>CREATE INCIDENT &rarr; RUN RESQGRID</span>
            </button>
          )}

          <button
            onClick={() => onSelectTab('optimization')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
              isDarkMode
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800 shadow-sm'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${isDarkMode ? 'text-sky-400' : 'text-sky-600'}`} />
            <span>Optimize Solver</span>
          </button>

          <button
            onClick={() => onSelectTab('demo')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
              isDarkMode
                ? 'bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border-purple-500/40'
                : 'bg-purple-600 hover:bg-purple-500 text-white border-purple-600 shadow-md shadow-purple-500/20'
            }`}
          >
            <span>Interactive Demo Flow</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Master Operational Workflow Pipeline */}
      <MasterOperationalWorkflow
        currentScenario={state.event.type}
        onSelectTab={onSelectTab}
        isDarkMode={isDarkMode}
      />

      {/* Evaluator Master Demonstration & Policy Control Bench */}
      {onOptimize && onCloseRoad && onSwitchScenario && (
        <EvaluatorLiveTestbench
          state={state}
          onOptimize={onOptimize}
          onCloseRoad={onCloseRoad}
          onSwitchScenario={onSwitchScenario}
          isDarkMode={isDarkMode}
        />
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-xl border transition-all ${isDarkMode ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono">AFFECTED CITIZENS</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
            {state.event.affected_population.toLocaleString()}
          </div>
          <div className="text-xs text-amber-400 mt-1 flex items-center space-x-1">
            <span>Across {state.zones.length} {state.event.type.toLowerCase()} sectors</span>
          </div>
        </div>

        <div className={`p-4 rounded-xl border transition-all ${isDarkMode ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono">AVG RESPONSE TIME</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {latestRun ? `${latestRun.avg_response_time_min} min` : '15.4 min'}
          </div>
          <div className="text-xs text-emerald-500 mt-1">
            Optimal depot dispatch
          </div>
        </div>

        <div className={`p-4 rounded-xl border transition-all ${isDarkMode ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono">CRITICAL ZONES</span>
            <AlertOctagon className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400">
            {criticalZones.length} / {state.zones.length}
          </div>
          <div className="text-xs text-red-300 mt-1">
            Priority Score &ge; 80.0
          </div>
        </div>

        <div className={`p-4 rounded-xl border transition-all ${isDarkMode ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono">HUMANITARIAN EQUITY GAP</span>
            <TrendingDown className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400">
            {latestRun ? latestRun.equity_gap_score : '8.4'}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Low disparity in relief coverage
          </div>
        </div>
      </div>

      {/* Main Grid: Critical Zones & Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: High Urgency Zones & Priority Breakdown */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                  Critical Impact Sectors & Urgent Demand Signals
                </h3>
              </div>
              <button
                onClick={() => onSelectTab('map')}
                className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center space-x-1"
              >
                <span>View on GIS Map</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-800/60">
              {state.zones.map((zone) => {
                const isHigh = zone.priority_score >= 80;
                return (
                  <div key={zone.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm text-slate-200">{zone.name}</span>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                            isHigh
                              ? 'bg-red-950 text-red-400 border border-red-500/40'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          Score: {zone.priority_score}
                        </span>
                        <span className="text-xs text-slate-500">
                          ({zone.affected_population.toLocaleString()} affected)
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 italic">
                        {zone.notes || 'Monitoring flood level and route navigability.'}
                      </p>
                    </div>

                    <div className="flex items-center space-x-4 text-xs shrink-0">
                      <div className="text-right">
                        <div className="text-slate-400 font-mono">Med / Water / Food</div>
                        <div className="font-semibold text-slate-300">
                          {zone.medical_need} kits | {(zone.water_need / 1000).toFixed(1)}k L | {(zone.food_need / 1000).toFixed(1)}k rk
                        </div>
                      </div>
                      <div className="w-16 text-right">
                        <div className="text-[10px] text-slate-400">Road Access</div>
                        <div className={`font-mono font-bold ${zone.road_accessibility < 0.7 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {Math.round(zone.road_accessibility * 100)}%
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pending Human-In-The-Loop Approvals */}
          <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                  Human-in-the-Loop Allocations Awaiting Officer Review ({pendingAllocations.length})
                </h3>
              </div>
              <button
                onClick={() => onSelectTab('optimization')}
                className="text-xs text-sky-400 hover:text-sky-300 font-medium"
              >
                Manage All
              </button>
            </div>

            {pendingAllocations.length === 0 ? (
              <div className="text-xs text-slate-500 py-4 text-center bg-slate-950/40 rounded-lg">
                All generated allocations have been reviewed and approved.
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {pendingAllocations.slice(0, 5).map((alloc) => (
                  <div
                    key={alloc.id}
                    className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sky-400 font-bold">{alloc.id}</span>
                        <span className="text-slate-300 font-semibold">{alloc.destination_zone_name}</span>
                        <span className="text-slate-500">&larr;</span>
                        <span className="text-slate-400">{alloc.source_warehouse_name}</span>
                      </div>
                      <div className="text-slate-400">
                        Dispatching <strong className="text-white">{alloc.quantity.toLocaleString()} {alloc.resource_type.replace('_', ' ')}</strong> via {alloc.vehicle_type} (ETA: {alloc.estimated_time_min}m, {alloc.distance_km}km)
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => onApproveAllocation(alloc.id)}
                        className="px-2.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center space-x-1"
                        title="Approve Dispatch"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => onRejectAllocation(alloc.id)}
                        className="px-2.5 py-1.5 rounded bg-red-950 hover:bg-red-900 border border-red-700/50 text-red-300 font-semibold flex items-center space-x-1"
                        title="Reject Allocation"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Live Tactical Event Feed */}
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                Live Sensor & Field Feed
              </h3>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {state.notifications.map((n) => (
                <div
                  key={n.id}
                  className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-300">{n.title}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {n.timestamp.slice(11, 16)} UTC
                    </span>
                  </div>
                  <p className="text-slate-400">{n.message}</p>
                </div>
              ))}

              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sky-400">Telemetry Ingestion</span>
                  <span className="text-[10px] text-slate-500 font-mono">NOW</span>
                </div>
                <p className="text-slate-400">
                  IMD Radar confirms 245mm/24h cumulative rainfall. River swell stabilized at +2.8m.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Simulation CTA */}
          <div className="p-5 rounded-xl bg-gradient-to-br from-purple-950/40 to-slate-900 border border-purple-500/30 space-y-3">
            <div className="flex items-center space-x-2 text-purple-300">
              <AlertTriangle className="w-4 h-4 text-purple-400" />
              <h4 className="text-sm font-bold">Evaluator Demonstration</h4>
            </div>
            <p className="text-xs text-slate-300">
              Test dynamic constraint adaptation in real time: close roads, simulate medical shortages, and watch the optimizer recalculate in milliseconds.
            </p>
            <button
              onClick={() => onSelectTab('simulation')}
              className="w-full py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition"
            >
              Open What-If Simulation Sandbox &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
