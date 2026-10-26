"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiRequest } from "@/lib/api";
import {
  FileText,
  Search,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ChevronLeft,
  ChevronRight,
  Shield
} from "lucide-react";

export default function AuditLogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [limit] = useState(25);
  const [actionSearch, setActionSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchLogs = (currentOffset = 0) => {
    setLoading(true);
    const query = new URLSearchParams({
      offset: String(currentOffset),
      limit: String(limit),
      ...(actionSearch ? { action: actionSearch } : {}),
    });

    apiRequest(`/audit/?${query.toString()}`)
      .then((data) => {
        setLogs(data.items || []);
        setTotal(data.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user?.role === "ADMIN" || user?.role === "REVIEWER") {
      fetchLogs(offset);
    } else {
      setLoading(false);
    }
  }, [user, offset]);

  if (!user || (user.role !== "ADMIN" && user.role !== "REVIEWER")) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-800 text-center space-y-4">
        <Lock className="w-8 h-8 text-rose-600 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">403 - Restricted Access</h2>
        <p className="text-xs text-slate-500">Only Reviewers and Administrators have permission to inspect system audit logs.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-qblue-600 dark:text-qblue-400">
            Compliance & Non-Repudiation
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mt-1">
            <Shield className="w-7 h-7 text-qblue-600 dark:text-qblue-400" />
            <span>Audit Log Explorer</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Searchable, append-oriented audit records of logins, state transitions, key revocations, and arbitration rulings.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Filter by action (e.g. LOGIN)..."
            value={actionSearch}
            onChange={(e) => setActionSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchLogs(0)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading audit records...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">No audit logs found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-navy-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-navy-800">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Resource</th>
                  <th className="px-4 py-3">Outcome</th>
                  <th className="px-4 py-3">IP Address</th>
                  <th className="px-4 py-3">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800 font-mono text-[11px]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/40">
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      {log.action}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      {log.actor_username || "Anonymous"}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {log.resource_type} {log.resource_id ? `(${log.resource_id.substring(0, 8)}...)` : ""}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          log.outcome === "SUCCESS"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {log.outcome}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {log.ip_address || "127.0.0.1"}
                    </td>
                    <td className="px-4 py-3 text-slate-500 max-w-xs truncate" title={log.details}>
                      {log.details || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {logs.length} of {total} audit records
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOffset((o) => Math.max(0, o - limit))}
              disabled={offset === 0}
              className="p-1 rounded bg-slate-100 dark:bg-navy-800 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setOffset((o) => o + limit)}
              disabled={offset + limit >= total}
              className="p-1 rounded bg-slate-100 dark:bg-navy-800 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
