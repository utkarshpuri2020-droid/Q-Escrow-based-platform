"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "./ThemeToggle";
import {
  ShieldCheck,
  Bell,
  User,
  LogOut,
  Settings,
  PlusCircle,
  FileText,
  Activity,
  Layers,
  HelpCircle,
  Cpu,
  Menu,
  X
} from "lucide-react";
import { apiRequest } from "@/lib/api";

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      apiRequest("/notifications/")
        .then((data) => setUnreadCount(data.unread_count || 0))
        .catch(() => {});
    }
  }, [user, pathname]);

  const navLinks = user
    ? [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Transactions", href: "/escrows" },
        { label: "New Escrow", href: "/escrows/create", highlight: true },
        { label: "Disputes", href: "/disputes" },
        { label: "PQC Verification", href: "/crypto-verification" },
        { label: "Blockchain", href: "/blockchain-explorer" },
        ...(user.role === "ADMIN" ? [{ label: "Admin", href: "/admin" }] : []),
      ]
    : [
        { label: "Features", href: "/features" },
        { label: "How It Works", href: "/how-it-works" },
        { label: "Security & PQC", href: "/crypto-verification" },
        { label: "Blockchain", href: "/blockchain-explorer" },
      ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-navy-800 bg-white/90 dark:bg-navy-950/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-navy-800 via-qblue-700 to-qblue-500 flex items-center justify-center text-white shadow-sm group-hover:shadow transition">
              <ShieldCheck className="w-5 h-5 text-qblue-200" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
                Q<span className="text-qblue-600 dark:text-qblue-400">-Escrow</span>
              </span>
              <span className="block text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">
                Post-Quantum Secured
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    link.highlight
                      ? "bg-qblue-600 hover:bg-qblue-700 text-white shadow-sm"
                      : active
                      ? "text-qblue-600 dark:text-qblue-400 bg-qblue-50/80 dark:bg-navy-800"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800/60"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons & Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />

            {user ? (
              <>
                {/* Notification Bell */}
                <Link
                  href="/notifications"
                  aria-label="View notifications"
                  className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800 transition"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>

                {/* Profile Link */}
                <Link
                  href="/settings"
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-navy-700 hover:border-slate-300 dark:hover:border-navy-600 transition"
                >
                  <div className="w-6 h-6 rounded-full bg-qblue-100 dark:bg-navy-800 text-qblue-700 dark:text-qblue-300 flex items-center justify-center text-xs font-semibold uppercase">
                    {user.username.charAt(0)}
                  </div>
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200 max-w-[100px] truncate">
                    {user.username}
                  </span>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-400">
                    {user.role}
                  </span>
                </Link>

                {/* Logout Button */}
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-2 rounded-lg text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-1.5 text-sm font-medium rounded-lg bg-qblue-600 hover:bg-qblue-700 text-white shadow-sm transition"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-950 px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800"
            >
              {link.label}
            </Link>
          ))}
          {user && (
            <Link
              href="/settings"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800"
            >
              Settings & Keys
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
