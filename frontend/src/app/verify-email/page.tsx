"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { MailCheck, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { apiRequest } from "@/lib/api";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialToken = searchParams.get("token") || "";

  const [token, setToken] = useState(initialToken);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (tokenToVerify: string) => {
    if (!tokenToVerify.trim()) return;
    setLoading(true);
    setError(null);

    try {
      await apiRequest("/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ token: tokenToVerify.trim() }),
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Email verification failed or token expired.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialToken) {
      handleVerify(initialToken);
    }
  }, [initialToken]);

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white dark:bg-navy-900 p-8 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-sm text-center">
        <div className="w-12 h-12 rounded-xl bg-qblue-50 dark:bg-qblue-950/60 text-qblue-600 dark:text-qblue-400 flex items-center justify-center mx-auto shadow-sm">
          <MailCheck className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Email Verification
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Verify your email address to enable high-assurance escrow actions.
          </p>
        </div>

        {success ? (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
            <h3 className="font-bold text-sm text-emerald-800 dark:text-emerald-200">
              Email Verified Successfully!
            </h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-300">
              Your account has full verification status. You can now participate in digital escrow agreements.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4 text-left">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Verification Token
              </label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste verification token from email/console"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-qblue-500"
              />
            </div>

            <button
              onClick={() => handleVerify(token)}
              disabled={loading || !token.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-qblue-600 hover:bg-qblue-700 text-white font-medium text-sm shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{loading ? "Verifying..." : "Verify Email"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-xs text-slate-400">Loading verification...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
