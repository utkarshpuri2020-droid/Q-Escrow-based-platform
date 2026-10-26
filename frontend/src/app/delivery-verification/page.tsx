"use client";

import React, { useState } from "react";
import { sha256Client } from "@/lib/crypto";
import {
  FileCheck2,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Hash,
  ArrowRight,
  ShieldCheck,
  Search
} from "lucide-react";

export default function DeliveryVerificationPage() {
  const [targetHash, setTargetHash] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [calculatedHash, setCalculatedHash] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [matchResult, setMatchResult] = useState<"MATCH" | "MISMATCH" | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setVerifying(true);
    setMatchResult(null);

    try {
      const buffer = await selected.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      setCalculatedHash(hashHex);

      if (targetHash.trim()) {
        const isMatch = hashHex.toLowerCase() === targetHash.trim().toLowerCase();
        setMatchResult(isMatch ? "MATCH" : "MISMATCH");
      }
    } catch {
      setCalculatedHash(null);
    } finally {
      setVerifying(false);
    }
  };

  const checkManualComparison = () => {
    if (calculatedHash && targetHash.trim()) {
      const isMatch = calculatedHash.toLowerCase() === targetHash.trim().toLowerCase();
      setMatchResult(isMatch ? "MATCH" : "MISMATCH");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-qblue-600 dark:text-qblue-400">
          Delivery Audit
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Delivery Evidence Verifier
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Perform client-side independent SHA-256 verification of delivered files against the on-chain or escrow commitment hash.
        </p>
      </div>

      <div className="bg-white dark:bg-navy-900 p-8 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-sm space-y-6">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Expected Escrow Evidence Hash (SHA-256)
          </label>
          <div className="relative">
            <Hash className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Paste SHA-256 evidence hash from escrow details..."
              value={targetHash}
              onChange={(e) => {
                setTargetHash(e.target.value);
                setMatchResult(null);
              }}
              className="w-full pl-9 pr-3 py-2 font-mono text-xs rounded-lg border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-qblue-500"
            />
          </div>
        </div>

        {/* File Dropzone */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Delivered File to Verify
          </label>
          <div className="border-2 border-dashed border-slate-300 dark:border-navy-700 rounded-xl p-8 text-center space-y-3 hover:border-qblue-500 transition">
            <div className="w-12 h-12 rounded-xl bg-qblue-50 dark:bg-qblue-950/60 text-qblue-600 mx-auto flex items-center justify-center">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <label
                htmlFor="file-upload"
                className="cursor-pointer text-sm font-semibold text-qblue-600 dark:text-qblue-400 hover:underline"
              >
                Select a local deliverable file
              </label>
              <input
                id="file-upload"
                type="file"
                onChange={handleFileChange}
                className="hidden"
              />
              <p className="text-xs text-slate-400 mt-1">
                Your file is processed entirely inside your browser sandbox and is not uploaded.
              </p>
            </div>

            {file && (
              <div className="pt-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
                Selected: <span className="font-semibold">{file.name}</span> ({(file.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>
        </div>

        {/* Calculated Hash Output */}
        {calculatedHash && (
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Calculated Client SHA-256 Digest:
            </span>
            <div className="p-3 bg-slate-50 dark:bg-navy-950 rounded-lg border border-slate-200 dark:border-navy-800 font-mono text-xs text-slate-800 dark:text-slate-200 break-all select-all">
              {calculatedHash}
            </div>

            {targetHash && (
              <button
                onClick={checkManualComparison}
                className="px-4 py-2 bg-qblue-600 hover:bg-qblue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
              >
                Compare Digests
              </button>
            )}
          </div>
        )}

        {/* Match / Mismatch Banner */}
        {matchResult === "MATCH" && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-200">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            <div>
              <strong className="block font-bold text-sm">Delivery Integrity Verified!</strong>
              The delivered file bit-for-bit matches the exact cryptographic hash submitted during the delivery phase. No tampering detected.
            </div>
          </div>
        )}

        {matchResult === "MISMATCH" && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center gap-3 text-xs text-rose-800 dark:text-rose-200">
            <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0" />
            <div>
              <strong className="block font-bold text-sm">Hash Mismatch Detected!</strong>
              The computed file digest does NOT match the expected escrow commitment. The deliverable has been modified or corrupted.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
