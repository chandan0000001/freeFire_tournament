import useLiveRefresh from '../../hooks/useLiveRefresh.js';
import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { ScrollText, Shield, Clock } from 'lucide-react';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [refreshVersion, setRefreshVersion] = useState(0);
  useLiveRefresh(() => setRefreshVersion(value => value + 1));
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/admin/audit-logs');
        if (res.success) {
          setLogs(res.logs || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [refreshVersion]);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-extrabold uppercase text-white tracking-wide">
          Operational Audit Trail
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Recorded administrative actions, payment approvals, room dispatches, and score modifications.
        </p>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl bg-[#1c1b1e] border border-[#393236] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#111214] text-[10px] uppercase font-bold text-slate-400 border-b border-[#393236]">
              <tr>
                <th className="py-3 px-5">Timestamp</th>
                <th className="py-3 px-5">Action</th>
                <th className="py-3 px-5">Admin</th>
                <th className="py-3 px-5">Target</th>
                <th className="py-3 px-5">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#393236]">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-500">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-[#292428]">
                    <td className="py-3 px-5 text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-5">
                      <span className="font-mono text-[11px] font-bold text-brand-orange px-2 py-0.5 rounded bg-brand-orange/10 border border-brand-orange/20">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-white font-medium">
                      {log.performedByName || log.performedBy?.name || 'System'}
                    </td>
                    <td className="py-3 px-5 text-slate-300 font-mono text-[11px]">
                      {log.targetEntity}
                    </td>
                    <td className="py-3 px-5 text-slate-300">
                      {log.details}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-500">
                    No audit records logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
