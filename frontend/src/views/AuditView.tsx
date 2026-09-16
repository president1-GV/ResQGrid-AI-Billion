import React, { useEffect, useState } from 'react';
import { ShieldCheck, History, Filter, Search } from 'lucide-react';
import { AuditLog } from '../types';
import { fetchAuditLogs } from '../services/api';

export const AuditView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAuditLogs()
      .then((res) => {
        setLogs(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.user.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      (log.resource_id && log.resource_id.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-sky-400 font-bold uppercase">Compliance & Accountability</span>
            <span className="text-xs px-2 py-0.5 rounded bg-sky-950 border border-sky-500/40 text-sky-300 font-semibold">
              IMMUTABLE AUDIT TRAIL
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">
            System Governance & Audit Logs
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl mt-0.5">
            Every algorithmic allocation, officer override, road closure, and re-optimization cycle is strictly logged with caller credentials and cryptographic timestamps.
          </p>
        </div>

        {/* Search */}
        <div className="w-full md:w-72">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search action, user, or resource..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3">
          Chronological Audit Records ({filteredLogs.length})
        </h3>

        {loading ? (
          <div className="text-xs text-slate-500 py-8 text-center">Loading audit logs...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                  <th className="py-2 px-3">TIMESTAMP</th>
                  <th className="py-2 px-3">USER & ROLE</th>
                  <th className="py-2 px-3">ACTION</th>
                  <th className="py-2 px-3">RESOURCE ID</th>
                  <th className="py-2 px-3">OPERATIONAL DETAILS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLogs.map((log) => {
                  const isCriticalAction =
                    log.action.includes('REJECT') ||
                    log.action.includes('ROAD_BLOCKED') ||
                    log.action.includes('MODIFIED');

                  return (
                    <tr key={log.id} className="hover:bg-slate-950/40 transition font-mono">
                      <td className="py-3 px-3 text-slate-400 text-[10px] whitespace-nowrap">
                        {log.timestamp.replace('T', ' ').replace('Z', '')}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-sans font-semibold text-slate-200 block">{log.user}</span>
                        <span className="text-[10px] text-sky-400">{log.role}</span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isCriticalAction
                              ? 'bg-amber-950 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {log.resource_id || '-'}
                      </td>
                      <td className="py-3 px-3 font-sans text-slate-300 max-w-md">
                        {log.details}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
