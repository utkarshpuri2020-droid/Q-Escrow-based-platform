"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { apiRequest } from "@/lib/api";
import {
  Scale,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Lock,
  User,
  FileText,
  DollarSign
} from "lucide-react";

export default function DisputeDetailPage() {
  const { id } = useParams() as { id: string };
  const { user } = useAuth();
  const router = useRouter();

  const [dispute, setDispute] = useState<any | null>(null);
  const [escrow, setEscrow] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Resolution form state
  const [ruling, setRuling] = useState("REFUND_BUYER");
  const [notes, setNotes] = useState("");
  const [buyerSplit, setBuyerSplit] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchDispute = () => {
    apiRequest(`/disputes/${id}`)
      .then((data) => {
        setDispute(data);
        return apiRequest(`/escrows/${data.escrow_id}`);
      })
      .then((escData) => {
        setEscrow(escData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (id) fetchDispute();
  }, [id]);

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    setSuccess(null);

    const buyerMinor = buyerSplit ? Math.round(parseFloat(buyerSplit) * 100) : 0;
    const sellerMinor = escrow ? escrow.amount - buyerMinor : 0;

    try {
      await apiRequest(`/disputes/${id}/resolve`, {
        method: "POST",
        body: JSON.stringify({
          ruling,
          resolution_notes: notes.trim(),
          buyer_split_amount: ruling === "SPLIT_FUNDS" ? buyerMinor : undefined,
          seller_split_amount: ruling === "SPLIT_FUNDS" ? sellerMinor : undefined,
        }),
      });

      setSuccess("Dispute resolved successfully! Escrow state and ledger payout updated.");
      fetchDispute();
    } catch (err: any) {
      setError(err.message || "Failed to resolve dispute");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-500">Loading dispute details...</div>;
  }

  if (!dispute) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 text-center space-y-3">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Dispute Not Found</h2>
        <Link href="/disputes" className="text-xs text-qblue-600 hover:underline">
          Return to Disputes
        </Link>
      </div>
    );
  }

  const isReviewerOrAdmin = user?.role === "REVIEWER" || user?.role === "ADMIN";
  const isResolved = dispute.status.startsWith("RESOLVED");

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-navy-800 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            Case Adjudication
          </span>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mt-1">
            <Scale className="w-6 h-6 text-rose-600" />
            <span>Dispute: {dispute.reason}</span>
          </h1>
          <div className="flex items-center gap-3 text-xs text-slate-500 font-mono mt-1">
            <span>Case ID: {dispute.id}</span>
            <span>Opened: {new Date(dispute.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full font-bold text-xs bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-400">
          {dispute.status}
        </span>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left 2 cols: Claim details and Escrow Info */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Claim Description & Argument
            </h3>
            <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
              {dispute.description}
            </p>
          </div>

          {escrow && (
            <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-qblue-500" />
                  <span>Subject Escrow: {escrow.title}</span>
                </h3>
                <Link
                  href={`/escrows/${escrow.id}`}
                  className="text-xs font-semibold text-qblue-600 hover:underline"
                >
                  View Full Escrow
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-navy-950 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Locked Amount</span>
                  <strong className="text-slate-900 dark:text-white font-mono text-sm">
                    ${(escrow.amount / 100).toFixed(2)} {escrow.currency}
                  </strong>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-navy-950 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Escrow State</span>
                  <strong className="text-slate-900 dark:text-white font-mono">
                    {escrow.status}
                  </strong>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Agreed Terms Summary:
                </span>
                <div className="p-3 bg-slate-50 dark:bg-navy-950 rounded-lg font-mono text-xs text-slate-600 dark:text-slate-400 max-h-36 overflow-y-auto">
                  {escrow.terms}
                </div>
              </div>
            </div>
          )}

          {isResolved && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 p-6 rounded-2xl border border-emerald-200 dark:border-emerald-800 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 font-bold text-sm">
                <ShieldCheck className="w-5 h-5" />
                <span>Final Arbitration Decision</span>
              </div>
              <div className="text-xs text-emerald-900 dark:text-emerald-100 font-mono">
                Ruling: <strong>{dispute.ruling}</strong>
              </div>
              {dispute.resolution_notes && (
                <div className="text-xs text-emerald-800 dark:text-emerald-200">
                  <strong>Arbiter Explanation:</strong> {dispute.resolution_notes}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right col: Reviewer Resolution Panel */}
        <div>
          {isReviewerOrAdmin && !isResolved ? (
            <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-qblue-500" />
                Arbiter Decision Panel
              </h3>
              <p className="text-xs text-slate-500">
                You are authorized as an impartial reviewer to settle this dispute.
              </p>

              <form onSubmit={handleResolve} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Ruling
                  </label>
                  <select
                    value={ruling}
                    onChange={(e) => setRuling(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-white"
                  >
                    <option value="REFUND_BUYER">Refund 100% to Buyer</option>
                    <option value="RELEASE_SELLER">Release 100% to Seller</option>
                    <option value="SPLIT_FUNDS">Split Funds Proportionally</option>
                  </select>
                </div>

                {ruling === "SPLIT_FUNDS" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Buyer Split Amount ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="e.g. 250.00"
                      value={buyerSplit}
                      onChange={(e) => setBuyerSplit(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-white"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Remainder will automatically be disbursed to the seller.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Adjudication Rationale & Notes
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Provide detailed legal and contractual rationale..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-qblue-600 hover:bg-qblue-700 text-white font-semibold text-xs shadow-sm transition disabled:opacity-50"
                >
                  {actionLoading ? "Executing Ruling..." : "Enforce Arbitration Ruling"}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-navy-900/60 p-6 rounded-2xl border border-slate-200 dark:border-navy-800 space-y-3 text-xs text-slate-500">
              <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                Arbitration Policy
              </h4>
              <p>
                Rulings are final and permanently recorded on the tamper-evident state chain and smart contract ledger.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
