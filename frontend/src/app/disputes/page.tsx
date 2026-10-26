"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiRequest } from "@/lib/api";
import {
  Scale,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ShieldCheck,
  Search
} from "lucide-react";

function DisputesListContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const paramEscrowId = searchParams.get("escrow_id") || "";
  const paramOpen = searchParams.get("open") === "true";

  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOpenModal, setShowOpenModal] = useState(paramOpen);

  const [escrowId, setEscrowId] = useState(paramEscrowId);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchDisputes = () => {
    apiRequest("/disputes/")
      .then((data) => setDisputes(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user) {
      fetchDisputes();
    }
  }, [user]);

  const handleOpenDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await apiRequest("/disputes/", {
        method: "POST",
        body: JSON.stringify({
          escrow_id: escrowId.trim(),
          reason: reason.trim(),
          description: description.trim(),
        }),
      });

      setSuccess("Dispute opened successfully. The escrow funds are frozen awaiting review.");
      setShowOpenModal(false);
      setReason("");
      setDescription("");
      fetchDisputes();
    } catch (err: any) {
      setError(err.message || "Failed to open dispute");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            Arbitration & Claims
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Dispute & Refund Resolution
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Resolve transaction conflicts with authorized reviewer arbitration and cryptographic evidence audit.
          </p>
        </div>

        <button
          onClick={() => setShowOpenModal(true)}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition"
        >
          <Scale className="w-4 h-4" />
          <span>Open New Dispute</span>
        </button>
      </div>

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Disputes Table */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading disputes...</div>
        ) : disputes.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Scale className="w-10 h-10 text-slate-300 dark:text-navy-700 mx-auto" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">No active disputes</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              All transactions are proceeding smoothly without claims or pending arbitration.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-navy-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-navy-800">
                <tr>
                  <th className="px-6 py-3">Reason</th>
                  <th className="px-6 py-3">Escrow ID</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Ruling</th>
                  <th className="px-6 py-3">Created</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                {disputes.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/40 transition">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      {d.reason}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-500">
                      {d.escrow_id.substring(0, 12)}...
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-400">
                        {d.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">
                      {d.ruling || "Pending Arbiter Decision"}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(d.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/disputes/${d.id}`}
                        className="inline-flex items-center gap-1 font-semibold text-qblue-600 dark:text-qblue-400 hover:underline"
                      >
                        <span>Inspect</span>
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

      {/* Open Dispute Modal */}
      {showOpenModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-navy-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span>Open Escrow Dispute</span>
              </h3>
              <button
                onClick={() => setShowOpenModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Opening a dispute freezes the funds locked in the smart contract and transfers adjudication to an authorized reviewer.
            </p>

            {error && (
              <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-200">
                {error}
              </div>
            )}

            <form onSubmit={handleOpenDispute} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Escrow Transaction ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="Paste Escrow UUID..."
                  value={escrowId}
                  onChange={(e) => setEscrowId(e.target.value)}
                  className="w-full font-mono px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Dispute Reason
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Non-delivery, corrupted deliverables, terms violation"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Detailed Explanation & Evidence Summary
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detail why terms were not satisfied and cite evidence..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOpenModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm disabled:opacity-50"
                >
                  {actionLoading ? "Submitting Claim..." : "Submit Dispute Claim"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DisputesPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-xs text-slate-400">Loading disputes...</div>}>
      <DisputesListContent />
    </Suspense>
  );
}
