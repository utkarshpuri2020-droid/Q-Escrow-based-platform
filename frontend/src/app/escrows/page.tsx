"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { apiRequest } from "@/lib/api";
import { EscrowStateBadge } from "@/components/EscrowStateBadge";
import {
  Layers,
  PlusCircle,
  Search,
  Filter,
  ArrowUpRight,
  ShieldCheck,
  Lock,
  Clock
} from "lucide-react";

export default function EscrowsListPage() {
  const { user } = useAuth();
  const [escrows, setEscrows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    if (user) {
      apiRequest("/escrows/")
        .then((data) => setEscrows(data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user]);

  const filtered = escrows.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.id.toLowerCase().includes(search.toLowerCase());

    if (statusFilter === "ALL") return matchesSearch;
    if (statusFilter === "ACTIVE") {
      return matchesSearch && !["RELEASED", "REFUNDED", "CANCELLED"].includes(e.status);
    }
    if (statusFilter === "COMPLETED") {
      return matchesSearch && ["RELEASED", "REFUNDED"].includes(e.status);
    }
    return matchesSearch && e.status === statusFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-qblue-600 dark:text-qblue-400">
            Ledger Overview
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            My Escrow Transactions
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Browse, manage, and inspect all escrow agreements where you are buyer or seller.
          </p>
        </div>

        <Link
          href="/escrows/create"
          className="px-4 py-2 bg-qblue-600 hover:bg-qblue-500 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Escrow</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-qblue-500"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1 flex-wrap w-full sm:w-auto">
          {["ALL", "ACTIVE", "COMPLETED", "LOCKED", "DISPUTED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                statusFilter === st
                  ? "bg-qblue-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading transactions...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-navy-800 text-slate-400 flex items-center justify-center mx-auto">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">No matching escrows</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No transactions match your current search or filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-navy-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-navy-800">
                <tr>
                  <th className="px-6 py-3">Agreement</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Created</th>
                  <th className="px-6 py-3">Deadline</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                {filtered.map((e) => (
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
                      {new Date(e.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(e.deadline).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/escrows/${e.id}`}
                        className="inline-flex items-center gap-1 font-semibold text-qblue-600 dark:text-qblue-400 hover:underline"
                      >
                        <span>Manage</span>
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
