"use client";

import React, { useState } from "react";
import { useNoticesStore } from "../lib/notices-store";

interface ConsumerDashboardProps {
  onNavigateScan?: () => void;
}

export default function ConsumerDashboard({ onNavigateScan }: ConsumerDashboardProps) {
  const { dispatchNotice } = useNoticesStore();
  const [productName, setProductName] = useState("");
  const [storeName, setStoreName] = useState("");
  const [mrpPrinted, setMrpPrinted] = useState("");
  const [priceCharged, setPriceCharged] = useState("");
  const [grievanceText, setGrievanceText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleReportGrievance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || !storeName) return;

    // Automatically file a case into the Inspector queue
    dispatchNotice({
      product_name: productName,
      brand_name: storeName,
      company_id: "retail_overcharge",
      inspector_id: "insp_rajesh",
      inspector_name: "Enforcement Grievance Cell",
      jurisdiction: "Local District Jurisdiction",
      severity: "CRITICAL",
      rule_citations: [
        "Rule 18(2) - Selling commodity above Maximum Retail Price (MRP)",
        "Section 36(1) - Legal Metrology Act, 2009",
      ],
      violations_summary: [
        `Consumer reported overcharging: Printed MRP ₹${mrpPrinted || "N/A"}, Charged ₹${priceCharged || "N/A"} at ${storeName}.`,
        grievanceText || "Dual MRP or overcharging grievance lodged by citizen.",
      ],
      detected_declarations: {
        mrp: `₹ ${mrpPrinted}`,
      },
      ocr_evidence_snippet: `CITIZEN COMPLAINT: Retailer ${storeName} charged ₹${priceCharged} against declared MRP ₹${mrpPrinted}.`,
      inspector_notes: "Auto-routed from Consumer Grievance Watchdog Portal.",
    });

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setProductName("");
      setStoreName("");
      setMrpPrinted("");
      setPriceCharged("");
      setGrievanceText("");
    }, 4000);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black tracking-tight text-white">
              Consumer Rights & Grievance Watchdog
            </h2>
            <span className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-cyan-300">
              Citizen Portal
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Empowering consumers to identify retail packaging violations, dual MRP stickers, and lodge instant grievances with the Legal Metrology Department.
          </p>
        </div>

        {onNavigateScan && (
          <button
            type="button"
            onClick={onNavigateScan}
            className="flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-bold text-black shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400"
          >
            <span>🔍</span>
            <span>Scan Package Now</span>
          </button>
        )}
      </div>

      {/* 3 Quick Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/[0.08] bg-[#0c121e]/80 p-4">
          <span className="text-2xl">🏷️</span>
          <h3 className="mt-2 text-sm font-bold text-white">Dual MRP is Illegal</h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            Manufacturers cannot print two different MRPs for the same product in different stores or airports under Rule 18(2).
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#0c121e]/80 p-4">
          <span className="text-2xl">⚖️</span>
          <h3 className="mt-2 text-sm font-bold text-white">Net Quantity Guarantee</h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            Packaging must clearly state Net Quantity in standard units (g, kg, ml, L). Font size must meet statutory height standards.
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#0c121e]/80 p-4">
          <span className="text-2xl">📞</span>
          <h3 className="mt-2 text-sm font-bold text-white">Consumer Care Helpline</h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            National Consumer Helpline: <strong>1915</strong>. All packages must declare an active customer grievance email and phone.
          </p>
        </div>
      </div>

      {/* Report Overcharging Form */}
      <div className="rounded-3xl border border-white/[0.08] bg-[#0c121e]/85 p-6 backdrop-blur-xl sm:p-8">
        <div className="border-b border-white/[0.08] pb-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-400">
            <span>🚨</span> Citizen Vigilance Action
          </div>
          <h3 className="mt-2 text-xl font-black text-white">
            Lodge Overcharging / Package Grievance
          </h3>
          <p className="text-xs text-slate-400">
            Directly dispatches an enforcement alert to the Legal Metrology Inspector's inbox for that jurisdiction.
          </p>
        </div>

        {submitted ? (
          <div className="my-6 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-6 text-center">
            <span className="text-4xl">✓</span>
            <h4 className="mt-2 text-base font-black text-emerald-300">
              Grievance Registered Successfully!
            </h4>
            <p className="mt-1 text-xs text-emerald-200/80">
              A statutory case has been generated and routed to the Legal Metrology Enforcement Inspector for investigation.
            </p>
          </div>
        ) : (
          <form onSubmit={handleReportGrievance} className="mt-6 space-y-4 text-xs">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block font-bold text-slate-300">Product Name & Brand</label>
                <input
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. Mineral Water Bottle 1L"
                  className="w-full rounded-xl border border-white/[0.1] bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-300">Store / Retailer Name & Location</label>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="e.g. QuickMart Superstore, Terminal 3"
                  className="w-full rounded-xl border border-white/[0.1] bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block font-bold text-slate-300">Printed MRP on Package (₹)</label>
                <input
                  type="number"
                  value={mrpPrinted}
                  onChange={(e) => setMrpPrinted(e.target.value)}
                  placeholder="e.g. 20"
                  className="w-full rounded-xl border border-white/[0.1] bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-300">Price Actually Charged (₹)</label>
                <input
                  type="number"
                  value={priceCharged}
                  onChange={(e) => setPriceCharged(e.target.value)}
                  placeholder="e.g. 35"
                  className="w-full rounded-xl border border-white/[0.1] bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block font-bold text-slate-300">Grievance Details / Remarks</label>
              <textarea
                rows={3}
                value={grievanceText}
                onChange={(e) => setGrievanceText(e.target.value)}
                placeholder="Describe any altered MRP sticker, obscured manufacturing date, or retailer refusal to charge printed MRP..."
                className="w-full rounded-xl border border-white/[0.1] bg-black/40 p-3 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-cyan-500 py-3 text-xs font-black uppercase text-black hover:bg-cyan-400 shadow-lg shadow-cyan-500/20"
            >
              Submit Grievance to Legal Metrology Inspectorate →
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

