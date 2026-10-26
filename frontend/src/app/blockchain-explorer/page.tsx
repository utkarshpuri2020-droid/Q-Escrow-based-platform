"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { apiRequest } from "@/lib/api";
import {
  Globe,
  Search,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Layers,
  ArrowRight,
  ShieldCheck,
  Server
} from "lucide-react";

function BlockchainExplorerContent() {
  const searchParams = useSearchParams();
  const initialTx = searchParams.get("tx") || "";

  const [txHash, setTxHash] = useState(initialTx);
  const [nodeStatus, setNodeStatus] = useState<any | null>(null);
  const [txData, setTxData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest("/blockchain/status")
      .then(setNodeStatus)
      .catch(() => {});
  }, []);

  const handleLookup = async (hash: string) => {
    if (!hash.trim()) return;
    setLoading(true);
    setError(null);
    setTxData(null);

    try {
      const data = await apiRequest(`/blockchain/transactions/${hash.trim()}`);
      setTxData(data);
    } catch (err: any) {
      setError(err.message || "Transaction lookup failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialTx) {
      handleLookup(initialTx);
    }
  }, [initialTx]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          Decentralized Settlement
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mt-1">
          <Globe className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          <span>Blockchain Transaction Explorer</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
          Inspect on-chain escrow commitments, smart contract events, and development ledger confirmations.
        </p>
      </div>

      {/* Node Status Banner */}
      {nodeStatus && (
        <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 dark:border-navy-800 pb-3">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Network & Node Status
              </h3>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                nodeStatus.connected
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              {nodeStatus.mode}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3 bg-slate-50 dark:bg-navy-950 rounded-xl">
              <span className="text-slate-400 block text-[10px]">Chain ID</span>
              <strong className="text-slate-900 dark:text-white text-sm">{nodeStatus.chain_id}</strong>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-navy-950 rounded-xl">
              <span className="text-slate-400 block text-[10px]">Latest Block</span>
              <strong className="text-slate-900 dark:text-white text-sm">{nodeStatus.latest_block}</strong>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-navy-950 rounded-xl">
              <span className="text-slate-400 block text-[10px]">Contract Address</span>
              <span className="text-slate-900 dark:text-white text-[11px] truncate block select-all">
                {nodeStatus.contract_address}
              </span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-navy-950 rounded-xl">
              <span className="text-slate-400 block text-[10px]">RPC Provider</span>
              <span className="text-slate-900 dark:text-white text-[11px] truncate block">
                {nodeStatus.rpc_url}
              </span>
            </div>
          </div>

          {nodeStatus.note && (
            <p className="text-[11px] text-slate-500 italic">
              {nodeStatus.note}
            </p>
          )}
        </div>
      )}

      {/* Transaction Search Bar */}
      <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-sm space-y-3">
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Lookup Transaction Hash
        </label>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Paste 0x... transaction hash"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-qblue-500"
            />
          </div>
          <button
            onClick={() => handleLookup(txHash)}
            disabled={loading || !txHash.trim()}
            className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span>{loading ? "Inspecting..." : "Inspect Hash"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Transaction Details Display */}
      {txData && (
        <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-navy-800 pb-3">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Transaction Details
            </h3>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                txData.is_simulated
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}
            >
              {txData.is_simulated ? "Simulated Commitment" : "On-Chain Confirmed"}
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Transaction Hash:</span>
              <div className="p-2.5 bg-slate-50 dark:bg-navy-950 rounded border border-slate-200 dark:border-navy-800 break-all select-all text-slate-800 dark:text-slate-200">
                {txData.transaction_hash}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-navy-950 rounded border border-slate-200 dark:border-navy-800">
                <span className="text-slate-400 block text-[10px]">Block Number</span>
                <strong className="text-slate-900 dark:text-white text-sm">{txData.block_number}</strong>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-navy-950 rounded border border-slate-200 dark:border-navy-800">
                <span className="text-slate-400 block text-[10px]">Status</span>
                <strong className="text-emerald-600 dark:text-emerald-400 text-sm">{txData.status}</strong>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-navy-950 rounded border border-slate-200 dark:border-navy-800">
                <span className="text-slate-400 block text-[10px]">Confirmations</span>
                <strong className="text-slate-900 dark:text-white text-sm">{txData.confirmations || 1}</strong>
              </div>
            </div>

            {txData.note && (
              <p className="text-[11px] text-slate-500 italic pt-1">
                {txData.note}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function BlockchainExplorerPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-xs text-slate-400">Loading blockchain explorer...</div>}>
      <BlockchainExplorerContent />
    </Suspense>
  );
}
