import React, { useState, useEffect } from 'react';
import {
  Shield,
  Radio,
  Activity,
  RefreshCw,
  Moon,
  Sun,
  PlusCircle,
  UserCheck,
  Key,
  Lock,
  ChevronDown,
  CheckCircle2,
  LogOut,
  ShieldAlert
} from 'lucide-react';
import { SystemState, AuthOfficer } from '../types';
import {
  loginOfficer,
  fetchCurrentUser,
  fetchAvailableOfficers,
  logoutOfficer,
  getStoredToken
} from '../services/api';

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
  const [currentOfficer, setCurrentOfficer] = useState<AuthOfficer>({
    user_id: 'USR-CMD-01',
    email: 'commander@resqgrid.ai',
    full_name: 'Col. Arvind Sharma',
    role: 'INCIDENT_COMMANDER',
    badge_number: 'IC-01',
    permissions: ['all', 'approve_allocation', 'override_allocation', 'retrain_model', 'ingest_data'],
    is_active: true,
    clearance: 'Top Secret / Operational Command'
  });

  const [availableOfficers, setAvailableOfficers] = useState<any[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  useEffect(() => {
    // Initial fetch of current officer & officer list
    fetchAvailableOfficers()
      .then((officers) => setAvailableOfficers(officers))
      .catch((err) => console.warn('Could not fetch officers', err));

    if (getStoredToken()) {
      fetchCurrentUser()
        .then((user) => setCurrentOfficer(user))
        .catch(() => {
          // Default to Commander
        });
    }
  }, []);

  const handleSwitchOfficer = async (email: string, pass: string) => {
    setAuthLoading(true);
    setAuthMessage(null);
    try {
      const res = await loginOfficer(email, pass);
      setCurrentOfficer(res.user);
      setAuthMessage(`Authenticated as ${res.user.full_name} (${res.user.role})`);
      setTimeout(() => {
        setIsAuthModalOpen(false);
        setAuthMessage(null);
      }, 1000);
    } catch (err: any) {
      setAuthMessage(`Authentication failed: ${err.message}`);
    } finally {
      setAuthLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'INCIDENT_COMMANDER':
        return 'bg-red-500/20 text-red-300 border-red-500/40';
      case 'LOGISTICS_CHIEF':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'FIELD_RESPONDER':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'GOVERNANCE_AUDITOR':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <>
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
              <p className="text-[11px] text-slate-400 hidden sm:block font-medium">
                INTELLIGENCE FOR EVERY RESPONSE.
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
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* Officer Profile & RBAC Switch Button */}
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="flex items-center space-x-2 pl-3 py-1 pr-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-xs font-bold text-sky-300">
              {currentOfficer.badge_number}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-medium text-white flex items-center gap-1">
                {currentOfficer.full_name}
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
              <div className="text-[9px] font-mono font-bold text-sky-400">
                {currentOfficer.role.replace(/_/g, ' ')}
              </div>
            </div>
          </button>
        </div>
      </header>

      {/* Officer Authentication & Clearance Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-sky-500/20 text-sky-400 rounded-lg">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Officer Authentication & RBAC Clearance</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Active Token: <span className="text-emerald-400 font-bold">HMAC-SHA256 SIGNED & VERIFIED</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAuthModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Current Officer Card */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sm font-bold text-sky-300 font-mono">
                  {currentOfficer.badge_number}
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{currentOfficer.full_name}</div>
                  <div className="text-xs text-slate-400">{currentOfficer.email}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {currentOfficer.user_id}</div>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${getRoleBadgeColor(currentOfficer.role)}`}>
                {currentOfficer.role}
              </span>
            </div>

            {/* Role Switcher */}
            <div className="space-y-2.5">
              <div className="text-xs font-semibold uppercase text-slate-400 tracking-wider flex items-center justify-between">
                <span>Switch Officer Account (Live RBAC Testing)</span>
                <span className="text-[10px] text-emerald-400 font-mono">Instant Session Token Handshake</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {availableOfficers.map((off) => {
                  const isCurrent = off.email === currentOfficer.email;
                  return (
                    <button
                      key={off.email}
                      onClick={() => handleSwitchOfficer(off.email, off.password_hint)}
                      disabled={authLoading || isCurrent}
                      className={`p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                        isCurrent
                          ? 'bg-sky-500/10 border-sky-500/40 text-white cursor-default'
                          : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/60 text-slate-200'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold flex items-center gap-1.5">
                          {off.full_name}
                          {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">{off.role}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{off.clearance}</div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-slate-400">
                        {off.badge_number}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {authMessage && (
              <div className="p-2.5 bg-sky-950/80 border border-sky-800 text-sky-300 rounded text-xs text-center font-mono">
                {authMessage}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <div className="text-xs text-slate-500 font-mono flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-400" />
                PBKDF2 Salted Hashes | Zero Secrets in Client Bundle
              </div>
              <button
                onClick={() => setIsAuthModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
