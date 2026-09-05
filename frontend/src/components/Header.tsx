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
  const { user, logout, switchRole } = useAuth();
  const { notices } = useNoticesStore();
  const [time, setTime] = useState("");
  const [showRoleMenu, setShowRoleMenu] = useState(false);

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
        {/* Interactive Role Switcher Pill & Dropdown */}
        {user && (
          <div className="relative">
            {user.role === "inspector" ? (
              <button
                type="button"
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 shadow-2xs hover:bg-emerald-100 transition active:scale-95"
                title="Switch role or company profile"
              >
                <span className="text-sm">🛡️</span>
                <span className="hidden sm:inline">Inspector Portal</span>
                <span className="text-[10px] text-emerald-600 font-normal">⇄ Switch ▾</span>
              </button>
            ) : user.role === "company" ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => switchRole("inspector")}
                  className="flex items-center gap-1.5 rounded-xl border border-emerald-400 bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition active:scale-95"
                  title="Switch to Inspector Enforcement Portal"
                >
                  <span>🛡️</span>
                  <span className="hidden sm:inline">Switch to Inspector</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowRoleMenu(!showRoleMenu)}
                  className="flex items-center gap-1 rounded-xl border border-orange-200 bg-orange-50 px-2 py-1 text-xs font-bold text-orange-800 hover:bg-orange-100 transition"
                  title="Switch company account"
                >
                  <span>🏢</span>
                  <span className="max-w-[70px] sm:max-w-[100px] truncate">{user.name.split(" ")[0]}</span>
                  <span className="text-[10px]">▾</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => switchRole("inspector")}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
              >
                <span>🛡️ Switch to Inspector</span>
              </button>
            )}

            {/* Dropdown Menu Backdrop */}
            {showRoleMenu && (
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowRoleMenu(false)}
              />
            )}

            {/* Dropdown Menu Card */}
            {showRoleMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 border-b border-slate-100">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Switch Active Portal / Role
                  </p>
                </div>

                <div className="mt-1 space-y-0.5">
                  {/* Inspector Option */}
                  <button
                    type="button"
                    onClick={() => {
                      switchRole("inspector");
                      setShowRoleMenu(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold transition ${
                      user.role === "inspector"
                        ? "bg-emerald-50 text-emerald-900 font-bold"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🛡️</span>
                      <div>
                        <p className="leading-tight">Inspector Portal</p>
                        <p className="text-[10px] text-slate-500 font-normal">Legal Metrology Enforcement</p>
                      </div>
                    </div>
                    {user.role === "inspector" && <span className="text-emerald-600 font-bold">✓</span>}
                  </button>

                  <div className="px-3 pt-2 pb-1 border-t border-slate-100">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Company Portals (Manufacturer Inboxes)
                    </p>
                  </div>

                  {[
                    { id: "parle_foods", name: "Parle Biscuits Pvt Ltd", brand: "Parle-G / Hide & Seek" },
                    { id: "amul_india", name: "GCMMF Ltd. (Amul)", brand: "Amul Butter / Dairy" },
                    { id: "cadbury_mondelez", name: "Mondelez India (Cadbury)", brand: "Dairy Milk / 5 Star" },
                    { id: "britannia_foods", name: "Britannia Industries Ltd", brand: "Good Day / Marie" },
                  ].map((comp) => {
                    const isCurrent = user.role === "company" && user.user_id === comp.id;
                    return (
                      <button
                        key={comp.id}
                        type="button"
                        onClick={() => {
                          switchRole("company", comp.id);
                          setShowRoleMenu(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-1.5 text-left text-xs transition ${
                          isCurrent
                            ? "bg-orange-50 text-orange-950 font-bold"
                            : "text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>🏢</span>
                          <div>
                            <p className="font-semibold text-xs leading-tight">{comp.name}</p>
                            <p className="text-[10px] text-slate-500">{comp.brand}</p>
                          </div>
                        </div>
                        {isCurrent && <span className="text-orange-600 font-bold">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
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

