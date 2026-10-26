import Link from "next/link";
import { Clock, ArrowLeft } from "lucide-react";

export default function RateLimitedPage() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-navy-900 p-8 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 mx-auto flex items-center justify-center">
          <Clock className="w-6 h-6" />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white font-mono">429</h1>
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
          Rate Limit Exceeded
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Too many requests have been made from your client IP address. Please wait a moment for the sliding rate-limit window to reset before retrying.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-qblue-600 hover:bg-qblue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return Home</span>
        </Link>
      </div>
    </div>
  );
}
