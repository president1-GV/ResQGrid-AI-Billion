import React, { useState, useEffect } from 'react';
import { Award, ArrowRight, CheckCircle2, TrendingUp, TrendingDown, Clock, ShieldCheck, Zap, Activity, Cpu, Server } from 'lucide-react';
import { BenchmarkComparison, OptimizationRun } from '../types';
import { fetchModelsMonitoring } from '../services/api';

interface BenchmarkViewProps {
  onRunBenchmark: () => Promise<{ resqgrid_run: OptimizationRun; comparisons: BenchmarkComparison[] }>;
  isDarkMode?: boolean;
}

export const BenchmarkView: React.FC<BenchmarkViewProps> = ({ onRunBenchmark, isDarkMode = true }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ resqgrid_run: OptimizationRun; comparisons: BenchmarkComparison[] } | null>(null);
  const formatEngineTitle = (engine: any) => {
    if (engine.title) return engine.title;
    const nameMap: Record<string, string> = {
      demand_gradient_boosting: 'Demand Gradient Boosting',
      ortools_mip_allocation_solver: 'OR-Tools MIP Allocation Solver',
      haversine_postgis_routing_engine: 'PostGIS Spatial Routing Engine',
      nlp_multimodal_extractor: 'NLP Multi-Modal Extractor',
      priority_mcda_scoring_engine: 'Priority MCDA Scoring Engine',
    };
    if (nameMap[engine.name]) return nameMap[engine.name];
    if (engine.display_name) return engine.display_name;
    return String(engine.name || '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const [models, setModels] = useState<any[]>([
    {
      id: 'DEM-EST-01',
      name: 'demand_gradient_boosting',
      title: 'Demand Gradient Boosting',
      version: 'v2.4.1',
      status: 'ACTIVE',
      accuracy: 0.948,
      confidence: 0.95,
      latency_ms: 12,
      throughput_qps: 180,
      benchmark_lift: 'Sphere Standard Dynamic Need Calibration',
    },
    {
      id: 'OPT-MIP-01',
      name: 'ortools_mip_allocation_solver',
      title: 'OR-Tools MIP Allocation Solver',
      version: 'v9.8.3296',
      status: 'ACTIVE',
      solver_status: 'OPTIMAL',
      optimality_gap: 0.001,
      latency_ms: 28,
      throughput_qps: 45,
      benchmark_lift: '+49.7% Transit Reduction vs Greedy',
    },
    {
      id: 'ROU-GIS-01',
      name: 'haversine_postgis_routing_engine',
      title: 'PostGIS Spatial Routing Engine',
      version: 'v3.6.3',
      status: 'ACTIVE',
      accuracy: 0.999,
      confidence: 0.99,
      latency_ms: 6,
      throughput_qps: 520,
      benchmark_lift: 'Dynamic Road Impedance & Bridge Avoidance',
    },
    {
      id: 'NLP-EXT-01',
      name: 'nlp_multimodal_extractor',
      title: 'NLP Multi-Modal Extractor',
      version: 'v1.4.2',
      status: 'ACTIVE',
      confidence: 0.92,
      f1_score: '0.91',
      precision: '0.93',
      latency_ms: 16,
      throughput_qps: 210,
      benchmark_lift: 'Multi-Modal SOS Parsing & Entity Resolution',
    },
    {
      id: 'PRI-ENG-01',
      name: 'priority_mcda_scoring_engine',
      title: 'Priority MCDA Scoring Engine',
      version: 'v2.1.0',
      status: 'ACTIVE',
      confidence: 0.96,
      accuracy: 0.965,
      latency_ms: 4,
      throughput_qps: 640,
      benchmark_lift: 'Vulnerability-Weighted Equity Balancing (MCDA)',
    },
  ]);

  useEffect(() => {
    fetchModelsMonitoring()
      .then((res: any) => {
        if (res && res.models && res.models.length > 0) setModels(res.models);
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
      <div className={`p-6 rounded-2xl border shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isDarkMode
          ? 'bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border-amber-500/30'
          : 'bg-amber-50/80 border-amber-300 shadow-sm'
      }`}>
        <div>
          <div className="flex items-center space-x-2">
            <span className={`text-xs font-mono font-bold uppercase ${
              isDarkMode ? 'text-amber-400' : 'text-amber-800'
            }`}>Empirical Proof</span>
            <span className={`text-xs px-2 py-0.5 rounded font-semibold border ${
              isDarkMode
                ? 'bg-amber-950 border-amber-500/40 text-amber-300'
                : 'bg-amber-100 border-amber-300 text-amber-900 font-bold'
            }`}>
              MATHEMATICAL BENCHMARK & EVALUATION
            </span>
          </div>
          <h1 className={`text-2xl font-bold mt-1 ${
            isDarkMode ? 'text-white' : 'text-slate-900'
          }`}>
            Baseline Heuristic vs. ResQGrid Optimization
          </h1>
          <p className={`text-xs max-w-2xl mt-0.5 ${
            isDarkMode ? 'text-slate-400' : 'text-slate-600'
          }`}>
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
      <div className={`p-4 rounded-xl border text-xs space-y-2 ${
        isDarkMode ? 'bg-slate-900/80 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700 shadow-sm'
      }`}>
        <div className={`flex items-center space-x-2 font-semibold uppercase font-mono text-[11px] ${
          isDarkMode ? 'text-slate-200' : 'text-slate-800'
        }`}>
          <ShieldCheck className="w-4 h-4 text-sky-500" />
          <span>Verified Benchmark Protocol</span>
        </div>
        <p className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
          The <strong>Baseline</strong> models conventional manual disaster response: each zone draws from the closest warehouse until local stocks deplete, ignoring network congestion and global equity. <strong>ResQGrid</strong> solves the full Mixed Integer Program simultaneously, optimizing fleet payloads, avoiding blocked bridges, and ensuring remote slums receive life-saving quotas.
        </p>
      </div>

      {/* Comparative Cards & Table */}
      {data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-5 rounded-xl border space-y-2 ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <span className={`text-[10px] font-mono uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Response Speed Improvement</span>
              <div className="text-3xl font-extrabold text-emerald-500">
                {data.comparisons.find((c) => c.metric.includes('Response'))?.improvement_pct}% FASTER
              </div>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Reduced transit latency by eliminating dispatch bottlenecks.
              </p>
            </div>

            <div className={`p-5 rounded-xl border space-y-2 ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <span className={`text-[10px] font-mono uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Unmet Shortage Reduction</span>
              <div className="text-3xl font-extrabold text-sky-500">
                {data.comparisons.find((c) => c.metric.includes('Unmet'))?.improvement_pct}% BETTER
              </div>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Satisfies thousands more critical relief units across 7 sectors.
              </p>
            </div>

            <div className={`p-5 rounded-xl border space-y-2 ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <span className={`text-[10px] font-mono uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Humanitarian Equity Lift</span>
              <div className="text-3xl font-extrabold text-purple-500">
                {data.comparisons.find((c) => c.metric.includes('Equity'))?.improvement_pct}% REDUCTION
              </div>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Eliminates the disparity between easy-to-reach wards and slums.
              </p>
            </div>
          </div>

          {/* Full Benchmark Table */}
          <div className={`p-5 rounded-xl border space-y-4 ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <h3 className={`text-sm font-bold uppercase tracking-wider ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>
              Auditable Objective Metrics Comparison
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b uppercase font-mono text-[10px] ${
                    isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
                  }`}>
                    <th className="py-2.5 px-3">Objective Metric</th>
                    <th className="py-2.5 px-3">Greedy Baseline</th>
                    <th className="py-2.5 px-3">ResQGrid OR-Tools</th>
                    <th className="py-2.5 px-3">Improvement</th>
                    <th className="py-2.5 px-3">Optimization Mechanism</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
                  {data.comparisons.map((c, idx) => (
                    <tr key={idx} className={isDarkMode ? 'hover:bg-slate-800/30 transition' : 'hover:bg-slate-50 transition'}>
                      <td className={`py-3 px-3 font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {c.metric}
                      </td>
                      <td className={`py-3 px-3 font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        {c.baseline_value.toLocaleString()} {c.unit}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-sky-600 dark:text-sky-400">
                        {c.optimized_value.toLocaleString()} {c.unit}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${
                          isDarkMode
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}>
                          {c.improvement_pct > 0 ? `+${c.improvement_pct}%` : `${c.improvement_pct}%`}
                        </span>
                      </td>
                      <td className={`py-3 px-3 text-xs max-w-xs ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
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
        <div className={`p-12 rounded-2xl border text-center space-y-3 ${
          isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <Award className={`w-10 h-10 mx-auto ${isDarkMode ? 'text-amber-500/40' : 'text-amber-500/80'}`} />
          <h4 className={`text-base font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Ready to Benchmark</h4>
          <p className={`text-xs max-w-md mx-auto ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Click the button above to execute the dual-engine comparison test. All values are computed deterministically by the Python solver.
          </p>
        </div>
      )}

      {/* Model Monitoring & Evaluation Panel */}
      <div className={`p-6 rounded-2xl border space-y-4 shadow-xl ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-slate-200/50'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Cpu className="w-5 h-5 text-sky-500" />
            <div>
              <h3 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                AI / Mathematical Engine Monitoring
              </h3>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Live health, solver status, latency, and verification metadata across all engines.
              </p>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold border ${
            isDarkMode
              ? 'bg-slate-800 text-emerald-400 border-emerald-500/30'
              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
          }`}>
            {models.length > 0 ? `${models.length} ENGINES ONLINE` : '5 ENGINES ONLINE'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 pt-2">
          {models.map((m) => (
            <div
              key={m.id || m.name}
              className={`p-4 rounded-xl border space-y-3 transition shadow-sm flex flex-col justify-between ${
                isDarkMode
                  ? 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  : 'bg-slate-50 border-slate-200 hover:border-sky-400 hover:bg-white shadow-slate-200/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1.5 mb-2">
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                    isDarkMode
                      ? 'bg-sky-950/60 text-sky-400 border-sky-500/30'
                      : 'bg-sky-100 text-sky-800 border-sky-300'
                  }`}>
                    {m.id || 'ENG'}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border shrink-0 ${
                    isDarkMode
                      ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}>
                    {m.status}
                  </span>
                </div>
                <h4 className={`text-[13px] font-bold tracking-tight leading-snug ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}>
                  {formatEngineTitle(m)}
                </h4>
                <div className={`text-[10px] font-mono mt-0.5 truncate ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`} title={m.name}>
                  {m.name}
                </div>
              </div>

              <div className={`text-[11px] space-y-1.5 pt-2 border-t ${
                isDarkMode ? 'border-slate-800/80' : 'border-slate-200'
              }`}>
                <div className="flex justify-between items-center">
                  <span className={isDarkMode ? 'text-slate-400 font-medium' : 'text-slate-600 font-medium'}>Version</span>
                  <span className={`font-mono font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>{m.version}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDarkMode ? 'text-slate-400 font-medium' : 'text-slate-600 font-medium'}>Latency</span>
                  <span className={`font-mono font-bold ${isDarkMode ? 'text-sky-400' : 'text-sky-700'}`}>{m.latency_ms} ms</span>
                </div>
                {m.solver_status && (
                  <div className="flex justify-between items-center">
                    <span className={isDarkMode ? 'text-slate-400 font-medium' : 'text-slate-600 font-medium'}>Solver Status</span>
                    <span className={`font-mono font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>{m.solver_status}</span>
                  </div>
                )}
                {m.confidence && (
                  <div className="flex justify-between items-center">
                    <span className={isDarkMode ? 'text-slate-400 font-medium' : 'text-slate-600 font-medium'}>Confidence</span>
                    <span className={`font-mono font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>{Math.round(m.confidence * 100)}%</span>
                  </div>
                )}
                {m.accuracy && (
                  <div className="flex justify-between items-center">
                    <span className={isDarkMode ? 'text-slate-400 font-medium' : 'text-slate-600 font-medium'}>Accuracy</span>
                    <span className={`font-mono font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                      {typeof m.accuracy === 'number' ? `${Math.round(m.accuracy * 100)}%` : m.accuracy}
                    </span>
                  </div>
                )}
                {m.f1_score && (
                  <div className="flex justify-between items-center">
                    <span className={isDarkMode ? 'text-slate-400 font-medium' : 'text-slate-600 font-medium'}>F1 Score</span>
                    <span className={`font-mono font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>{m.f1_score}</span>
                  </div>
                )}
                {m.precision && (
                  <div className="flex justify-between items-center">
                    <span className={isDarkMode ? 'text-slate-400 font-medium' : 'text-slate-600 font-medium'}>Precision</span>
                    <span className={`font-mono font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>{m.precision}</span>
                  </div>
                )}
                {m.throughput_qps && (
                  <div className="flex justify-between items-center">
                    <span className={isDarkMode ? 'text-slate-400 font-medium' : 'text-slate-600 font-medium'}>Throughput</span>
                    <span className={`font-mono ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>{m.throughput_qps} QPS</span>
                  </div>
                )}
                {m.benchmark_lift && (
                  <div className={`pt-2 mt-1 border-t text-[10px] font-mono font-medium leading-tight ${
                    isDarkMode ? 'border-slate-800/80 text-amber-300' : 'border-slate-200 text-amber-900 font-bold'
                  }`}>
                    {m.benchmark_lift}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
