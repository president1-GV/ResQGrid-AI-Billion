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
  Brain,
  CheckCircle2
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'requests'
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

interface NavSection {
  title: string;
  items: {
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | null;
    badgeType?: 'alert' | 'info' | 'neutral';
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  unapprovedCount,
  isDarkMode = true,
}) => {
  const sections: NavSection[] = [
    {
      title: 'Operational Command',
      items: [
        { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
        {
          id: 'requests',
          label: 'Requests & Approvals',
          icon: CheckCircle2,
          badge: unapprovedCount > 0 ? `${unapprovedCount} Pending` : null,
          badgeType: 'alert',
        },
        { id: 'map', label: 'Live GIS Tactical Map', icon: MapPin },
      ],
    },
    {
      title: 'AI & Optimization',
      items: [
        { id: 'optimization', label: 'Optimization Engine', icon: Sliders, badge: 'OR-Tools', badgeType: 'neutral' },
        { id: 'simulation', label: 'What-If Simulation', icon: PlaySquare },
        { id: 'analyzer', label: 'LLM & Field Reports', icon: Brain, badge: 'NLP', badgeType: 'neutral' },
        { id: 'benchmark', label: 'Baseline vs ResQGrid', icon: Award },
      ],
    },
    {
      title: 'Logistics & Spatial',
      items: [
        { id: 'datasets', label: 'Datasets & Quality', icon: Database },
        { id: 'resources', label: 'Warehouses & Fleets', icon: Boxes },
        { id: 'gaps', label: 'Resource Gap Analysis', icon: Layers },
        { id: 'reports', label: 'Dispatches & Reports', icon: FileText },
      ],
    },
    {
      title: 'System & Governance',
      items: [
        { id: 'demo', label: 'Interactive Demo Flow', icon: Zap, badge: 'Guide', badgeType: 'info' },
        { id: 'analytics', label: 'Impact Analytics', icon: TrendingUp },
        { id: 'audit', label: 'Governance & Audit', icon: ShieldCheck },
      ],
    },
  ];

  return (
    <aside
      className={`w-64 flex flex-col justify-between shrink-0 select-none border-r transition-colors duration-200 overflow-y-auto ${
        isDarkMode
          ? 'bg-slate-950 border-slate-800 text-slate-200'
          : 'bg-white border-slate-200 text-slate-800 shadow-sm'
      }`}
    >
      <div className="p-3 space-y-4">
        {sections.map((sec) => (
          <div key={sec.title} className="space-y-0.5">
            <div
              className={`px-3 pt-2 pb-1 text-[10px] font-mono font-bold tracking-wider uppercase ${
                isDarkMode ? 'text-slate-500' : 'text-slate-600'
              }`}
            >
              {sec.title}
            </div>
            {sec.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-left ${
                    isActive
                      ? isDarkMode
                        ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 font-bold shadow-sm'
                        : 'bg-sky-50 text-sky-900 border border-sky-300 font-bold shadow-xs'
                      : isDarkMode
                      ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 border border-transparent'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive
                          ? isDarkMode
                            ? 'text-sky-400'
                            : 'text-sky-700'
                          : isDarkMode
                          ? 'text-slate-500'
                          : 'text-slate-600'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 tracking-tight ${
                        item.badgeType === 'alert'
                          ? isDarkMode
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-extrabold'
                            : 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold'
                          : item.badgeType === 'info'
                          ? isDarkMode
                            ? 'bg-sky-950 text-sky-300 border-sky-500/30'
                            : 'bg-sky-100 text-sky-800 border-sky-200'
                          : isDarkMode
                          ? 'bg-slate-900 text-slate-400 border-slate-800'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* System Status Footer */}
      <div className="p-3 pt-0">
        <div
          className={`p-3 rounded-xl text-[11px] space-y-2 border transition-colors duration-200 ${
            isDarkMode
              ? 'bg-slate-900/60 border-slate-800/80 text-slate-400'
              : 'bg-slate-50 border-slate-200 text-slate-700 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className={`font-mono text-[11px] font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>
                OR-Tools MIP Solver
              </span>
            </span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
              isDarkMode ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
            }`}>
              ONLINE
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className={`font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Optimization Engine
            </span>
            <span className={`font-mono font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>
              SCIP / CBC (Optimal)
            </span>
          </div>
          <div
            className={`pt-1.5 border-t text-[10px] text-center font-mono font-semibold tracking-wider ${
              isDarkMode ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-600'
            }`}
          >
            FROM SIGNALS &rarr; TO ACTION
          </div>
        </div>
      </div>
    </aside>
  );
};
