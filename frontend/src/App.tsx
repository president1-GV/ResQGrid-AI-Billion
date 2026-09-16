import React, { useEffect, useState } from 'react';
import { SystemState, OptimizationObjectiveWeights } from './types';
import {
  fetchState,
  runOptimize,
  runBenchmark,
  triggerRoadClosure,
  triggerDemandSpike,
  triggerWarehouseReduction,
  actOnAllocation,
  submitFieldReport,
  fetchFieldReports,
  resetSystemState,
} from './services/api';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardView } from './views/DashboardView';
import { MapView } from './views/MapView';
import { OptimizationView } from './views/OptimizationView';
import { SimulationView } from './views/SimulationView';
import { BenchmarkView } from './views/BenchmarkView';
import { ResourceGapView } from './views/ResourceGapView';
import { ResourcesView } from './views/ResourcesView';
import { FieldReportsView } from './views/FieldReportsView';
import { AnalyticsView } from './views/AnalyticsView';
import { AuditView } from './views/AuditView';
import { DemoModeView } from './views/DemoModeView';
import { CreateIncidentModal } from './components/CreateIncidentModal';
import { Shield, AlertTriangle } from 'lucide-react';

export function App() {
  const [state, setState] = useState<SystemState | null>(null);
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [loading, setLoading] = useState(true);
  const [fieldReports, setFieldReports] = useState<any[]>([]);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('resqgrid_theme') as 'dark' | 'light') || 'dark';
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('resqgrid_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const loadAll = async () => {
    try {
      const [s, reps] = await Promise.all([fetchState(), fetchFieldReports()]);
      setState(s);
      setFieldReports(reps);
    } catch (err) {
      console.error('Error loading state:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // Poll every 8 seconds for background telemetry sync
    const interval = setInterval(loadAll, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleOptimize = async (weights: OptimizationObjectiveWeights) => {
    await runOptimize(weights);
    await loadAll();
  };

  const handleApprove = async (id: string) => {
    await actOnAllocation(id, 'APPROVE', 'Chief Dispatcher');
    await loadAll();
  };

  const handleModify = async (id: string, reason: string, qty: number) => {
    await actOnAllocation(id, 'MODIFY', 'Chief Dispatcher', reason, qty);
    await loadAll();
  };

  const handleReject = async (id: string, reason: string) => {
    await actOnAllocation(id, 'REJECT', 'Chief Dispatcher', reason);
    await loadAll();
  };

  const handleCloseRoad = async (roadId: string, reason?: string) => {
    const res = await triggerRoadClosure(roadId, reason);
    await loadAll();
    return res;
  };

  const handleToggleRoad = async (roadId: string) => {
    if (!state) return;
    const targetRoad = state.roads.find((r) => r.id === roadId);
    if (!targetRoad) return;
    if (targetRoad.status === 'blocked') {
      // Toggle back to open via reset or update
      await triggerRoadClosure(roadId, 'Road cleared by engineering unit');
    } else {
      await triggerRoadClosure(roadId, 'Breached by rising flood waters');
    }
    await loadAll();
  };

  const handleDemandSpike = async (zoneId: string, mult: number, reason?: string) => {
    const res = await triggerDemandSpike(zoneId, mult, reason);
    await loadAll();
    return res;
  };

  const handleWarehouseReduction = async (whId: string, res: string, frac: number) => {
    const r = await triggerWarehouseReduction(whId, res, frac);
    await loadAll();
    return r;
  };

  const handleSubmitReport = async (data: {
    reporter_name: string;
    reporter_role: string;
    location_name: string;
    raw_text: string;
  }) => {
    await submitFieldReport(data);
    await loadAll();
  };

  const handleRunBenchmark = async () => {
    return await runBenchmark();
  };

  const handleReset = async () => {
    setLoading(true);
    await resetSystemState();
    await loadAll();
  };

  if (loading && !state) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-500/50 flex items-center justify-center text-sky-400 font-bold animate-pulse">
          <Shield className="w-6 h-6 text-sky-400" />
        </div>
        <div className="text-sm font-semibold tracking-wider text-white uppercase font-mono">
          Initializing ResQGrid AI Command Engine...
        </div>
        <div className="text-xs text-slate-500 font-mono">
          Connecting Google OR-Tools MIP Solver & OpenStreetMap Spatial Layers
        </div>
      </div>
    );
  }

  const unapprovedCount = state
    ? state.active_allocations.filter((a) => a.status === 'pending_approval').length
    : 0;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col font-sans">
      <Navbar
        state={state}
        onReset={handleReset}
        loading={loading}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenCreateIncident={() => setIsCreateModalOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          unapprovedCount={unapprovedCount}
        />

        <main className="flex-1 overflow-y-auto p-6 bg-[#020617]">
          <div className="max-w-7xl mx-auto pb-12">
            {state && (
              <>
                {currentTab === 'dashboard' && (
                  <DashboardView
                    state={state}
                    onSelectTab={setCurrentTab}
                    onApproveAllocation={handleApprove}
                    onRejectAllocation={(id) => handleReject(id, 'Command Center Rejected')}
                    isDarkMode={theme === 'dark'}
                    onToggleTheme={toggleTheme}
                    onOpenCreateIncident={() => setIsCreateModalOpen(true)}
                  />
                )}

                {currentTab === 'map' && (
                  <MapView
                    state={state}
                    onToggleRoad={handleToggleRoad}
                    isDarkMode={theme === 'dark'}
                  />
                )}

                {currentTab === 'optimization' && (
                  <OptimizationView
                    state={state}
                    onOptimize={handleOptimize}
                    onApprove={handleApprove}
                    onModify={handleModify}
                    onReject={handleReject}
                  />
                )}

                {currentTab === 'simulation' && (
                  <SimulationView
                    state={state}
                    onCloseRoad={handleCloseRoad}
                    onDemandSpike={handleDemandSpike}
                    onWarehouseReduction={handleWarehouseReduction}
                    onReset={handleReset}
                  />
                )}

                {currentTab === 'benchmark' && (
                  <BenchmarkView onRunBenchmark={handleRunBenchmark} />
                )}

                {currentTab === 'gaps' && <ResourceGapView state={state} />}

                {currentTab === 'resources' && <ResourcesView state={state} />}

                {currentTab === 'reports' && (
                  <FieldReportsView
                    reports={fieldReports}
                    onSubmitReport={handleSubmitReport}
                  />
                )}

                {currentTab === 'analytics' && <AnalyticsView />}

                {currentTab === 'audit' && <AuditView />}

                {currentTab === 'demo' && (
                  <DemoModeView
                    state={state}
                    onOptimize={handleOptimize}
                    onCloseRoad={handleCloseRoad}
                    onRunBenchmark={handleRunBenchmark}
                    onSelectTab={setCurrentTab}
                    onReset={handleReset}
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>

      <CreateIncidentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={loadAll}
        isDarkMode={theme === 'dark'}
      />
    </div>
  );
}

export default App;
