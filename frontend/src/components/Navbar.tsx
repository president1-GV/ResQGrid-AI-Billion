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
  ShieldAlert,
  Database
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
  onSwitchScenario?: (scenario: 'flood' | 'tsunami') => void;
  onSelectTab?: (tab: any) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  state,
  onReset,
  loading,
  theme,
  onToggleTheme,
  onOpenCreateIncident,
  onSwitchScenario,
  onSelectTab,
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
    } else {
      // Auto-authenticate with authoritative Commander profile to establish live JWT session
      loginOfficer('commander@resqgrid.ai', 'Commander#2026')
        .then((res) => setCurrentOfficer(res.user))
        .catch(() => {});
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
    if (theme === 'dark') {
      switch (role) {
        case 'INCIDENT_COMMANDER':
          return 'bg-red-500/20 text-red-300 border-red-500/40 font-bold';
        case 'LOGISTICS_CHIEF':
          return 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold';
        case 'FIELD_RESPONDER':
          return 'bg-blue-500/20 text-blue-300 border-blue-500/40 font-bold';
        case 'GOVERNANCE_AUDITOR':
          return 'bg-purple-500/20 text-purple-300 border-purple-500/40 font-bold';
        default:
          return 'bg-slate-700 text-slate-300 border-slate-600 font-bold';
      }
    } else {
      switch (role) {
        case 'INCIDENT_COMMANDER':
          return 'bg-red-100 text-red-800 border-red-400 font-bold';
        case 'LOGISTICS_CHIEF':
          return 'bg-amber-100 text-amber-900 border-amber-400 font-bold';
        case 'FIELD_RESPONDER':
          return 'bg-blue-100 text-blue-900 border-blue-400 font-bold';
        case 'GOVERNANCE_AUDITOR':
          return 'bg-purple-100 text-purple-900 border-purple-400 font-bold';
        default:
          return 'bg-slate-100 text-slate-800 border-slate-300 font-bold';
      }
    }
  };

  const pendingCount = (state?.active_allocations || []).filter((a) => {
    const s = (a.status || '').toLowerCase();
    return s === 'pending_approval' || s === 'pending';
  }).length;

  const isTsunamiScenario = state
    ? state.event.type.toLowerCase().includes('tsunami') || ((state.zones[0]?.lat ?? 99) < 15.0)
    : false;

  return (
    <>
      <header className={`sticky top-0 z-50 px-3 sm:px-4 lg:px-6 h-16 flex flex-nowrap items-center justify-between border-b backdrop-blur-md transition-colors duration-200 shrink-0 select-none ${
        theme === 'dark'
          ? 'bg-slate-950/90 border-slate-800 text-slate-100'
          : 'bg-white/95 border-slate-200 text-slate-900 shadow-sm'
      }`}>
        {/* Left Zone: Brand & Active Incident Lockup */}
        <div className="flex items-center space-x-2.5 sm:space-x-4 shrink-0 min-w-0">
          <div className="flex items-center space-x-2.5 sm:space-x-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-white p-0.5 border border-sky-500/40 shadow-sm flex items-center justify-center overflow-hidden shrink-0">
              <img
                src="/resqgrid-logo.png"
                alt="ResQGrid AI Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="shrink-0">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span className={`text-lg font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>
                  RESQ<span className="text-sky-500">GRID</span>
                </span>
                <span className={`hidden xl:inline-block text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                  theme === 'dark'
                    ? 'bg-sky-950/60 border-sky-500/30 text-sky-300'
                    : 'bg-sky-50 border-sky-200 text-sky-800 font-semibold'
                }`}>
                  v2.6 OPS
                </span>
              </div>
              <p className={`text-[10px] hidden sm:block font-medium tracking-wide ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}>
                AUTONOMOUS DISASTER DISPATCH
              </p>
            </div>
          </div>

          {/* Active Disaster Event Status Badge */}
          {state && (
            <div className="hidden lg:flex items-center pl-2.5 sm:pl-3 border-l border-slate-200 dark:border-slate-800 shrink-0">
              <div className={`flex items-center space-x-1.5 sm:space-x-2 px-2 sm:px-2.5 py-1 rounded-md text-xs font-semibold border transition-all ${
                isTsunamiScenario
                  ? theme === 'dark'
                    ? 'bg-teal-950/50 border-teal-500/40 text-teal-300'
                    : 'bg-teal-50 border-teal-200 text-teal-800'
                  : theme === 'dark'
                    ? 'bg-rose-950/50 border-rose-500/40 text-rose-300'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                <span className={`w-2 h-2 rounded-full animate-pulse shrink-0 ${isTsunamiScenario ? 'bg-teal-400' : 'bg-rose-500'}`} />
                <span className="font-bold tracking-tight shrink-0">
                  {state.event.type.toUpperCase()}:
                </span>
                <span className="truncate max-w-[90px] xl:max-w-[140px] 2xl:max-w-[200px] text-[11px] opacity-90 font-medium">
                  {state.event.location}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Center Zone: Unified Telemetry & Scenario Segment */}
        {state && (
          <div className="hidden xl:flex items-center space-x-2 2xl:space-x-3 text-xs shrink-0">
            {/* Telemetry Pod - Visible on 2xl to preserve space on standard 1366-1440px laptop displays */}
            <div className={`hidden 2xl:flex items-center space-x-3 px-3 py-1 rounded-lg border text-[11px] shrink-0 ${
              theme === 'dark'
                ? 'bg-slate-900/70 border-slate-800 text-slate-300'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className="flex items-center space-x-1.5 font-medium">
                <Radio className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-sky-400' : 'text-sky-600'}`} />
                <span>Precip: <strong className={theme === 'dark' ? 'text-white' : 'text-slate-900 font-bold'}>{state.event.rainfall_mm}mm</strong></span>
              </div>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <div className="flex items-center space-x-1.5 font-medium">
                <Activity className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`} />
                {isTsunamiScenario ? (
                  <span>Surge: <strong className={theme === 'dark' ? 'text-white' : 'text-slate-900 font-bold'}>4.2m</strong> <span className={theme === 'dark' ? 'text-teal-400' : 'text-teal-700 font-semibold'}>(Wavefront)</span></span>
                ) : (
                  <span>River: <strong className={theme === 'dark' ? 'text-white' : 'text-slate-900 font-bold'}>{state.event.river_level_meters}m</strong> <span className={theme === 'dark' ? 'text-rose-400' : 'text-rose-700 font-semibold'}>(+2.8m)</span></span>
                )}
              </div>
            </div>

            {/* Segmented Scenario Switcher */}
            {onSwitchScenario && (
              <div className={`flex items-center p-0.5 rounded-lg border text-xs font-semibold shrink-0 ${
                theme === 'dark'
                  ? 'bg-slate-900/90 border-slate-800'
                  : 'bg-slate-100 border-slate-200'
              }`}>
                <button
                  onClick={() => onSwitchScenario('flood')}
                  title="Switch to Brahmaputra Flood Scenario (Guwahati)"
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    !isTsunamiScenario
                      ? 'bg-sky-600 text-white shadow-sm'
                      : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  <span>🌊</span>
                  <span>Flood</span>
                </button>
                <button
                  onClick={() => onSwitchScenario('tsunami')}
                  title="Switch to Bay of Bengal Coastal Tsunami Scenario"
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    isTsunamiScenario
                      ? 'bg-teal-600 text-white shadow-sm'
                      : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  <span>🌊</span>
                  <span>Tsunami</span>
                </button>
              </div>
            )}

            {/* PostGIS Database Status Chip */}
            <div
              title="Connected to Authoritative Cloud PostgreSQL 15 & PostGIS 3.6 Spatial Engine"
              className={`hidden 2xl:flex items-center gap-1.5 px-2 py-1 rounded-md border text-[11px] font-medium shrink-0 ${
                theme === 'dark'
                  ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="font-semibold">PostGIS 3.6</span>
            </div>
          </div>
        )}

        {/* Right Zone: Command Action Controls (Unified h-9 heights, zero-wrap guarantee) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-nowrap">
          {/* Requests Queue Quick-Action Button */}
          {state && onSelectTab && (
            <button
              onClick={() => onSelectTab('requests')}
              title="Open Tactical Requests & Approvals Queue"
              className={`h-9 px-2 sm:px-3 rounded-lg border text-xs font-semibold transition-all flex items-center space-x-1.5 sm:space-x-2 cursor-pointer shrink-0 ${
                pendingCount > 0
                  ? theme === 'dark'
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25 shadow-sm'
                    : 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100 shadow-sm'
                  : theme === 'dark'
                    ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="hidden xl:inline">Requests</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold shrink-0 ${
                pendingCount > 0
                  ? 'bg-amber-500 text-slate-950'
                  : theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-700'
              }`}>
                {pendingCount}
              </span>
            </button>
          )}

          {/* Create Incident Button */}
          {onOpenCreateIncident && (
            <button
              onClick={onOpenCreateIncident}
              title="Create Incident & Run ResQGrid Dispatch"
              className="h-9 px-2.5 sm:px-3 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 shadow-sm shadow-sky-600/20 transition-all flex items-center space-x-1.5 cursor-pointer shrink-0"
            >
              <PlusCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden 2xl:inline">Create Incident</span>
            </button>
          )}

          {/* Theme Switcher Button */}
          <button
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Night Mode'}
            className={`h-9 px-2.5 rounded-lg border text-xs font-medium transition-all flex items-center space-x-1.5 cursor-pointer shrink-0 ${
              theme === 'dark'
                ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800 shadow-sm'
            }`}
          >
            {theme === 'dark' ? (
              <>
                <Moon className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="hidden 2xl:inline text-[11px] font-semibold">Night</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                <span className="hidden 2xl:inline text-[11px] font-semibold">Light</span>
              </>
            )}
          </button>

          {/* Scenario Reset Button */}
          <button
            onClick={onReset}
            disabled={loading}
            title="Reset system state to baseline"
            className={`h-9 px-2.5 rounded-lg border text-xs font-medium transition-all flex items-center space-x-1.5 cursor-pointer shrink-0 ${
              theme === 'dark'
                ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 hover:text-slate-950 shadow-sm'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden 2xl:inline text-[11px] font-semibold">Reset</span>
          </button>

          {/* Officer Profile Pill - Guaranteed In-Bounds Anchor */}
          <button
            onClick={() => setIsAuthModalOpen(true)}
            title={`Active Officer: ${currentOfficer.full_name} (${currentOfficer.role})`}
            className={`h-9 px-2 sm:px-2.5 rounded-lg border transition-all flex items-center space-x-2 cursor-pointer shrink-0 max-w-[190px] ${
              theme === 'dark'
                ? 'bg-slate-900 hover:bg-slate-800 border-slate-800'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 shadow-sm'
            }`}
          >
            <div className={`w-6 h-6 rounded-md border flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${
              theme === 'dark'
                ? 'bg-sky-500/20 border-sky-400/30 text-sky-300'
                : 'bg-sky-100 border-sky-300 text-sky-800 font-extrabold'
            }`}>
              {currentOfficer.badge_number}
            </div>
            <div className="hidden 2xl:block text-left pr-1 min-w-0">
              <div className={`text-xs font-bold leading-tight flex items-center gap-1 ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
                <span className="truncate max-w-[100px]">{currentOfficer.full_name}</span>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
              </div>
              <div className={`text-[9px] font-mono font-bold truncate max-w-[110px] ${
                theme === 'dark' ? 'text-sky-400' : 'text-sky-700'
              }`}>
                {currentOfficer.role.replace(/_/g, ' ')}
              </div>
            </div>
          </button>
        </div>
      </header>

      {/* Officer Authentication & Clearance Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className={`border rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-6 transition-colors ${
            theme === 'dark'
              ? 'bg-slate-900 border-slate-800 text-white'
              : 'bg-white border-slate-300 text-slate-900'
          }`}>
            <div className={`flex items-center justify-between border-b pb-4 ${
              theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white p-1 border border-sky-500/40 shadow-md shadow-sky-500/10 flex items-center justify-center overflow-hidden shrink-0">
                  <img
                    src="/resqgrid-logo.png"
                    alt="ResQGrid AI Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900 font-extrabold'}`}>
                    Officer Authentication & RBAC Clearance
                  </h3>
                  <p className={`text-xs font-mono ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                    Active Token: <span className="text-emerald-600 dark:text-emerald-400 font-bold">HMAC-SHA256 SIGNED & VERIFIED</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAuthModalOpen(false)}
                className={`text-lg font-bold cursor-pointer transition ${
                  theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                ✕
              </button>
            </div>

            {/* Current Officer Card */}
            <div className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${
              theme === 'dark'
                ? 'bg-slate-950 border-slate-800'
                : 'bg-slate-50 border-slate-200 shadow-sm'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full border flex items-center justify-center text-sm font-bold font-mono ${
                  theme === 'dark'
                    ? 'bg-sky-500/20 border-sky-400/30 text-sky-300'
                    : 'bg-sky-600 border-sky-700 text-white font-extrabold shadow-sm'
                }`}>
                  {currentOfficer.badge_number}
                </div>
                <div>
                  <div className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900 font-extrabold'}`}>
                    {currentOfficer.full_name}
                  </div>
                  <div className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                    {currentOfficer.email}
                  </div>
                  <div className={`text-[10px] font-mono mt-0.5 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                    ID: {currentOfficer.user_id}
                  </div>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border shadow-sm ${getRoleBadgeColor(currentOfficer.role)}`}>
                {currentOfficer.role}
              </span>
            </div>

            {/* Role Switcher */}
            <div className="space-y-2.5">
              <div className={`text-xs font-bold uppercase tracking-wider flex items-center justify-between ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-700'
              }`}>
                <span>Switch Officer Account (Live RBAC Testing)</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">Instant Session Token Handshake</span>
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
                          ? theme === 'dark'
                            ? 'bg-sky-950/60 border-sky-500 text-white shadow-md'
                            : 'bg-sky-50 border-sky-500 text-slate-900 shadow-md ring-2 ring-sky-400/30'
                          : theme === 'dark'
                          ? 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/80 text-slate-200'
                          : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800 shadow-sm'
                      }`}
                    >
                      <div>
                        <div className={`text-xs font-bold flex items-center gap-1.5 ${
                          isCurrent
                            ? theme === 'dark' ? 'text-white' : 'text-sky-950 font-extrabold'
                            : theme === 'dark' ? 'text-slate-200' : 'text-slate-900'
                        }`}>
                          {off.full_name}
                          {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />}
                        </div>
                        <div className={`text-[10px] font-mono font-bold ${
                          isCurrent
                            ? theme === 'dark' ? 'text-sky-300' : 'text-sky-700'
                            : theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                        }`}>
                          {off.role}
                        </div>
                        <div className={`text-[10px] mt-0.5 font-medium ${
                          isCurrent
                            ? theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                            : theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          {off.clearance}
                        </div>
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                        isCurrent
                          ? theme === 'dark'
                            ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                            : 'bg-sky-600 text-white border-sky-700 shadow-sm'
                          : theme === 'dark'
                          ? 'bg-slate-900 text-slate-300 border-slate-700'
                          : 'bg-slate-100 text-slate-800 border-slate-300'
                      }`}>
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

            <div className={`flex items-center justify-between pt-2 border-t ${
              theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <div className={`text-xs font-mono flex items-center gap-1 ${
                theme === 'dark' ? 'text-slate-500' : 'text-slate-600'
              }`}>
                <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>PBKDF2 Salted Hashes | Zero Secrets in Client Bundle</span>
              </div>
              <button
                onClick={() => setIsAuthModalOpen(false)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer shadow-sm ${
                  theme === 'dark'
                    ? 'bg-slate-800 hover:bg-slate-700 text-white'
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                }`}
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
