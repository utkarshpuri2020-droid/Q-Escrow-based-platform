"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { apiRequest } from "@/lib/api";
import { sha256Client } from "@/lib/crypto";
import { OfflineStore } from "@/lib/offline-store";
import {
  ShieldCheck,
  Cpu,
  ArrowRight,
  AlertCircle,
  Hash,
  CheckCircle2,
  Lock,
  WifiOff
} from "lucide-react";

export default function CreateEscrowPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    seller_username: "",
    title: "",
    description: "",
    terms: "",
    amount_dollars: "",
    currency: "USD",
    duration_days: "7",
  });

  const [termsHash, setTermsHash] = useState<string>("");
  const [keys, setKeys] = useState<any[]>([]);
  const [selectedKeyId, setSelectedKeyId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offlineSaved, setOfflineSaved] = useState(false);

  // Compute terms SHA-256 live as user types
  useEffect(() => {
    if (formData.terms.trim()) {
      sha256Client(formData.terms.trim()).then(setTermsHash);
    } else {
      setTermsHash("");
    }
  }, [formData.terms]);

  // Fetch active user keys for signing option
  useEffect(() => {
    if (user) {
      apiRequest("/crypto/keys")
        .then((data) => {
          setKeys(data);
          const activeKey = data.find((k: any) => k.status === "ACTIVE");
          if (activeKey) setSelectedKeyId(activeKey.id);
        })
        .catch(() => {});
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const amountCents = Math.round(parseFloat(formData.amount_dollars) * 100);
    if (isNaN(amountCents) || amountCents <= 0) {
      setError("Please enter a valid positive payment amount");
      setLoading(false);
      return;
    }

    const payload = {
      seller_username: formData.seller_username.trim(),
      title: formData.title.trim(),
      description: formData.description.trim(),
      terms: formData.terms.trim(),
      amount: amountCents,
      currency: formData.currency,
      duration_days: parseInt(formData.duration_days, 10),
      signing_key_id: selectedKeyId || undefined,
    };

    // If browser is offline, queue into OfflineStore
    if (!navigator.onLine) {
      OfflineStore.saveDraft({
        action_type: "CREATE_ESCROW",
        payload,
        signing_key_id: selectedKeyId,
      });
      setOfflineSaved(true);
      setLoading(false);
      return;
    }

    try {
      const res = await apiRequest("/escrows/", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      router.push(`/escrows/${res.id}`);
    } catch (err: any) {
      if (err.data?.isNetworkError) {
        OfflineStore.saveDraft({
          action_type: "CREATE_ESCROW",
          payload,
          signing_key_id: selectedKeyId,
        });
        setOfflineSaved(true);
      } else {
        setError(err.message || "Failed to create escrow agreement");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-qblue-600 dark:text-qblue-400">
          New Agreement
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Create Escrow Agreement
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Lock buyer funds under smart contract terms, verifiable via SHA-256 state commitments and post-quantum signatures.
        </p>
      </div>

      {offlineSaved && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-bold text-sm">
            <WifiOff className="w-4 h-4 text-amber-600" />
            <span>Escrow Agreement Drafted in Local Offline Storage</span>
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Your draft has been securely stored locally. When network connectivity resumes, you can synchronize it directly from the offline banner.
          </p>
          <Link
            href="/dashboard"
            className="inline-block mt-2 text-xs font-semibold text-amber-800 dark:text-amber-200 underline"
          >
            Return to Dashboard
          </Link>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-navy-900 p-8 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-sm space-y-6">
        {/* Recipient */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Seller Username
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Alice_Seller"
            value={formData.seller_username}
            onChange={(e) => setFormData({ ...formData, seller_username: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-qblue-500"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            The counterparty that must accept terms and provide delivery evidence before funds release.
          </p>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Agreement Title
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Full-Stack Web Development & Audit Delivery"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-qblue-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Description & Context (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="Summary of deliverables, milestones, and context..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-qblue-500"
          />
        </div>

        {/* Detailed Terms */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Contract Terms & Release Conditions
            </label>
            {termsHash && (
              <span className="font-mono text-[10px] text-qblue-600 dark:text-qblue-400 flex items-center gap-1">
                <Hash className="w-3 h-3" />
                SHA-256: {termsHash.substring(0, 12)}...
              </span>
            )}
          </div>
          <textarea
            rows={5}
            required
            placeholder="Specify release conditions, acceptance criteria, milestone requirements, and dispute timeline..."
            value={formData.terms}
            onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
            className="w-full font-mono text-xs px-3 py-2.5 rounded-lg border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-qblue-500"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            These terms are hashed into the initial canonical commitment. Any alteration after agreement will violate cryptographic verification.
          </p>
        </div>

        {/* Amount & Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Payment Amount
            </label>
            <input
              type="number"
              step="0.01"
              required
              min="0.01"
              placeholder="e.g. 500.00"
              value={formData.amount_dollars}
              onChange={(e) => setFormData({ ...formData, amount_dollars: e.target.value })}
              className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-qblue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Currency
            </label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-qblue-500"
            >
              <option value="USD">USD (United States Dollar)</option>
              <option value="EUR">EUR (Euro)</option>
              <option value="ETH">ETH (Ethereum / Wei)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Duration (Days)
            </label>
            <input
              type="number"
              required
              min="1"
              max="90"
              value={formData.duration_days}
              onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-qblue-500"
            />
          </div>
        </div>

        {/* Cryptographic Key Selection */}
        {keys.length > 0 && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 space-y-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-qblue-500" />
              Sign with Post-Quantum ML-DSA Key (Optional)
            </span>
            <select
              value={selectedKeyId}
              onChange={(e) => setSelectedKeyId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-900 text-slate-900 dark:text-white"
            >
              <option value="">No signature (SHA-256 commitment only)</option>
              {keys.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.label} ({k.algorithm} - {k.key_fingerprint.substring(0, 10)}...)
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl bg-qblue-600 hover:bg-qblue-700 text-white font-semibold text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <span>{loading ? "Generating Agreement..." : "Initiate Escrow Agreement"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
