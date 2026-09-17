import React from 'react';
import {
  Activity,
  Radio,
  Layers,
  ShieldCheck,
  Cpu,
  Sliders,
  Zap,
  UserCheck,
  Truck,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  Database
} from 'lucide-react';
import { NavTab } from './Sidebar';

interface MasterOperationalWorkflowProps {
  currentScenario: string;
  onSelectTab: (tab: NavTab) => void;
  isDarkMode?: boolean;
}

interface WorkflowStep {
  id: string;
  number: string;
  title: string;
  subtext: string;
  icon: React.ComponentType<{ className?: string }>;
  status: string;
  statusColor: string;
  badge: string;
  tab: NavTab;
}

export const MasterOperationalWorkflow: React.FC<MasterOperationalWorkflowProps> = ({
  currentScenario,
  onSelectTab,
  isDarkMode = true,
}) => {
  const steps: WorkflowStep[] = [
    {
      id: 'detection',
      number: '01',
      title: 'Disaster Detection',
      subtext: 'IMD / CWC / USGS telemetry streaming',
      icon: Radio,
      status: 'STREAMING',
      statusColor: isDarkMode ? 'text-red-400 bg-red-950/50 border-red-500/40' : 'text-red-800 bg-red-100 border-red-300',
      badge: 'LIVE SENSORS',
      tab: 'datasets',
    },
    {
      id: 'activation',
      number: '02',
      title: 'Incident Activation',
      subtext: `${currentScenario.toUpperCase()} scenario primed`,
      icon: Activity,
      status: 'ACTIVE',
      statusColor: isDarkMode ? 'text-amber-400 bg-amber-950/50 border-amber-500/40' : 'text-amber-800 bg-amber-100 border-amber-300',
      badge: currentScenario.toUpperCase(),
      tab: 'dashboard',
    },
    {
      id: 'ingestion',
      number: '03',
      title: 'Data Ingestion',
      subtext: 'Weather + OSM GIS + Field SITREPs',
      icon: Database,
      status: 'INGESTED',
      statusColor: isDarkMode ? 'text-sky-400 bg-sky-950/50 border-sky-500/40' : 'text-sky-800 bg-sky-100 border-sky-300',
      badge: '3 FEEDS',
      tab: 'datasets',
    },
    {
      id: 'fusion',
      number: '04',
      title: 'Data Fusion & QC',
      subtext: 'Source confidence & anti-hallucination',
      icon: ShieldCheck,
      status: 'VERIFIED',
      statusColor: isDarkMode ? 'text-emerald-400 bg-emerald-950/50 border-emerald-500/40' : 'text-emerald-800 bg-emerald-100 border-emerald-300',
      badge: 'QC PASS',
      tab: 'analyzer',
    },
    {
      id: 'demand',
      number: '05',
      title: 'Demand Estimation',
      subtext: 'SPHERE Standards + ML Gradient Boost',
      icon: Cpu,
      status: 'COMPUTED',
      statusColor: isDarkMode ? 'text-blue-400 bg-blue-950/50 border-blue-500/40' : 'text-blue-800 bg-blue-100 border-blue-300',
      badge: 'AI REGRESSOR',
      tab: 'analyzer',
    },
    {
      id: 'priority',
      number: '06',
      title: 'Priority Engine',
      subtext: 'Zone triage (Pop • Severity • Hospital)',
      icon: Sliders,
      status: 'SCORED',
      statusColor: isDarkMode ? 'text-purple-400 bg-purple-950/50 border-purple-500/40' : 'text-purple-800 bg-purple-100 border-purple-300',
      badge: '0-100 TRIAGE',
      tab: 'gaps',
    },
    {
      id: 'optimization',
      number: '07',
      title: 'Optimization Engine',
      subtext: 'Google OR-Tools MIP solver & routing',
      icon: Zap,
      status: 'SOLVED (15ms)',
      statusColor: isDarkMode ? 'text-amber-300 bg-amber-950/60 border-amber-400/50' : 'text-amber-900 bg-amber-200 border-amber-400',
      badge: 'OR-TOOLS MIP',
      tab: 'optimization',
    },
    {
      id: 'approval',
      number: '08',
      title: 'Commander Review',
      subtext: 'Human-in-the-loop: Approve / Modify / Reject',
      icon: UserCheck,
      status: 'RBAC AUDITED',
      statusColor: isDarkMode ? 'text-teal-300 bg-teal-950/50 border-teal-500/40' : 'text-teal-800 bg-teal-100 border-teal-300',
      badge: 'SHA-256 HASH',
      tab: 'optimization',
    },
    {
      id: 'dispatch',
      number: '09',
      title: 'Field Deployment',
      subtext: 'Convoys, Ambulances, NDRF Boats',
      icon: Truck,
      status: 'DISPATCHED',
      statusColor: isDarkMode ? 'text-cyan-300 bg-cyan-950/50 border-cyan-500/40' : 'text-cyan-800 bg-cyan-100 border-cyan-300',
      badge: 'GPS ROUTED',
      tab: 'resources',
    },
    {
      id: 'reoptimization',
      number: '10',
      title: 'Dynamic Re-Optimize',
      subtext: 'Auto re-solve on road breach / demand shock',
      icon: RotateCcw,
      status: 'DYNAMIC READY',
      statusColor: isDarkMode ? 'text-emerald-400 bg-emerald-950/60 border-emerald-400/50' : 'text-emerald-900 bg-emerald-200 border-emerald-400',
      badge: 'FEEDBACK LOOP',
      tab: 'simulation',
    },
  ];

  return (
    <div className={`p-5 rounded-2xl border shadow-xl space-y-4 transition-all ${
      isDarkMode
        ? 'bg-slate-900/90 border-slate-800'
        : 'bg-white border-slate-200 shadow-slate-200/50'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-slate-800/60">
        <div>
          <div className="flex items-center space-x-2">
            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
              isDarkMode ? 'text-sky-400' : 'text-sky-700 font-extrabold'
            }`}>
              Operational Architecture • Official Specification
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
              isDarkMode
                ? 'bg-sky-950/80 border-sky-500/40 text-sky-300'
                : 'bg-sky-100 border-sky-300 text-sky-800'
            }`}>
              10-STAGE CLOSED-LOOP PIPELINE
            </span>
          </div>
          <h2 className={`text-base font-bold tracking-tight mt-0.5 ${
            isDarkMode ? 'text-white' : 'text-slate-900'
          }`}>
            Master Operational Workflow Console
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className={`text-xs font-mono font-semibold ${
            isDarkMode ? 'text-slate-300' : 'text-slate-700'
          }`}>
            CLOSED-LOOP FEEDBACK: ACTIVE
          </span>
        </div>
      </div>

      {/* Horizontal Scrollable Stepper Chain */}
      <div className="overflow-x-auto pb-2 scrollbar-thin">
        <div className="flex items-center min-w-max space-x-2">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => onSelectTab(step.tab)}
                  className={`group relative p-3 rounded-xl border text-left transition-all cursor-pointer hover:scale-[1.02] flex flex-col justify-between w-48 shrink-0 ${
                    isDarkMode
                      ? 'bg-slate-950/80 hover:bg-slate-800/80 border-slate-800 hover:border-sky-500/40'
                      : 'bg-slate-50 hover:bg-sky-50/50 border-slate-200 hover:border-sky-400 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-mono font-bold ${
                      isDarkMode ? 'text-slate-500 group-hover:text-sky-400' : 'text-slate-400 group-hover:text-sky-700'
                    }`}>
                      {step.number}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border font-mono ${step.statusColor}`}>
                      {step.badge}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 my-1">
                    <div className={`p-1.5 rounded-lg ${
                      isDarkMode ? 'bg-slate-800 text-sky-400' : 'bg-white text-sky-700 shadow-sm border border-slate-200'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <div className={`text-xs font-bold truncate ${
                        isDarkMode ? 'text-white' : 'text-slate-900'
                      }`}>
                        {step.title}
                      </div>
                    </div>
                  </div>

                  <div className={`text-[10px] line-clamp-1 mt-1 leading-tight ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    {step.subtext}
                  </div>

                  <div className={`text-[9px] font-mono font-bold mt-2 pt-1 border-t flex items-center justify-between ${
                    isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
                  }`}>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                      {step.status}
                    </span>
                    <span className="opacity-0 group-hover:opacity-100 transition text-sky-400">View &rarr;</span>
                  </div>
                </button>

                {idx < steps.length - 1 && (
                  <ArrowRight className={`w-3.5 h-3.5 shrink-0 ${
                    isDarkMode ? 'text-slate-600' : 'text-slate-400'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
