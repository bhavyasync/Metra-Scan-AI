"use client";

import React, { useState } from "react";
import { useAuth } from "../lib/auth-context";
import {
  useNoticesStore,
  ComplianceNotice,
  ViolationSeverity,
  NoticeStatus,
} from "../lib/notices-store";

interface InspectorInboxProps {
  onNavigateScan?: () => void;
}

export default function InspectorInbox({ onNavigateScan }: InspectorInboxProps) {
  const { user } = useAuth();
  const { notices, updateStatus } = useNoticesStore();

  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");
  const [selectedCase, setSelectedCase] = useState<ComplianceNotice | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [inspectorNotesInput, setInspectorNotesInput] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  // Filter cases
  const filteredNotices = notices.filter((n) => {
    const matchesFilter =
      selectedFilter === "ALL"
        ? true
        : selectedFilter === "URGENT"
        ? n.is_urgent || n.flag_count > 5
        : selectedFilter === "RESPONDED"
        ? n.status === "COMPANY_RESPONDED"
        : n.severity === selectedFilter;

    const matchesSearch =
      n.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.case_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.company_id.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Metrics
  const totalCount = notices.length;
  const urgentCount = notices.filter((n) => n.is_urgent || n.flag_count > 5).length;
  const criticalCount = notices.filter((n) => n.severity === "CRITICAL").length;
  const majorCount = notices.filter((n) => n.severity === "MAJOR").length;
  const respondedCount = notices.filter(
    (n) => n.status === "COMPANY_RESPONDED"
  ).length;

  const handleUpdateStatus = (status: NoticeStatus) => {
    if (!selectedCase) return;
    updateStatus(selectedCase.id, status, inspectorNotesInput || undefined);
    showToast(`Case status updated to ${status.replace("_", " ")}`);
    setSelectedCase((prev) =>
      prev ? { ...prev, status, inspector_notes: inspectorNotesInput || prev.inspector_notes } : null
    );
  };

    return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-emerald-300 bg-white px-5 py-3 shadow-xl">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
            ✓
          </span>
          <p className="text-xs font-bold text-emerald-900">{toastMessage}</p>
        </div>
      )}

      {/* Top Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black tracking-tight text-slate-900">
              Inspector Enforcement Inbox
            </h2>
            <span className="rounded-full border border-orange-300 bg-orange-50 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-orange-700">
              Active Docket Registry
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Automated Legal Metrology notices dispatched to companies following non-compliant package scans.
          </p>
        </div>

        {onNavigateScan && (
          <button
            type="button"
            onClick={onNavigateScan}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700"
          >
            <span>📷</span>
            <span>Scan New Package</span>
          </button>
        )}
      </div>

      {/* Metric KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Total Flagged
          </p>
          <p className="mt-1 text-2xl font-black text-slate-900">{totalCount}</p>
          <p className="text-[10px] text-slate-500">Active inspection cases</p>
        </div>

        {/* URGENT CASE METRIC */}
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-red-800">
              Urgent Cases (&gt; 5x)
            </p>
            <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping"></span>
          </div>
          <p className="mt-1 text-2xl font-black text-red-900">{urgentCount}</p>
          <p className="text-[10px] text-red-700 font-medium">Flagged &gt; 5 times (Repeat Offender)</p>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-red-800">
              Critical Violations
            </p>
            <span className="h-2 w-2 rounded-full bg-red-500"></span>
          </div>
          <p className="mt-1 text-2xl font-black text-red-900">{criticalCount}</p>
          <p className="text-[10px] text-red-700/80">Missing MRP / Net Qty</p>
        </div>

        <div className="rounded-2xl border border-orange-200 bg-orange-50/60 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-orange-800">
              Major Notices
            </p>
            <span className="h-2 w-2 rounded-full bg-orange-500"></span>
          </div>
          <p className="mt-1 text-2xl font-black text-orange-900">{majorCount}</p>
          <p className="text-[10px] text-orange-700/80">Font / Care omission</p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
            Company Responded
          </p>
          <p className="mt-1 text-2xl font-black text-emerald-900">{respondedCount}</p>
          <p className="text-[10px] text-emerald-700/80">Awaiting Inspector review</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-slate-100 p-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "ALL", label: "All Cases" },
            { id: "RESPONDED", label: `🔔 Company Responded (${respondedCount})` },
            { id: "URGENT", label: "🚨 Urgent (> 5x Flags)" },
            { id: "CRITICAL", label: "Critical" },
            { id: "MAJOR", label: "Major" },
            { id: "MINOR", label: "Minor" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedFilter(tab.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                selectedFilter === tab.id
                  ? tab.id === "RESPONDED"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : tab.id === "URGENT"
                    ? "bg-red-600 text-white shadow-xs animate-pulse"
                    : tab.id === "CRITICAL"
                    ? "bg-red-600 text-white shadow-xs"
                    : tab.id === "MAJOR"
                    ? "bg-orange-600 text-white shadow-xs"
                    : "bg-white text-slate-900 shadow-xs border border-slate-200"
                  : "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by case #, product, or brand..."
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:outline-none shadow-2xs"
          />
        </div>
      </div>

      {/* Cases List */}
      <div className="grid gap-3">
        {filteredNotices.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <span className="text-3xl">📭</span>
            <p className="mt-3 text-sm font-bold text-slate-800">No cases found</p>
            <p className="mt-1 text-xs text-slate-500">
              No flagged violations matching the filter criteria.
            </p>
          </div>
        ) : (
          filteredNotices.map((notice) => {
            const isUrgent = notice.is_urgent || notice.flag_count > 5;
            const isCritical = notice.severity === "CRITICAL";
            const isMajor = notice.severity === "MAJOR";
            const hasResponded = notice.status === "COMPANY_RESPONDED";
            const isResolved = notice.status === "RESOLVED";

            return (
              <div
                key={notice.id}
                className={`group rounded-2xl border p-4 transition-all bg-white shadow-2xs hover:shadow-xs ${
                  hasResponded
                    ? "border-emerald-400 bg-emerald-50/25 ring-1 ring-emerald-300/60"
                    : isUrgent
                    ? "border-red-300 bg-red-50/40"
                    : isCritical
                    ? "border-red-200"
                    : isMajor
                    ? "border-orange-200"
                    : "border-slate-200"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-sm ${
                        hasResponded
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                          : isUrgent
                          ? "bg-red-600 text-white shadow-md shadow-red-600/30 animate-pulse"
                          : isCritical
                          ? "bg-red-100 text-red-800 border border-red-200"
                          : isMajor
                          ? "bg-orange-100 text-orange-800 border border-orange-200"
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {hasResponded ? "💬" : isUrgent ? "🚨" : isCritical ? "⚠️" : "ℹ️"}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-600">
                          {notice.case_number}
                        </span>

                        {hasResponded && (
                          <span className="rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-0.5 text-[9px] font-black uppercase text-emerald-800 animate-pulse">
                            🔔 COMPANY RESPONDED — ACTION NEEDED
                          </span>
                        )}

                        {isUrgent && !hasResponded && (
                          <span className="rounded-full border border-red-300 bg-red-100 px-2.5 py-0.5 text-[9px] font-black uppercase text-red-800 animate-pulse">
                            🚨 URGENT CASE (FLAGGED {notice.flag_count}x)
                          </span>
                        )}

                        <span
                          className={`rounded-full border px-2 py-0.5 text-[9px] font-extrabold uppercase ${
                            isCritical
                              ? "border-red-300 bg-red-100 text-red-800"
                              : isMajor
                              ? "border-orange-300 bg-orange-100 text-orange-800"
                              : "border-amber-300 bg-amber-100 text-amber-800"
                          }`}
                        >
                          {notice.severity} NOTICE
                        </span>

                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                            notice.status === "COMPANY_RESPONDED"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : notice.status === "ESCALATED_URGENT"
                              ? "bg-red-100 text-red-800 border border-red-200"
                              : notice.status === "RESOLVED"
                              ? "bg-slate-100 text-slate-700"
                              : "bg-orange-100 text-orange-800 border border-orange-200"
                          }`}
                        >
                          {notice.status.replace("_", " ")}
                        </span>
                      </div>

                      <h4 className="mt-1 text-sm font-bold text-slate-900">
                        {notice.product_name} • <span className="text-slate-500 font-normal">{notice.brand_name}</span>
                      </h4>

                      <div className="mt-1.5 space-y-1">
                        {notice.rule_citations.map((rule, idx) => (
                          <p key={idx} className="text-[11px] font-medium text-red-800">
                            • {rule}
                          </p>
                        ))}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-slate-500">
                        <span>🏢 Target Entity: <strong className="text-slate-800">{notice.company_id}</strong></span>
                        <span>
                          • Flag Counter:{" "}
                          <strong className={isUrgent ? "text-red-700 font-bold" : "text-emerald-700"}>
                            {notice.flag_count} Inspection(s)
                          </strong>
                        </span>
                        <span>• Dispatched: {new Date(notice.created_at).toLocaleDateString("en-IN")}</span>
                        <span>• Case Status: <strong className="text-slate-800">{notice.status.replace("_", " ")}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCase(notice);
                        setInspectorNotesInput(notice.inspector_notes || "");
                      }}
                      className={`rounded-xl px-4 py-2 text-xs font-bold transition shadow-2xs ${
                        hasResponded
                          ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20 ring-2 ring-emerald-400/50"
                          : "border border-slate-300 bg-slate-50 text-slate-800 hover:bg-slate-100 hover:border-slate-400"
                      }`}
                    >
                      {hasResponded ? "Review Company Response →" : "Inspect Case File →"}
                    </button>

                    {hasResponded && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-ping"></span>
                        Response Awaiting Sign-off
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Case Details Modal - Three Step Audit Timeline */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Case Docket #{selectedCase.case_number}
                </span>
                <h3 className="mt-1 text-lg font-black text-slate-900">
                  {selectedCase.product_name} • <span className="text-slate-500 font-normal">{selectedCase.brand_name}</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCase(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-5 text-xs">
              {/* Summary KPIs */}
              <div className="grid grid-cols-3 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-500">Severity Level</p>
                  <p className="mt-0.5 font-bold text-orange-700">{selectedCase.severity} NOTICE</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-500">Inspection Count</p>
                  <p className={`mt-0.5 font-bold ${selectedCase.flag_count > 5 ? "text-red-700 font-black" : "text-slate-800"}`}>
                    {selectedCase.flag_count}x Flagged {selectedCase.flag_count > 5 ? "(🚨 REPEAT OFFENDER)" : ""}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-500">Target Entity</p>
                  <p className="mt-0.5 font-mono font-bold text-slate-800">
                    {selectedCase.company_id}
                  </p>
                </div>
              </div>

              {/* THREE-STEP AUDIT TIMELINE */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Two-Way Regulatory Communication & Audit Timeline
                  </p>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800">
                    Real-Time Synced
                  </span>
                </div>

                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                  {/* STEP 1: Inspector Notice Dispatched */}
                  <div className="relative">
                    <div className="absolute -left-6 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-white ring-4 ring-white shadow-xs">
                      1
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">🛡️</span>
                          <h5 className="font-bold text-xs text-slate-900">
                            Notice Dispatched by Inspectorate
                          </h5>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">
                          {new Date(selectedCase.created_at).toLocaleString("en-IN")}
                        </span>
                      </div>

                      {/* Rule Infractions */}
                      <div className="mt-2.5 space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Detected Statutory Infractions (PCR 2011)
                        </p>
                        {selectedCase.rule_citations.map((r, i) => (
                          <div key={i} className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-900">
                            ⚖️ {r}
                          </div>
                        ))}
                      </div>

                      {/* OCR Evidence */}
                      <div className="mt-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Extracted Packaging OCR Evidence
                        </p>
                        <div className="mt-1 rounded-lg border border-slate-200 bg-white p-2.5 font-mono text-[11px] text-slate-700 select-all">
                          {selectedCase.ocr_evidence_snippet}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* STEP 2: Company Corrective Response */}
                  <div className="relative">
                    <div
                      className={`absolute -left-6 top-0 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ring-4 ring-white shadow-xs ${
                        selectedCase.company_response ? "bg-emerald-600" : "bg-amber-500"
                      }`}
                    >
                      2
                    </div>
                    {selectedCase.company_response ? (
                      <div className="rounded-2xl border border-emerald-300 bg-emerald-50/70 p-3.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">🏢</span>
                            <h5 className="font-bold text-xs text-emerald-900">
                              Company Corrective Action & Proof Received
                            </h5>
                            <span className="rounded-full bg-emerald-200 px-2 py-0.5 text-[9px] font-extrabold text-emerald-800">
                              SUBMITTED
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-700">
                            {new Date(selectedCase.company_response.responded_at).toLocaleString("en-IN")}
                          </span>
                        </div>

                        <div className="mt-2 rounded-xl bg-white/95 border border-emerald-200 p-3 text-xs leading-relaxed text-slate-800">
                          "{selectedCase.company_response.response_text}"
                        </div>

                        {selectedCase.company_response.proof_submitted && (
                          <div className="mt-2 flex items-center gap-2 text-[11px] text-emerald-800">
                            <span>📎</span>
                            <span className="font-semibold">Attached Rectification Reference:</span>
                            <span className="font-mono font-bold bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                              {selectedCase.company_response.proof_submitted}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/60 p-3.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">⏳</span>
                            <h5 className="font-bold text-xs text-amber-900">
                              Awaiting Company Response
                            </h5>
                          </div>
                          <span className="text-[10px] font-bold text-amber-700">PENDING</span>
                        </div>
                        <p className="mt-1.5 text-[11px] text-amber-800 leading-relaxed">
                          Statutory notice delivered to manufacturer (<span className="font-mono font-bold">{selectedCase.company_id}</span>). Awaiting submission of packaging plate realignment proof and corrective batch timeline.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* STEP 3: Inspector Determination & Resolution */}
                  <div className="relative">
                    <div
                      className={`absolute -left-6 top-0 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ring-4 ring-white shadow-xs ${
                        selectedCase.status === "RESOLVED"
                          ? "bg-emerald-600"
                          : selectedCase.status === "ESCALATED_URGENT"
                          ? "bg-red-600"
                          : "bg-slate-400"
                      }`}
                    >
                      3
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">⚖️</span>
                          <h5 className="font-bold text-xs text-slate-900">
                            Inspector Verification & Final Determination
                          </h5>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase ${
                            selectedCase.status === "RESOLVED"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : selectedCase.status === "ESCALATED_URGENT"
                              ? "bg-red-100 text-red-800 border border-red-200"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {selectedCase.status.replace("_", " ")}
                        </span>
                      </div>

                      {selectedCase.status === "RESOLVED" ? (
                        <div className="mt-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                          <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                            <span>✓</span> Docket Resolved & Rectification Approved
                          </div>
                          {selectedCase.inspector_notes && (
                            <p className="mt-1 text-xs text-emerald-800">
                              <strong>Inspector Directives:</strong> {selectedCase.inspector_notes}
                            </p>
                          )}
                          <p className="mt-1.5 text-[10px] text-emerald-600">
                            Package meets Legal Metrology Rules, 2011 compliance requirements following corrective proof submission.
                          </p>
                        </div>
                      ) : (
                        <div className="mt-2.5 space-y-2.5">
                          {selectedCase.status === "ESCALATED_URGENT" && (
                            <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-red-900">
                              <p className="font-bold text-xs">🚨 Case Escalated for Legal Enforcement</p>
                              {selectedCase.inspector_notes && (
                                <p className="mt-1 text-xs text-red-800">
                                  <strong>Enforcement Remarks:</strong> {selectedCase.inspector_notes}
                                </p>
                              )}
                            </div>
                          )}

                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                              Inspector Directives & Rectification Remarks:
                            </label>
                            <textarea
                              value={inspectorNotesInput}
                              onChange={(e) => setInspectorNotesInput(e.target.value)}
                              rows={2}
                              placeholder="Enter statutory directives, artwork cylinder verification notes, or packaging inspection instructions..."
                              className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none"
                            />
                          </div>

                          <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus("RESOLVED")}
                              className="flex-1 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-1.5"
                            >
                              <span>✓</span>
                              <span>Accept Rectification & Mark Resolved</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus("ESCALATED_URGENT")}
                              className="flex-1 rounded-xl bg-red-600 py-2 text-xs font-bold text-white hover:bg-red-700 shadow-md shadow-red-600/20 transition flex items-center justify-center gap-1.5"
                            >
                              <span>🚨</span>
                              <span>Escalate as Urgent Case</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
