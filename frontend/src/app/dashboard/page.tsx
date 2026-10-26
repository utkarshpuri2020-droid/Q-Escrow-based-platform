"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { apiRequest } from "@/lib/api";
import { EscrowStateBadge } from "@/components/EscrowStateBadge";
import {
  ShieldCheck,
  PlusCircle,
  Clock,
  Lock,
  ArrowUpRight,
  AlertCircle,
  Cpu,
  Layers,
  CheckCircle2,
  Scale
} from "lucide-react";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [escrows, setEscrows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      apiRequest("/escrows/")
        .then((data) => setEscrows(data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (authLoading) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading profile...</div>;
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-800 text-center space-y-4">
        <Lock className="w-8 h-8 text-qblue-600 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Authentication Required</h2>
        <p className="text-xs text-slate-500">Please sign in to view your dashboard.</p>
        <Link
          href="/login"
          className="inline-block px-4 py-2 bg-qblue-600 hover:bg-qblue-700 text-white rounded-lg text-xs font-semibold"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const activeEscrows = escrows.filter((e) => !["RELEASED", "REFUNDED", "CANCELLED"].includes(e.status));
  const lockedValue = escrows
    .filter((e) => ["LOCKED", "IN_PROGRESS", "DELIVERY_SUBMITTED", "AWAITING_BUYER_CONFIRMATION"].includes(e.status))
    .reduce((acc, curr) => acc + curr.amount, 0);
  const completedEscrows = escrows.filter((e) => ["RELEASED", "REFUNDED"].includes(e.status));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-navy-900 to-qblue-900 text-white p-6 rounded-2xl shadow-sm">
        <div>
          <span className="text-xs font-semibold text-qblue-300 uppercase tracking-wider block">
            Dashboard
          </span>
          <h1 className="text-2xl font-bold">
            Welcome back, {user.username}
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Role: <span className="font-semibold text-white uppercase">{user.role}</span> | Post-Quantum ML-DSA authentication active
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/escrows/create"
            className="px-4 py-2 bg-qblue-600 hover:bg-qblue-500 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Escrow</span>
          </Link>
          <Link
            href="/crypto-verification"
            className="px-4 py-2 bg-navy-800 hover:bg-navy-700 text-white text-xs font-semibold rounded-lg border border-navy-700 flex items-center gap-1.5 transition"
          >
            <Cpu className="w-4 h-4 text-qblue-300" />
            <span>Verify Crypto</span>
          </Link>
        </div>
      </div>

      {!user.email_verified && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between text-xs text-amber-800 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>Your email address is unverified. Verify your email to activate all transaction privileges.</span>
          </div>
          <Link
            href="/verify-email"
            className="font-bold underline hover:text-amber-900 dark:hover:text-amber-100"
          >
            Verify Now
          </Link>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-sm space-y-1">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active Escrows</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{activeEscrows.length}</span>
            <Clock className="w-5 h-5 text-qblue-500" />
          </div>
          <span className="text-[11px] text-slate-400 block">Pending fulfillment or release</span>
        </div>

        <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-sm space-y-1">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Locked Escrow Value</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
              ${(lockedValue / 100).toFixed(2)}
            </span>
            <Lock className="w-5 h-5 text-indigo-500" />
          </div>
          <span className="text-[11px] text-slate-400 block">Secured under smart contract</span>
        </div>

        <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-sm space-y-1">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Completed Escrows</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{completedEscrows.length}</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <span className="text-[11px] text-slate-400 block">Released or refunded</span>
        </div>

        <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-sm space-y-1">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Disputes Open</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
              {escrows.filter((e) => e.status === "DISPUTED").length}
            </span>
            <Scale className="w-5 h-5 text-red-500" />
          </div>
          <span className="text-[11px] text-slate-400 block">Awaiting arbiter decision</span>
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-navy-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Recent Escrow Transactions
          </h2>
          <Link
            href="/escrows"
            className="text-xs font-semibold text-qblue-600 dark:text-qblue-400 hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading transactions...</div>
        ) : escrows.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-navy-800 text-slate-400 flex items-center justify-center mx-auto">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">No transactions yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You haven&apos;t created or participated in any escrow agreements.
            </p>
            <Link
              href="/escrows/create"
              className="inline-block px-4 py-2 rounded-lg bg-qblue-600 hover:bg-qblue-700 text-white text-xs font-semibold"
            >
              Initiate Your First Escrow
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-navy-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-navy-800">
                <tr>
                  <th className="px-6 py-3">Agreement</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Deadline</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                {escrows.slice(0, 5).map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/40 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white text-sm">
                        {e.title}
                      </div>
                      <div className="font-mono text-[11px] text-slate-400">
                        ID: {e.id.substring(0, 8)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white">
                      ${(e.amount / 100).toFixed(2)} {e.currency}
                    </td>
                    <td className="px-6 py-4">
                      <EscrowStateBadge status={e.status} />
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(e.deadline).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/escrows/${e.id}`}
                        className="inline-flex items-center gap-1 font-semibold text-qblue-600 dark:text-qblue-400 hover:underline"
                      >
                        <span>Details</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
