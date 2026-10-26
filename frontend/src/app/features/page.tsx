import { ShieldCheck, Cpu, Lock, CheckCircle2, AlertTriangle, Layers, Database, Eye } from "lucide-react";
import Link from "next/link";

export default function FeaturesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      {/* Header */}
      <div className="max-w-3xl space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-qblue-600 dark:text-qblue-400">
          Architecture & Cryptography
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
          Security and Features Architecture
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
          Comprehensive defense-in-depth security engineered to prevent unauthorized transaction modification, double payouts, replay attacks, and quantum cryptanalysis.
        </p>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-6 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-qblue-50 dark:bg-qblue-950/60 text-qblue-600 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            NIST FIPS 204 ML-DSA
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Module-Lattice-Based Digital Signature Algorithm (formerly Dilithium) provides quantum resistance. Supports parameter sets ML-DSA-44, ML-DSA-65 (default), and ML-DSA-87.
          </p>
        </div>

        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-6 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            SHA-256 State Hash Chain
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Every escrow state record cryptographically commits to its predecessor using SHA-256. Any historical alteration invalidates the entire subsequent hash chain.
          </p>
        </div>

        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-6 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Solidity Reentrancy Protection
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            EVM smart contract implements strict Checks-Effects-Interactions and mutex locks to prevent reentrant exploit vectors during fund release or refund.
          </p>
        </div>

        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-6 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Argon2id Authentication
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Memory-hard Argon2id algorithm guards account passwords. Includes case-insensitive unique usernames, email normalization, rate limits, and brute-force lockouts.
          </p>
        </div>

        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-6 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Append-Only Audit Trails
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Comprehensive audit events record IP addresses, user agents, outcomes, and resource IDs. Sensitive credentials and secrets are scrubbed before persistence.
          </p>
        </div>

        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-6 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 flex items-center justify-center">
            <Eye className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Offline-Aware Drafts & Sync
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Draft transactions locally when disconnected. When online, queued items synchronize with server-side signature re-validation and conflict detection.
          </p>
        </div>
      </div>

      {/* Honest Limitations Notice */}
      <div className="p-6 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-3 text-xs text-slate-700 dark:text-slate-300">
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-sm">
          <AlertTriangle className="w-4 h-4" />
          <span>Security Notice and Operational Requirements for Production</span>
        </div>
        <p className="leading-relaxed">
          <strong>1. Quantum Safety Scope:</strong> While ML-DSA provides post-quantum signature security, full system resistance requires quantum-safe TLS ciphersuites, secure hardware key custody (HSMs), and audited smart contracts.
        </p>
        <p className="leading-relaxed">
          <strong>2. Custody & Fiat Settlement:</strong> This prototype uses local EVM commitments and test funds. Production real-money deployment mandates licensed escrow banking rails, KYC/AML regulatory checks, and qualified escrow agents.
        </p>
      </div>
    </div>
  );
}
