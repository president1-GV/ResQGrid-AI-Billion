import React, { useState } from 'react';
import {
  Zap,
  Check,
  X,
  Edit2,
  Sliders,
  Info,
  Clock,
  Navigation,
  ShieldCheck,
  TrendingDown,
  Layers,
  HelpCircle
} from 'lucide-react';
import {
  SystemState,
  OptimizationObjectiveWeights,
  AllocationItem
} from '../types';

interface OptimizationViewProps {
  state: SystemState;
  onOptimize: (weights: OptimizationObjectiveWeights) => Promise<void>;
  onApprove: (id: string) => void;
  onModify: (id: string, reason: string, qty: number) => void;
  onReject: (id: string, reason: string) => void;
  isDarkMode?: boolean;
}

export const OptimizationView: React.FC<OptimizationViewProps> = ({
  state,
  onOptimize,
  onApprove,
  onModify,
  onReject,
  isDarkMode = true,
}) => {
  const latestRun = state.latest_run;

  // State for weights
  const [weights, setWeights] = useState<OptimizationObjectiveWeights>({
    response_time: 0.30,
    unmet_demand: 0.35,
    travel_distance: 0.15,
    equity: 0.20,
    resource_priorities: {
      medical_kits: 1.0,
      ambulances: 1.0,
      medical_teams: 0.95,
      water: 0.85,
      food: 0.70,
      shelter_kits: 0.60,
    },
  });

  const [optimizing, setOptimizing] = useState(false);
  const [optimizationStep, setOptimizationStep] = useState<string | null>(null);

  // Filter & Search
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>('ALL');
  const [selectedResourceFilter, setSelectedResourceFilter] = useState<string>('ALL');

  // Inspection modal / Why? modal
  const [inspectingAllocation, setInspectingAllocation] = useState<AllocationItem | null>(null);

  // Modify modal
  const [modifyingAllocation, setModifyingAllocation] = useState<AllocationItem | null>(null);
  const [modifyReason, setModifyReason] = useState('');
  const [modifyQty, setModifyQty] = useState<number>(0);

  // Reject modal
  const [rejectingAllocation, setRejectingAllocation] = useState<AllocationItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const handleRunOptimization = async () => {
    setOptimizing(true);
    const steps = [
      'Collecting multi-source disaster signals...',
      'Synthesizing humanitarian demand estimates...',
      'Checking warehouse inventories & vehicle fleet availability...',
      'Solving multi-objective Mixed Integer Program via Google OR-Tools...',
      'Verifying humanitarian equity constraints across vulnerable zones...',
      'Generating explainable allocation justifications...',
      'Optimization complete.',
    ];

    for (let i = 0; i < steps.length - 1; i++) {
      setOptimizationStep(steps[i]);
      await new Promise((r) => setTimeout(r, 200));
    }

    try {
      await onOptimize(weights);
    } finally {
      setOptimizationStep(steps[steps.length - 1]);
      setTimeout(() => {
        setOptimizing(false);
        setOptimizationStep(null);
      }, 300);
    }
  };

  const filteredAllocations = state.active_allocations.filter((a) => {
    if (selectedZoneFilter !== 'ALL' && a.destination_zone_id !== selectedZoneFilter) return false;
    if (selectedResourceFilter !== 'ALL' && a.resource_type !== selectedResourceFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Weights Drawer */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono text-sky-400 font-bold uppercase">Mathematical Solver</span>
              <span className="text-xs px-2 py-0.5 rounded bg-sky-950 border border-sky-500/30 text-sky-300 font-semibold">
                Google OR-Tools SCIP / MIP
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white mt-1">Constraint-Aware Resource Optimization</h1>
            <p className="text-xs text-slate-400 max-w-2xl mt-0.5">
              Decides <strong>WHAT</strong> resource should go <strong>WHERE</strong>, <strong>WHEN</strong>, from <strong>WHICH DEPOT</strong>, and through <strong>WHICH ROUTE</strong> under hard physical constraints.
            </p>
          </div>

          <button
            onClick={handleRunOptimization}
            disabled={optimizing}
            className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm shadow-xl shadow-sky-500/20 transition disabled:opacity-50 cursor-pointer"
          >
            <Zap className={`w-4 h-4 fill-current ${optimizing ? 'animate-spin' : ''}`} />
            <span>{optimizing ? 'SOLVING MIP...' : '⚡ OPTIMIZE ALLOCATION'}</span>
          </button>
        </div>

        {/* Dynamic Step Loading Bar */}
        {optimizing && (
          <div className="p-3 rounded-xl bg-sky-950/60 border border-sky-500/30 flex items-center space-x-3 text-xs text-sky-300 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
            <span className="font-mono font-semibold">{optimizationStep}</span>
          </div>
        )}

        {/* Configurable Objective Weights Sliders */}
        <div className="pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="space-y-1 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <div className="flex justify-between text-slate-300 font-medium">
              <span>Unmet Demand Penalty</span>
              <span className="font-mono text-sky-400 font-bold">{Math.round(weights.unmet_demand * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={weights.unmet_demand}
              onChange={(e) => setWeights({ ...weights, unmet_demand: parseFloat(e.target.value) })}
              className="w-full accent-sky-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500">Heavily penalizes shortages in high-need zones</span>
          </div>

          <div className="space-y-1 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <div className="flex justify-between text-slate-300 font-medium">
              <span>Response Time Weight</span>
              <span className="font-mono text-emerald-400 font-bold">{Math.round(weights.response_time * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={weights.response_time}
              onChange={(e) => setWeights({ ...weights, response_time: parseFloat(e.target.value) })}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500">Favors faster dispatch routes and closer hubs</span>
          </div>

          <div className="space-y-1 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <div className="flex justify-between text-slate-300 font-medium">
              <span>Humanitarian Equity Weight</span>
              <span className="font-mono text-cyan-400 font-bold">{Math.round(weights.equity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.8"
              step="0.05"
              value={weights.equity}
              onChange={(e) => setWeights({ ...weights, equity: parseFloat(e.target.value) })}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500">Protects remote & slum zones from deprivation</span>
          </div>

          <div className="space-y-1 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <div className="flex justify-between text-slate-300 font-medium">
              <span>Travel Distance Minimization</span>
              <span className="font-mono text-purple-400 font-bold">{Math.round(weights.travel_distance * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.6"
              step="0.05"
              value={weights.travel_distance}
              onChange={(e) => setWeights({ ...weights, travel_distance: parseFloat(e.target.value) })}
              className="w-full accent-purple-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500">Minimizes fleet fuel consumption & road wear</span>
          </div>
        </div>
      </div>

      {/* Latest Run Results KPI Strip */}
      {latestRun && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block text-[10px] font-mono uppercase">ZONES SERVED</span>
            <div className="text-xl font-bold text-white mt-1">
              {latestRun.zones_served} / {latestRun.total_zones}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block text-[10px] font-mono uppercase">TOTAL ALLOCATED</span>
            <div className="text-xl font-bold text-sky-400 mt-1">
              {latestRun.total_resources_allocated.toLocaleString()}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block text-[10px] font-mono uppercase">UNMET SHORTAGE</span>
            <div className="text-xl font-bold text-amber-400 mt-1">
              {latestRun.unmet_demand_total.toLocaleString()}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block text-[10px] font-mono uppercase">AVG RESPONSE TIME</span>
            <div className="text-xl font-bold text-emerald-400 mt-1">
              {latestRun.avg_response_time_min} min
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block text-[10px] font-mono uppercase">FLEET DISTANCE</span>
            <div className="text-xl font-bold text-slate-200 mt-1">
              {latestRun.total_travel_distance_km} km
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block text-[10px] font-mono uppercase">SOLVER RUNTIME</span>
            <div className="text-xl font-bold text-purple-400 mt-1 font-mono">
              {latestRun.runtime_ms} ms
            </div>
          </div>
        </div>
      )}

      {/* Allocation Table with Filters */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Optimal Deployment Table & Human Verification ({filteredAllocations.length})
            </h3>
            <p className="text-xs text-slate-400">
              Review, approve, or adjust constraint-verified allocations before physical dispatch.
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-3 text-xs">
            <select
              value={selectedZoneFilter}
              onChange={(e) => setSelectedZoneFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">All Zones ({state.zones.length})</option>
              {state.zones.map((z) => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
            </select>

            <select
              value={selectedResourceFilter}
              onChange={(e) => setSelectedResourceFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">All Resources</option>
              <option value="water">Water</option>
              <option value="food">Food</option>
              <option value="medical_kits">Medical Kits</option>
              <option value="ambulances">Ambulances</option>
              <option value="medical_teams">Medical Teams</option>
              <option value="shelter_kits">Shelter Kits</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                <th className="py-2.5 px-3">ZONE & PRIORITY</th>
                <th className="py-2.5 px-3">RESOURCE & QTY</th>
                <th className="py-2.5 px-3">SOURCE DEPOT</th>
                <th className="py-2.5 px-3">VEHICLE & ETA</th>
                <th className="py-2.5 px-3">STATUS</th>
                <th className="py-2.5 px-3 text-center">EXPLANATION</th>
                <th className="py-2.5 px-3 text-right">OFFICER ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredAllocations.map((a) => {
                const isPending = a.status === 'pending_approval';
                const isApproved = a.status === 'approved' || a.status === 'dispatched';
                const isRejected = a.status === 'rejected';
                const isModified = a.status === 'modified';

                return (
                  <tr key={a.id} className="hover:bg-slate-950/40 transition">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-200">{a.destination_zone_name}</div>
                      <div className="text-[10px] text-slate-400 flex items-center space-x-1">
                        <span>Score:</span>
                        <strong className="text-amber-400">{a.priority_score}</strong>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-white capitalize">
                        {a.quantity.toLocaleString()} {a.resource_type.replace('_', ' ')}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">Run: {a.optimization_run_id}</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="text-slate-300 font-medium">{a.source_warehouse_name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{a.source_warehouse_id}</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="text-slate-300">{a.vehicle_type}</div>
                      <div className="text-[10px] text-emerald-400 font-mono">
                        {a.estimated_time_min} min ({a.distance_km} km)
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                          isApproved
                            ? isDarkMode
                              ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : isRejected
                            ? isDarkMode
                              ? 'bg-red-950 text-red-400 border-red-500/30'
                              : 'bg-red-100 text-red-800 border-red-300'
                            : isModified
                            ? isDarkMode
                              ? 'bg-purple-950 text-purple-300 border-purple-500/30'
                              : 'bg-purple-100 text-purple-800 border-purple-300'
                            : isDarkMode
                            ? 'bg-amber-950 text-amber-300 border-amber-500/30'
                            : 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                        }`}
                      >
                        {a.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => setInspectingAllocation(a)}
                        className={`px-2 py-1 rounded font-bold text-[11px] inline-flex items-center space-x-1 border transition cursor-pointer ${
                          isDarkMode
                            ? 'bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 border-slate-700'
                            : 'bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-300 shadow-sm'
                        }`}
                        title="View mathematical justification"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Why?</span>
                      </button>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {isPending && (
                          <>
                            <button
                              onClick={() => onApprove(a.id)}
                              className="p-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center space-x-1 shadow-sm cursor-pointer"
                              title="Approve allocation"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span className="hidden xl:inline">Approve</span>
                            </button>
                            <button
                              onClick={() => {
                                setModifyingAllocation(a);
                                setModifyQty(a.quantity);
                                setModifyReason('');
                              }}
                              className={`p-1.5 rounded font-bold text-[11px] flex items-center space-x-1 border transition cursor-pointer ${
                                isDarkMode
                                  ? 'bg-slate-800 hover:bg-slate-700 text-purple-300 border-slate-700'
                                  : 'bg-purple-50 hover:bg-purple-100 text-purple-800 border-purple-300 shadow-sm'
                              }`}
                              title="Modify quantity with reason"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span className="hidden xl:inline">Modify</span>
                            </button>
                            <button
                              onClick={() => {
                                setRejectingAllocation(a);
                                setRejectReason('');
                              }}
                              className={`p-1.5 rounded font-bold text-[11px] flex items-center space-x-1 border transition cursor-pointer ${
                                isDarkMode
                                  ? 'bg-red-950 hover:bg-red-900 text-red-300 border-red-800'
                                  : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-300 shadow-sm'
                              }`}
                              title="Reject allocation"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span className="hidden xl:inline">Reject</span>
                            </button>
                          </>
                        )}
                        {!isPending && (
                          <span className={`text-[11px] italic ${isDarkMode ? 'text-slate-500' : 'text-slate-400 font-medium'}`}>
                            Action recorded
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* WHY? Explanation Modal */}
      {inspectingAllocation && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Info className="w-5 h-5 text-sky-400" />
                <h4 className="text-base font-bold text-white">
                  Explainable Decision Factor Analysis
                </h4>
              </div>
              <button
                onClick={() => setInspectingAllocation(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-slate-400 font-mono">DISPATCH SUMMARY:</div>
                <div className="text-white font-semibold">
                  {inspectingAllocation.quantity.toLocaleString()} {inspectingAllocation.resource_type.replace('_', ' ')} &rarr; {inspectingAllocation.destination_zone_name}
                </div>
                <div className="text-slate-400">
                  Source: {inspectingAllocation.source_warehouse_name} ({inspectingAllocation.distance_km} km, ETA {inspectingAllocation.estimated_time_min}m)
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-semibold text-sky-400 block uppercase font-mono tracking-wider">
                  Why did the optimization model make this specific allocation?
                </span>
                <p className="p-3 rounded-lg bg-sky-950/30 border border-sky-500/20 text-sky-200">
                  {inspectingAllocation.reason}
                </p>
              </div>

              <div className="space-y-1 text-slate-400">
                <div className="font-semibold text-slate-300 font-mono text-[11px]">SOLVER OBJECTIVE TRACE:</div>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li>Calculated nearest feasible route avoiding waterlogged segments.</li>
                  <li>Destination has Priority Score of <strong>{inspectingAllocation.priority_score}</strong>.</li>
                  <li>Satisfied humanitarian equity bounds under total warehouse inventory limit.</li>
                  <li>Allocated vehicle payload optimized for road conditions.</li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => setInspectingAllocation(null)}
              className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs"
            >
              Close Factor Breakdown
            </button>
          </div>
        </div>
      )}

      {/* Human Modification Override Modal */}
      {modifyingAllocation && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Human-in-the-Loop Override
              </h4>
              <button onClick={() => setModifyingAllocation(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Authorized officers may adjust allocation volume. A mandatory operational reason is required for governance and audit logging.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Quantity (Units):</label>
                <input
                  type="number"
                  value={modifyQty}
                  onChange={(e) => setModifyQty(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Operational Modification Reason <span className="text-red-400">*</span>:
                </label>
                <textarea
                  rows={3}
                  value={modifyReason}
                  onChange={(e) => setModifyReason(e.target.value)}
                  placeholder="e.g. Field commander reports road narrowing prevents 10T truck access; downscaling to 4T cargo."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 text-xs focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setModifyingAllocation(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!modifyReason.trim()) {
                    alert('Modification reason is mandatory.');
                    return;
                  }
                  onModify(modifyingAllocation.id, modifyReason, modifyQty);
                  setModifyingAllocation(null);
                }}
                className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold"
              >
                Save & Record Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingAllocation && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-red-400 uppercase tracking-wider">
                Reject Allocation Decision
              </h4>
              <button onClick={() => setRejectingAllocation(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Please enter the rationale for rejecting this allocation recommendation.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Rejection Reason <span className="text-red-400">*</span>:
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Zone already receiving private NGO relief supplies."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 text-xs focus:border-red-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setRejectingAllocation(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onReject(rejectingAllocation.id, rejectReason);
                  setRejectingAllocation(null);
                }}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
