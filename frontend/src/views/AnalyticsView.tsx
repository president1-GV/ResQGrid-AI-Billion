import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TrendingUp, Activity, BarChart2, ShieldCheck, Clock } from 'lucide-react';
import { fetchAnalytics } from '../services/api';

export const AnalyticsView: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return (
      <div className="p-12 text-center text-xs text-slate-400">
        Loading operational analytics and optimization trends...
      </div>
    );
  }

  const COLORS = ['#0EA5FF', '#22D3EE', '#C084FC', '#F59E0B', '#EF4444', '#10B981'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-emerald-400 font-bold uppercase">Executive Analytics</span>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-semibold">
              EVALUATION DASHBOARD
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">
            Performance Metrics & Allocation Trends
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl mt-0.5">
            Statistical breakdown of demand satisfaction, response time latency curves, and humanitarian coverage across all 7 disaster zones.
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Supply vs Demand vs Allocation */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2">
            <BarChart2 className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Relief Commodities: Required vs Available vs Allocated
            </h3>
          </div>

          <div className="h-72 text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.resource_comparison} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="resource" stroke="#94A3B8" angle={-15} textAnchor="end" tick={{ fontSize: 10 }} />
                <YAxis stroke="#94A3B8" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="required" fill="#EF4444" name="Required Demand" />
                <Bar dataKey="available" fill="#3B82F6" name="Depot Stock" />
                <Bar dataKey="allocated" fill="#10B981" name="Optimized Dispatch" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Zone Priority Ranking & Severity */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Disaster Severity (%) vs Computed Priority Score
            </h3>
          </div>

          <div className="h-72 text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.zone_metrics} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="zone" stroke="#94A3B8" angle={-15} textAnchor="end" tick={{ fontSize: 10 }} />
                <YAxis stroke="#94A3B8" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="severity" fill="#F59E0B" name="Flood Severity %" />
                <Bar dataKey="priority" fill="#C084FC" name="Explainable Priority Score" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Response Time across Optimization Runs */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 lg:col-span-2">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Solver Performance History: Response Time & Equity Gap Evolution
            </h3>
          </div>

          <div className="h-64 text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.run_history} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="run_id" stroke="#94A3B8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#94A3B8" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="response_time" stroke="#10B981" strokeWidth={2} name="Avg Response Time (min)" />
                <Line type="monotone" dataKey="equity_gap" stroke="#0EA5FF" strokeWidth={2} name="Humanitarian Equity Gap" />
                <Line type="monotone" dataKey="utilization" stroke="#C084FC" strokeWidth={2} name="Depot Utilization %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
