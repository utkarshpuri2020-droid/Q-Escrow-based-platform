import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck, Lock, Upload, Scale, KeyRound, Clock } from "lucide-react";

export default function HowItWorksPage() {
  const steps = [
    {
      step: "01",
      title: "Initiate Escrow Agreement",
      description: "Buyer defines title, detailed terms, deadline, and payment amount. The system deterministically canonicalizes the terms and generates an initial SHA-256 commitment hash.",
      icon: KeyRound,
      badge: "CREATED",
    },
    {
      step: "02",
      title: "Seller Terms Acceptance",
      description: "Seller inspects the proposed terms. To proceed, the seller signs their acceptance using their NIST FIPS 204 ML-DSA post-quantum key, moving status to Awaiting Funding.",
      icon: CheckCircle2,
      badge: "AWAITING_FUNDING",
    },
    {
      step: "03",
      title: "Locking Escrow Funds",
      description: "Buyer deposits payment into the digital escrow. Once confirmed on the EVM smart contract, the status locks to LOCKED. Funds cannot be withdrawn unilaterally.",
      icon: Lock,
      badge: "LOCKED",
    },
    {
      step: "04",
      title: "Delivery & Evidence Submission",
      description: "Seller performs fulfillment and submits delivery evidence. Files are hashed with SHA-256 to create verifiable proof of delivery, transitioning the state to DELIVERY_SUBMITTED.",
      icon: Upload,
      badge: "DELIVERY_SUBMITTED",
    },
    {
      step: "05",
      title: "Buyer Review & Release",
      description: "Buyer validates the delivery against the original agreed terms. Upon confirmation, buyer triggers release, paying out funds to the seller.",
      icon: ShieldCheck,
      badge: "RELEASED",
    },
    {
      step: "06",
      title: "Dispute Arbitration (If Needed)",
      description: "If parties disagree, either party can open a dispute. An appointed arbiter inspects evidence, reviews ML-DSA signatures, and renders a binding release, refund, or split ruling.",
      icon: Scale,
      badge: "DISPUTED",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      <div className="max-w-3xl space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-qblue-600 dark:text-qblue-400">
          User Guide & Lifecycle
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
          How Q-Escrow Works
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
          Learn how Q-Escrow protects both buyers and sellers across each phase of an escrow agreement, using automated state transitions, blockchain verification, and post-quantum digital signatures.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.step}
              className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-6 shadow-sm space-y-4 relative"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-slate-200 dark:text-navy-800 font-mono">
                  {s.step}
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-navy-700">
                  {s.badge}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-qblue-50 dark:bg-qblue-950/60 text-qblue-600 dark:text-qblue-400 flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {s.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {s.description}
              </p>
            </div>
          );
        })}
      </div>

      <div className="text-center pt-8">
        <Link
          href="/escrows/create"
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-qblue-600 hover:bg-qblue-500 text-white font-semibold text-sm shadow-md transition"
        >
          <span>Start a New Escrow Agreement</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
