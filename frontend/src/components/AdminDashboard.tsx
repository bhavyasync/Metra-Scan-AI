"use client";

import React from "react";
import { useNoticesStore } from "../lib/notices-store";

export default function AdminDashboard() {
  const { notices } = useNoticesStore();

  const totalNotices = notices.length;
  const criticalCount = notices.filter((n) => n.severity === "CRITICAL").length;
  const majorCount = notices.filter((n) => n.severity === "MAJOR").length;
  const resolvedCount = notices.filter((n) => n.status === "RESOLVED").length;


  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black tracking-tight text-white">
              National Metrology Oversight Console
            </h2>
            <span className="rounded-full border border-purple-500/40 bg-purple-500/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-purple-300">
              Admin Directorate
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Directorate of Legal Metrology • Real-time enforcement telemetry under Packaged Commodities Rules 2011.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-300">
            National Compliance: 78.4%
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-white/[0.08] bg-[#0c121e]/80 p-4 backdrop-blur-md">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Total Scans Logged
          </p>
          <p className="mt-1 text-3xl font-black text-white">1,428</p>
          <p className="mt-1 text-[10px] text-emerald-400">↑ 14% this month across 8 states</p>
        </div>

        <div className="rounded-2xl border border-red-500/30 bg-red-500/[0.05] p-4 backdrop-blur-md">
          <p className="text-[10px] font-bold uppercase tracking-wider text-red-300">
            Critical Violations
          </p>
          <p className="mt-1 text-3xl font-black text-red-100">{criticalCount + 18}</p>
          <p className="mt-1 text-[10px] text-red-300/70">Missing MRP / Altered price stamps</p>
        </div>

        <div className="rounded-2xl border border-orange-500/30 bg-orange-500/[0.05] p-4 backdrop-blur-md">
          <p className="text-[10px] font-bold uppercase tracking-wider text-orange-300">
            Notices Dispatched
          </p>
          <p className="mt-1 text-3xl font-black text-orange-100">{totalNotices + 42}</p>
          <p className="mt-1 text-[10px] text-orange-300/70">Statutory 7 & 15-day notices</p>
        </div>

        <div className="rounded-2xl border border-red-500/30 bg-red-500/[0.08] p-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-red-300">
              Urgent Repeat Cases (&gt; 5x)
            </p>
            <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping"></span>
          </div>
          <p className="mt-1 text-3xl font-black text-red-100">
            {notices.filter((n) => n.is_urgent || n.flag_count > 5).length + 4}
          </p>
          <p className="mt-1 text-[10px] text-red-300/70">Flagged &gt; 5 times for repeat non-compliance</p>
        </div>
      </div>

      {/* Enforcement Heatmap & Top Rule Infractions */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Top Rule Violations */}
        <div className="lg:col-span-7 rounded-3xl border border-white/[0.08] bg-[#0c121e]/85 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                Top Legal Metrology Rule Infractions
              </h3>
              <p className="text-xs text-slate-400">Rules 2011 Automated Detection Rates</p>
            </div>
            <span className="rounded-lg bg-white/5 px-2.5 py-1 text-[10px] font-bold text-slate-300">
              Q3 2026
            </span>
          </div>

          <div className="mt-5 space-y-4 text-xs">
            <div>
              <div className="flex justify-between font-semibold">
                <span className="text-white">Rule 6(1)(e) - Missing / Obscured MRP</span>
                <span className="text-red-400">38% of violations</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-white/[0.05] overflow-hidden">
                <div className="h-full bg-red-500 rounded-full" style={{ width: "38%" }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold">
                <span className="text-white">Rule 9(3) - Font Size Below Mandatory Millimeter Threshold</span>
                <span className="text-orange-400">29% of violations</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-white/[0.05] overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: "29%" }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold">
                <span className="text-white">Rule 6(1)(a) - Illegible Consumer Care Contact Details</span>
                <span className="text-amber-400">19% of violations</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-white/[0.05] overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: "19%" }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold">
                <span className="text-white">Rule 6(1)(g) - Non-Standard Unit Sale Price (USP)</span>
                <span className="text-emerald-400">14% of violations</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-white/[0.05] overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: "14%" }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Regional Enforcement Zones */}
        <div className="lg:col-span-5 rounded-3xl border border-white/[0.08] bg-[#0c121e]/85 p-6 backdrop-blur-xl">
          <div className="border-b border-white/[0.08] pb-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-white">
              Regional Enforcement Jurisdictions
            </h3>
            <p className="text-xs text-slate-400">Active Legal Metrology Inspection Zones</p>
          </div>

          <div className="mt-4 space-y-3">
            {[
              { zone: "North Zone (Delhi NCR)", officers: 18, scans: 412, compliance: "76%" },
              { zone: "West Zone (Mumbai & Gujarat)", officers: 24, scans: 538, compliance: "81%" },
              { zone: "South Zone (Bangalore & Chennai)", officers: 16, scans: 310, compliance: "84%" },
              { zone: "East Zone (Kolkata & Assam)", officers: 12, scans: 168, compliance: "72%" },
            ].map((z, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-black/40 p-3">
                <div>
                  <p className="text-xs font-bold text-white">{z.zone}</p>
                  <p className="text-[10px] text-slate-400">{z.officers} Active Officers • {z.scans} Scans</p>
                </div>
                <div className="text-right">
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-300">
                    {z.compliance}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

