"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import {
  ShieldCheck,
  Cpu,
  Hash,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  ExternalLink,
  Layers,
  Search
} from "lucide-react";

function CryptoVerificationContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("escrow_id") || "";

  const [escrowId, setEscrowId] = useState(initialId);
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (idToVerify: string) => {
    if (!idToVerify.trim()) return;
    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const data = await apiRequest("/crypto/verify-transaction", {
        method: "POST",
        body: JSON.stringify({ escrow_id: idToVerify.trim() }),
      });
      setReport(data);
    } catch (err: any) {
      setError(err.message || "Failed to execute cryptographic verification");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialId) {
      handleVerify(initialId);
    }
  }, [initialId]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-qblue-600 dark:text-qblue-400">
          Independent Trust & Integrity Engine
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mt-1">
          <Cpu className="w-7 h-7 text-qblue-600 dark:text-qblue-400" />
          <span>Cryptographic Verification Dashboard</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
          Verify escrow integrity through dual cryptographic validation: SHA-256 state chain hash matching and NIST FIPS 204 ML-DSA post-quantum digital signature verification.
        </p>
      </div>

      {/* Escrow Search Input Bar */}
      <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-sm space-y-3">
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Escrow Transaction UUID to Verify
        </label>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Paste Escrow UUID (e.g. 550e8400-e29b-41d4-a716-446655440000)"
              value={escrowId}
              onChange={(e) => setEscrowId(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-qblue-500"
            />
          </div>
          <button
            onClick={() => handleVerify(escrowId)}
            disabled={loading || !escrowId.trim()}
            className="w-full sm:w-auto px-6 py-2.5 bg-qblue-600 hover:bg-qblue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>{loading ? "Verifying..." : "Verify Transaction"}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Verification Report Display */}
      {report && (
        <div className="space-y-6">
          {/* Summary Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              className={`p-5 rounded-2xl border ${
                report.overall_integrity_verified
                  ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 text-emerald-900 dark:text-emerald-100"
                  : "bg-rose-50 dark:bg-rose-950/30 border-rose-200 text-rose-900 dark:text-rose-100"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {report.overall_integrity_verified ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                )}
                <span className="font-bold text-sm">SHA-256 Hash Integrity</span>
              </div>
              <p className="text-xs leading-relaxed opacity-90">
                {report.overall_integrity_verified
                  ? "All state transitions bit-for-bit match the canonical hash chain. No tampering detected."
                  : "Hash mismatch detected! Transaction history has been altered."}
              </p>
            </div>

            <div
              className={`p-5 rounded-2xl border ${
                report.signatures_verified
                  ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 text-emerald-900 dark:text-emerald-100"
                  : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 text-amber-900 dark:text-amber-100"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <span className="font-bold text-sm">Post-Quantum Signatures</span>
              </div>
              <p className="text-xs leading-relaxed opacity-90">
                {report.signatures_verified
                  ? "NIST FIPS 204 ML-DSA digital signatures successfully verified against registered public keys."
                  : "Transactions committed via SHA-256 hashes without ML-DSA digital signatures or pending."}
              </p>
            </div>

            <div className="p-5 rounded-2xl border bg-slate-50 dark:bg-navy-900 border-slate-200 dark:border-navy-800 text-slate-800 dark:text-slate-200">
              <div className="flex items-center gap-2 mb-1">
                <Cpu className="w-5 h-5 text-qblue-600" />
                <span className="font-bold text-sm">Blockchain Ledger Status</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-500">
                {report.blockchain_status?.mode === "REAL_ETHEREUM_NODE"
                  ? "Verified live on local EVM node at block " + report.blockchain_status?.latest_block
                  : "Development commitment mode: Verified via cryptographic receipt."}
              </p>
            </div>
          </div>

          {/* Detailed State Step Verification Trail */}
          <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-sm overflow-hidden space-y-4 p-6">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-qblue-500" />
              <span>Step-by-Step Transition Integrity Breakdown ({report.items.length} events)</span>
            </h3>

            <div className="space-y-4">
              {report.items.map((item: any, idx: number) => (
                <div
                  key={item.history_id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 space-y-3"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-qblue-600 text-white font-bold text-[10px] flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <strong className="text-xs font-mono text-slate-900 dark:text-white">
                        {item.event_type} → {item.state}
                      </strong>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.hash_matched && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> SHA-256 Valid
                        </span>
                      )}
                      {item.chain_link_valid && item.previous_hash && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                          Chain Linked
                        </span>
                      )}
                      {item.signature_verified && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> {item.signature_algorithm} Valid
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="p-2.5 rounded bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 break-all select-all">
                      <span className="text-slate-400 block text-[10px]">Computed State Hash:</span>
                      {item.calculated_hash}
                    </div>
                    <div className="p-2.5 rounded bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 break-all select-all">
                      <span className="text-slate-400 block text-[10px]">Previous State Hash:</span>
                      {item.previous_hash || "Genesis (None)"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CryptoVerificationPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-xs text-slate-400">Loading verification dashboard...</div>}>
      <CryptoVerificationContent />
    </Suspense>
  );
}
