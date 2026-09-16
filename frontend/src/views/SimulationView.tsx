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

interface SimulationViewProps {
  state: SystemState;
  onCloseRoad: (roadId: string, reason?: string) => Promise<any>;
  onDemandSpike: (zoneId: string, mult: number, reason?: string) => Promise<any>;
  onWarehouseReduction: (whId: string, resource: string, frac: number) => Promise<any>;
  onReset: () => void;
}

export const SimulationView: React.FC<SimulationViewProps> = ({
  state,
  onCloseRoad,
  onDemandSpike,
  onWarehouseReduction,
  onReset,
}) => {
  const [selectedRoad, setSelectedRoad] = useState<string>('ROAD-R17');
  const [selectedZone, setSelectedZone] = useState<string>('zone_4');
  const [demandMultiplier, setDemandMultiplier] = useState<number>(1.5);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('WH-NORTH');
  const [selectedResource, setSelectedResource] = useState<string>('water');

  const [simulating, setSimulating] = useState(false);
  const [lastDelta, setLastDelta] = useState<any>(null);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border border-purple-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-purple-400 font-bold uppercase">Evaluator Sandbox</span>
            <span className="text-xs px-2 py-0.5 rounded bg-purple-950 border border-purple-500/40 text-purple-300 font-semibold">
              DYNAMIC RE-OPTIMIZATION TESTBENCH
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">What-If Disaster Simulation Center</h1>
          <p className="text-xs text-slate-400 max-w-2xl mt-0.5">
            Inject disruptive physical events (road breaches, demand spikes, inventory failure) and observe the mathematical solver dynamically adapt routes, re-allocate depots, and balance constraints.
          </p>
        </div>

        <button
          onClick={onReset}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Clean State</span>
        </button>
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
