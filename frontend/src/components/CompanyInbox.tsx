"use client";

import React, { useState } from "react";
import { useAuth } from "../lib/auth-context";
import { useNoticesStore, ComplianceNotice } from "../lib/notices-store";

interface CompanyInboxProps {
  onNavigateScanner?: () => void;
}

export default function CompanyInbox({ onNavigateScanner }: CompanyInboxProps) {
  const { user } = useAuth();
  const { notices, respondToNotice } = useNoticesStore();

  const [activeNotice, setActiveNotice] = useState<ComplianceNotice | null>(null);
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>("ALL");
  const [responseText, setResponseText] = useState("");
  const [proofFilename, setProofFilename] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  // Filter notices for this company or brand
  const companyNotices = notices.filter((n) => {
    if (selectedBrandFilter !== "ALL") {
      const matchBrand =
        n.brand_name.toLowerCase().includes(selectedBrandFilter.toLowerCase()) ||
        n.company_id.toLowerCase().includes(selectedBrandFilter.toLowerCase()) ||
        n.product_name.toLowerCase().includes(selectedBrandFilter.toLowerCase());
      return matchBrand;
    }

    if (!user) return true;
    const uid = user.user_id.toLowerCase();
    const ent = (user.entityName || "").toLowerCase();

    // If company user is logged in, show their company's notices, or all notices if general company account
    if (uid.includes("parle")) {
      return n.brand_name.toLowerCase().includes("parle") || n.company_id.includes("parle");
    }
    if (uid.includes("cadbury") || uid.includes("mondelez")) {
      return n.brand_name.toLowerCase().includes("cadbury") || n.brand_name.toLowerCase().includes("mondelez") || n.company_id.includes("cadbury");
    }
    if (uid.includes("amul")) {
      return n.brand_name.toLowerCase().includes("amul") || n.company_id.includes("amul");
    }
    if (uid.includes("britannia")) {
      return n.brand_name.toLowerCase().includes("britannia") || n.company_id.includes("britannia");
    }

    return (
      n.company_id.toLowerCase().includes(uid) ||
      ent.includes(n.brand_name.toLowerCase()) ||
      true
    );
  });

  const handleSubmitResponse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNotice || !responseText.trim()) return;

    const proof = proofFilename.trim() || `Revised_Cylinder_${activeNotice.case_number}.pdf`;
    respondToNotice(activeNotice.id, responseText.trim(), proof);
    showToast(`✓ Statutory response submitted for Case ${activeNotice.case_number}! Inspector notified.`);
    setActiveNotice(null);
    setResponseText("");
    setProofFilename("");
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-emerald-300 bg-white px-5 py-3 shadow-xl">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
            ✓
          </span>
          <p className="text-xs font-bold text-emerald-900">{toastMessage}</p>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black tracking-tight text-slate-900">
              Company Compliance Inbox
            </h2>
            <span className="rounded-full border border-orange-300 bg-orange-50 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-orange-700">
              Automated Statutory Notices
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Official non-compliance notices automatically dispatched by Legal Metrology enforcement officers based on package scan violations.
          </p>
        </div>

        {onNavigateScanner && (
          <button
            type="button"
            onClick={onNavigateScanner}
            className="flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-600/20 transition hover:bg-orange-700"
          >
            <span>🧪</span>
            <span>Pre-Market Audit Scanner</span>
          </button>
        )}
      </div>

      {/* Company Alert Bar */}
      <div className="rounded-2xl border border-orange-200 bg-orange-50/80 p-4 text-xs text-orange-950">
        <div className="flex items-start gap-3">
          <span className="text-lg">📢</span>
          <div>
            <p className="font-bold text-slate-900">
              Automated Legal Metrology Notification System Active
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-orange-900">
              Under Rule 6 & 9 of Legal Metrology (Packaged Commodities) Rules, 2011, your packaging division must respond to flagged notices to avoid enforcement escalation or retail product seizure.
            </p>
          </div>
        </div>
      </div>

      {/* Brand / Company Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
        <span className="text-xs font-bold text-slate-500 mr-1">Filter Brand:</span>
        {[
          { id: "ALL", label: "All Complaints" },
          { id: "parle", label: "Parle" },
          { id: "amul", label: "Amul" },
          { id: "mondelez", label: "Cadbury / Mondelez" },
          { id: "britannia", label: "Britannia" },
          { id: "royal", label: "Royal Spices" },
        ].map((f) => {
          const isActive = selectedBrandFilter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setSelectedBrandFilter(f.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                isActive
                  ? "bg-orange-600 text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Notices List */}
      <div className="grid gap-4">
        {companyNotices.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <span className="text-4xl">🎉</span>
            <p className="mt-3 text-sm font-bold text-emerald-800">No active violations on file!</p>
            <p className="mt-1 text-xs text-slate-500">
              All scanned products for this brand filter are currently compliant with Legal Metrology regulations.
            </p>
          </div>
        ) : (
          companyNotices.map((notice) => {
            const isUrgent = notice.is_urgent || notice.flag_count > 5;
            const isCritical = notice.severity === "CRITICAL";
            const isMajor = notice.severity === "MAJOR";

            return (
              <div
                key={notice.id}
                className={`rounded-3xl border p-5 transition-all bg-white shadow-xs ${
                  isUrgent
                    ? "border-red-400 bg-red-50/40"
                    : isCritical
                    ? "border-red-300 bg-red-50/20"
                    : isMajor
                    ? "border-orange-300 bg-orange-50/20"
                    : "border-slate-200"
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    {/* Tags */}
                    <div className="flex flex-wrap items-center gap-2">
                      {isUrgent && (
                        <span className="rounded-full border border-red-300 bg-red-100 px-2.5 py-0.5 text-[9px] font-black uppercase text-red-800 animate-pulse">
                          🚨 URGENT CASE (FLAGGED {notice.flag_count}x)
                        </span>
                      )}

                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase ${
                          isCritical
                            ? "border-red-300 bg-red-100 text-red-800"
                            : isMajor
                            ? "border-orange-300 bg-orange-100 text-orange-800"
                            : "border-amber-300 bg-amber-100 text-amber-800"
                        }`}
                      >
                        {notice.severity} NOTICE
                      </span>

                      <span className="font-mono text-xs font-bold text-slate-600">
                        {notice.case_number}
                      </span>

                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] text-slate-600 font-medium">
                        Officer: {notice.inspector_name} ({notice.jurisdiction})
                      </span>

                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600 font-medium">
                        Inspected: {notice.flag_count || 1} time(s)
                      </span>
                    </div>

                    {/* Product Name */}
                    <h3 className="mt-2 text-lg font-black text-slate-900">
                      {notice.product_name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Brand: <span className="font-semibold text-slate-800">{notice.brand_name}</span> • Entity ID: {notice.company_id}
                    </p>

                    {/* Violations Summary */}
                    <div className="mt-3 space-y-1.5">
                      {notice.rule_citations.map((r, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-900"
                        >
                          <span>⚠️</span>
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>

                    {/* OCR Evidence */}
                    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-mono text-[11px] text-slate-700">
                      <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block mb-1">
                        Inspector OCR Scan Evidence:
                      </span>
                      {notice.ocr_evidence_snippet}
                    </div>

                    {/* Company Response Preview if already submitted */}
                    {notice.company_response && (
                      <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs">
                        <div className="flex items-center justify-between text-emerald-900 font-bold">
                          <span>✓ Your Submitted Corrective Action:</span>
                          <span className="text-[10px] font-normal text-slate-500">
                            {new Date(notice.company_response.responded_at).toLocaleString("en-IN")}
                          </span>
                        </div>
                        <p className="mt-1 text-slate-800 italic leading-relaxed">
                          "{notice.company_response.response_text}"
                        </p>
                        {notice.company_response.proof_submitted && (
                          <p className="mt-1.5 font-mono text-[10px] text-emerald-700">
                            Attached Proof: {notice.company_response.proof_submitted}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Notice Status & Actions */}
                  <div className="flex flex-col items-start sm:items-end gap-3 shrink-0">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center sm:text-right min-w-[160px]">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Notice Status
                      </p>
                      <p className="mt-0.5 text-sm font-black text-slate-800">
                        {notice.status === "RESOLVED"
                          ? "Resolved & Approved"
                          : notice.status === "COMPANY_RESPONDED"
                          ? "Response Under Review"
                          : notice.status === "ESCALATED_URGENT"
                          ? "Escalated Urgent"
                          : "Action Required"}
                      </p>
                    </div>

                    {notice.status === "RESOLVED" ? (
                      <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-center sm:text-right">
                        <span className="text-xs font-bold text-emerald-800 block">
                          ✓ Case Resolved & Approved
                        </span>
                        <span className="text-[10px] text-emerald-700">
                          Enforcement officer signed off
                        </span>
                      </div>
                    ) : notice.status === "COMPANY_RESPONDED" ? (
                      <div className="rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-center sm:text-right">
                        <span className="text-xs font-bold text-blue-800 block">
                          ✓ Response Submitted
                        </span>
                        <span className="text-[10px] text-blue-600">
                          Awaiting Inspector Sign-off
                        </span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveNotice(notice);
                          setResponseText("");
                        }}
                        className="w-full sm:w-auto rounded-xl bg-orange-600 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-orange-600/20 transition hover:bg-orange-700"
                      >
                        Submit Corrective Action →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Response Modal */}
      {activeNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700">
                  Legal Metrology Form 4 Response
                </span>
                <h3 className="mt-1 text-lg font-black text-slate-900">
                  Respond to {activeNotice.case_number}
                </h3>
                <p className="text-xs text-slate-500">{activeNotice.product_name}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveNotice(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitResponse} className="mt-5 space-y-4 text-xs">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[10px] uppercase text-slate-500 font-bold">Violations to remedy:</p>
                <ul className="mt-1 list-disc pl-4 text-slate-700 space-y-1">
                  {activeNotice.rule_citations.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-800">
                  Company Corrective Action & Justification:
                </label>
                <textarea
                  required
                  rows={4}
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Describe corrective actions taken (e.g. cylinder plate redesigned to meet 4mm font height, batch recall initiated, thermal stamp calibrated)..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-xs text-slate-900 placeholder-slate-400 focus:border-orange-600 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-800">
                  Attach Corrected Packaging Artwork / Lab Test Proof:
                </label>
                <input
                  type="text"
                  value={proofFilename}
                  onChange={(e) => setProofFilename(e.target.value)}
                  placeholder="e.g. Amul_Pure_Ghee_Revised_Cylinder_2026.pdf"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-orange-600 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-orange-600 py-3 text-xs font-black uppercase text-white hover:bg-orange-700 shadow-md shadow-orange-600/20"
                >
                  Submit Official Response to Inspector
                </button>
                <button
                  type="button"
                  onClick={() => setActiveNotice(null)}
                  className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

