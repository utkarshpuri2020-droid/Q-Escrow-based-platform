import React from "react";
import { ShieldCheck, Clock, Lock, CheckCircle2, AlertTriangle, XCircle, RotateCcw } from "lucide-react";

interface Props {
  status: string;
  size?: "sm" | "md" | "lg";
}

export function EscrowStateBadge({ status, size = "md" }: Props) {
  const configs: Record<string, { label: string; bg: string; text: string; border: string; icon: any }> = {
    CREATED: { label: "Created", bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-700 dark:text-slate-300", border: "border-slate-300 dark:border-slate-700", icon: Clock },
    AWAITING_SELLER: { label: "Awaiting Seller", bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-400", border: "border-amber-200 dark:border-amber-800", icon: Clock },
    AWAITING_FUNDING: { label: "Awaiting Funding", bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-700 dark:text-blue-400", border: "border-blue-200 dark:border-blue-800", icon: Clock },
    LOCKED: { label: "Funds Locked", bg: "bg-indigo-50 dark:bg-indigo-950/40", text: "text-indigo-700 dark:text-indigo-400", border: "border-indigo-200 dark:border-indigo-800", icon: Lock },
    IN_PROGRESS: { label: "In Progress", bg: "bg-cyan-50 dark:bg-cyan-950/40", text: "text-cyan-700 dark:text-cyan-400", border: "border-cyan-200 dark:border-cyan-800", icon: Clock },
    DELIVERY_SUBMITTED: { label: "Delivered", bg: "bg-purple-50 dark:bg-purple-950/40", text: "text-purple-700 dark:text-purple-400", border: "border-purple-200 dark:border-purple-800", icon: CheckCircle2 },
    AWAITING_BUYER_CONFIRMATION: { label: "Buyer Review", bg: "bg-sky-50 dark:bg-sky-950/40", text: "text-sky-700 dark:text-sky-400", border: "border-sky-200 dark:border-sky-800", icon: Clock },
    RELEASE_PENDING: { label: "Release Pending", bg: "bg-teal-50 dark:bg-teal-950/40", text: "text-teal-700 dark:text-teal-400", border: "border-teal-200 dark:border-teal-800", icon: Clock },
    RELEASED: { label: "Released", bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-800", icon: ShieldCheck },
    REFUND_PENDING: { label: "Refund Pending", bg: "bg-orange-50 dark:bg-orange-950/40", text: "text-orange-700 dark:text-orange-400", border: "border-orange-200 dark:border-orange-800", icon: RotateCcw },
    REFUNDED: { label: "Refunded", bg: "bg-rose-50 dark:bg-rose-950/40", text: "text-rose-700 dark:text-rose-400", border: "border-rose-200 dark:border-rose-800", icon: RotateCcw },
    DISPUTED: { label: "Disputed", bg: "bg-red-50 dark:bg-red-950/40", text: "text-red-700 dark:text-red-400", border: "border-red-200 dark:border-red-800", icon: AlertTriangle },
    EXPIRED: { label: "Expired", bg: "bg-zinc-100 dark:bg-zinc-800", text: "text-zinc-700 dark:text-zinc-300", border: "border-zinc-300 dark:border-zinc-700", icon: Clock },
    CANCELLED: { label: "Cancelled", bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400", border: "border-gray-200 dark:border-gray-700", icon: XCircle },
  };

  const cfg = configs[status.toUpperCase()] || {
    label: status,
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-300",
    icon: Clock,
  };

  const Icon = cfg.icon;
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border} ${sizeClasses}`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{cfg.label}</span>
    </span>
  );
}
