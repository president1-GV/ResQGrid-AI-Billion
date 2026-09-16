import React, { useState } from 'react';
import { Boxes, Building2, HeartPulse, Home, Truck, ShieldAlert } from 'lucide-react';
import { SystemState } from '../types';

interface ResourcesViewProps {
  state: SystemState;
}

export const ResourcesView: React.FC<ResourcesViewProps> = ({ state }) => {
  const [activeSubTab, setActiveSubTab] = useState<'warehouses' | 'hospitals' | 'shelters'>('warehouses');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-sky-400 font-bold uppercase">Logistics Infrastructure</span>
            <span className="text-xs px-2 py-0.5 rounded bg-sky-950 border border-sky-500/40 text-sky-300 font-semibold">
              RELIEF ASSETS & FLEET MANAGEMENT
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">
            Depot Inventories, Hospitals & Shelters
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl mt-0.5">
            Physical supply caches, emergency vehicle fleets, and medical intake capacity under real-time monitoring.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center space-x-2 text-xs bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveSubTab('warehouses')}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center space-x-1.5 ${
              activeSubTab === 'warehouses'
                ? 'bg-sky-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Depot Hubs ({state.warehouses.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('hospitals')}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center space-x-1.5 ${
              activeSubTab === 'hospitals'
                ? 'bg-sky-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5" />
            <span>Hospitals ({state.hospitals.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('shelters')}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center space-x-1.5 ${
              activeSubTab === 'shelters'
                ? 'bg-sky-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Shelters ({state.shelters.length})</span>
          </button>
        </div>
      </div>

      {/* Warehouses View */}
      {activeSubTab === 'warehouses' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {state.warehouses.map((w) => {
            const currentStockSum = Object.values(w.inventory).reduce((a, b) => a + b, 0);
            const fillPct = Math.round((currentStockSum / w.capacity) * 100);

            return (
              <div key={w.id} className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono font-bold text-sky-400">{w.id}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                      {w.operational_status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">{w.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{w.location}</p>
                </div>

                {/* Capacity progress */}
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Depot Capacity:</span>
                    <strong className="text-slate-200">{currentStockSum.toLocaleString()} / {w.capacity.toLocaleString()}</strong>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                    <div className="bg-sky-500 h-full" style={{ width: `${Math.min(100, fillPct)}%` }} />
                  </div>
                </div>

                {/* Inventory Table */}
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-mono uppercase text-slate-400 block">Available Inventory:</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(w.inventory).map(([resKey, qty]) => (
                      <div key={resKey} className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between">
                        <span className="text-slate-400 capitalize">{resKey.replace('_', ' ')}</span>
                        <strong className="text-white font-mono">{qty.toLocaleString()}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Vehicles Available */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-mono uppercase text-slate-400 block">Dispatch Fleet:</span>
                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    {Object.entries(w.vehicles_available).map(([vKey, count]) => (
                      <span key={vKey} className="px-2 py-1 rounded bg-slate-800/80 border border-slate-700 text-slate-300">
                        {vKey.replace('_', ' ')}: <strong className="text-sky-400">{count}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Hospitals View */}
      {activeSubTab === 'hospitals' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {state.hospitals.map((h) => {
            const occPct = Math.round(((h.total_beds - h.available_beds) / h.total_beds) * 100);
            return (
              <div key={h.id} className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono font-bold text-red-400">{h.id}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {h.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">{h.name}</h3>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Available Inpatient Beds:</span>
                    <strong className="text-emerald-400 font-mono text-sm">{h.available_beds} / {h.total_beds}</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>ICU Ventilator Units:</span>
                    <strong className="text-amber-400 font-mono text-sm">{h.icu_available} units</strong>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mt-1">
                    <div className="bg-red-500 h-full" style={{ width: `${occPct}%` }} />
                  </div>
                  <div className="text-right text-[10px] text-slate-500 font-mono">
                    {occPct}% Bed Saturation
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Shelters View */}
      {activeSubTab === 'shelters' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {state.shelters.map((s) => {
            const occPct = Math.round((s.current_occupancy / s.capacity) * 100);
            return (
              <div key={s.id} className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono font-bold text-emerald-400">{s.id}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                      {s.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">{s.name}</h3>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Capacity Headroom:</span>
                    <strong className="text-emerald-400 font-mono text-sm">{s.available_capacity} free beds</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Current Evacuees:</span>
                    <strong className="text-slate-200 font-mono">{s.current_occupancy} / {s.capacity}</strong>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mt-1">
                    <div className="bg-emerald-500 h-full" style={{ width: `${occPct}%` }} />
                  </div>
                  <div className="text-right text-[10px] text-slate-500 font-mono">
                    {occPct}% Occupied
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
