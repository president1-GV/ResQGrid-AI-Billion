import React from 'react';
import {
  LayoutDashboard,
  MapPin,
  Sliders,
  PlaySquare,
  TrendingUp,
  FileText,
  Boxes,
  Layers,
  Award,
  History,
  ShieldCheck,
  Zap,
  Database,
  Brain
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'demo'
  | 'datasets'
  | 'analyzer'
  | 'map'
  | 'optimization'
  | 'simulation'
  | 'gaps'
  | 'benchmark'
  | 'reports'
  | 'resources'
  | 'analytics'
  | 'audit';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  unapprovedCount: number;
  isDarkMode?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  unapprovedCount,
  isDarkMode = true,
}) => {
  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Command Center', icon: LayoutDashboard, badge: null },
    { id: 'demo' as NavTab, label: 'Demo Flow', icon: Zap, badge: 'Guide' },
    { id: 'datasets' as NavTab, label: 'Datasets & Quality', icon: Database, badge: 'Live' },
    { id: 'analyzer' as NavTab, label: 'LLM & Field Reports', icon: Brain, badge: 'AI' },
    { id: 'map' as NavTab, label: 'Live GIS Map', icon: MapPin, badge: null },
    { id: 'optimization' as NavTab, label: 'Optimization Engine', icon: Sliders, badge: unapprovedCount > 0 ? `${unapprovedCount} pending` : null },
    { id: 'simulation' as NavTab, label: 'What-If Simulation', icon: PlaySquare, badge: 'Live' },
    { id: 'benchmark' as NavTab, label: 'Baseline vs ResQGrid', icon: Award, badge: null },
    { id: 'gaps' as NavTab, label: 'Resource Gap Analysis', icon: Layers, badge: null },
    { id: 'resources' as NavTab, label: 'Warehouses & Fleets', icon: Boxes, badge: null },
    { id: 'reports' as NavTab, label: 'Dispatches & Reports', icon: FileText, badge: null },
    { id: 'analytics' as NavTab, label: 'Impact Analytics', icon: TrendingUp, badge: null },
    { id: 'audit' as NavTab, label: 'Governance & Audit', icon: ShieldCheck, badge: null },
  ];

  return (
    <aside
      className={`w-64 flex flex-col justify-between p-3 shrink-0 select-none transition-colors duration-200 ${
        isDarkMode
          ? 'bg-slate-950 border-r border-slate-800'
          : 'bg-white border-r border-slate-200 shadow-sm'
      }`}
    >
      <div className="space-y-1">
        <div
          className={`px-3 py-2 text-[10px] font-mono font-bold tracking-wider uppercase ${
            isDarkMode ? 'text-slate-500' : 'text-slate-600'
          }`}
        >
          Tactical Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? isDarkMode
                    ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm shadow-sky-500/10 font-bold'
                    : 'bg-sky-100 text-sky-800 border border-sky-300 shadow-sm font-bold'
                  : isDarkMode
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive
                      ? isDarkMode
                        ? 'text-sky-400'
                        : 'text-sky-700 font-bold'
                      : isDarkMode
                      ? 'text-slate-500'
                      : 'text-slate-500'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                    item.badge === 'Guide'
                      ? isDarkMode
                        ? 'bg-purple-950 text-purple-300 border-purple-500/40'
                        : 'bg-purple-100 text-purple-800 border-purple-300'
                      : item.badge === 'Live'
                      ? isDarkMode
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : isDarkMode
                      ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                      : 'bg-amber-100 text-amber-900 border-amber-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* System Status Footer */}
      <div
        className={`p-3 rounded-lg text-[11px] space-y-2 border transition-colors duration-200 ${
          isDarkMode
            ? 'bg-slate-900/60 border-slate-800/80 text-slate-400'
            : 'bg-slate-50 border-slate-200 text-slate-700 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className={`font-mono ${isDarkMode ? 'text-slate-300' : 'text-slate-700 font-medium'}`}>
              OR-Tools Solver
            </span>
          </span>
          <span className={isDarkMode ? 'text-emerald-400 font-semibold' : 'text-emerald-700 font-bold'}>
            Active
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className={`font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Constraint Engine
          </span>
          <span className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>
            MIP / SCIP
          </span>
        </div>
        <div
          className={`pt-1 border-t text-[10px] text-center font-mono font-semibold ${
            isDarkMode ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-500'
          }`}
        >
          FROM SIGNALS &rarr; TO ACTION
        </div>
      </div>
    </aside>
  );
};
