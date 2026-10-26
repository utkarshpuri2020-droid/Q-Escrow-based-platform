import React from "react";
import { Scale, AlertTriangle, ShieldCheck } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-qblue-600 dark:text-qblue-400">
          Agreement & Guidelines
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
          Terms of Service
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Effective date: October 2026 | Version 1.0 (Q-Escrow Protocol)
        </p>
      </div>

      <div className="bg-white dark:bg-navy-900 p-8 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-sm space-y-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            1. Digital Escrow Service Description
          </h2>
          <p>
            Q-Escrow facilitates conditional digital payment custody between buyers and sellers. When an escrow agreement is funded, funds remain locked until predefined terms are satisfied, verified by delivery evidence, or resolved through dispute arbitration.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            2. Academic Prototype and Test Funds Notice
          </h2>
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200">
            <strong>Important Operational Disclosure:</strong> This platform is deployed as a functional academic and engineering prototype demonstrating NIST FIPS 204 post-quantum authentication and EVM smart contracts. Payments conducted in this environment utilize simulated test balances or local testnet Ether. No claim of real fiat banking custody or licensed financial transmitter status is made without formal production escrow licensing and regulatory integrations.
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            3. Post-Quantum Cryptographic Key Responsibilities
          </h2>
          <p>
            Users are solely responsible for generating, safeguarding, and backing up their ML-DSA private signing keys. Q-Escrow does not hold private keys and cannot recover access to transactions signed by lost private keys.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            4. Dispute Arbitration and Binding Rulings
          </h2>
          <p>
            In the event of a dispute opened by buyer or seller, both parties agree to submit to the determination of the designated dispute reviewer. Reviewer rulings (full refund, full release, or proportional split) are final and enforced programmatically via the escrow state machine and smart contract.
          </p>
        </section>
      </div>
    </div>
  );
}
