import React from 'react';
import { Shield, Radio, Activity, RefreshCw, Moon, Sun, PlusCircle } from 'lucide-react';
import { SystemState } from '../types';

interface NavbarProps {
  state: SystemState | null;
  onReset: () => void;
  loading: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenCreateIncident?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  state,
  onReset,
  loading,
  theme,
  onToggleTheme,
  onOpenCreateIncident,
}) => {
  return (
    <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 sticky top-0 z-50 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-white p-0.5 border border-sky-500/40 shadow-lg shadow-sky-500/10 flex items-center justify-center overflow-hidden shrink-0">
            <img
              src="/resqgrid-logo.png"
              alt="ResQGrid AI Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-wider text-white">RESQ<span className="text-sky-400">GRID</span></span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-sky-950 border border-sky-500/30 text-sky-300 font-semibold tracking-wider">
                TACTICAL AI OPTIMIZER
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Explainable Dynamic Disaster Resource Allocation Platform
            </p>
          </div>
        </div>
      </div>

      {state && (
        <div className="hidden md:flex items-center space-x-6 text-xs">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-red-950/40 border border-red-500/30 text-red-300">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span className="font-semibold">{state.event.type.toUpperCase()}: {state.event.location}</span>
          </div>

          <div className="flex items-center space-x-1 text-slate-300">
            <Radio className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
            <span>Precipitation: <strong className="text-white">{state.event.rainfall_mm}mm</strong></span>
          </div>

          <div className="flex items-center space-x-1 text-slate-300">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span>River Level: <strong className="text-amber-300">{state.event.river_level_meters}m</strong> (+2.8m)</span>
          </div>
        </div>
      )}

      <div className="flex items-center space-x-3">
        {onOpenCreateIncident && (
          <button
            onClick={onOpenCreateIncident}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-lg shadow-sm shadow-sky-400/20 transition cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Create Incident</span>
          </button>
        )}

        {/* Night / Light Mode Toggle Button */}
        <button
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Night Mode'}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-200"
        >
          {theme === 'dark' ? (
            <>
              <Moon className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Night Mode</span>
            </>
          ) : (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Light Mode</span>
            </>
          )}
        </button>

        <button
          onClick={onReset}
          disabled={loading}
          title="Reset back to initial flood scenario"
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Reset Scenario</span>
        </button>

        <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
          <div className="w-7 h-7 rounded-full bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-xs font-bold text-sky-300">
            CD
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-medium text-slate-200">Chief Dispatcher</div>
            <div className="text-[10px] text-sky-400 font-mono">SUPERVISOR</div>
          </div>
        </div>
      </div>
    </header>
  );
};
