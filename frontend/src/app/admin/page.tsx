"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { apiRequest } from "@/lib/api";
import {
  ShieldAlert,
  Users,
  Layers,
  Scale,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ArrowRight
} from "lucide-react";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === "ADMIN") {
      apiRequest("/admin/metrics")
        .then(setMetrics)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-800 text-center space-y-4">
        <Lock className="w-8 h-8 text-rose-600 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">403 - Forbidden</h2>
        <p className="text-xs text-slate-500">Administrator credentials are required to inspect system telemetry.</p>
        <Link
          href="/dashboard"
          className="inline-block px-4 py-2 bg-qblue-600 hover:bg-qblue-700 text-white rounded-lg text-xs font-semibold"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-500">Loading administrative metrics...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
          Supervisory Controls
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mt-1">
          <ShieldAlert className="w-7 h-7 text-rose-600" />
          <span>System Administration Dashboard</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Real-time platform telemetry, user accounts, dispute volumes, failed verifications, and audit activity.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200">
          {error}
        </div>
      )}

      {metrics && (
        <div className="space-y-8">
          {/* Top 4 Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-sm space-y-1">
              <span className="text-xs text-slate-400 font-medium">Total Registered Users</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                  {metrics.users.total}
                </span>
                <Users className="w-5 h-5 text-qblue-500" />
              </div>
              <span className="text-[11px] text-slate-400 block">
                {metrics.users.active} active accounts ({metrics.users.verified} verified)
              </span>
            </div>

            <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-sm space-y-1">
              <span className="text-xs text-slate-400 font-medium">Total Escrows Initiated</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                  {metrics.escrows.total}
                </span>
                <Layers className="w-5 h-5 text-indigo-500" />
              </div>
              <span className="text-[11px] text-slate-400 block">Across all states</span>
            </div>

            <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-sm space-y-1">
              <span className="text-xs text-slate-400 font-medium">Open Dispute Claims</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                  {metrics.disputes.open}
                </span>
                <Scale className="w-5 h-5 text-amber-500" />
              </div>
              <span className="text-[11px] text-slate-400 block">Awaiting review or ruling</span>
            </div>

            <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-sm space-y-1">
              <span className="text-xs text-slate-400 font-medium">Failed Verifications</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                  {metrics.security.failed_verifications}
                </span>
                <AlertTriangle className="w-5 h-5 text-rose-500" />
              </div>
              <span className="text-[11px] text-slate-400 block">
                {metrics.security.suspicious_events} security warnings logged
              </span>
            </div>
          </div>

          {/* Status Breakdown & Security Events */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-sm space-y-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Escrow State Distribution
              </h3>
              <div className="space-y-2">
                {Object.entries(metrics.escrows.status_distribution || {}).map(([st, cnt]) => (
                  <div key={st} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 dark:border-navy-800">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{st}</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{String(cnt)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Recent Security Events
                </h3>
                <Link
                  href="/audit-logs"
                  className="text-xs font-semibold text-qblue-600 hover:underline"
                >
                  Full Audit Log →
                </Link>
              </div>

              <div className="space-y-3">
                {metrics.security.recent_events?.map((ev: any, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-50 dark:bg-navy-950 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between font-mono">
                      <strong className="text-slate-900 dark:text-white">{ev.action}</strong>
                      <span className="text-[10px] text-slate-400">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-slate-500 flex items-center justify-between text-[11px]">
                      <span>User: {ev.actor_username || "Anonymous"}</span>
                      <span className={ev.outcome === "SUCCESS" ? "text-emerald-600" : "text-rose-600"}>
                        {ev.outcome}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
