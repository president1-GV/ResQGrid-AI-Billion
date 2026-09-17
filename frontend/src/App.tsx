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
  switchScenario,
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
import { DatasetsView } from './views/DatasetsView';
import { FieldReportAnalyzerView } from './views/FieldReportAnalyzerView';
import { CreateIncidentModal } from './components/CreateIncidentModal';
import { RequestAppReviewQueue } from './components/RequestAppReviewQueue';
import { RequestsView } from './views/RequestsView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { getInitialSystemState, getInitialFieldReports } from './data/initialState';
import { Shield, AlertTriangle } from 'lucide-react';

export function App() {
  const [state, setState] = useState<SystemState>(() => {
    const saved = typeof window !== 'undefined'
      ? ((localStorage.getItem('resqgrid_scenario') as 'flood' | 'tsunami') || 'flood')
      : 'flood';
    return getInitialSystemState(saved);
  });
  const validTabs: NavTab[] = [
    'dashboard',
    'requests',
    'datasets',
    'map',
    'optimization',
    'simulation',
    'benchmark',
    'gaps',
    'resources',
    'reports',
    'analytics',
    'audit',
    'demo',
    'analyzer',
  ];
  const [currentTab, setCurrentTab] = useState<NavTab>(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && validTabs.includes(hash as NavTab)) {
      return hash as NavTab;
    }
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam && validTabs.includes(tabParam as NavTab)) {
      return tabParam as NavTab;
    }
    return 'dashboard';
  });
  const [loading, setLoading] = useState(false);

  const handleSelectTab = (tab: NavTab) => {
    setCurrentTab(tab);
    window.location.hash = tab;
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && validTabs.includes(hash as NavTab)) {
        setCurrentTab(hash as NavTab);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  const [fieldReports, setFieldReports] = useState<any[]>(() => getInitialFieldReports());
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

  const handleSwitchScenario = async (scen: 'flood' | 'tsunami') => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('resqgrid_scenario', scen);
    }
    // Optimistically switch state immediately so the entire UI responds with zero lag
    const initialForScen = getInitialSystemState(scen);
    setState(initialForScen);
    setLoading(true);
    try {
      const newState = await switchScenario(scen);
      setState(newState);
      await loadAll();
    } catch (err) {
      console.error('Failed to switch scenario:', err);
    } finally {
      setLoading(false);
    }
  };

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
        <div className="w-16 h-16 rounded-2xl bg-white p-1 border border-sky-500/50 shadow-xl shadow-sky-500/20 flex items-center justify-center animate-pulse overflow-hidden">
          <img
            src="/resqgrid-logo.png"
            alt="ResQGrid AI Logo"
            className="w-full h-full object-contain"
          />
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
    ? (state.active_allocations || []).filter((a) => {
        const s = (a.status || '').toLowerCase();
        return s === 'pending_approval' || s === 'pending';
      }).length
    : 0;

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 overflow-x-hidden ${
      theme === 'dark' ? 'bg-[#020617] text-slate-200' : 'bg-slate-50 text-slate-900'
    }`}>
      <Navbar
        state={state}
        onReset={handleReset}
        loading={loading}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenCreateIncident={() => setIsCreateModalOpen(true)}
        onSwitchScenario={handleSwitchScenario}
        onSelectTab={handleSelectTab}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          unapprovedCount={unapprovedCount}
          isDarkMode={theme === 'dark'}
        />

        <main className={`flex-1 overflow-y-auto p-6 transition-colors duration-200 ${
          theme === 'dark' ? 'bg-[#020617]' : 'bg-slate-50'
        }`}>
          <div className="max-w-7xl mx-auto pb-12">
            {state && (
              <ErrorBoundary isDarkMode={theme === 'dark'} fallbackTitle="View Rendering Issue Detected">
                {currentTab === 'dashboard' && (
                  <DashboardView
                    state={state}
                    onSelectTab={handleSelectTab}
                    onApproveAllocation={handleApprove}
                    onRejectAllocation={(id, reason) => handleReject(id, reason || 'Command Center Rejected')}
                    onModifyAllocation={handleModify}
                    onRequestEmergencyDemand={(zoneId, commodity, qty, reason) => handleDemandSpike(zoneId, 1.25, reason)}
                    isDarkMode={theme === 'dark'}
                    onToggleTheme={toggleTheme}
                    onOpenCreateIncident={() => setIsCreateModalOpen(true)}
                    onOptimize={handleOptimize}
                    onCloseRoad={handleCloseRoad}
                    onSwitchScenario={handleSwitchScenario}
                  />
                )}

                {currentTab === 'requests' && (
                  <ErrorBoundary isDarkMode={theme === 'dark'} fallbackTitle="Requests & Approvals View">
                    <RequestsView
                      state={state}
                      onApprove={handleApprove}
                      onReject={(id, reason) => handleReject(id, reason || 'Rejected during tactical review')}
                      onModify={handleModify}
                      onBatchApproveAll={async () => {
                        const pending = (state.active_allocations || []).filter((a) => {
                          const s = (a.status || '').toLowerCase();
                          return s === 'pending_approval' || s === 'pending';
                        });
                        for (const a of pending) {
                          await handleApprove(a.id);
                        }
                        await loadAll();
                      }}
                      isDarkMode={theme === 'dark'}
                    />
                  </ErrorBoundary>
                )}

                {currentTab === 'datasets' && (
                  <ErrorBoundary isDarkMode={theme === 'dark'} fallbackTitle="Datasets & Quality Intelligence View">
                    <DatasetsView isDarkMode={theme === 'dark'} />
                  </ErrorBoundary>
                )}
                {currentTab === 'analyzer' && (
                  <ErrorBoundary isDarkMode={theme === 'dark'} fallbackTitle="LLM & Field Reports Studio">
                    <FieldReportAnalyzerView
                      isDarkMode={theme === 'dark'}
                      onSubmitReport={handleSubmitReport}
                      onRefreshState={loadAll}
                    />
                  </ErrorBoundary>
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
                    isDarkMode={theme === 'dark'}
                  />
                )}

                {currentTab === 'simulation' && (
                  <SimulationView
                    state={state}
                    onCloseRoad={handleCloseRoad}
                    onDemandSpike={handleDemandSpike}
                    onWarehouseReduction={handleWarehouseReduction}
                    onReset={handleReset}
                    isDarkMode={theme === 'dark'}
                  />
                )}

                {currentTab === 'benchmark' && (
                  <ErrorBoundary isDarkMode={theme === 'dark'} fallbackTitle="Benchmark & Mathematical Evaluation View">
                    <BenchmarkView
                      onRunBenchmark={handleRunBenchmark}
                      isDarkMode={theme === 'dark'}
                    />
                  </ErrorBoundary>
                )}

                {currentTab === 'gaps' && <ResourceGapView state={state} />}

                {currentTab === 'resources' && <ResourcesView state={state} />}

                {currentTab === 'reports' && (
                  <FieldReportsView
                    reports={fieldReports}
                    onSubmitReport={handleSubmitReport}
                    isDarkMode={theme === 'dark'}
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
                    onSelectTab={handleSelectTab}
                    onReset={handleReset}
                    isDarkMode={theme === 'dark'}
                  />
                )}
              </ErrorBoundary>
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
