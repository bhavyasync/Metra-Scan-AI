"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  generatePDFReport,
} from "../lib/api";


interface ReportReviewProps {
  file: File | null;
  result: any;
}


export default function ReportReview({
  file,
  result,
}: ReportReviewProps) {

  const [reviewerName, setReviewerName] =
    useState("");

  const [decision, setDecision] =
    useState(
      "Not Reviewed"
    );

  const [comments, setComments] =
    useState("");

  const [finalNote, setFinalNote] =
    useState("");

  const [generating, setGenerating] =
    useState(false);

  const [generated, setGenerated] =
    useState(false);

  const [error, setError] =
    useState("");


  const score = useMemo(() => {
    return Number(
      result?.compliance
        ?.compliance_score ?? 0
    );
  }, [result]);


  if (!result) {
    return null;
  }


  async function handleGenerate() {

    if (!file) {
      setError(
        "The original product image is unavailable."
      );
      return;
    }

    try {

      setGenerating(true);
      setError("");
      setGenerated(false);

      const reportData = {
        scan_id:
          `LL-MS-${new Date()
            .toISOString()
            .replace(/\D/g, "")
            .slice(0, 14)}`,

        scan_mode:
          file.name.startsWith(
            "metrascan-camera-"
          )
            ? "Camera"
            : "Upload",

        compliance:
          result.compliance ?? {},

        ocr:
          result.ocr ?? {},

        declarations:
          result.declarations ?? {},

        review: {
          reviewer_name:
            reviewerName,

          decision,

          comments,

          final_note: finalNote,

          reviewed_at:
            new Date().toLocaleString(
              "en-IN"
            ),
        },
      };


      const blob =
        await generatePDFReport(
          file,
          reportData
        );


      const url =
        window.URL.createObjectURL(
          blob
        );

      const anchor =
        document.createElement(
          "a"
        );

      anchor.href = url;

      anchor.download =
        `${reportData.scan_id}.pdf`;

      document.body.appendChild(
        anchor
      );

      anchor.click();

      anchor.remove();

      window.URL.revokeObjectURL(
        url
      );

      setGenerated(true);

    } catch (err) {

      console.error(
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to generate report."
      );

    } finally {

      setGenerating(false);

    }
  }


  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-slate-500">
            Human verification
          </p>
          <h3 className="mt-1 text-xl font-black tracking-tight text-slate-900">
            Review & Generate Report
          </h3>
          <p className="mt-2 max-w-xl text-xs leading-6 text-slate-500">
            Review the automated findings, add your observations and generate the official Logic Legends screening report.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
          <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500 font-bold">
            Current score
          </p>
          <p className="mt-1 text-2xl font-black text-slate-900">
            {Math.round(score)}
            <span className="text-xs text-slate-500"> / 100</span>
          </p>
        </div>
      </div>

      {/* Reviewer */}
      <div className="mt-6">
        <label className="text-xs font-bold text-slate-700">
          Reviewer name
        </label>
        <input
          value={reviewerName}
          onChange={(event) => setReviewerName(event.target.value)}
          placeholder="Enter reviewer name"
          className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white"
        />
      </div>

      {/* Decision */}
      <div className="mt-5">
        <label className="text-xs font-bold text-slate-700">
          Review decision
        </label>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {[
            "Not Reviewed",
            "Reviewed",
            "Requires Further Inspection",
            "Re-scan Required",
          ].map((option) => {
            const active = decision === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setDecision(option)}
                className={`rounded-2xl border px-4 py-3 text-left text-xs font-semibold transition ${
                  active
                    ? "border-emerald-300 bg-emerald-50 text-emerald-900 font-bold shadow-2xs"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {active && <span className="mr-2 text-emerald-600 font-black">✓</span>}
                {option}
              </button>
            );
          })}
        </div>
      </div>

      {/* Comments */}
      <div className="mt-5">
        <label className="text-xs font-bold text-slate-700">
          Reviewer comments
        </label>
        <textarea
          value={comments}
          onChange={(event) => setComments(event.target.value)}
          placeholder="Record observations, corrections, missing declarations, packaging issues, or other review notes..."
          rows={5}
          className="mt-2 w-full resize-none rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white"
        />
      </div>

      {/* Final note */}
      <div className="mt-5">
        <label className="text-xs font-bold text-slate-700">
          Final reviewer note
        </label>
        <textarea
          value={finalNote}
          onChange={(event) => setFinalNote(event.target.value)}
          placeholder="Final assessment or action to be taken..."
          rows={4}
          className="mt-2 w-full resize-none rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs leading-5 text-red-900">
          {error}
        </div>
      )}

      {/* Success */}
      {generated && (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs leading-5 text-emerald-900 font-medium">
          PDF report generated successfully. The report contains your review information and Logic Legends watermark.
        </div>
      )}

      {/* Generate */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={generating || !file}
        className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black text-white transition hover:bg-emerald-700 shadow-md shadow-emerald-600/20 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {generating ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            Generating professional report...
          </>
        ) : (
          <>
            <span className="text-lg">↓</span>
            Generate PDF Report
          </>
        )}
      </button>


      <p className="mt-3 text-center text-[10px] leading-5 text-white/20">
        Report branding: Logic Legends ·
        MetraScan AI · Scanned & Verified
      </p>

    </section>
  );
}