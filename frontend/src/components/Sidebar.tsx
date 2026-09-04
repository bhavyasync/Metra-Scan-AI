"use client";

import React from "react";
import Link from "next/link";
import { useAuth, UserRole } from "../lib/auth-context";
import { useNoticesStore } from "../lib/notices-store";

export type ActiveTab =
  | "scan"
  | "inbox"
  | "company-inbox"
  | "admin-hub"
  | "consumer-scan"
  | "reports"
  | "registry"
  | "officers"
  | "rules"
  | "grievances"
  | "guide";

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({
  activeTab,
  onSelectTab,
  collapsed = false,
  mobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const { user, logout } = useAuth();
  const { notices } = useNoticesStore();

  const role = user?.role || "inspector";

  // Unread notice badge computation
  const inspectorPendingCount = notices.filter(
    (n) => n.status === "NOTICE_ISSUED"
  ).length;

  const companyNoticesCount = notices.filter(
    (n) =>
      n.status === "NOTICE_ISSUED" &&
      (n.company_id.includes(user?.user_id || "") ||
        user?.entityName?.toLowerCase().includes(n.brand_name.toLowerCase()) ||
        user?.user_id.includes("amul"))
  ).length;

  // Build navigation items tailored for the active role
  const getNavItems = () => {
    switch (role) {
      case "inspector":
        return [
          {
            id: "scan" as ActiveTab,
            label: "Live Scan Station",
            icon: "📷",
            badge: "AI",
            badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
          },
          {
            id: "inbox" as ActiveTab,
            label: "Inspector Inbox",
            icon: "📥",
            badge: inspectorPendingCount > 0 ? `${inspectorPendingCount} Flagged` : undefined,
            badgeColor: "bg-orange-500/20 text-orange-300 border-orange-500/40 animate-pulse",
          },
          {
            id: "reports" as ActiveTab,
            label: "Inspection Archive",
            icon: "📄",
          },
          {
            id: "rules" as ActiveTab,
            label: "Legal Metrology 2011",
            icon: "⚖️",
          },
        ];

      case "company":
        return [
          {
            id: "company-inbox" as ActiveTab,
            label: "Violation Notices",
            icon: "🔔",
            badge: companyNoticesCount > 0 ? `${companyNoticesCount} Action` : undefined,
            badgeColor: "bg-orange-500/20 text-orange-300 border-orange-500/40 animate-pulse",
          },
          {
            id: "scan" as ActiveTab,
            label: "Pre-Market Scanner",
            icon: "🧪",
            badge: "Pro",
            badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
          },
          {
            id: "registry" as ActiveTab,
            label: "Packaging Catalog",
            icon: "📦",
          },
          {
            id: "rules" as ActiveTab,
            label: "Packaging Guidelines",
            icon: "📐",
          },
        ];

      case "admin":
        return [
          {
            id: "admin-hub" as ActiveTab,
            label: "National Analytics",
            icon: "📊",
            badge: "Govt",
            badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
          },
          {
            id: "scan" as ActiveTab,
            label: "Inspection Console",
            icon: "🔍",
          },
          {
            id: "inbox" as ActiveTab,
            label: "Enforcement Feed",
            icon: "📁",
            badge: `${notices.length} Total`,
            badgeColor: "bg-slate-700 text-slate-300",
          },
          {
            id: "officers" as ActiveTab,
            label: "Officer Directory",
            icon: "👥",
          },
          {
            id: "rules" as ActiveTab,
            label: "Rule Configuration",
            icon: "⚙️",
          },
        ];

      case "user":
      default:
        return [
          {
            id: "consumer-scan" as ActiveTab,
            label: "Consumer Scanner",
            icon: "🔎",
            badge: "Free",
            badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
          },
          {
            id: "grievances" as ActiveTab,
            label: "Report Overcharging",
            icon: "🚨",
          },
          {
            id: "guide" as ActiveTab,
            label: "Consumer Rights Guide",
            icon: "📖",
          },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full flex-col justify-between border-r border-slate-200 bg-white transition-all duration-300 md:static md:translate-x-0 ${
          mobileOpen ? "translate-x-0 shadow-2xl w-72" : "-translate-x-full md:translate-x-0"
        } ${collapsed ? "md:w-20" : "md:w-64 lg:w-72"} shrink-0`}
      >
        {/* Top Branding Section */}
        <div>
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-orange-500 font-black text-white shadow-md shadow-emerald-500/20">
                <span className="text-base font-black text-white">M</span>
              </div>

              {(!collapsed || mobileOpen) && (
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-base font-black tracking-tight text-slate-900">
                      MetraScan
                    </h1>
                    <span className="rounded border border-emerald-300 bg-emerald-50 px-1.5 py-0.2 text-[9px] font-extrabold uppercase tracking-widest text-emerald-700">
                      AI
                    </span>
                  </div>
                  <p className="truncate text-[10px] font-medium tracking-wide text-slate-500">
                    Legal Metrology • SIH 26034
                  </p>
                </div>
              )}
            </div>

            {/* Mobile Close Button */}
            {onCloseMobile && (
              <button
                type="button"
                onClick={onCloseMobile}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 md:hidden"
                aria-label="Close menu"
              >
                ✕
              </button>
            )}
          </div>

          {/* Current Active Role Badge */}
          {(!collapsed || mobileOpen) && user && (
            <div className="mx-4 my-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                  ACTIVE WORKSPACE
                </span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${
                    role === "inspector"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : role === "company"
                      ? "border-orange-200 bg-orange-50 text-orange-800"
                      : role === "admin"
                      ? "border-purple-200 bg-purple-50 text-purple-800"
                      : "border-cyan-200 bg-cyan-50 text-cyan-800"
                  }`}
                >
                  {role}
                </span>
              </div>
              <p className="mt-1 truncate text-xs font-bold text-slate-900">
                {user.name}
              </p>
              <p className="truncate text-[10px] text-slate-500">
                {user.entityName || user.jurisdiction || user.email}
              </p>
            </div>
          )}

          {/* Navigation Items */}
          <nav className="space-y-1.5 px-3 py-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectTab(item.id);
                    onCloseMobile?.();
                  }}
                  className={`group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-xs font-semibold transition-all ${
                    isActive
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-900 shadow-xs font-bold"
                      : "border border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base transition group-hover:scale-110">
                      {item.icon}
                    </span>
                    {(!collapsed || mobileOpen) && <span>{item.label}</span>}
                  </div>

                {!collapsed && item.badge && (
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[9px] font-bold tracking-wide ${
                      item.badgeColor || "border-slate-200 bg-slate-100 text-slate-700"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Authenticated Session & Legal Footnote */}
      <div className="border-t border-slate-200 p-3 space-y-2">
        {!collapsed && user && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700">
                ● ACTIVE SESSION
              </span>
              <span className="text-[9px] font-medium text-slate-500 capitalize">
                {user.role === "user" ? "Citizen" : user.role}
              </span>
            </div>
            <p className="mt-1 truncate text-xs font-semibold text-slate-800">
              {user.name}
            </p>
            {user.entityName && (
              <p className="truncate text-[10px] text-slate-500">
                {user.entityName}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between px-2 pt-1 text-[10px] text-slate-500">
          {!collapsed && <span>Dept of Consumer Affairs</span>}
          {user ? (
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1 font-semibold text-rose-600 transition hover:text-rose-700"
              title="Secure Sign Out"
            >
              <span>Sign Out</span>
              <span>→</span>
            </button>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1 font-semibold text-emerald-600 transition hover:text-emerald-700"
            >
              <span>Sign In</span>
              <span>→</span>
            </Link>
          )}
        </div>
      </div>
    </aside>
    </>
  );
}

