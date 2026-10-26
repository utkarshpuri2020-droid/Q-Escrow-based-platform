import Link from "next/link";
import { FileQuestion, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-navy-900 p-8 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-navy-800 text-slate-500 mx-auto flex items-center justify-center">
          <FileQuestion className="w-6 h-6" />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white font-mono">404</h1>
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
          Page Not Found
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          The requested escrow transaction, page, or cryptographic record could not be found.
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
