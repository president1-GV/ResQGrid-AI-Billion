import React, { useState } from 'react';
import { Layers, AlertOctagon, CheckCircle2, AlertTriangle, ArrowRight, ShieldAlert } from 'lucide-react';
import { SystemState, ResourceGap } from '../types';

interface ResourceGapViewProps {
  state: SystemState;
}

export const ResourceGapView: React.FC<ResourceGapViewProps> = ({ state }) => {
  const latestRun = state.latest_run;
  const gaps: ResourceGap[] = latestRun ? latestRun.gaps : [];

  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');

  const filteredGaps = gaps.filter((g) => {
    if (selectedSeverity !== 'ALL' && g.severity !== selectedSeverity) return false;
    return true;
  });

  const criticalCount = gaps.filter((g) => g.severity === 'Critical').length;
  const moderateCount = gaps.filter((g) => g.severity === 'Moderate').length;
  const coveredCount = gaps.filter((g) => g.severity === 'Covered').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-red-400 font-bold uppercase">Deficit Tracking</span>
            <span className="text-xs px-2 py-0.5 rounded bg-red-950 border border-red-500/40 text-red-300 font-semibold">
              RESOURCE GAP & SHORTAGE ENGINE
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">
            Humanitarian Relief Gap Analysis
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl mt-0.5">
            Identifies unmet demand pockets, flags acute medical or water deficits, and generates actionable supply recommendations.
          </p>
        </div>

        {/* Severity counts badge strip */}
        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={() => setSelectedSeverity('ALL')}
            className={`px-3 py-1.5 rounded-lg border font-medium ${
              selectedSeverity === 'ALL' ? 'bg-slate-800 text-white border-slate-600' : 'bg-slate-950 text-slate-400 border-slate-800'
            }`}
          >
            All Gaps ({gaps.length})
          </button>
          <button
            onClick={() => setSelectedSeverity('Critical')}
            className={`px-3 py-1.5 rounded-lg border font-medium ${
              selectedSeverity === 'Critical' ? 'bg-red-950 text-red-300 border-red-500/40' : 'bg-slate-950 text-slate-400 border-slate-800'
            }`}
          >
            Critical ({criticalCount})
          </button>
          <button
            onClick={() => setSelectedSeverity('Moderate')}
            className={`px-3 py-1.5 rounded-lg border font-medium ${
              selectedSeverity === 'Moderate' ? 'bg-amber-950 text-amber-300 border-amber-500/40' : 'bg-slate-950 text-slate-400 border-slate-800'
            }`}
          >
            Moderate ({moderateCount})
          </button>
          <button
            onClick={() => setSelectedSeverity('Covered')}
            className={`px-3 py-1.5 rounded-lg border font-medium ${
              selectedSeverity === 'Covered' ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' : 'bg-slate-950 text-slate-400 border-slate-800'
            }`}
          >
            Covered ({coveredCount})
          </button>
        </div>
      </div>

      {/* Gaps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGaps.map((gap, idx) => {
          const isCritical = gap.severity === 'Critical';
          const isCovered = gap.severity === 'Covered';

          return (
            <div
              key={idx}
              className={`p-4 rounded-xl border space-y-3 transition ${
                isCritical
                  ? 'bg-slate-900/90 border-red-500/30'
                  : isCovered
                  ? 'bg-slate-900/60 border-emerald-500/20'
                  : 'bg-slate-900/80 border-amber-500/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-200">{gap.zone_name}</span>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                    isCritical
                      ? 'bg-red-950 text-red-400 border border-red-500/40'
                      : isCovered
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                      : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {gap.severity}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Commodity:</span>
                  <strong className="text-white capitalize">{gap.resource_type.replace('_', ' ')}</strong>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Required:</span>
                  <span className="font-mono text-slate-300">{gap.required.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Allocated by Optimizer:</span>
                  <span className="font-mono font-semibold text-sky-400">{gap.allocated.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Shortage Deficit:</span>
                  <span className={`font-mono font-bold ${gap.shortage > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {gap.shortage.toLocaleString()}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mt-2">
                  <div
                    className={`h-full ${
                      gap.coverage_pct >= 90
                        ? 'bg-emerald-500'
                        : gap.coverage_pct >= 50
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(100, gap.coverage_pct)}%` }}
                  />
                </div>
                <div className="text-right text-[10px] text-slate-500 font-mono">
                  {gap.coverage_pct}% Fulfilled
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                <span className="text-[10px] font-mono uppercase text-sky-400 block mb-0.5">Recommended Action:</span>
                {gap.recommended_action}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
