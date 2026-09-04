"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth, UserRole } from "../lib/auth-context";
import { useNoticesStore } from "../lib/notices-store";

interface HeaderProps {
  onOpenInbox?: () => void;
  onToggleMobileMenu?: () => void;
}

export default function Header({ onOpenInbox, onToggleMobileMenu }: HeaderProps) {
  const { user, logout } = useAuth();
  const { notices } = useNoticesStore();
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Compute unread/pending notices count for the current role
  const unreadCount = React.useMemo(() => {
    if (!user) return 0;
    if (user.role === "inspector") {
      return notices.filter((n) => n.status === "NOTICE_ISSUED").length;
    }
    if (user.role === "company") {
      return notices.filter(
        (n) =>
          n.status === "NOTICE_ISSUED" &&
          (n.company_id.includes(user.user_id) ||
            user.entityName?.toLowerCase().includes(n.brand_name.toLowerCase()) ||
            user.user_id.includes("amul"))
      ).length;
    }
    return notices.length;
  }, [user, notices]);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 px-3 py-2.5 shadow-xs backdrop-blur-xl sm:px-6 sm:py-3">
      {/* LEFT: Mobile Hamburger & Live Status Indicator */}
      <div className="flex items-center gap-2 sm:gap-3">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            aria-label="Open navigation menu"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95 md:hidden"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        <div className="flex items-center gap-1.5 sm:gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600"></span>
          </span>
          <span className="text-[9px] sm:text-[10px] font-bold tracking-wider text-emerald-800">
            METRASCAN AI
          </span>
        </div>

        <span className="hidden text-[11px] font-medium text-slate-500 md:inline-block">
          Packaged Commodities Rules, 2011
        </span>

        {time && (
          <span className="hidden text-[11px] font-mono text-slate-400 lg:inline-block">
            • {time} IST
          </span>
        )}
      </div>

      {/* RIGHT: User Profile & Secure Session */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Active Role Badge (Read-Only) */}
        {user && (
          <div
            className={`hidden items-center gap-1.5 rounded-xl border px-3 py-1 text-xs font-semibold sm:flex ${
              user.role === "inspector"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : user.role === "company"
                ? "border-orange-200 bg-orange-50 text-orange-800"
                : user.role === "admin"
                ? "border-purple-200 bg-purple-50 text-purple-800"
                : "border-cyan-200 bg-cyan-50 text-cyan-800"
            }`}
          >
            <span className="text-sm">
              {user.role === "inspector"
                ? "🛡️"
                : user.role === "company"
                ? "🏢"
                : user.role === "admin"
                ? "🏛️"
                : "👤"}
            </span>
            <span className="capitalize">
              {user.role === "user" ? "Citizen" : user.role} Portal
            </span>
          </div>
        )}

        {/* Notices Alert Badge */}
        {user && (user.role === "inspector" || user.role === "company") && (
          <button
            type="button"
            onClick={onOpenInbox}
            className="relative flex items-center justify-center rounded-xl border border-orange-200 bg-orange-50 p-2 text-orange-600 transition hover:bg-orange-100"
            title={`${unreadCount} compliance notices require attention`}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>
        )}

        {/* Active User Card */}
        {user ? (
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-1 pl-2 pr-2.5 shadow-2xs">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
                user.role === "inspector"
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : user.role === "company"
                  ? "bg-orange-100 text-orange-800 border border-orange-200"
                  : user.role === "admin"
                  ? "bg-purple-100 text-purple-800 border border-purple-200"
                  : "bg-cyan-100 text-cyan-800 border border-cyan-200"
              }`}
            >
              {user.name.charAt(0)}
            </div>

            <div className="hidden text-left sm:block">
              <p className="text-xs font-semibold leading-tight text-slate-800">
                {user.name}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">
                {user.role} {user.badgeNumber ? `• ${user.badgeNumber}` : ""}
              </p>
            </div>

            <button
              type="button"
              onClick={logout}
              className="ml-1 rounded-md p-1 text-slate-400 transition hover:bg-rose-100 hover:text-rose-600"
              title="Secure Sign Out"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}

