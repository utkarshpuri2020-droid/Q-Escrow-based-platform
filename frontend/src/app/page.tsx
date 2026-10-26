import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Cpu,
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  RefreshCw,
  Scale,
  Zap,
  Layers,
  ChevronRight
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-navy-900 via-navy-950 to-slate-950 text-white pt-20 pb-28 px-4 sm:px-6 lg:px-8 border-b border-navy-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-qblue-600/10 via-transparent to-transparent pointer-events-none"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-navy-800/80 border border-qblue-500/30 text-xs font-semibold text-qblue-300 mb-2 shadow-inner">
            <Cpu className="w-3.5 h-3.5 text-qblue-400" />
            <span>NIST FIPS 204 ML-DSA Standardized Digital Signatures</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight sm:leading-none">
            Trustless Digital Escrow with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-qblue-400 via-cyan-300 to-teal-300">
              Post-Quantum Authentication
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            Safeguard high-value digital agreements between untrusted counterparties.
            Funds are locked until terms are fulfilled, verified with cryptographic state chains and quantum-resistant signatures.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/escrows/create"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-qblue-600 hover:bg-qblue-500 text-white font-semibold text-sm shadow-lg shadow-qblue-600/30 flex items-center justify-center gap-2 transition"
            >
              <span>Create Escrow Agreement</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/crypto-verification"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-navy-800 hover:bg-navy-700 border border-navy-700 text-slate-200 font-semibold text-sm flex items-center justify-center gap-2 transition"
            >
              <span>Verify Cryptographic State</span>
            </Link>
          </div>

          {/* Quick Metrics Bar */}
          <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-xl bg-navy-900/60 border border-navy-800/80">
              <span className="text-xs text-slate-400 block">Digital Signature</span>
              <span className="text-lg font-bold text-white font-mono">ML-DSA-65</span>
              <span className="text-[11px] text-teal-400 block mt-0.5">NIST FIPS 204 Standard</span>
            </div>
            <div className="p-4 rounded-xl bg-navy-900/60 border border-navy-800/80">
              <span className="text-xs text-slate-400 block">State Hash Chain</span>
              <span className="text-lg font-bold text-white font-mono">SHA-256</span>
              <span className="text-[11px] text-qblue-400 block mt-0.5">Tamper-Evident Ledger</span>
            </div>
            <div className="p-4 rounded-xl bg-navy-900/60 border border-navy-800/80">
              <span className="text-xs text-slate-400 block">Smart Contract</span>
              <span className="text-lg font-bold text-white font-mono">Solidity 0.8.20</span>
              <span className="text-[11px] text-indigo-400 block mt-0.5">Reentrancy Protected</span>
            </div>
            <div className="p-4 rounded-xl bg-navy-900/60 border border-navy-800/80">
              <span className="text-xs text-slate-400 block">Password Security</span>
              <span className="text-lg font-bold text-white font-mono">Argon2id</span>
              <span className="text-[11px] text-purple-400 block mt-0.5">OWASP Recommended</span>
            </div>
          </div>
        </div>
      </section>

      {/* Core Architectural Pillars */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <h2 className="text-xs uppercase font-bold tracking-wider text-qblue-600 dark:text-qblue-400">
            Defense-In-Depth Security
          </h2>
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
            Engineered for Integrity and Quantum Resistance
          </h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Q-Escrow integrates three complementary cryptographic foundations to guarantee payment safety, author non-repudiation, and auditability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Pillar 1 */}
          <div className="bg-white dark:bg-navy-900 p-8 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-sm hover:shadow-md transition space-y-4">
            <div className="w-12 h-12 rounded-xl bg-qblue-50 dark:bg-qblue-950/60 text-qblue-600 dark:text-qblue-400 flex items-center justify-center">
              <Cpu className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">
              NIST FIPS 204 ML-DSA
            </h4>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              Standardized post-quantum module-lattice digital signatures (ML-DSA-44, 65, 87) bound to transaction parameters prevent forgery even against Shor’s algorithm on quantum computers.
            </p>
            <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-2 pt-2 border-t border-slate-100 dark:border-navy-800">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Action-bound non-reusable signatures
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Public key fingerprint registration
              </li>
            </ul>
          </div>

          {/* Pillar 2 */}
          <div className="bg-white dark:bg-navy-900 p-8 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-sm hover:shadow-md transition space-y-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">
              SHA-256 State Hash Chains
            </h4>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              Every transition links back to the prior state hash, establishing an immutable cryptographic hash chain that immediately exposes unauthorized state tampering.
            </p>
            <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-2 pt-2 border-t border-slate-100 dark:border-navy-800">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Deterministic canonical serialization
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Evidence content digest hashing
              </li>
            </ul>
          </div>

          {/* Pillar 3 */}
          <div className="bg-white dark:bg-navy-900 p-8 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-sm hover:shadow-md transition space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">
              Solidity Escrow Contracts
            </h4>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              Checks-effects-interactions and OpenZeppelin-standard reentrancy mutex guards enforce conditional payout, deadlines, and multi-party arbitration on-chain.
            </p>
            <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-2 pt-2 border-t border-slate-100 dark:border-navy-800">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Double-release & double-refund protection
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Arbiter split and refund rulings
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* State Machine Overview */}
      <section className="py-16 bg-slate-100/60 dark:bg-navy-900/40 border-y border-slate-200 dark:border-navy-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              Predictable Escrow Lifecycle
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Transitions are strictly enforced by the backend state machine and smart contract.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
            <div className="p-4 rounded-xl bg-white dark:bg-navy-950 border border-slate-200 dark:border-navy-800">
              <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-navy-800 text-xs font-bold flex items-center justify-center mx-auto mb-2 text-slate-700 dark:text-slate-300">1</span>
              <span className="font-semibold text-xs block text-slate-900 dark:text-white">Created</span>
              <span className="text-[11px] text-slate-500 block mt-1">Buyer initiates</span>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-navy-950 border border-slate-200 dark:border-navy-800">
              <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950 text-xs font-bold flex items-center justify-center mx-auto mb-2 text-amber-700 dark:text-amber-400">2</span>
              <span className="font-semibold text-xs block text-slate-900 dark:text-white">Accepted</span>
              <span className="text-[11px] text-slate-500 block mt-1">Seller agrees</span>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-navy-950 border border-slate-200 dark:border-navy-800">
              <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-xs font-bold flex items-center justify-center mx-auto mb-2 text-blue-700 dark:text-blue-400">3</span>
              <span className="font-semibold text-xs block text-slate-900 dark:text-white">Locked</span>
              <span className="text-[11px] text-slate-500 block mt-1">Funds deposited</span>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-navy-950 border border-slate-200 dark:border-navy-800">
              <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-950 text-xs font-bold flex items-center justify-center mx-auto mb-2 text-purple-700 dark:text-purple-400">4</span>
              <span className="font-semibold text-xs block text-slate-900 dark:text-white">Delivered</span>
              <span className="text-[11px] text-slate-500 block mt-1">Proof hashed</span>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-navy-950 border border-slate-200 dark:border-navy-800">
              <span className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-950 text-xs font-bold flex items-center justify-center mx-auto mb-2 text-teal-700 dark:text-teal-400">5</span>
              <span className="font-semibold text-xs block text-slate-900 dark:text-white">Confirmed</span>
              <span className="text-[11px] text-slate-500 block mt-1">Buyer checks</span>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-navy-950 border border-slate-200 dark:border-navy-800">
              <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-xs font-bold flex items-center justify-center mx-auto mb-2 text-emerald-700 dark:text-emerald-400">6</span>
              <span className="font-semibold text-xs block text-slate-900 dark:text-white">Released</span>
              <span className="text-[11px] text-slate-500 block mt-1">Funds disbursed</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
