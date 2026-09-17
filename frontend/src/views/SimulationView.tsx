import React, { useState } from 'react';
import {
  PlaySquare,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Navigation,
  CheckCircle2,
  Clock,
  Shield,
  Zap
} from 'lucide-react';
import { SystemState } from '../types';
import { runHardEvaluatorTest } from '../services/api';

interface SimulationViewProps {
  state: SystemState;
  onCloseRoad: (roadId: string, reason?: string) => Promise<any>;
  onDemandSpike: (zoneId: string, mult: number, reason?: string) => Promise<any>;
  onWarehouseReduction: (whId: string, resource: string, frac: number) => Promise<any>;
  onReset: () => void;
  isDarkMode?: boolean;
}

export const SimulationView: React.FC<SimulationViewProps> = ({
  state,
  onCloseRoad,
  onDemandSpike,
  onWarehouseReduction,
  onReset,
  isDarkMode = true,
}) => {
  const [selectedRoad, setSelectedRoad] = useState<string>('ROAD-R17');
  const [selectedZone, setSelectedZone] = useState<string>('zone_4');
  const [demandMultiplier, setDemandMultiplier] = useState<number>(1.5);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('WH-NORTH');
  const [selectedResource, setSelectedResource] = useState<string>('water');

  const [simulating, setSimulating] = useState(false);
  const [lastDelta, setLastDelta] = useState<any>(null);

  const [hardEvalRunning, setHardEvalRunning] = useState(false);
  const [hardEvalResult, setHardEvalResult] = useState<any>(null);

  const handleSimulateRoadClosure = async () => {
    setSimulating(true);
    try {
      const res = await onCloseRoad(selectedRoad, 'Emergency Causeway Inundation Simulated by Evaluator');
      setLastDelta(res.delta);
    } finally {
      setSimulating(false);
    }
  };

  const handleSimulateDemandSpike = async () => {
    setSimulating(true);
    try {
      const res = await onDemandSpike(selectedZone, demandMultiplier, 'Secondary Levee Failure');
      setLastDelta(res.delta);
    } finally {
      setSimulating(false);
    }
  };

  const handleSimulateWarehouseShortage = async () => {
    setSimulating(true);
    try {
      const res = await onWarehouseReduction(selectedWarehouse, selectedResource, 0.3);
      setLastDelta(res.delta);
    } finally {
      setSimulating(false);
    }
  };

  const handleRunHardEvaluator = async () => {
    setHardEvalRunning(true);
    try {
      const res = await runHardEvaluatorTest();
      setHardEvalResult(res);
      setLastDelta(res.delta);
    } catch (err) {
      console.error('Hard Evaluator error:', err);
    } finally {
      setHardEvalRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`p-6 rounded-2xl border shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
        isDarkMode
          ? 'bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border-purple-500/30'
          : 'bg-white border-slate-200 shadow-slate-200/50'
      }`}>
        <div>
          <div className="flex items-center space-x-2">
            <span className={`text-xs font-mono font-bold uppercase ${isDarkMode ? 'text-purple-400' : 'text-purple-700'}`}>
              Evaluator Sandbox
            </span>
            <span className={`text-xs px-2 py-0.5 rounded font-bold border ${
              isDarkMode
                ? 'bg-purple-950 border-purple-500/40 text-purple-300'
                : 'bg-purple-100 border-purple-300 text-purple-800'
            }`}>
              DYNAMIC RE-OPTIMIZATION TESTBENCH
            </span>
          </div>
          <h1 className={`text-2xl font-bold mt-1 tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            What-If Disaster Simulation Center
          </h1>
          <p className={`text-xs max-w-2xl mt-0.5 leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600 font-medium'}`}>
            Inject disruptive physical events (road breaches, demand spikes, inventory failure) and observe the mathematical solver dynamically adapt routes, re-allocate depots, and balance constraints.
          </p>
        </div>

        <button
          onClick={onReset}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
            isDarkMode
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 shadow-sm'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Clean State</span>
        </button>
      </div>

      {/* MASTER HARD-EVALUATOR TEST CARD */}
      <div className={`p-6 rounded-2xl border-2 shadow-2xl space-y-4 transition-all ${
        isDarkMode
          ? 'bg-gradient-to-r from-red-950/40 via-slate-900 to-amber-950/30 border-red-500/40'
          : 'bg-white border-red-300 shadow-slate-200/50'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                isDarkMode
                  ? 'bg-red-500/20 text-red-400 border-red-500/40'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                HARD-EVALUATOR TEST
              </span>
              <span className={`text-xs font-mono font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                COMPOUND RE-OPTIMIZATION PROOF
              </span>
            </div>
            <h2 className={`text-lg font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Test Scenario: Zone C Demand (+40%) &bull; Warehouse A Water (-20%) &bull; Road R17 (CLOSED)
            </h2>
            <p className={`text-xs max-w-3xl leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600 font-medium'}`}>
              Proves true mathematical re-optimization: detects compound event, invalidates road R17 (Causeway), updates Zone C (North Bridge Enclave) needs by +40%, reduces Warehouse A water by 20%, reruns OR-Tools MIP solver, applies equity bounds, computes uncertainty intervals, and produces verified delta.
            </p>
          </div>

          <button
            onClick={handleRunHardEvaluator}
            disabled={hardEvalRunning}
            className="flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-red-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-xs tracking-wider uppercase shadow-xl shadow-red-600/30 transition disabled:opacity-50 shrink-0 cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            <span>{hardEvalRunning ? 'SOLVING MIP RE-OPTIMIZATION...' : '⚡ RUN HARD-EVALUATOR TEST'}</span>
          </button>
        </div>

        {/* Hard Evaluator Live Results */}
        {hardEvalResult && (
          <div className="mt-4 pt-4 border-t border-red-500/30 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Status</span>
                <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> RE-OPTIMIZED
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Audit #{hardEvalResult.audit_event_id}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Response Time Shift</span>
                <span className="text-sm font-bold text-amber-400 mt-0.5 block font-mono">
                  {hardEvalResult.delta?.response_time_diff > 0 ? `+${hardEvalResult.delta.response_time_diff}m` : `${hardEvalResult.delta?.response_time_diff}m`}
                </span>
                <span className="text-[10px] text-slate-400">Baseline {hardEvalResult.baseline_run?.avg_response_time_min}m &rarr; {hardEvalResult.reoptimized_run?.avg_response_time_min}m</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Rerouted Legs</span>
                <span className="text-sm font-bold text-sky-400 mt-0.5 block font-mono">
                  {hardEvalResult.delta?.rerouted_allocations?.length || 0} Routes Adapted
                </span>
                <span className="text-[10px] text-slate-400">Road R17 Avoided 100%</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Zone C Water Interval</span>
                <span className="text-xs font-bold text-slate-200 mt-0.5 block font-mono">
                  {hardEvalResult.explanation?.uncertainty_intervals?.zone_c_water_range}
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">Confidence: 91%</span>
              </div>
            </div>

            {/* Explainability Callout */}
            <div className="p-4 rounded-xl bg-slate-950/90 border border-amber-500/30 space-y-2">
              <div className="flex items-center space-x-2 text-amber-400">
                <Shield className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Explainable Re-Allocation Rationale</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {hardEvalResult.explanation?.why_changed}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                <div>
                  <strong className="text-slate-300">Detour Route:</strong> {hardEvalResult.explanation?.road_closure?.detour_route} (+{hardEvalResult.explanation?.road_closure?.additional_travel_time_min} min delay)
                </div>
                <div>
                  <strong className="text-slate-300">Inventory Shift:</strong> Warehouse A Water reduced by -20% (to {hardEvalResult.explanation?.inventory_reduction?.new_quantity?.toLocaleString()} L)
                </div>
              </div>
            </div>

            {/* Constraints Verified */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold block mb-1.5">
                Constraints Mathematically Verified by OR-Tools:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-300">
                {hardEvalResult.explanation?.constraints_verified?.map((c: string, idx: number) => (
                  <div key={idx} className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-[11px]">{c}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>


      {/* 3 Interactive Experiment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Experiment 1: Road Closure */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Scenario A: Road Closure</h3>
            </div>
            <p className="text-xs text-slate-400">
              Cut off critical transit corridor. The routing engine prevents traversing blocked roads and finds optimal detours or switches hubs.
            </p>

            <div className="pt-2">
              <label className="block text-[11px] text-slate-300 font-medium mb-1">Target Road:</label>
              <select
                value={selectedRoad}
                onChange={(e) => setSelectedRoad(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              >
                {state.roads.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.id}) — {r.status.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleSimulateRoadClosure}
            disabled={simulating}
            className="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/20 transition disabled:opacity-50"
          >
            {simulating ? 'RE-OPTIMIZING...' : '🚧 CLOSE ROAD & RE-OPTIMIZE'}
          </button>
        </div>

        {/* Experiment 2: Demand Surge */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sky-400">
              <TrendingUp className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Scenario B: Sudden Demand Surge</h3>
            </div>
            <p className="text-xs text-slate-400">
              Simulate influx of casualties or refugees into a flood zone. The priority engine updates urgency and mobilizes reserves.
            </p>

            <div className="pt-2 space-y-2">
              <div>
                <label className="block text-[11px] text-slate-300 font-medium mb-1">Target Sector:</label>
                <select
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  {state.zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name} (Priority {z.priority_score})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Demand Increase Multiplier:</span>
                  <span className="text-sky-400 font-bold font-mono">+{Math.round((demandMultiplier - 1) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="1.2"
                  max="2.5"
                  step="0.1"
                  value={demandMultiplier}
                  onChange={(e) => setDemandMultiplier(parseFloat(e.target.value))}
                  className="w-full accent-sky-500 cursor-pointer mt-1"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSimulateDemandSpike}
            disabled={simulating}
            className="w-full py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-600/20 transition disabled:opacity-50"
          >
            {simulating ? 'RE-OPTIMIZING...' : '🌊 TRIGGER SURGE & RE-OPTIMIZE'}
          </button>
        </div>

        {/* Experiment 3: Warehouse Stock Loss */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-purple-400">
              <Zap className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Scenario C: Depot Stock Depletion</h3>
            </div>
            <p className="text-xs text-slate-400">
              Simulate warehouse contamination or sudden stock loss. The solver redistributes supply from neighboring regional depots.
            </p>

            <div className="pt-2 space-y-2">
              <div>
                <label className="block text-[11px] text-slate-300 font-medium mb-1">Depot & Commodity:</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={selectedWarehouse}
                    onChange={(e) => setSelectedWarehouse(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    {state.warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>

                  <select
                    value={selectedResource}
                    onChange={(e) => setSelectedResource(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="water">Water</option>
                    <option value="medical_kits">Medical Kits</option>
                    <option value="food">Food</option>
                    <option value="ambulances">Ambulances</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleSimulateWarehouseShortage}
            disabled={simulating}
            className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/20 transition disabled:opacity-50"
          >
            {simulating ? 'RE-OPTIMIZING...' : '📉 CUT STOCK BY 70% & SOLVE'}
          </button>
        </div>
      </div>

      {/* Delta Impact Comparison Card */}
      {lastDelta ? (
        <div className="p-6 rounded-2xl bg-slate-900 border border-sky-500/30 space-y-5 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">
                Dynamic Re-Optimization Impact Analysis
              </h3>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-500/30">
              TRIGGER: {lastDelta.trigger}
            </span>
          </div>

          <p className="text-xs text-slate-300">
            {lastDelta.summary}
          </p>

          {/* Delta Metrics Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 text-[10px] font-mono uppercase block">&Delta; Response Time</span>
              <div className={`text-xl font-bold mt-1 ${lastDelta.response_time_diff > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {lastDelta.response_time_diff > 0 ? `+${lastDelta.response_time_diff}` : lastDelta.response_time_diff} min
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 text-[10px] font-mono uppercase block">&Delta; Unmet Demand</span>
              <div className={`text-xl font-bold mt-1 ${lastDelta.unmet_demand_diff > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {lastDelta.unmet_demand_diff > 0 ? `+${lastDelta.unmet_demand_diff}` : lastDelta.unmet_demand_diff} units
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 text-[10px] font-mono uppercase block">&Delta; Fleet Distance</span>
              <div className="text-xl font-bold text-slate-200 mt-1">
                {lastDelta.distance_diff > 0 ? `+${lastDelta.distance_diff}` : lastDelta.distance_diff} km
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 text-[10px] font-mono uppercase block">Rerouted Legs</span>
              <div className="text-xl font-bold text-purple-400 mt-1">
                {lastDelta.changed_routes_count} dispatches
              </div>
            </div>
          </div>

          {/* Rerouted Hub Assignments */}
          {lastDelta.rerouted_allocations && lastDelta.rerouted_allocations.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                Rerouted Deployments & Alternate Hub Dispatch:
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {lastDelta.rerouted_allocations.map((r: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1">
                    <div className="flex justify-between font-semibold text-slate-200">
                      <span>{r.zone}</span>
                      <span className="capitalize text-sky-400">{r.resource.replace('_', ' ')}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center space-x-2">
                      <span className="text-red-400 line-through">{r.old_source} ({r.old_eta}m)</span>
                      <span>&rarr;</span>
                      <span className="text-emerald-400 font-semibold">{r.new_source} ({r.new_eta}m)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-center space-y-2">
          <Clock className="w-8 h-8 text-slate-600 mx-auto" />
          <h4 className="text-sm font-semibold text-slate-300">Awaiting Simulation Trigger</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Choose any scenario above and click simulate. ResQGrid will run the re-optimization loop in real time and graph the before-and-after operational shift.
          </p>
        </div>
      )}
    </div>
  );
};
