import React, { useState, useEffect } from 'react';
import { Award, ArrowRight, CheckCircle2, TrendingUp, TrendingDown, Clock, ShieldCheck, Zap, Activity, Cpu, Server } from 'lucide-react';
import { BenchmarkComparison, OptimizationRun } from '../types';
import { fetchModelsMonitoring } from '../services/api';

interface BenchmarkViewProps {
  onRunBenchmark: () => Promise<{ resqgrid_run: OptimizationRun; comparisons: BenchmarkComparison[] }>;
}

export const BenchmarkView: React.FC<BenchmarkViewProps> = ({ onRunBenchmark }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ resqgrid_run: OptimizationRun; comparisons: BenchmarkComparison[] } | null>(null);
  const [models, setModels] = useState<any[]>([]);

  useEffect(() => {
    fetchModelsMonitoring()
      .then((res: any) => {
        if (res && res.models) setModels(res.models);
      })
      .catch((err: any) => console.error('Error fetching models:', err));
  }, []);

  const handleBenchmark = async () => {
    setLoading(true);
    try {
      const res = await onRunBenchmark();
      setData(res);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-amber-400 font-bold uppercase">Empirical Proof</span>
            <span className="text-xs px-2 py-0.5 rounded bg-amber-950 border border-amber-500/40 text-amber-300 font-semibold">
              MATHEMATICAL BENCHMARK & EVALUATION
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">
            Baseline Heuristic vs. ResQGrid Optimization
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl mt-0.5">
            Strict scientific comparison against the standard operational baseline (Greedy Nearest-Depot Allocation) to mathematically prove the performance delta of Google OR-Tools MIP.
          </p>
        </div>

        <button
          onClick={handleBenchmark}
          disabled={loading}
          className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/20 transition disabled:opacity-50 cursor-pointer"
        >
          <Award className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'CALCULATING BENCHMARK...' : '⚡ EXECUTE BENCHMARK COMPARISON'}</span>
        </button>
      </div>

      {/* Explanatory Methodology Card */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-2">
        <div className="flex items-center space-x-2 text-slate-200 font-semibold uppercase font-mono text-[11px]">
          <ShieldCheck className="w-4 h-4 text-sky-400" />
          <span>Verified Benchmark Protocol</span>
        </div>
        <p className="text-slate-400">
          The <strong>Baseline</strong> models conventional manual disaster response: each zone draws from the closest warehouse until local stocks deplete, ignoring network congestion and global equity. <strong>ResQGrid</strong> solves the full Mixed Integer Program simultaneously, optimizing fleet payloads, avoiding blocked bridges, and ensuring remote slums receive life-saving quotas.
        </p>
      </div>

      {/* Comparative Cards & Table */}
      {data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-[10px] font-mono uppercase text-slate-400">Response Speed Improvement</span>
              <div className="text-3xl font-extrabold text-emerald-400">
                {data.comparisons.find((c) => c.metric.includes('Response'))?.improvement_pct}% FASTER
              </div>
              <p className="text-xs text-slate-400">
                Reduced transit latency by eliminating dispatch bottlenecks.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-[10px] font-mono uppercase text-slate-400">Unmet Shortage Reduction</span>
              <div className="text-3xl font-extrabold text-sky-400">
                {data.comparisons.find((c) => c.metric.includes('Unmet'))?.improvement_pct}% BETTER
              </div>
              <p className="text-xs text-slate-400">
                Satisfies thousands more critical relief units across 7 sectors.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-[10px] font-mono uppercase text-slate-400">Humanitarian Equity Lift</span>
              <div className="text-3xl font-extrabold text-purple-400">
                {data.comparisons.find((c) => c.metric.includes('Equity'))?.improvement_pct}% REDUCTION
              </div>
              <p className="text-xs text-slate-400">
                Eliminates the disparity between easy-to-reach wards and slums.
              </p>
            </div>
          </div>

          {/* Full Benchmark Table */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Auditable Objective Metrics Comparison
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                    <th className="py-2.5 px-3">Objective Metric</th>
                    <th className="py-2.5 px-3">Greedy Baseline</th>
                    <th className="py-2.5 px-3">ResQGrid OR-Tools</th>
                    <th className="py-2.5 px-3">Improvement</th>
                    <th className="py-2.5 px-3">Optimization Mechanism</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {data.comparisons.map((c, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-3 font-semibold text-white">
                        {c.metric}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400">
                        {c.baseline_value.toLocaleString()} {c.unit}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-sky-400">
                        {c.optimized_value.toLocaleString()} {c.unit}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                          {c.improvement_pct > 0 ? `+${c.improvement_pct}%` : `${c.improvement_pct}%`}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300 text-xs max-w-xs">
                        {c.explanation}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
          <Award className="w-10 h-10 text-amber-500/40 mx-auto" />
          <h4 className="text-base font-bold text-slate-200">Ready to Benchmark</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Click the button above to execute the dual-engine comparison test. All values are computed deterministically by the Python solver.
          </p>
        </div>
      )}

      {/* Model Monitoring & Evaluation Panel */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Cpu className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="text-base font-bold text-white">AI / Mathematical Engine Monitoring</h3>
              <p className="text-xs text-slate-400">Live health, solver status, latency, and verification metadata across all engines.</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded bg-slate-800 text-[11px] font-mono text-slate-300 border border-slate-700">
            5 ENGINES ONLINE
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {models.map((m) => (
            <div key={m.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{m.name}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                  {m.status}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 space-y-1">
                <div>Version: <span className="text-slate-200 font-mono">{m.version}</span></div>
                <div>Latency: <span className="text-sky-400 font-mono">{m.latency_ms} ms</span></div>
                {m.solver_status && <div>Solver Status: <span className="text-emerald-400 font-mono font-bold">{m.solver_status}</span></div>}
                {m.confidence && <div>Confidence: <span className="text-emerald-400 font-mono font-bold">{Math.round(m.confidence * 100)}%</span></div>}
                {m.f1_score && <div>F1 Score: <span className="text-slate-500 font-mono">{m.f1_score}</span></div>}
                {m.precision && <div>Precision: <span className="text-slate-500 font-mono">{m.precision}</span></div>}
                {m.benchmark_lift && <div className="text-amber-300 font-mono font-semibold">{m.benchmark_lift}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
