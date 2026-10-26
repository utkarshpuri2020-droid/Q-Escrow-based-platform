import Link from "next/link";
import { ShieldCheck, Lock, Cpu, Globe } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-950 text-slate-600 dark:text-slate-400 text-sm transition-colors mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-qblue-600 flex items-center justify-center text-white">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-slate-900 dark:text-white text-base">
                Q-Escrow
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Blockchain-based digital escrow platform with NIST FIPS 204 ML-DSA post-quantum authentication and SHA-256 state chain verification.
            </p>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 dark:text-slate-500">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>FIPS 204 ML-DSA-65 Active</span>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/dashboard" className="hover:text-qblue-600 dark:hover:text-qblue-400 transition">
                  User Dashboard
                </Link>
              </li>
              <li>
                <Link href="/escrows/create" className="hover:text-qblue-600 dark:hover:text-qblue-400 transition">
                  Create Escrow
                </Link>
              </li>
              <li>
                <Link href="/escrows" className="hover:text-qblue-600 dark:hover:text-qblue-400 transition">
                  My Transactions
                </Link>
              </li>
              <li>
                <Link href="/delivery-verification" className="hover:text-qblue-600 dark:hover:text-qblue-400 transition">
                  Delivery Verification
                </Link>
              </li>
              <li>
                <Link href="/disputes" className="hover:text-qblue-600 dark:hover:text-qblue-400 transition">
                  Dispute & Arbitration
                </Link>
              </li>
            </ul>
          </div>

          {/* Cryptography & Ledger */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              Security & Verification
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/crypto-verification" className="hover:text-qblue-600 dark:hover:text-qblue-400 transition">
                  Cryptographic Dashboard
                </Link>
              </li>
              <li>
                <Link href="/blockchain-explorer" className="hover:text-qblue-600 dark:hover:text-qblue-400 transition">
                  Blockchain Explorer
                </Link>
              </li>
              <li>
                <Link href="/audit-logs" className="hover:text-qblue-600 dark:hover:text-qblue-400 transition">
                  Audit Log Viewer
                </Link>
              </li>
              <li>
                <Link href="/features" className="hover:text-qblue-600 dark:hover:text-qblue-400 transition">
                  Security Architecture
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-qblue-600 dark:hover:text-qblue-400 transition">
                  How Q-Escrow Works
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Disclaimers */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              Compliance & Legal
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/privacy" className="hover:text-qblue-600 dark:hover:text-qblue-400 transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-qblue-600 dark:hover:text-qblue-400 transition">
                  Terms of Service
                </Link>
              </li>
            </ul>
            <div className="mt-4 p-3 rounded-lg bg-slate-50 dark:bg-navy-900 border border-slate-200/60 dark:border-navy-800 text-[11px] text-slate-500 leading-normal">
              <strong>Academic Prototype Notice:</strong> Operates using test funds and local EVM commitments. Real-money production escrow requires licensed payment custody and KYC/AML regulatory integrations.
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-navy-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Q-Escrow Project. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-qblue-500" />
              NIST FIPS 204
            </span>
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-indigo-500" />
              Argon2id Auth
            </span>
            <span className="flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-emerald-500" />
              Solidity EVM
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
