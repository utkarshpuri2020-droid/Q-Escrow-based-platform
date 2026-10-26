import React from "react";
import { ShieldCheck, Lock, Eye, Database } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-qblue-600 dark:text-qblue-400">
          Legal & Transparency
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
          Privacy Policy
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Effective date: October 2026 | Version 1.0 (Q-Escrow Protocol)
        </p>
      </div>

      <div className="bg-white dark:bg-navy-900 p-8 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-sm space-y-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            1. Cryptographic Data Minimization Principle
          </h2>
          <p>
            Q-Escrow operates under strict data minimization. Public blockchains store only cryptographic commitments (SHA-256 state hashes and public keys). Private keys, passwords, session cookies, and confidential evidence documents are never committed to public ledgers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            2. Personal Information Collected
          </h2>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>Account Data: Normalized username, normalized email address, Argon2id password hash.</li>
            <li>Security Data: TOTP MFA registration metadata, hashed backup recovery codes, session token hashes.</li>
            <li>Cryptographic Public Keys: NIST FIPS 204 ML-DSA public keys and calculated SHA-256 key fingerprints.</li>
            <li>Transactional Evidence: Delivery proofs, descriptions, and file SHA-256 hashes submitted during fulfillment or dispute arbitration.</li>
            <li>Audit Logging: Actor ID, IP address, user-agent string, and action outcome.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            3. Password and Key Security Guarantee
          </h2>
          <p>
            Passwords are never stored in plaintext or with reversible encryption. They are hashed using the memory-hard Argon2id algorithm. Secret cryptographic keys for ML-DSA signing are maintained under client-side custody and are never logged or stored on the backend server.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            4. Access Control and Evidence Retention
          </h2>
          <p>
            Transaction evidence is strictly access-controlled and visible only to the participating buyer, seller, assigned dispute arbitrator, and authorized administrators. Evidence files are protected with strict size and extension filters and encrypted at rest in production environments.
          </p>
        </section>
      </div>
    </div>
  );
}
