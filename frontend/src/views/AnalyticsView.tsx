import React, { useEffect, useState, useCallback } from 'react';
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
import {
  TrendingUp,
  Activity,
  BarChart2,
  ShieldCheck,
  Clock,
  RefreshCw,
  Database,
  CheckCircle2,
  Layers,
  HeartHandshake,
  Truck,
  Zap,
  Radio,
  Warehouse
} from 'lucide-react';
import { fetchAnalytics } from '../services/api';
import { subscribeToRealtime, DbAnalyticsData } from '../services/supabaseClient';

export const AnalyticsView: React.FC = () => {
  const [data, setData] = useState<DbAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 'bulk' | 'kits' | 'fleet'>('all');

  const loadData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetchAnalytics();
      setData(res);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Subscribe to live PostgreSQL real-time table mutations
    const unsubAllocations = subscribeToRealtime('allocations', () => {
      loadData();
    });
    const unsubRoads = subscribeToRealtime('roads', () => {
      loadData();
    });

    // Fallback sync polling every 12 seconds
    const interval = setInterval(() => {
      loadData();
    }, 12000);

    return () => {
      unsubAllocations();
      unsubRoads();
      clearInterval(interval);
    };
  }, [loadData]);

  if (loading && !data) {
    return (
      <div className="p-16 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
        <div className="text-sm font-semibold text-slate-300">
          Querying Authoritative PostgreSQL 15 & PostGIS Spatial Layers...
        </div>
        <div className="text-xs text-slate-500">
          Syncing affected_zones, warehouses, allocations, and optimization_runs
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-12 text-center text-xs text-red-400">
        Failed to load database analytics. Please click refresh to retry.
      </div>
    );
  }

  // Filter resources for Chart 1
  const filteredResources = data.resource_comparison.filter((r) => {
    if (activeCategory === 'all') return true;
    return r.category === activeCategory;
  });

  const PIE_COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];

  return (
    <div className="space-y-6">
      {/* Top Banner: Status, Database Metadata & Manual Refresh */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
              Executive Analytics
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              LIVE POSTGRESQL & POSTGIS
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-950 border border-sky-500/40 text-sky-300 font-mono font-medium">
              {data.table_records.zones} Zones &bull; {data.table_records.warehouses} Depots &bull; {data.table_records.allocations} Dispatches
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1.5">
            Operational Analytics & Optimization Evaluation
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl mt-1">
            Real-time telemetry and database analytics for humanitarian relief operations across all 7 monitored flood sectors in the Brahmaputra Basin.
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start lg:self-auto">
          <div className="text-right hidden sm:block">
            <div className="text-[11px] font-mono text-slate-400">Database Engine</div>
            <div className="text-xs font-semibold text-sky-400 font-mono">{data.database_engine}</div>
            <div className="text-[10px] text-slate-500">Synced at {data.last_sync}</div>
          </div>
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 text-white text-xs font-bold transition flex items-center space-x-2 shadow-lg shadow-sky-600/20 cursor-pointer"
            title="Force re-query of all live database records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Sync Live DB'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Lives Protected</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {data.lives_protected.toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-400 font-medium">100% Ward Coverage</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Demand Fulfilled</span>
            <CheckCircle2 className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {data.demand_fulfillment_pct}%
          </div>
          <div className="text-[10px] text-sky-400 font-medium">MIP Allocation Parity</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Avg Response</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {data.average_response_time_min} <span className="text-xs font-normal text-slate-400">min</span>
          </div>
          <div className="text-[10px] text-amber-400 font-medium">-42% vs Baseline</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Route Gain</span>
            <Zap className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">
            +{data.efficiency_gain_pct}%
          </div>
          <div className="text-[10px] text-purple-400 font-medium">PostGIS Dynamic Routing</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Equity Gini</span>
            <HeartHandshake className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {data.equity_gini_coefficient}
          </div>
          <div className="text-[10px] text-rose-400 font-medium">High Fairness Balance</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Total Dispatched</span>
            <Truck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {data.total_resources_delivered.toLocaleString()}
          </div>
          <div className="text-[10px] text-cyan-400 font-medium">All Commodities Total</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Relief Commodities: Required vs Available vs Allocated */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <BarChart2 className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Relief Commodities: Required vs Available vs Allocated
              </h3>
            </div>
            
            {/* Category Filter Pills */}
            <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[10px]">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-2 py-0.5 rounded font-medium transition ${
                  activeCategory === 'all' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveCategory('bulk')}
                className={`px-2 py-0.5 rounded font-medium transition ${
                  activeCategory === 'bulk' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Bulk Rations
              </button>
              <button
                onClick={() => setActiveCategory('kits')}
                className={`px-2 py-0.5 rounded font-medium transition ${
                  activeCategory === 'kits' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Kits
              </button>
              <button
                onClick={() => setActiveCategory('fleet')}
                className={`px-2 py-0.5 rounded font-medium transition ${
                  activeCategory === 'fleet' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Fleet
              </button>
            </div>
          </div>

          <div className="h-72 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={250}>
              <BarChart
                data={filteredResources}
                margin={{ top: 15, right: 15, left: 5, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis
                  dataKey="resource"
                  stroke="#94A3B8"
                  angle={-15}
                  textAnchor="end"
                  tick={{ fontSize: 10 }}
                  interval={0}
                />
                <YAxis stroke="#94A3B8" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '11px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                  }}
                  formatter={(value: any, name: any, item: any) => {
                    const unit = item.payload.unit || 'units';
                    return [`${Number(value).toLocaleString()} ${unit}`, name];
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="required" fill="#EF4444" name="Required Demand" radius={[4, 4, 0, 0]} />
                <Bar dataKey="available" fill="#3B82F6" name="Depot Stock" radius={[4, 4, 0, 0]} />
                <Bar dataKey="allocated" fill="#10B981" name="Optimized Dispatch" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Zone Priority Ranking & Severity */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Disaster Severity (%) vs Computed Priority Score
              </h3>
            </div>
            <span className="text-[10px] font-mono text-purple-400 font-semibold bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/30">
              7 AFFECTED ZONES
            </span>
          </div>

          <div className="h-72 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={250}>
              <BarChart
                data={data.zone_metrics}
                margin={{ top: 15, right: 15, left: 5, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis
                  dataKey="zone"
                  stroke="#94A3B8"
                  angle={-15}
                  textAnchor="end"
                  tick={{ fontSize: 10 }}
                  interval={0}
                />
                <YAxis stroke="#94A3B8" tick={{ fontSize: 10 }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '11px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                  }}
                  formatter={(value: any, name: any) => [
                    `${value}%`,
                    name,
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="severity" fill="#F59E0B" name="Flood Severity %" radius={[4, 4, 0, 0]} />
                <Bar dataKey="priority" fill="#C084FC" name="Explainable Priority Score" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Response Time across Optimization Runs */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Solver Performance History: Response Time & Equity Gap Evolution
              </h3>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Live Runs Recorded: {data.run_history.length}
            </div>
          </div>

          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={220}>
              <LineChart
                data={data.run_history}
                margin={{ top: 15, right: 25, left: 5, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="label" stroke="#94A3B8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#94A3B8" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '11px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Line
                  type="monotone"
                  dataKey="response_time"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#10B981' }}
                  name="Avg Response Time (min)"
                />
                <Line
                  type="monotone"
                  dataKey="equity_gap"
                  stroke="#0EA5FF"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#0EA5FF' }}
                  name="Humanitarian Equity Gap"
                />
                <Line
                  type="monotone"
                  dataKey="utilization"
                  stroke="#C084FC"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#C084FC' }}
                  name="Depot Utilization %"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Logistics Depots & Stockpile Reserves */}
        {data.warehouse_metrics && data.warehouse_metrics.length > 0 && (
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 lg:col-span-2">
            <div className="flex items-center space-x-2">
              <Warehouse className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Strategic Warehouse Stockpiles & Reserve Utilization
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.warehouse_metrics.map((wh) => (
                <div key={wh.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-white">{wh.name}</div>
                      <div className="text-[10px] text-slate-400">{wh.location_name}</div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 border border-sky-500/30 text-sky-300 font-bold">
                      {wh.id}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Capacity Utilization</span>
                      <span className="font-bold text-sky-400">{wh.utilization_pct}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-500"
                        style={{ width: `${wh.utilization_pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 border-t border-slate-900">
                    <div>
                      <span className="text-slate-500 block">Water:</span>
                      <span className="font-mono font-bold text-slate-300">{(wh.inventory?.water || 0).toLocaleString()} L</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Food:</span>
                      <span className="font-mono font-bold text-slate-300">{(wh.inventory?.food || 0).toLocaleString()} Rations</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Medical Kits:</span>
                      <span className="font-mono font-bold text-slate-300">{(wh.inventory?.medical_kits || 0).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Ambulances:</span>
                      <span className="font-mono font-bold text-slate-300">{(wh.inventory?.ambulances || 0).toLocaleString()} Units</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsView;
