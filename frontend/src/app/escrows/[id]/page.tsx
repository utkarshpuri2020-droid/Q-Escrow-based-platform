"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { apiRequest } from "@/lib/api";
import { EscrowStateBadge } from "@/components/EscrowStateBadge";
import { CryptoHashCard } from "@/components/CryptoHashCard";
import {
  ShieldCheck,
  Clock,
  Lock,
  ArrowRight,
  Upload,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  FileText,
  User,
  History,
  Scale,
  ExternalLink,
  Cpu
} from "lucide-react";

export default function EscrowDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { user } = useAuth();

  const [escrow, setEscrow] = useState<any | null>(null);
  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Evidence upload form state
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [evidenceTitle, setEvidenceTitle] = useState("");
  const [evidenceDesc, setEvidenceDesc] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);

  const fetchDetails = () => {
    apiRequest(`/escrows/${id}`)
      .then((data) => {
        setEscrow(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    apiRequest(`/escrows/${id}/evidence`)
      .then((data) => setEvidenceList(data))
      .catch(() => {});
  };

  useEffect(() => {
    if (id) {
      fetchDetails();
    }
  }, [id]);

  const handleTransition = async (action: string) => {
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await apiRequest(`/escrows/${id}/transition`, {
        method: "POST",
        body: JSON.stringify({ action }),
      });
      setSuccessMsg(`Action '${action}' executed successfully.`);
      fetchDetails();
    } catch (err: any) {
      setError(err.message || `Failed to execute action ${action}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUploadEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("title", evidenceTitle);
      if (evidenceDesc) formData.append("description", evidenceDesc);
      if (evidenceFile) formData.append("file", evidenceFile);

      await apiRequest(`/escrows/${id}/evidence`, {
        method: "POST",
        body: formData,
      });

      setShowEvidenceModal(false);
      setEvidenceTitle("");
      setEvidenceDesc("");
      setEvidenceFile(null);
      setSuccessMsg("Evidence submitted successfully with SHA-256 hash.");
      fetchDetails();
    } catch (err: any) {
      setError(err.message || "Failed to upload evidence");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-500">Loading escrow details...</div>;
  }

  if (!escrow) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 text-center space-y-3">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Escrow Not Found</h2>
        <p className="text-xs text-slate-500">The requested escrow transaction does not exist or access is denied.</p>
        <Link href="/escrows" className="inline-block text-xs font-semibold text-qblue-600 hover:underline">
          Return to My Transactions
        </Link>
      </div>
    );
  }

  const isBuyer = user?.id === escrow.buyer_id;
  const isSeller = user?.id === escrow.seller_id;
  const isReviewer = user?.role === "REVIEWER" || user?.role === "ADMIN";

  const latestHistory = escrow.history?.[escrow.history.length - 1];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-navy-800 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {escrow.title}
            </h1>
            <EscrowStateBadge status={escrow.status} size="lg" />
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 font-mono">
            <span>Escrow ID: {escrow.id}</span>
            <span>Created: {new Date(escrow.created_at).toLocaleDateString()}</span>
            <span>Deadline: {new Date(escrow.deadline).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Locked Amount</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            ${(escrow.amount / 100).toFixed(2)} {escrow.currency}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Action Bar (Role & State sensitive) */}
      <div className="bg-slate-50 dark:bg-navy-900/60 p-4 rounded-xl border border-slate-200 dark:border-navy-800 flex items-center justify-between flex-wrap gap-3">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Available Workflow Actions:
        </span>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Seller actions */}
          {isSeller && escrow.status === "AWAITING_SELLER" && (
            <button
              onClick={() => handleTransition("ACCEPT")}
              disabled={actionLoading}
              className="px-4 py-2 bg-qblue-600 hover:bg-qblue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
            >
              Accept Terms & Agreement
            </button>
          )}

          {/* Buyer funding action */}
          {isBuyer && escrow.status === "AWAITING_FUNDING" && (
            <button
              onClick={() => handleTransition("FUND")}
              disabled={actionLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Deposit & Lock Funds</span>
            </button>
          )}

          {/* Seller delivery submission */}
          {isSeller && (escrow.status === "LOCKED" || escrow.status === "IN_PROGRESS") && (
            <>
              <button
                onClick={() => setShowEvidenceModal(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Submit Delivery Evidence</span>
              </button>
              <button
                onClick={() => handleTransition("SUBMIT_DELIVERY")}
                disabled={actionLoading}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
              >
                Mark Delivered
              </button>
            </>
          )}

          {/* Buyer confirmation & release */}
          {isBuyer && (escrow.status === "DELIVERY_SUBMITTED" || escrow.status === "AWAITING_BUYER_CONFIRMATION" || escrow.status === "RELEASE_PENDING") && (
            <button
              onClick={() => handleTransition("RELEASE")}
              disabled={actionLoading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Confirm & Release Funds</span>
            </button>
          )}

          {/* Dispute Action */}
          {(isBuyer || isSeller) && ["LOCKED", "IN_PROGRESS", "DELIVERY_SUBMITTED", "AWAITING_BUYER_CONFIRMATION"].includes(escrow.status) && (
            <Link
              href={`/disputes?escrow_id=${escrow.id}&open=true`}
              className="px-4 py-2 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Open Dispute</span>
            </Link>
          )}

          {/* Buyer Cancellation */}
          {isBuyer && ["CREATED", "AWAITING_SELLER", "AWAITING_FUNDING"].includes(escrow.status) && (
            <button
              onClick={() => handleTransition("CANCEL")}
              disabled={actionLoading}
              className="px-4 py-2 bg-slate-200 dark:bg-navy-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition disabled:opacity-50"
            >
              Cancel Escrow
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Terms, Counterparties, Evidence, History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Agreement Terms */}
          <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-qblue-500" />
              Contract Terms & Specifications
            </h3>
            <div className="bg-slate-50 dark:bg-navy-950 p-4 rounded-xl font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap border border-slate-200/80 dark:border-navy-800 max-h-64 overflow-y-auto">
              {escrow.terms}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Canonical Terms SHA-256 Digest:</span>
              <span className="font-bold text-slate-600 dark:text-slate-300 select-all">{escrow.terms_hash}</span>
            </div>
          </div>

          {/* Counterparties */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-sm space-y-2">
              <span className="text-xs text-slate-400 font-medium">Buyer Party</span>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-navy-800 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold uppercase">
                  {escrow.buyer_username?.charAt(0) || "B"}
                </div>
                <div>
                  <div className="font-semibold text-sm text-slate-900 dark:text-white">
                    {escrow.buyer_username}
                  </div>
                  <div className="font-mono text-[10px] text-slate-400">{escrow.buyer_id.substring(0, 16)}...</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-sm space-y-2">
              <span className="text-xs text-slate-400 font-medium">Seller Party</span>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-navy-800 text-purple-700 dark:text-purple-300 flex items-center justify-center text-xs font-bold uppercase">
                  {escrow.seller_username?.charAt(0) || "S"}
                </div>
                <div>
                  <div className="font-semibold text-sm text-slate-900 dark:text-white">
                    {escrow.seller_username}
                  </div>
                  <div className="font-mono text-[10px] text-slate-400">{escrow.seller_id.substring(0, 16)}...</div>
                </div>
              </div>
            </div>
          </div>

          {/* Evidence List */}
          <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-purple-500" />
                Submitted Delivery Evidence ({evidenceList.length})
              </h3>
              {(isBuyer || isSeller) && (
                <button
                  onClick={() => setShowEvidenceModal(true)}
                  className="text-xs text-qblue-600 dark:text-qblue-400 hover:underline font-semibold"
                >
                  + Add Evidence
                </button>
              )}
            </div>

            {evidenceList.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No delivery evidence submitted yet.</p>
            ) : (
              <div className="space-y-3">
                {evidenceList.map((ev) => (
                  <div key={ev.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-slate-900 dark:text-white">{ev.title}</span>
                      <span className="text-[11px] text-slate-400">{new Date(ev.created_at).toLocaleString()}</span>
                    </div>
                    {ev.description && <p className="text-xs text-slate-600 dark:text-slate-400">{ev.description}</p>}
                    <div className="font-mono text-[10px] text-slate-400 flex items-center gap-1">
                      <span>SHA-256 Digest:</span>
                      <span className="select-all font-semibold text-slate-700 dark:text-slate-300">{ev.content_hash}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* State History Chain Timeline */}
          <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-500" />
              State Machine Hash-Linked Audit Trail
            </h3>

            <div className="relative pl-6 border-l-2 border-slate-200 dark:border-navy-800 space-y-6">
              {escrow.history?.map((h: any, idx: number) => (
                <div key={h.id} className="relative space-y-1">
                  <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-qblue-600 border-2 border-white dark:border-navy-950"></div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-900 dark:text-white font-mono">{h.event_type}</span>
                    <span className="text-slate-400 text-[11px]">{new Date(h.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
                    <span>State: <strong className="text-slate-800 dark:text-slate-200">{h.new_state}</strong></span>
                    {h.verification_status === "VERIFIED" && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" /> ML-DSA Verified
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-[10px] text-slate-400 break-all select-all">
                    Hash: {h.transaction_data_hash}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Cryptographic Card & Blockchain Ledger Status */}
        <div className="space-y-6">
          {latestHistory && (
            <CryptoHashCard
              escrowId={escrow.id}
              stateHash={latestHistory.transaction_data_hash}
              previousHash={latestHistory.previous_state_hash}
              signature={latestHistory.signature}
              signingAlgorithm={latestHistory.signing_algorithm || "ML-DSA-65"}
              blockchainTxHash={escrow.blockchain_tx_hash}
              verificationStatus={latestHistory.verification_status}
            />
          )}

          <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-qblue-500" />
              Smart Contract Ledger Commitment
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Every state transition emits a verifiable EVM blockchain event recording buyer, seller, locked balance, and canonical terms hash.
            </p>
            {escrow.blockchain_tx_hash ? (
              <div className="pt-2">
                <span className="text-[11px] text-slate-400 block mb-1">Transaction Hash:</span>
                <Link
                  href={`/blockchain-explorer?tx=${escrow.blockchain_tx_hash}`}
                  className="font-mono text-xs text-qblue-600 dark:text-qblue-400 hover:underline break-all block"
                >
                  {escrow.blockchain_tx_hash}
                </Link>
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic">No blockchain transaction submitted yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Evidence Upload Modal */}
      {showEvidenceModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-navy-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Submit Delivery Evidence
              </h3>
              <button
                onClick={() => setShowEvidenceModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadEvidence} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Evidence Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Milestone 1 Source Code & Build Logs"
                  value={evidenceTitle}
                  onChange={(e) => setEvidenceTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description / URL Links (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Verification notes or delivery summary..."
                  value={evidenceDesc}
                  onChange={(e) => setEvidenceDesc(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Upload Evidence File (Optional, max 10MB)
                </label>
                <input
                  type="file"
                  onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-qblue-50 file:text-qblue-700 hover:file:bg-qblue-100"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  File content will be SHA-256 hashed on client and server to preserve tamper-evident integrity.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEvidenceModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-qblue-600 hover:bg-qblue-700 text-white text-xs font-semibold shadow-sm disabled:opacity-50"
                >
                  {actionLoading ? "Submitting..." : "Upload Evidence"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
