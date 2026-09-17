import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Truck,
  ShieldAlert,
  Search,
  Check,
  X,
  PlusCircle,
  RefreshCw,
  Sliders,
  Filter,
  Package,
  Layers,
  ChevronRight,
  Database
} from 'lucide-react';
import { SystemState, AllocationItem } from '../types';

interface RequestAppReviewQueueProps {
  state: SystemState;
  onApproveAllocation: (id: string) => Promise<void> | void;
  onRejectAllocation: (id: string, reason?: string) => Promise<void> | void;
  onModifyAllocation?: (id: string, reason: string, qty: number) => Promise<void> | void;
  isDarkMode?: boolean;
  onRefresh?: () => void;
  onRequestEmergencyDemand?: (zoneId: string, commodity: string, qty: number, reason: string) => void;
}

export const RequestAppReviewQueue: React.FC<RequestAppReviewQueueProps> = ({
  state,
  onApproveAllocation,
  onRejectAllocation,
  onModifyAllocation,
  isDarkMode = true,
  onRefresh,
  onRequestEmergencyDemand,
}) => {
  const [filterStatus, setFilterStatus] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('Road cut off by inundation; alternate route required.');
  const [customReason, setCustomReason] = useState<string>('');
  const [modifyingItem, setModifyingItem] = useState<AllocationItem | null>(null);
  const [modifyQty, setModifyQty] = useState<number>(1000);
  const [modifyReason, setModifyReason] = useState<string>('Adjusted for field team carrying capacity');
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState<boolean>(false);
  const [emergencyZone, setEmergencyZone] = useState<string>(state.zones[0]?.id || 'Z1');
  const [emergencyCommodity, setEmergencyCommodity] = useState<string>('medical_kits');
  const [emergencyQty, setEmergencyQty] = useState<number>(500);
  const [emergencyReason, setEmergencyReason] = useState<string>('Urgent rooftop SOS received from marooned residents');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const allocations = state.active_allocations || [];

  const pendingAllocations = allocations.filter((a) => {
    const s = (a.status || '').toLowerCase();
    return s === 'pending_approval' || s === 'pending';
  });
  const approvedAllocations = allocations.filter((a) => {
    const s = (a.status || '').toLowerCase();
    return s === 'approved' || s === 'dispatched' || s === 'completed';
  });
  const rejectedAllocations = allocations.filter((a) => (a.status || '').toLowerCase() === 'rejected');

  const filteredAllocations = allocations.filter((a) => {
    const s = (a.status || '').toLowerCase();
    // Status filter
    if (filterStatus === 'pending') {
      if (s !== 'pending_approval' && s !== 'pending') return false;
    } else if (filterStatus === 'approved') {
      if (s !== 'approved' && s !== 'dispatched' && s !== 'completed') return false;
    } else if (filterStatus === 'rejected') {
      if (s !== 'rejected') return false;
    }

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchZone = a.destination_zone_name?.toLowerCase().includes(q);
      const matchRes = a.resource_type?.toLowerCase().includes(q);
      const matchWarehouse = a.source_warehouse_name?.toLowerCase().includes(q);
      const matchId = a.id?.toLowerCase().includes(q);
      return matchZone || matchRes || matchWarehouse || matchId;
    }
    return true;
  });

  const handleApprove = async (id: string) => {
    try {
      await onApproveAllocation(id);
      setActionFeedback(`Allocation ${id} APPROVED & authorized for immediate convoy dispatch.`);
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err: any) {
      alert(`Approval error: ${err.message}`);
    }
  };

  const handleApproveAll = async () => {
    if (pendingAllocations.length === 0) return;
    try {
      for (const a of pendingAllocations) {
        await onApproveAllocation(a.id);
      }
      setActionFeedback(`All ${pendingAllocations.length} pending allocation requests APPROVED successfully.`);
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err: any) {
      alert(`Bulk approval error: ${err.message}`);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingId) return;
    const finalReason = customReason.trim() ? customReason.trim() : rejectionReason;
    try {
      await onRejectAllocation(rejectingId, finalReason);
      setActionFeedback(`Allocation ${rejectingId} REJECTED with logged justification.`);
      setRejectingId(null);
      setCustomReason('');
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err: any) {
      alert(`Rejection error: ${err.message}`);
    }
  };

  const handleConfirmModify = async () => {
    if (!modifyingItem) return;
    if (onModifyAllocation) {
      await onModifyAllocation(modifyingItem.id, modifyReason, modifyQty);
      setActionFeedback(`Allocation ${modifyingItem.id} modified to ${modifyQty.toLocaleString()} units.`);
      setModifyingItem(null);
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  const handleSubmitEmergencyDemand = () => {
    if (onRequestEmergencyDemand) {
      onRequestEmergencyDemand(emergencyZone, emergencyCommodity, emergencyQty, emergencyReason);
      setActionFeedback(`Live emergency request created for ${emergencyZone}: ${emergencyQty} ${emergencyCommodity}.`);
    } else {
      alert(`Live emergency request created for zone ${emergencyZone}!`);
    }
    setIsEmergencyModalOpen(false);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const getCommodityBadgeColor = (res: string) => {
    const r = res.toLowerCase();
    if (r.includes('water')) return isDarkMode ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-cyan-100 text-cyan-800 border-cyan-300';
    if (r.includes('medical') || r.includes('amb')) return isDarkMode ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-rose-100 text-rose-800 border-rose-300';
    if (r.includes('food')) return isDarkMode ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-amber-100 text-amber-800 border-amber-300';
    return isDarkMode ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' : 'bg-indigo-100 text-indigo-800 border-indigo-300';
  };

  return (
    <div className={`p-6 rounded-2xl border shadow-xl space-y-5 transition-all ${
      isDarkMode
        ? 'bg-slate-900/95 border-sky-500/30 shadow-sky-950/20'
        : 'bg-white border-slate-200 shadow-slate-200/60'
    }`}>
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-5 border-slate-700/50">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
              pendingAllocations.length > 0
                ? isDarkMode ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse' : 'bg-amber-100 text-amber-800 border-amber-300'
                : isDarkMode ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
            }`}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>REQUEST APP OPTION: {pendingAllocations.length} PENDING REVIEW</span>
            </span>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded border flex items-center gap-1 ${
              isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}>
              <Database className="w-3 h-3 text-emerald-400" />
              <span>PostgreSQL 15 &bull; PostGIS 3.6 Authoritative</span>
            </span>
          </div>

          <h2 className={`text-xl font-bold tracking-tight flex items-center gap-2 ${
            isDarkMode ? 'text-white' : 'text-slate-900'
          }`}>
            <span>Live Operational Allocation Requests Queue</span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold ${
              isDarkMode ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'bg-sky-100 text-sky-800'
            }`}>
              ACCEPT OR REJECT CONTROLS
            </span>
          </h2>
          <p className={`text-xs leading-relaxed max-w-3xl ${
            isDarkMode ? 'text-slate-300' : 'text-slate-600 font-medium'
          }`}>
            Human-in-the-loop supervisory review for all AI-optimized resource allocations. Authorize dispatches, reject unviable legs with audit trails, or inject ad-hoc field demand requests.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {pendingAllocations.length > 0 && (
            <button
              onClick={handleApproveAll}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              title="Approve all currently pending allocation requests"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>APPROVE ALL PENDING ({pendingAllocations.length})</span>
            </button>
          )}

          <button
            onClick={() => setIsEmergencyModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
            title="Create an emergency demand request for immediate review"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ EMERGENCY DEMAND SIGNAL</span>
          </button>

          {onRefresh && (
            <button
              onClick={onRefresh}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
              title="Sync latest records from PostgreSQL"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionFeedback && (
        <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
          actionFeedback.includes('REJECTED')
            ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
            : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
        }`}>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
          <button onClick={() => setActionFeedback(null)} className="text-slate-400 hover:text-white text-xs">
            &times;
          </button>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              filterStatus === 'pending'
                ? isDarkMode
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'bg-amber-100 text-amber-900 border border-amber-300 font-extrabold'
                : isDarkMode
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>Pending Review</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              pendingAllocations.length > 0
                ? 'bg-amber-500 text-slate-950 font-extrabold'
                : isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-700'
            }`}>
              {pendingAllocations.length}
            </span>
          </button>

          <button
            onClick={() => setFilterStatus('approved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              filterStatus === 'approved'
                ? isDarkMode
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-extrabold'
                : isDarkMode
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>Approved & Dispatched</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-700'
            }`}>
              {approvedAllocations.length}
            </span>
          </button>

          <button
            onClick={() => setFilterStatus('rejected')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              filterStatus === 'rejected'
                ? isDarkMode
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                  : 'bg-rose-100 text-rose-900 border border-rose-300 font-extrabold'
                : isDarkMode
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>Rejected</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-700'
            }`}>
              {rejectedAllocations.length}
            </span>
          </button>

          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              filterStatus === 'all'
                ? isDarkMode
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                  : 'bg-sky-100 text-sky-900 border border-sky-300 font-extrabold'
                : isDarkMode
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>All Requests</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-700'
            }`}>
              {allocations.length}
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className={`w-3.5 h-3.5 absolute left-3 top-2.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search sector, commodity, depot..."
            className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border font-medium outline-none transition ${
              isDarkMode
                ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-sky-500'
                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-sky-500'
            }`}
          />
        </div>
      </div>

      {/* Requests List */}
      {filteredAllocations.length === 0 ? (
        <div className={`p-8 text-center rounded-xl border border-dashed ${
          isDarkMode ? 'bg-slate-950/40 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-300 text-slate-600'
        }`}>
          <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400 opacity-60" />
          <p className="text-sm font-semibold">
            {filterStatus === 'pending'
              ? 'All allocation requests have been reviewed and approved.'
              : 'No allocation requests match the selected filter.'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Generate an emergency demand signal or run solver re-optimization to generate new tactical allocations.
          </p>
          <button
            onClick={() => setIsEmergencyModalOpen(true)}
            className="mt-3 px-3 py-1.5 rounded-lg bg-sky-500 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Generate Demand Request</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
          {filteredAllocations.map((alloc) => {
            const s = (alloc.status || '').toLowerCase();
            const isPending = s === 'pending_approval' || s === 'pending';
            const isApproved = s === 'approved' || s === 'dispatched' || s === 'completed';
            const isRejected = s === 'rejected';

            return (
              <div
                key={alloc.id}
                className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isDarkMode
                    ? isPending
                      ? 'bg-slate-950/80 border-amber-500/30 hover:border-amber-500/50'
                      : 'bg-slate-950/40 border-slate-800'
                    : isPending
                    ? 'bg-amber-50/40 border-amber-300 hover:border-amber-400 shadow-sm'
                    : 'bg-white border-slate-200'
                }`}
              >
                {/* Left: Metadata & Zone Details */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
                      isDarkMode ? 'bg-slate-800 border-slate-700 text-sky-400' : 'bg-slate-100 border-slate-300 text-sky-800'
                    }`}>
                      {alloc.id}
                    </span>

                    <span className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {alloc.destination_zone_name}
                    </span>

                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase font-bold ${
                      isPending
                        ? isDarkMode ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse' : 'bg-amber-100 text-amber-800 border-amber-300'
                        : isApproved
                        ? isDarkMode ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : isDarkMode ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-rose-100 text-rose-800 border-rose-300'
                    }`}>
                      {alloc.status.replace('_', ' ')}
                    </span>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getCommodityBadgeColor(alloc.resource_type)}`}>
                      {alloc.resource_type.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <div className={`text-xs flex flex-wrap items-center gap-x-4 gap-y-1 ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    <div>
                      Dispatch Quantity:{' '}
                      <strong className={`font-mono font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>
                        {alloc.quantity.toLocaleString()} units
                      </strong>
                    </div>
                    <span className="text-slate-500 hidden sm:inline">&bull;</span>
                    <div>
                      Depot:{' '}
                      <span className="font-medium text-sky-400">{alloc.source_warehouse_name}</span>
                    </div>
                    <span className="text-slate-500 hidden sm:inline">&bull;</span>
                    <div className="flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-slate-400" />
                      <span>{alloc.vehicle_type || 'Relief Vehicle'}</span>
                      <span className="font-mono text-slate-400">({alloc.distance_km} km &bull; ETA {alloc.estimated_time_min}m)</span>
                    </div>
                  </div>

                  {alloc.modification_reason && (
                    <div className={`text-xs italic p-1.5 rounded border ${
                      isRejected
                        ? isDarkMode ? 'bg-rose-950/30 border-rose-900/50 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'
                        : isDarkMode ? 'bg-slate-800/60 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                    }`}>
                      Note: {alloc.modification_reason}
                    </div>
                  )}
                </div>

                {/* Right: Accept & Reject Controls */}
                <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
                  {isPending ? (
                    <>
                      <button
                        onClick={() => handleApprove(alloc.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-emerald-600/20 transition cursor-pointer"
                        title="Accept & Authorize Allocation"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>ACCEPT</span>
                      </button>

                      <button
                        onClick={() => {
                          setRejectingId(alloc.id);
                          setCustomReason('');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-rose-600/20 transition cursor-pointer"
                        title="Reject Allocation Request"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>REJECT</span>
                      </button>

                      {onModifyAllocation && (
                        <button
                          onClick={() => {
                            setModifyingItem(alloc);
                            setModifyQty(alloc.quantity);
                          }}
                          className={`p-1.5 rounded-lg border transition cursor-pointer ${
                            isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                          }`}
                          title="Modify Quantity"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs font-mono font-semibold px-2 py-1 rounded border ${
                        isApproved
                          ? isDarkMode ? 'text-emerald-400 bg-emerald-950/30 border-emerald-800' : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                          : isDarkMode ? 'text-rose-400 bg-rose-950/30 border-rose-800' : 'text-rose-700 bg-rose-50 border-rose-200'
                      }`}>
                        {isApproved ? 'AUTHORIZED' : 'REJECTED'}
                      </span>
                      {isRejected && (
                        <button
                          onClick={() => handleApprove(alloc.id)}
                          className="px-2 py-1 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 cursor-pointer"
                          title="Re-open & approve"
                        >
                          Re-approve
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rejection Justification Modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`max-w-md w-full p-6 rounded-2xl border shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150 ${
            isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-700/50">
              <div className="flex items-center space-x-2 text-rose-500">
                <XCircle className="w-5 h-5" />
                <h3 className="font-bold text-base">Reject Allocation {rejectingId}</h3>
              </div>
              <button
                onClick={() => setRejectingId(null)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Disaster governance mandates that every rejected allocation record has an immutable reason logged to the PostgreSQL audit trail.
            </p>

            <div className="space-y-3">
              <label className="text-xs font-semibold block text-slate-300">
                Select Operational Justification:
              </label>
              {[
                'Road severed by inundation; alternate route required.',
                'Depot inventory reserved for critical district hospital.',
                'Duplicate demand signal; covered by NDRF Boat Unit 2.',
                'Field responder verified citizen evacuation completed.',
                'PostGIS route obstructed by structural bridge failure.'
              ].map((reason) => (
                <label
                  key={reason}
                  className={`flex items-start space-x-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                    rejectionReason === reason
                      ? isDarkMode ? 'bg-rose-500/20 border-rose-500/50 text-white' : 'bg-rose-50 border-rose-400 text-rose-900'
                      : isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="rejection_reason"
                    checked={rejectionReason === reason}
                    onChange={() => setRejectionReason(reason)}
                    className="mt-0.5"
                  />
                  <span>{reason}</span>
                </label>
              ))}

              <div>
                <label className="text-xs font-semibold block text-slate-300 mb-1">
                  Or Enter Specific Field Notes:
                </label>
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Optional custom rejection reason..."
                  rows={2}
                  className={`w-full p-2.5 text-xs rounded-xl border outline-none ${
                    isDarkMode
                      ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-rose-500'
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-rose-500'
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setRejectingId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                Confirm Rejection & Log Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Demand Signal Generator Modal */}
      {isEmergencyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`max-w-md w-full p-6 rounded-2xl border shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150 ${
            isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-700/50">
              <div className="flex items-center space-x-2 text-sky-400">
                <PlusCircle className="w-5 h-5" />
                <h3 className="font-bold text-base">Generate Live Emergency Demand</h3>
              </div>
              <button
                onClick={() => setIsEmergencyModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Inject a live field emergency demand signal into the command review queue for immediate dispatch authorization.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold block text-slate-300 mb-1">
                  Destination Sector / Zone:
                </label>
                <select
                  value={emergencyZone}
                  onChange={(e) => setEmergencyZone(e.target.value)}
                  className={`w-full p-2.5 text-xs rounded-xl border outline-none font-medium ${
                    isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  {state.zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name} (Pop: {z.affected_population.toLocaleString()}, Priority: {z.priority_score})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold block text-slate-300 mb-1">
                  Resource Commodity:
                </label>
                <select
                  value={emergencyCommodity}
                  onChange={(e) => setEmergencyCommodity(e.target.value)}
                  className={`w-full p-2.5 text-xs rounded-xl border outline-none font-medium ${
                    isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="medical_kits">Medical Kits & Trauma First Aid</option>
                  <option value="water">Potable Drinking Water (Litres)</option>
                  <option value="food">High-Calorie Food Rations</option>
                  <option value="shelter_kits">Emergency Shelter Kits</option>
                  <option value="ambulances">Emergency Medical Evac Ambulances</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold block text-slate-300 mb-1">
                  Requested Quantity:
                </label>
                <input
                  type="number"
                  value={emergencyQty}
                  onChange={(e) => setEmergencyQty(parseInt(e.target.value) || 100)}
                  min={1}
                  step={10}
                  className={`w-full p-2.5 text-xs rounded-xl border outline-none font-mono ${
                    isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-semibold block text-slate-300 mb-1">
                  Ground Situation / Distress Report:
                </label>
                <textarea
                  value={emergencyReason}
                  onChange={(e) => setEmergencyReason(e.target.value)}
                  rows={2}
                  className={`w-full p-2.5 text-xs rounded-xl border outline-none ${
                    isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsEmergencyModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitEmergencyDemand}
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-lg shadow-sky-500/25 cursor-pointer"
              >
                Submit Demand to Review Queue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modify Quantity Modal */}
      {modifyingItem && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`max-w-md w-full p-6 rounded-2xl border shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150 ${
            isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-700/50">
              <div className="flex items-center space-x-2 text-amber-400">
                <Sliders className="w-5 h-5" />
                <h3 className="font-bold text-base">Modify Allocation {modifyingItem.id}</h3>
              </div>
              <button
                onClick={() => setModifyingItem(null)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold block text-slate-300 mb-1">
                  Adjust Quantity (Current: {modifyingItem.quantity.toLocaleString()} {modifyingItem.resource_type}):
                </label>
                <input
                  type="number"
                  value={modifyQty}
                  onChange={(e) => setModifyQty(parseInt(e.target.value) || 0)}
                  min={1}
                  className={`w-full p-2.5 text-xs rounded-xl border outline-none font-mono ${
                    isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-semibold block text-slate-300 mb-1">
                  Modification Justification (Logged to Audit Trail):
                </label>
                <input
                  type="text"
                  value={modifyReason}
                  onChange={(e) => setModifyReason(e.target.value)}
                  className={`w-full p-2.5 text-xs rounded-xl border outline-none ${
                    isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setModifyingItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmModify}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/25 cursor-pointer"
              >
                Save & Update Allocation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
