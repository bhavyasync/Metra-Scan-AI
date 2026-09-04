"use client";

import { useState } from "react";

import ImageUploader from "../../components/ImageUploader";
import CameraScanner from "../../components/CameraScanner";
import ReportReview from "../../components/ReportReview";
import { scanProduct } from "../../lib/api";


export default function ScanPage() {

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [previewUrl, setPreviewUrl] =
    useState<string | null>(null);

  const [showCamera, setShowCamera] =
    useState(false);

  const [scanning, setScanning] =
    useState(false);

  const [result, setResult] =
    useState<any>(null);

  const [error, setError] =
    useState("");


  // =========================================================
  // FILE SELECT
  // =========================================================

  const handleImageSelect = (
    file: File
  ) => {

    setSelectedFile(file);

    setPreviewUrl(
      URL.createObjectURL(file)
    );

    setResult(null);

    setError("");
  };


  // =========================================================
  // CAMERA CAPTURE
  // =========================================================

  const handleCameraCapture = (
    file: File
  ) => {

    setSelectedFile(file);

    setPreviewUrl(
      URL.createObjectURL(file)
    );

    setShowCamera(false);

    setResult(null);

    setError("");
  };


  // =========================================================
  // SCAN PRODUCT
  // =========================================================

  const handleScan = async () => {

    if (!selectedFile) {

      setError(
        "Please upload an image or capture a product photo first."
      );

      return;
    }

    try {

      setScanning(true);

      setError("");

      setResult(null);

      const data =
        await scanProduct(
          selectedFile
        );

      setResult(data);

    } catch (err) {

      console.error(
        "Scan error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to scan product."
      );

    } finally {

      setScanning(false);
    }
  };


  // =========================================================
  // RESET
  // =========================================================

  const handleReset = () => {

    if (previewUrl) {
      URL.revokeObjectURL(
        previewUrl
      );
    }

    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError("");
    setShowCamera(false);
  };


  return (

    <main className="min-h-screen bg-[#07090c] text-white">

      {/* =====================================================
          AMBIENT BACKGROUND
      ===================================================== */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">

        <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px]" />

        <div className="absolute -right-40 top-1/3 h-96 w-96 rounded-full bg-violet-500/10 blur-[120px]" />

        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

      </div>


      {/* =====================================================
          MAIN CONTAINER
      ===================================================== */}

      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* ===================================================
            HEADER
        =================================================== */}

        <header className="mb-8 flex items-center justify-between">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white font-black text-black shadow-lg">
              M
            </div>

            <div>

              <div className="flex items-center gap-2">

                <h1 className="text-lg font-bold tracking-tight">
                  MetraScan
                </h1>

                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-bold tracking-[0.2em] text-white/40">
                  AI
                </span>

              </div>

              <p className="text-[11px] text-white/35">
                Logic Legends
              </p>

            </div>

          </div>


          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2">

            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />

            <span className="text-[10px] font-semibold text-white/45">
              AI ENGINE READY
            </span>

          </div>

        </header>


        {/* ===================================================
            HERO
        =================================================== */}

        <section className="mb-8 max-w-3xl">

          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-300/60">
            Real-time package intelligence
          </p>

          <h2 className="text-4xl font-black tracking-[-0.04em] sm:text-5xl">
            Scan.
            <br />

            <span className="bg-gradient-to-r from-white via-white to-white/30 bg-clip-text text-transparent">
              Analyze.
            </span>

            <br />

            Review.
          </h2>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/40 sm:text-base">
            Capture or upload a packaged commodity and
            MetraScan AI extracts visible declarations,
            evaluates available evidence and prepares a
            professional screening report.
          </p>

        </section>


        {/* ===================================================
            WORKSPACE
        =================================================== */}

        <div className="grid gap-6 xl:grid-cols-2">


          {/* =================================================
              LEFT — SCANNER
          ================================================= */}

          <section className="rounded-[30px] border border-white/10 bg-white/[0.035] p-5 shadow-2xl backdrop-blur-xl sm:p-6">

            <div className="mb-6">

              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/25">
                Capture source
              </p>

              <h3 className="mt-1 text-xl font-black">
                Product Scanner
              </h3>

              <p className="mt-1 text-xs text-white/35">
                Upload a package image or capture it live.
              </p>

            </div>


            {/* CAMERA */}

            {showCamera ? (

              <CameraScanner
                onCapture={
                  handleCameraCapture
                }
                onClose={() =>
                  setShowCamera(false)
                }
              />

            ) : (

              <div className="space-y-5">

                {/* UPLOAD */}

                <div className="rounded-3xl border border-white/10 bg-black/20 p-2">

                  <ImageUploader
                    onImageSelect={
                      handleImageSelect
                    }
                  />

                </div>


                {/* DIVIDER */}

                <div className="flex items-center gap-3">

                  <div className="h-px flex-1 bg-white/10" />

                  <span className="text-[10px] font-bold tracking-[0.2em] text-white/20">
                    OR
                  </span>

                  <div className="h-px flex-1 bg-white/10" />

                </div>


                {/* CAMERA BUTTON */}

                <button
                  type="button"
                  onClick={() =>
                    setShowCamera(true)
                  }
                  className="group flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.025] px-5 py-4 text-sm font-bold text-white/70 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
                >

                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-lg transition group-hover:bg-white group-hover:text-black">
                    ◉
                  </span>

                  Use Camera

                </button>

              </div>

            )}


            {/* =================================================
                IMAGE PREVIEW
            ================================================= */}

            {previewUrl &&
              !showCamera && (

                <div className="mt-6">

                  <div className="mb-3 flex items-center justify-between">

                    <div>

                      <p className="text-xs font-bold text-white/75">
                        Selected Package
                      </p>

                      <p className="mt-1 max-w-[300px] truncate text-[10px] text-white/25">
                        {selectedFile?.name}
                      </p>

                    </div>

                    <button
                      type="button"
                      onClick={handleReset}
                      className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-bold text-white/40 transition hover:bg-white/5 hover:text-white"
                    >
                      Remove
                    </button>

                  </div>


                  <div className="overflow-hidden rounded-3xl border border-white/10 bg-black">

                    <img
                      src={previewUrl}
                      alt="Selected product"
                      className="max-h-[480px] w-full object-contain"
                    />

                  </div>

                </div>

              )}


            {/* =================================================
                ERROR
            ================================================= */}

            {error && (

              <div className="mt-5 rounded-2xl border border-red-400/15 bg-red-500/5 p-4">

                <div className="flex items-start gap-3">

                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-400/10 text-red-300">
                    !
                  </div>

                  <div>

                    <p className="text-xs font-bold text-red-200">
                      Scan unavailable
                    </p>

                    <p className="mt-1 text-[11px] leading-5 text-red-200/50">
                      {error}
                    </p>

                  </div>

                </div>

              </div>

            )}


            {/* =================================================
                SCAN BUTTON
            ================================================= */}

            {!showCamera && (

              <button
                type="button"
                onClick={handleScan}
                disabled={
                  !selectedFile ||
                  scanning
                }
                className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-5 py-4 text-sm font-black text-black shadow-xl transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-25"
              >

                {scanning ? (

                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />

                    Analyzing Package...

                  </>

                ) : (

                  <>
                    <span className="text-lg">
                      →
                    </span>

                    Scan & Analyze

                  </>
                )}

              </button>

            )}


            {/* =================================================
                TIPS
            ================================================= */}

            {!selectedFile &&
              !showCamera && (

                <div className="mt-4 grid grid-cols-3 gap-2">

                  <Tip
                    title="Clear"
                    text="Avoid blur"
                  />

                  <Tip
                    title="Flat"
                    text="Minimize glare"
                  />

                  <Tip
                    title="Full"
                    text="Show package"
                  />

                </div>

              )}

          </section>


          {/* =================================================
              RIGHT — RESULTS
          ================================================= */}

          <section className="rounded-[30px] border border-white/10 bg-white/[0.035] p-5 shadow-2xl backdrop-blur-xl sm:p-6">

            <div className="mb-6">

              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/25">
                Intelligence console
              </p>

              <h3 className="mt-1 text-xl font-black">
                Analysis Results
              </h3>

            </div>


            {/* =================================================
                EMPTY
            ================================================= */}

            {!result &&
              !scanning && (

                <div className="flex min-h-[500px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-black/10 p-8 text-center">

                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03] text-3xl">
                    ⌁
                  </div>

                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/20">
                    Waiting for package
                  </p>

                  <h4 className="mt-3 text-2xl font-black">
                    No analysis yet
                  </h4>

                  <p className="mt-3 max-w-sm text-xs leading-6 text-white/30">
                    Upload a package image or use the
                    camera. Your declarations, evidence
                    and compliance result will appear here.
                  </p>

                  <div className="mt-7 grid w-full max-w-sm grid-cols-2 gap-2">

                    <ConsoleItem
                      title="OCR"
                      text="Text extraction"
                    />

                    <ConsoleItem
                      title="Declarations"
                      text="Field detection"
                    />

                    <ConsoleItem
                      title="Evidence"
                      text="Traceable results"
                    />

                    <ConsoleItem
                      title="Report"
                      text="PDF review"
                    />

                  </div>

                </div>

              )}


            {/* =================================================
                SCANNING
            ================================================= */}

            {scanning && (

              <div className="flex min-h-[500px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-black/10">

                <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-white/10">

                  <div className="absolute inset-2 animate-spin rounded-full border-2 border-white/10 border-t-white" />

                  <span className="text-xl">
                    M
                  </span>

                </div>

                <h4 className="mt-7 text-xl font-black">
                  Analyzing package
                </h4>

                <p className="mt-2 text-xs text-white/30">
                  OCR → declarations → compliance
                </p>

              </div>

            )}


            {/* =================================================
                RESULTS
            ================================================= */}

            {result && (

              <div className="space-y-5">

                {/* COMPLIANCE SUMMARY */}

                {result.compliance && (

                  <div className="rounded-3xl border border-white/10 bg-black/20 p-5">

                    <div className="flex items-center justify-between gap-5">

                      <div>

                        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/25">
                          Compliance screening
                        </p>

                        <h4 className="mt-2 text-xl font-black">
                          {formatStatus(
                            result.compliance.status ||
                              "Unknown"
                          )}
                        </h4>

                      </div>

                      <div className="text-right">

                        <p className="text-4xl font-black tracking-tight">
                          {
                            result.compliance
                              .compliance_score ??
                            0
                          }
                        </p>

                        <p className="text-[9px] uppercase tracking-[0.15em] text-white/25">
                          out of 100
                        </p>

                      </div>

                    </div>


                    <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/5">

                      <div
                        className="h-full rounded-full bg-white transition-all duration-700"
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(
                              100,
                              Number(
                                result
                                  .compliance
                                  .compliance_score ??
                                  0
                              )
                            )
                          )}%`,
                        }}
                      />

                    </div>

                  </div>

                )}


                {/* =================================================
                    OCR METRICS
                ================================================= */}

                {result.ocr && (

                  <div className="grid grid-cols-2 gap-3">

                    <MetricCard
                      label="OCR Confidence"
                      value={`${result.ocr.confidence ?? 0}%`}
                    />

                    <MetricCard
                      label="Detected Words"
                      value={`${result.ocr.word_count ?? 0}`}
                    />

                  </div>

                )}


                {/* =================================================
                    DECLARATIONS
                ================================================= */}

                {result.declarations && (

                  <section>

                    <SectionHeader
                      title="Detected Declarations"
                      subtitle="Evidence extracted from the submitted image"
                    />

                    <div className="mt-3 space-y-2">

                      <DeclarationCard
                        title="MRP"
                        data={
                          result.declarations.mrp
                        }
                      />

                      <DeclarationCard
                        title="Net Quantity"
                        data={
                          result.declarations.net_quantity
                        }
                      />

                      <DeclarationCard
                        title="Best Before"
                        data={
                          result.declarations
                            .dates
                            ?.best_before
                        }
                      />

                      <DeclarationCard
                        title="Manufacturing Date"
                        data={
                          result.declarations
                            .dates
                            ?.manufacturing_date
                        }
                      />

                      <DeclarationCard
                        title="Packing Date"
                        data={
                          result.declarations
                            .dates
                            ?.packing_date
                        }
                      />

                      <DeclarationCard
                        title="Expiry Date"
                        data={
                          result.declarations
                            .dates
                            ?.expiry_date
                        }
                      />

                      <DeclarationCard
                        title="Batch / Lot"
                        data={
                          result.declarations.batch
                        }
                      />

                      <DeclarationCard
                        title="Storage"
                        data={
                          result.declarations.storage
                        }
                      />

                    </div>

                  </section>

                )}


                {/* =================================================
                    COMPANY
                ================================================= */}

                {result.declarations
                  ?.company_details && (

                  <section>

                    <SectionHeader
                      title="Company Details"
                      subtitle="Manufacturer and supply-chain information"
                    />

                    <div className="mt-3 space-y-2">

                      <DeclarationCard
                        title="Manufacturer"
                        data={
                          result.declarations
                            .company_details
                            .manufacturer
                        }
                      />

                      <DeclarationCard
                        title="Packer"
                        data={
                          result.declarations
                            .company_details
                            .packer
                        }
                      />

                      <DeclarationCard
                        title="Importer"
                        data={
                          result.declarations
                            .company_details
                            .importer
                        }
                      />

                    </div>

                  </section>

                )}


                {/* =================================================
                    CONSUMER CARE
                ================================================= */}

                {result.declarations
                  ?.consumer_care && (

                  <DeclarationCard
                    title="Consumer Care"
                    data={
                      result.declarations
                        .consumer_care
                    }
                  />

                )}


                {/* =================================================
                    REPORT REVIEW
                ================================================= */}

                <ReportReview
                  file={selectedFile}
                  result={result}
                />


                {/* =================================================
                    RAW OCR
                ================================================= */}

                {result.ocr?.text && (

                  <details className="rounded-3xl border border-white/10 bg-black/20">

                    <summary className="cursor-pointer px-5 py-4 text-sm font-bold text-white/70">
                      Raw OCR Evidence
                    </summary>

                    <div className="border-t border-white/10 p-5">

                      <pre className="max-h-[350px] overflow-auto whitespace-pre-wrap text-[10px] leading-6 text-white/30">
                        {
                          result.ocr.text
                        }
                      </pre>

                    </div>

                  </details>

                )}


                {/* =================================================
                    RESET
                ================================================= */}

                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.025] px-5 py-4 text-sm font-bold text-white/55 transition hover:bg-white/[0.05] hover:text-white"
                >
                  Start New Scan
                </button>

              </div>

            )}

          </section>

        </div>


        {/* ===================================================
            FOOTER
        =================================================== */}

        <footer className="mt-10 flex flex-col gap-2 border-t border-white/5 pt-6 text-[10px] text-white/20 sm:flex-row sm:items-center sm:justify-between">

          <span>
            LOGIC LEGENDS · METRASCAN AI
          </span>

          <span>
            Automated package screening • Human review supported
          </span>

        </footer>

      </div>

    </main>
  );
}


// ============================================================
// SECTION HEADER
// ============================================================

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {

  return (
    <div>

      <h4 className="text-sm font-black text-white/85">
        {title}
      </h4>

      <p className="mt-1 text-[10px] text-white/25">
        {subtitle}
      </p>

    </div>
  );
}


// ============================================================
// METRIC CARD
// ============================================================

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">

      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/25">
        {label}
      </p>

      <p className="mt-2 text-xl font-black">
        {value}
      </p>

    </div>
  );
}


// ============================================================
// DECLARATION CARD
// ============================================================

function DeclarationCard({
  title,
  data,
}: {
  title: string;
  data: any;
}) {

  if (!data) {
    return null;
  }

  const status =
    data.status ||
    "NOT_DETECTED";

  let statusClass =
    "border-white/8 bg-white/[0.02] text-white/35";

  let badgeText =
    "Not detected";

  if (
    status === "DETECTED"
  ) {

    statusClass =
      "border-emerald-400/15 bg-emerald-400/5 text-emerald-200";

    badgeText =
      "Detected";
  }

  if (
    status === "NEEDS_REVIEW"
  ) {

    statusClass =
      "border-amber-300/15 bg-amber-300/5 text-amber-200";

    badgeText =
      "Review";
  }

  if (
    status === "VIOLATION"
  ) {

    statusClass =
      "border-red-400/15 bg-red-400/5 text-red-200";

    badgeText =
      "Violation";
  }


  let value =
    "No evidence detected";


  if (
    data.value !== null &&
    data.value !== undefined &&
    String(data.value).trim() !== ""
  ) {

    value =
      String(data.value);

    if (data.unit) {

      value +=
        ` ${data.unit}`;
    }

    if (
      data.currency &&
      !value.includes(
        data.currency
      )
    ) {

      value =
        `${data.currency} ${value}`;
    }
  }


  if (
    data.phone ||
    data.email ||
    data.website
  ) {

    value = [
      data.phone,
      data.email,
      data.website,
    ]
      .filter(Boolean)
      .join(" • ");

  }


  return (

    <div className="rounded-2xl border border-white/8 bg-black/10 p-4 transition hover:bg-white/[0.025]">

      <div className="flex items-start justify-between gap-4">

        <div className="min-w-0">

          <p className="text-xs font-bold text-white/75">
            {title}
          </p>

          <p className="mt-2 break-words text-sm font-medium leading-6 text-white/45">
            {value}
          </p>

        </div>


        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide ${statusClass}`}
        >
          {badgeText}
        </span>

      </div>


      {data.confidence !==
        undefined &&
        Number(
          data.confidence
        ) > 0 && (

          <div className="mt-4">

            <div className="mb-1 flex justify-between text-[9px] uppercase tracking-wide text-white/20">

              <span>
                Confidence
              </span>

              <span>
                {Math.round(
                  Number(
                    data.confidence
                  ) * 100
                )}
                %
              </span>

            </div>


            <div className="h-1 overflow-hidden rounded-full bg-white/5">

              <div
                className="h-full rounded-full bg-white/50"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      0,
                      Number(
                        data.confidence
                      ) * 100
                    )
                  )}%`,
                }}
              />

            </div>

          </div>

        )}


      {data.evidence && (

        <div className="mt-4 rounded-xl border border-white/6 bg-black/20 p-3">

          <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-white/20">
            Evidence
          </p>

          <p className="mt-1 text-[10px] leading-5 text-white/35">
            {data.evidence}
          </p>

        </div>

      )}

    </div>

  );
}


// ============================================================
// TIP
// ============================================================

function Tip({
  title,
  text,
}: {
  title: string;
  text: string;
}) {

  return (

    <div className="rounded-xl border border-white/7 bg-white/[0.02] p-3 text-center">

      <p className="text-[10px] font-bold text-white/55">
        {title}
      </p>

      <p className="mt-1 text-[9px] text-white/20">
        {text}
      </p>

    </div>

  );
}


// ============================================================
// CONSOLE ITEM
// ============================================================

function ConsoleItem({
  title,
  text,
}: {
  title: string;
  text: string;
}) {

  return (

    <div className="rounded-2xl border border-white/7 bg-white/[0.02] p-3 text-left">

      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/20">
        {title}
      </p>

      <p className="mt-1 text-[10px] font-semibold text-white/45">
        {text}
      </p>

    </div>

  );
}


// ============================================================
// STATUS FORMATTER
// ============================================================

function formatStatus(
  status: string
) {

  return String(
    status
  )
    .replaceAll(
      "_",
      " "
    )
    .toLowerCase()
    .replace(
      /\b\w/g,
      (char) =>
        char.toUpperCase()
    );
}