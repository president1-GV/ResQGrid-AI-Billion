import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Truck,
  Shield,
  Search,
  Filter,
  ArrowRight,
  Check,
  X,
  Edit2,
  RefreshCw,
  TrendingDown,
  Layers,
  AlertOctagon,
  Sparkles,
  Info
} from 'lucide-react';
import { SystemState, AllocationItem, AuthOfficer } from '../types';

interface RequestsViewProps {
  state: SystemState;
  onApprove: (id: string) => Promise<void> | void;
  onReject: (id: string, reason: string) => Promise<void> | void;
  onModify?: (id: string, reason: string, qty: number) => Promise<void> | void;
  onBatchApproveAll?: () => Promise<void> | void;
  currentOfficer?: AuthOfficer;
  isDarkMode?: boolean;
}

export const RequestsView: React.FC<RequestsViewProps> = ({
  state,
  onApprove,
  onReject,
  onModify,
  onBatchApproveAll,
  currentOfficer,
  isDarkMode = true,
}) => {
  const [filterTab, setFilterTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [resourceFilter, setResourceFilter] = useState('ALL');
  
  // Rejection modal state
  const [rejectModalItem, setRejectModalItem] = useState<AllocationItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  // Modification modal state
  const [modifyModalItem, setModifyModalItem] = useState<AllocationItem | null>(null);
  const [modifyQty, setModifyQty] = useState<number>(0);
  const [modifyReason, setModifyReason] = useState('');
  const [modifyError, setModifyError] = useState('');

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [batchProcessing, setBatchProcessing] = useState(false);

  const allocations = state.active_allocations || [];

  const pendingAllocations = allocations.filter((a) => {
    const s = (a.status || '').toLowerCase();
    return s === 'pending_approval' || s === 'pending';
  });
  const approvedAllocations = allocations.filter((a) => {
    const s = (a.status || '').toLowerCase();
    return s === 'approved' || s === 'in_transit' || s === 'delivered' || s === 'dispatched' || s === 'completed';
  });
  const rejectedAllocations = allocations.filter((a) => (a.status || '').toLowerCase() === 'rejected');

  const filteredAllocations = allocations.filter((a) => {
    const s = (a.status || '').toLowerCase();
    // Status filter
    if (filterTab === 'pending' && s !== 'pending_approval' && s !== 'pending') return false;
    if (
      filterTab === 'approved' &&
      s !== 'approved' &&
      s !== 'in_transit' &&
      s !== 'delivered' &&
      s !== 'dispatched' &&
      s !== 'completed'
    )
      return false;
    if (filterTab === 'rejected' && s !== 'rejected') return false;

    // Resource filter
    if (resourceFilter !== 'ALL' && a.resource_type.toLowerCase() !== resourceFilter.toLowerCase()) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = a.id.toLowerCase().includes(q);
      const matchZone = (a.destination_zone_name || '').toLowerCase().includes(q);
      const matchWh = (a.source_warehouse_name || '').toLowerCase().includes(q);
      const matchRes = a.resource_type.toLowerCase().includes(q);
      if (!matchId && !matchZone && !matchWh && !matchRes) return false;
    }

    return true;
  });

  const handleQuickAccept = async (id: string) => {
    setProcessingId(id);
    try {
      await onApprove(id);
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (item: AllocationItem) => {
    setRejectModalItem(item);
    setRejectReason('');
    setRejectError('');
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim() || rejectReason.trim().length < 5) {
      setRejectError('Mandatory justification required (minimum 5 characters).');
      return;
    }
    if (!rejectModalItem) return;

    setProcessingId(rejectModalItem.id);
    try {
      await onReject(rejectModalItem.id, rejectReason.trim());
      setRejectModalItem(null);
    } finally {
      setProcessingId(null);
    }
  };

  const openModifyModal = (item: AllocationItem) => {
    setModifyModalItem(item);
    setModifyQty(item.quantity);
    setModifyReason('');
    setModifyError('');
  };

  const handleConfirmModify = async () => {
    if (!modifyReason.trim() || modifyReason.trim().length < 5) {
      setModifyError('Mandatory justification required for modifying allocation quantity.');
      return;
    }
    if (modifyQty <= 0) {
      setModifyError('Quantity must be greater than 0.');
      return;
    }
    if (!modifyModalItem || !onModify) return;

    setProcessingId(modifyModalItem.id);
    try {
      await onModify(modifyModalItem.id, modifyReason.trim(), modifyQty);
      setModifyModalItem(null);
    } finally {
      setProcessingId(null);
    }
  };

  const handleBatchAccept = async () => {
    if (!onBatchApproveAll) return;
    setBatchProcessing(true);
    try {
      await onBatchApproveAll();
    } finally {
      setBatchProcessing(false);
    }
  };

  const totalCommodityUnits = pendingAllocations.reduce((acc, a) => acc + a.quantity, 0);
  const avgETA =
    pendingAllocations.length > 0
      ? (pendingAllocations.reduce((acc, a) => acc + a.estimated_time_min, 0) / pendingAllocations.length).toFixed(1)
      : '0.0';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div
        className={`p-6 rounded-2xl border shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all ${
          isDarkMode
            ? 'bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border-sky-500/20'
            : 'bg-white border-slate-200 shadow-slate-200/50'
        }`}
      >
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                isDarkMode ? 'bg-sky-500/20 text-sky-300 border-sky-500/30' : 'bg-sky-100 text-sky-800 border-sky-300'
              }`}
            >
              HUMAN-IN-THE-LOOP COMMAND SURFACE
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${
                pendingAllocations.length > 0
                  ? isDarkMode
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-amber-100 text-amber-900 border-amber-300'
                  : isDarkMode
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-emerald-100 text-emerald-900 border-emerald-300'
              }`}
            >
              {pendingAllocations.length} ACTION REQUESTS PENDING
            </span>
            <span
              className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              Clearance: {currentOfficer ? currentOfficer.role.replace(/_/g, ' ') : 'INCIDENT COMMANDER'}
            </span>
          </div>

          <h1 className={`text-2xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Operational Requests & Approvals App
          </h1>
          <p className={`text-xs max-w-3xl leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600 font-medium'}`}>
            Review, authorize, modify, or reject AI-generated dispatch recommendations and emergency field requests.
            Every decision generates a cryptographic SHA-256 signed audit trail and executes immediate live fleet routing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {pendingAllocations.length > 0 && onBatchApproveAll && (
            <button
              onClick={handleBatchAccept}
              disabled={batchProcessing}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className={`w-4 h-4 ${batchProcessing ? 'animate-spin' : ''}`} />
              <span>{batchProcessing ? 'Authorizing All...' : `Accept All Pending (${pendingAllocations.length})`}</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          className={`p-4 rounded-xl border transition-all ${
            isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono">PENDING SIGN-OFF</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className={`text-2xl font-bold ${pendingAllocations.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {pendingAllocations.length}
          </div>
          <div className="text-xs text-slate-400 mt-1">Awaiting officer action</div>
        </div>

        <div
          className={`p-4 rounded-xl border transition-all ${
            isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono">AUTHORIZED / ACTIVE</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{approvedAllocations.length}</div>
          <div className="text-xs text-slate-400 mt-1">Dispatched to sectors</div>
        </div>

        <div
          className={`p-4 rounded-xl border transition-all ${
            isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono">TOTAL PENDING UNITS</span>
            <Layers className="w-4 h-4 text-sky-400" />
          </div>
          <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            {totalCommodityUnits.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-1">Water, food, meds, kits</div>
        </div>

        <div
          className={`p-4 rounded-xl border transition-all ${
            isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono">AVG DISPATCH ETA</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400">{avgETA} min</div>
          <div className="text-xs text-slate-400 mt-1">Shortest-path routed</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilterTab('pending')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              filterTab === 'pending'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : isDarkMode
                ? 'text-slate-400 hover:text-white bg-slate-800'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100'
            }`}
          >
            Pending Action ({pendingAllocations.length})
          </button>
          <button
            onClick={() => setFilterTab('approved')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              filterTab === 'approved'
                ? 'bg-emerald-600 text-white shadow-md font-extrabold'
                : isDarkMode
                ? 'text-slate-400 hover:text-white bg-slate-800'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100'
            }`}
          >
            Accepted / Dispatched ({approvedAllocations.length})
          </button>
          <button
            onClick={() => setFilterTab('rejected')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              filterTab === 'rejected'
                ? 'bg-rose-600 text-white shadow-md font-extrabold'
                : isDarkMode
                ? 'text-slate-400 hover:text-white bg-slate-800'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100'
            }`}
          >
            Rejected ({rejectedAllocations.length})
          </button>
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              filterTab === 'all'
                ? 'bg-sky-500 text-slate-950 shadow-md font-extrabold'
                : isDarkMode
                ? 'text-slate-400 hover:text-white bg-slate-800'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100'
            }`}
          >
            All Requests ({allocations.length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search destination, depot, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-8 pr-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-sky-500 ${
                isDarkMode
                  ? 'bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
              }`}
            />
          </div>

          <select
            value={resourceFilter}
            onChange={(e) => setResourceFilter(e.target.value)}
            className={`px-2.5 py-1.5 text-xs rounded-lg border font-semibold focus:outline-none focus:ring-1 focus:ring-sky-500 ${
              isDarkMode
                ? 'bg-slate-950 border-slate-800 text-slate-200'
                : 'bg-slate-50 border-slate-300 text-slate-900'
            }`}
          >
            <option value="ALL">All Commodities</option>
            <option value="water">Clean Water</option>
            <option value="food">Food Rations</option>
            <option value="medical_kits">Medical Kits</option>
            <option value="ambulances">Ambulances</option>
            <option value="medical_teams">Medical Teams</option>
            <option value="shelter_kits">Shelter Kits</option>
          </select>
        </div>
      </div>

      {/* Requests Stream Cards & Table */}
      <div
        className={`rounded-xl border overflow-hidden ${
          isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        {filteredAllocations.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto opacity-70" />
            <div className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              No Requests Match Current Filter
            </div>
            <p className={`text-xs max-w-md mx-auto ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {filterTab === 'pending'
                ? 'All generated dispatch recommendations have been reviewed and authorized by the commander.'
                : 'Try adjusting your search query or commodity filter above.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {filteredAllocations.map((item) => {
              const s = (item.status || '').toLowerCase();
              const isPending = s === 'pending_approval' || s === 'pending';
              const isApproved =
                s === 'approved' ||
                s === 'in_transit' ||
                s === 'delivered' ||
                s === 'dispatched' ||
                s === 'completed';
              const isRejected = s === 'rejected';
              const isModified = s === 'modified';
              const isProcessing = processingId === item.id;

              return (
                <div
                  key={item.id}
                  className={`p-5 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                    isPending
                      ? isDarkMode
                        ? 'bg-slate-950/40 hover:bg-slate-950/80'
                        : 'bg-amber-50/30 hover:bg-amber-50/60'
                      : isDarkMode
                      ? 'hover:bg-slate-800/30'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-xs text-sky-400 bg-sky-950/60 border border-sky-500/30 px-2 py-0.5 rounded">
                        {item.id}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          isPending
                            ? isDarkMode
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-amber-100 text-amber-900 border-amber-300'
                            : isApproved
                            ? isDarkMode
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : isRejected
                            ? isDarkMode
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : 'bg-rose-100 text-rose-900 border-rose-300'
                            : isDarkMode
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                            : 'bg-purple-100 text-purple-900 border-purple-300'
                        }`}
                      >
                        {item.status.replace(/_/g, ' ')}
                      </span>

                      <span className={`text-xs font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        ETA: <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>{item.estimated_time_min}m</strong> ({item.distance_km}km)
                      </span>

                      <span className={`text-xs font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Transport: <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>{item.vehicle_type}</strong>
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                      <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>
                        {item.quantity.toLocaleString()} {item.resource_type.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      <span className="text-slate-500">&rarr;</span>
                      <span className={isDarkMode ? 'text-sky-300' : 'text-sky-800'}>
                        {item.destination_zone_name || item.destination_zone_id}
                      </span>
                      <span className={`text-xs font-normal ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        (Dispatched from {item.source_warehouse_name || item.source_warehouse_id})
                      </span>
                    </div>

                    {item.reason && (
                      <p className={`text-xs italic ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        &ldquo;{item.reason}&rdquo;
                      </p>
                    )}

                    {item.modification_reason && (
                      <div
                        className={`text-xs p-2 rounded border font-mono ${
                          isRejected
                            ? isDarkMode
                              ? 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                              : 'bg-rose-50 border-rose-200 text-rose-800'
                            : isDarkMode
                            ? 'bg-purple-950/40 border-purple-500/30 text-purple-300'
                            : 'bg-purple-50 border-purple-200 text-purple-800'
                        }`}
                      >
                        Note: {item.modification_reason}
                      </div>
                    )}
                  </div>

                  {/* Decision Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isPending && (
                      <>
                        <button
                          onClick={() => handleQuickAccept(item.id)}
                          disabled={isProcessing}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50"
                          title="Accept and authorize this allocation immediately"
                        >
                          <Check className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                          <span>Accept</span>
                        </button>

                        {onModify && (
                          <button
                            onClick={() => openModifyModal(item)}
                            disabled={isProcessing}
                            className={`px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                              isDarkMode
                                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                            }`}
                            title="Modify quantity or vehicle"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline ml-1">Modify</span>
                          </button>
                        )}

                        <button
                          onClick={() => openRejectModal(item)}
                          disabled={isProcessing}
                          className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-rose-600/20 transition cursor-pointer disabled:opacity-50"
                          title="Reject this allocation with mandatory justification"
                        >
                          <X className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      </>
                    )}

                    {isApproved && (
                      <div className="flex items-center space-x-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/40 px-3 py-1.5 rounded-lg">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Accepted & En Route</span>
                      </div>
                    )}

                    {isRejected && (
                      <div className="flex items-center space-x-1.5 text-xs text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/40 px-3 py-1.5 rounded-lg">
                        <XCircle className="w-4 h-4" />
                        <span>Rejected</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reject Justification Modal */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div
            className={`border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 ${
              isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2 text-rose-500">
                <AlertOctagon className="w-5 h-5" />
                <h3 className="font-bold text-base">Reject Allocation Request</h3>
              </div>
              <button
                onClick={() => setRejectModalItem(null)}
                className="text-slate-400 hover:text-white cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <p className={`text-xs ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              You are rejecting order <strong className="font-mono">{rejectModalItem.id}</strong> (
              {rejectModalItem.quantity.toLocaleString()} {rejectModalItem.resource_type} to{' '}
              {rejectModalItem.destination_zone_name}). Under emergency command governance, human rejection requires a
              mandatory rationale.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Mandatory Operational Justification
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => {
                  setRejectReason(e.target.value);
                  if (rejectError) setRejectError('');
                }}
                placeholder="e.g. Destination sector road is impassable; rerouting to secondary depot."
                className={`w-full p-2.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-rose-500 ${
                  isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
              {rejectError && <p className="text-xs text-rose-400">{rejectError}</p>}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setRejectModalItem(null)}
                className={`px-4 py-2 text-xs font-bold rounded-lg border cursor-pointer ${
                  isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={processingId === rejectModalItem.id}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-500 text-white shadow-md cursor-pointer disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modify Modal */}
      {modifyModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div
            className={`border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 ${
              isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2 text-sky-400">
                <Edit2 className="w-5 h-5" />
                <h3 className="font-bold text-base">Modify Allocation Order</h3>
              </div>
              <button
                onClick={() => setModifyModalItem(null)}
                className="text-slate-400 hover:text-white cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  New Quantity ({modifyModalItem.resource_type})
                </label>
                <input
                  type="number"
                  min={1}
                  value={modifyQty}
                  onChange={(e) => setModifyQty(parseInt(e.target.value) || 0)}
                  className={`w-full mt-1 p-2 text-xs rounded-lg border font-mono ${
                    isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Modification Rationale
                </label>
                <textarea
                  rows={2}
                  value={modifyReason}
                  onChange={(e) => setModifyReason(e.target.value)}
                  placeholder="e.g. Adjusted quantity based on ground reconnaissance report."
                  className={`w-full mt-1 p-2 text-xs rounded-lg border ${
                    isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
              {modifyError && <p className="text-xs text-rose-400">{modifyError}</p>}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setModifyModalItem(null)}
                className={`px-4 py-2 text-xs font-bold rounded-lg border cursor-pointer ${
                  isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmModify}
                disabled={processingId === modifyModalItem.id}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-md cursor-pointer disabled:opacity-50"
              >
                Save & Authorize
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
