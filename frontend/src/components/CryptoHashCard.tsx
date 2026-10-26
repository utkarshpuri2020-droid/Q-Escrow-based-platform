"use client";

import React, { useState } from "react";
import { ShieldCheck, Copy, Check, Hash, Cpu, KeyRound, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Props {
  escrowId: string;
  stateHash: string;
  previousHash?: string | null;
  signature?: string | null;
  signingAlgorithm?: string | null;
  blockchainTxHash?: string | null;
  verificationStatus?: string;
}

export function CryptoHashCard({
  escrowId,
  stateHash,
  previousHash,
  signature,
  signingAlgorithm = "ML-DSA-65",
  blockchainTxHash,
  verificationStatus = "VERIFIED",
}: Props) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-navy-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-qblue-50 dark:bg-qblue-950/50 text-qblue-600 dark:text-qblue-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
              Cryptographic Commitment & Verification
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              SHA-256 Tamper-Evident State Hash & NIST FIPS 204 Signature
            </p>
          </div>
        </div>

        <Link
          href={`/crypto-verification?escrow_id=${escrowId}`}
          className="text-xs font-medium text-qblue-600 dark:text-qblue-400 hover:underline flex items-center gap-1"
        >
          <span>Deep Verify</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Current State SHA-256 Hash */}
      <div>
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
          <span className="flex items-center gap-1 font-medium">
            <Hash className="w-3.5 h-3.5 text-slate-400" />
            Current State Hash (SHA-256)
          </span>
          <button
            onClick={() => copyToClipboard(stateHash, "state")}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1"
          >
            {copiedKey === "state" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            <span>{copiedKey === "state" ? "Copied" : "Copy"}</span>
          </button>
        </div>
        <div className="font-mono text-xs bg-slate-50 dark:bg-navy-950 p-2.5 rounded-lg border border-slate-200/80 dark:border-navy-800 text-slate-700 dark:text-slate-300 break-all select-all">
          {stateHash}
        </div>
      </div>

      {/* Previous-State Hash Chain Link */}
      {previousHash && (
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span className="flex items-center gap-1 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              Linked Predecessor Hash
            </span>
            <button
              onClick={() => copyToClipboard(previousHash, "prev")}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1"
            >
              {copiedKey === "prev" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              <span>{copiedKey === "prev" ? "Copied" : "Copy"}</span>
            </button>
          </div>
          <div className="font-mono text-xs bg-slate-50 dark:bg-navy-950 p-2.5 rounded-lg border border-slate-200/80 dark:border-navy-800 text-slate-700 dark:text-slate-300 break-all select-all">
            {previousHash}
          </div>
        </div>
      )}

      {/* ML-DSA Post-Quantum Digital Signature */}
      {signature ? (
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span className="flex items-center gap-1 font-medium text-indigo-600 dark:text-indigo-400">
              <KeyRound className="w-3.5 h-3.5" />
              {signingAlgorithm} Post-Quantum Signature
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              FIPS 204 Valid
            </span>
          </div>
          <div className="font-mono text-xs bg-indigo-50/50 dark:bg-navy-950 p-2.5 rounded-lg border border-indigo-100 dark:border-navy-800 text-indigo-950 dark:text-indigo-200 break-all max-h-20 overflow-y-auto">
            {signature}
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
          <span>State committed with SHA-256 integrity check. Ready for ML-DSA authentication.</span>
        </div>
      )}

      {/* On-Chain Ledger Reference */}
      {blockchainTxHash && (
        <div className="pt-2 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400">Ledger Reference:</span>
          <Link
            href={`/blockchain-explorer?tx=${blockchainTxHash}`}
            className="font-mono text-qblue-600 dark:text-qblue-400 hover:underline flex items-center gap-1 truncate max-w-[240px]"
          >
            <span>{blockchainTxHash.substring(0, 18)}...</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
