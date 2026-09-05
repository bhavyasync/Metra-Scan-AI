"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Sidebar, { ActiveTab } from "../components/Sidebar";
import Header from "../components/Header";
import InspectorInbox from "../components/InspectorInbox";
import CompanyInbox from "../components/CompanyInbox";
import AdminDashboard from "../components/AdminDashboard";
import ConsumerDashboard from "../components/ConsumerDashboard";
import RulesGuide from "../components/RulesGuide";
import ImageUploader from "../components/ImageUploader";
import CameraScanner from "../components/CameraScanner";
import ReportReview from "../components/ReportReview";
import { useAuth } from "../lib/auth-context";
import {
  useNoticesStore,
  ViolationSeverity,
  getProductFlagCounters,
  incrementProductFlagCounter,
} from "../lib/notices-store";
import { scanProduct, generatePDFReport } from "../lib/api";

interface PresetSample {
  id: string;
  name: string;
  brand: string;
  category: string;
  companyId: string;
  complianceVerdict: "COMPLIANT" | "CRITICAL_VIOLATION" | "MAJOR_VIOLATION";
  score: number;
  description: string;
  declarations: any;
  violations: string[];
  rules: string[];
  svgGraphic: string;
}

const PRESET_SAMPLES: PresetSample[] = [
  {
    id: "sample-amul",
    name: "Amul Pasteurised Butter 500g",
    brand: "Amul",
    category: "Dairy & Fats",
    companyId: "amul_india",
    complianceVerdict: "COMPLIANT",
    score: 96,
    description: "Fully compliant packaging with bold MRP, standard net quantity, and clear consumer care.",
    declarations: {
      mrp: { value: "₹ 285.00", status: "DETECTED", confidence: 0.96, evidence: "MRP Rs 285.00 INCL. OF ALL TAXES" },
      net_quantity: { value: "500 g", status: "DETECTED", confidence: 0.98, evidence: "NET WT: 500g (0.5 kg)" },
      dates: {
        manufacturing_date: { value: "14/08/2026", status: "DETECTED", confidence: 0.94 },
        best_before: { value: "12 MONTHS FROM PACKAGING", status: "DETECTED", confidence: 0.92 },
      },
      batch: { value: "B-4921", status: "DETECTED", confidence: 0.95 },
      company_details: {
        manufacturer: { value: "Gujarat Co-op Milk Mktg Federation Ltd, Anand", status: "DETECTED" },
      },
      consumer_care: {
        phone: "1800-258-3333",
        email: "care@amul.coop",
        status: "DETECTED",
      },
    },
    violations: [],
    rules: ["Complies with Rule 6(1) and Rule 9 Table 1."],
    svgGraphic: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='400' height='300' fill='%23fef08a' rx='20'/><rect x='20' y='20' width='360' height='260' fill='%23facc15' rx='16'/><text x='40' y='70' font-family='sans-serif' font-size='28' font-weight='900' fill='%23b45309'>Amul</text><text x='40' y='100' font-family='sans-serif' font-size='16' font-weight='bold' fill='%2378350f'>PASTEURISED BUTTER</text><rect x='40' y='125' width='320' height='2' fill='%23b45309'/><text x='40' y='155' font-family='sans-serif' font-size='14' font-weight='bold' fill='%230f172a'>Net Quantity: 500 g</text><text x='40' y='180' font-family='sans-serif' font-size='14' font-weight='bold' fill='%230f172a'>MRP: ₹ 285.00 (Incl. all taxes)</text><text x='40' y='205' font-family='sans-serif' font-size='12' fill='%23334155'>Mfg Date: 14/08/2026 • Lot B-4921</text><text x='40' y='230' font-family='sans-serif' font-size='11' fill='%23334155'>Care: 1800-258-3333 | care@amul.coop</text><rect x='40' y='245' width='140' height='20' fill='%2310b981' rx='4'/><text x='50' y='259' font-family='sans-serif' font-size='10' font-weight='bold' fill='white'>LEGAL METROLOGY OK</text></svg>",
  },
  {
    id: "sample-spices",
    name: "Royal Spices Garam Masala 100g",
    brand: "Royal Spices",
    category: "Spices & Condiments",
    companyId: "royal_spices",
    complianceVerdict: "CRITICAL_VIOLATION",
    score: 38,
    description: "Missing mandatory MRP declaration; net quantity font height is below 4mm threshold.",
    declarations: {
      mrp: { value: null, status: "VIOLATION", confidence: 0.12, evidence: "PRICE TAG OBSCURED ON CRIMP" },
      net_quantity: { value: "100g (Height: 1.8mm)", status: "VIOLATION", confidence: 0.88, evidence: "Net Wt 100g in illegible sub-standard font" },
      dates: {
        manufacturing_date: { value: "06/2026", status: "DETECTED", confidence: 0.85 },
      },
      batch: { value: "RS-890", status: "DETECTED", confidence: 0.9 },
      company_details: {
        manufacturer: { value: "Royal Spice Mills, Delhi", status: "DETECTED" },
      },
      consumer_care: { phone: null, email: null, status: "NOT_DETECTED" },
    },
    violations: [
      "Rule 6(1)(e): Maximum Retail Price (MRP) missing or altered.",
      "Rule 9(3): Net quantity numeral height (1.8mm) violates statutory 4.0mm minimum for 100g package.",
      "Rule 6(1)(f): Consumer grievance redressal phone or email absent.",
    ],
    rules: [
      "Section 36(1) of Legal Metrology Act, 2009",
      "Rule 6(1)(e) & Rule 9(3) of Packaged Commodities Rules, 2011",
    ],
    svgGraphic: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='400' height='300' fill='%23450a0a' rx='20'/><rect x='20' y='20' width='360' height='260' fill='%237f1d1d' rx='16'/><text x='40' y='70' font-family='sans-serif' font-size='26' font-weight='900' fill='%23f87171'>ROYAL SPICES</text><text x='40' y='100' font-family='sans-serif' font-size='16' font-weight='bold' fill='white'>SPECIAL GARAM MASALA</text><rect x='40' y='120' width='320' height='2' fill='%23b91c1c'/><text x='40' y='150' font-family='sans-serif' font-size='11' fill='%23fca5a5'>Net Wt: 100g [Font 1.8mm VIOLATION]</text><rect x='40' y='165' width='220' height='28' fill='%23ef4444' rx='6'/><text x='50' y='184' font-family='sans-serif' font-size='12' font-weight='bold' fill='white'>MRP: [MISSING / ILLEGIBLE]</text><text x='40' y='220' font-family='sans-serif' font-size='11' fill='%23fca5a5'>Customer Care: NOT DETECTED</text><rect x='40' y='245' width='160' height='22' fill='%23dc2626' rx='4'/><text x='48' y='260' font-family='sans-serif' font-size='10' font-weight='bold' fill='white'>CRITICAL NON-COMPLIANCE</text></svg>",
  },
  {
    id: "sample-cookies",
    name: "Crispy Crunch Cashew Cookies 250g",
    brand: "Crispy Crunch",
    category: "Confectionery",
    companyId: "crispy_bakes",
    complianceVerdict: "MAJOR_VIOLATION",
    score: 61,
    description: "Font size violation for Net Quantity and missing toll-free consumer redressal number.",
    declarations: {
      mrp: { value: "₹ 55.00", status: "DETECTED", confidence: 0.91, evidence: "MRP Rs 55/-" },
      net_quantity: { value: "250g (Font: 2.1mm)", status: "NEEDS_REVIEW", confidence: 0.82, evidence: "Net Wt: 250g" },
      dates: {
        manufacturing_date: { value: "07/2026", status: "DETECTED", confidence: 0.88 },
      },
      batch: { value: "CK-102", status: "DETECTED", confidence: 0.86 },
      company_details: {
        manufacturer: { value: "Crispy Crunch Foods, Okhla Phase III", status: "DETECTED" },
      },
      consumer_care: { phone: null, email: "help@crispycrunch.in", status: "NEEDS_REVIEW" },
    },
    violations: [
      "Rule 9(3): Net Quantity numeral height 2.1mm is below mandatory 4.0mm height for packages > 200g.",
      "Rule 6(1)(f): Absence of a telephone helpline for consumer grievances.",
    ],
    rules: ["Rule 9(3) & Rule 6(1)(f) of Packaged Commodities Rules, 2011"],
    svgGraphic: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='400' height='300' fill='%23431407' rx='20'/><rect x='20' y='20' width='360' height='260' fill='%237c2d12' rx='16'/><text x='40' y='70' font-family='sans-serif' font-size='24' font-weight='900' fill='%23fdba74'>CRISPY CRUNCH</text><text x='40' y='98' font-family='sans-serif' font-size='15' font-weight='bold' fill='white'>Rich Cashew Delight Cookies</text><rect x='40' y='120' width='320' height='2' fill='%23c2410c'/><text x='40' y='150' font-family='sans-serif' font-size='13' fill='white'>MRP: ₹ 55.00 (Incl. of all taxes)</text><text x='40' y='180' font-family='sans-serif' font-size='12' fill='%23fed7aa'>Net Quantity: 250g [Font 2.1mm - Rule 9 Violation]</text><text x='40' y='210' font-family='sans-serif' font-size='11' fill='%23fed7aa'>Email: help@crispycrunch.in | Phone: NOT FOUND</text><rect x='40' y='245' width='140' height='22' fill='%23ea580c' rx='4'/><text x='50' y='260' font-family='sans-serif' font-size='10' font-weight='bold' fill='white'>MAJOR DEFICIENCY</text></svg>",
  },
];

export default function Home() {
  const { user } = useAuth();
  const { dispatchNotice } = useNoticesStore();

  const [activeTab, setActiveTab] = useState<ActiveTab>("scan");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Scanner states
  const [activeMode, setActiveMode] = useState<"upload" | "camera" | "preset">("preset");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [activeStage, setActiveStage] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [noticeDispatched, setNoticeDispatched] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { notices } = useNoticesStore();

  // Inspector Remarks & Flag Counter
  const [inspectorRemarks, setInspectorRemarks] = useState(
    "Routine packaging inspection conducted under Legal Metrology (Packaged Commodities) Rules, 2011."
  );
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [currentFlagCount, setCurrentFlagCount] = useState(1);
  const [isCurrentUrgent, setIsCurrentUrgent] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  // Adjust active tab when role changes
  useEffect(() => {
    if (user?.role === "inspector" && activeTab === "company-inbox") {
      setActiveTab("inbox");
    } else if (user?.role === "company" && activeTab === "inbox") {
      setActiveTab("company-inbox");
    } else if (user?.role === "admin" && activeTab === "scan") {
      // Keep on scan or admin-hub
    }
  }, [user?.role]);

  // Handle stage transitions during scanning
  useEffect(() => {
    if (!scanning) return;
    setActiveStage(0);
    const interval = setInterval(() => {
      setActiveStage((prev) => (prev < 3 ? prev + 1 : prev));
    }, 800);
    return () => clearInterval(interval);
  }, [scanning]);

  // Clean up object URL
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Load preset sample
  const handleSelectPreset = (sample: PresetSample) => {
    setPreviewUrl(sample.svgGraphic);
    setSelectedFile(null);
    setResult(null);
    setError("");
    setNoticeDispatched(null);

    // Track flag count for this product
    const key = sample.name.toLowerCase().trim();
    const counters = getProductFlagCounters();
    const flags = counters[key] || (sample.complianceVerdict === "CRITICAL_VIOLATION" ? 6 : 1);
    setCurrentFlagCount(flags);
    const urgent = flags > 5;
    setIsCurrentUrgent(urgent);

    setInspectorRemarks(
      sample.complianceVerdict === "COMPLIANT"
        ? "All mandatory declarations (MRP, Net Qty, Mfg Date, Consumer Care) verified and compliant."
        : urgent
        ? `URGENT CASE: Repeat non-compliance detected (${flags} times). Immediate statutory intervention required under Section 36 of Legal Metrology Act.`
        : "Package non-compliance detected. MRP/Net quantity declarations must be rectified by manufacturer."
    );

    // Simulate real-time scan pipeline
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setResult({
        image: { original_filename: sample.name },
        ocr: {
          confidence: sample.score > 80 ? 94 : 86,
          word_count: 78,
          text: `Extracted packaging text from ${sample.name}:\nBrand: ${sample.brand}\n${JSON.stringify(sample.declarations, null, 2)}`,
        },
        declarations: sample.declarations,
        compliance: {
          compliance_score: sample.score,
          status: sample.complianceVerdict === "COMPLIANT" ? "COMPLIANT" : "NEEDS_REVIEW",
          violations: sample.violations,
          rules: sample.rules,
          companyId: sample.companyId,
          sampleName: sample.name,
          brandName: sample.brand,
          flag_count: flags,
          is_urgent: urgent,
        },
      });

      // If non-compliant, alert inspector
      if (sample.complianceVerdict !== "COMPLIANT") {
        if (urgent) {
          showToast(`🚨 URGENT CASE: Flagged ${flags} times! Immediate notice ready for dispatch.`);
        } else {
          showToast(`⚡ Package flagged with ${sample.complianceVerdict.replace("_", " ")}! Notice ready for dispatch.`);
        }
      }
    }, 2200);
  };

  const handleFileUpload = (file: File) => {
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
    setError("");
    setNoticeDispatched(null);

    const key = (file.name || "packaged commodity").toLowerCase().trim();
    const counters = getProductFlagCounters();
    const flags = counters[key] || 1;
    setCurrentFlagCount(flags);
    setIsCurrentUrgent(flags > 5);
  };

  const handleCameraCapture = (file: File) => {
    handleFileUpload(file);
    setShowCamera(false);
  };

  const handleRunRealScan = async () => {
    if (!selectedFile) {
      setError("Please select or capture a product image first.");
      return;
    }

    try {
      setScanning(true);
      setError("");
      setResult(null);
      setNoticeDispatched(null);

      const key = (selectedFile.name || "packaged commodity").toLowerCase().trim();
      const counters = getProductFlagCounters();
      const flags = counters[key] || 1;
      setCurrentFlagCount(flags);
      setIsCurrentUrgent(flags > 5);

      const data = await scanProduct(selectedFile);
      setResult(data);

      if (data.compliance?.violations?.length > 0) {
        showToast("⚠️ Declarations missing or non-compliant! Automated notice dispatch available.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to scan product. Make sure the backend server is running.");
    } finally {
      setScanning(false);
    }
  };

  // Flag & Dispatch Notice to Company
  const handleDispatchNoticeToCompany = () => {
    if (!result) return;

    const comp = result.compliance || {};
    const violations = comp.violations || ["Mandatory declaration non-compliance"];
    const score = comp.compliance_score ?? comp.score ?? 50;

    // Derive Target Company and Brand Name dynamically from detected declarations
    const mfgText = (
      result.declarations?.company_details?.manufacturer?.value ||
      result.declarations?.consumer_care?.cell_name ||
      comp.brandName ||
      ""
    ).toLowerCase();

    let targetCompany = "parle_foods";
    let brandName = "Parle Biscuits Pvt Ltd";

    if (mfgText.includes("parle")) {
      targetCompany = "parle_foods";
      brandName = "Parle Biscuits Pvt Ltd";
    } else if (mfgText.includes("cadbury") || mfgText.includes("mondelez")) {
      targetCompany = "cadbury_mondelez";
      brandName = "Mondelez India Foods Pvt Ltd";
    } else if (mfgText.includes("amul") || mfgText.includes("gcmmf")) {
      targetCompany = "amul_india";
      brandName = "GCMMF Ltd (Amul)";
    } else if (mfgText.includes("britannia")) {
      targetCompany = "britannia_foods";
      brandName = "Britannia Industries Ltd";
    } else if (comp.companyId) {
      targetCompany = comp.companyId;
      brandName = comp.brandName || "Packaged Goods Producer";
    } else {
      const rawBrand = result.declarations?.company_details?.manufacturer?.value || comp.sampleName || "Packaged Goods Producer";
      brandName = rawBrand;
      targetCompany = rawBrand.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 20);
    }

    const prodName =
      comp.sampleName ||
      (selectedFile ? selectedFile.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ") : `${brandName} Packaging Sample`);

    // Increment flag counter
    const newCount = incrementProductFlagCounter(prodName);
    setCurrentFlagCount(newCount);
    const urgent = newCount > 5;
    setIsCurrentUrgent(urgent);

    const severity: ViolationSeverity =
      score < 50 || violations.some((v: any) => typeof v === "string" && (v.toLowerCase().includes("mrp") || v.toLowerCase().includes("quantity")))
        ? "CRITICAL"
        : score < 75
        ? "MAJOR"
        : "MINOR";

    const newNotice = dispatchNotice({
      product_name: prodName,
      brand_name: brandName,
      company_id: targetCompany,
      inspector_id: user?.user_id || "insp_rajesh",
      inspector_name: user?.name || "Rajesh Sharma",
      jurisdiction: user?.jurisdiction || "North Zone (Delhi NCR)",
      severity,
      rule_citations: comp.rules || [
        "Rule 6(1) - Legal Metrology (Packaged Commodities) Rules, 2011",
        "Section 36(1) - Legal Metrology Act, 2009",
      ],
      violations_summary: Array.isArray(violations)
        ? violations.map((v: any) => (typeof v === "string" ? v : v.title || v.message || "Declaration issue"))
        : ["Statutory packaging review flag"],
      detected_declarations: {
        mrp: result.declarations?.mrp?.value ? `₹ ${result.declarations.mrp.value}` : "Not Detected",
        net_quantity: result.declarations?.net_quantity?.value ? `${result.declarations.net_quantity.value} ${result.declarations.net_quantity.unit || "g"}` : "Illegible",
        mfg_date: result.declarations?.dates?.manufacturing_date?.value || result.declarations?.dates?.packing_date?.value,
        consumer_care: result.declarations?.consumer_care?.phone || result.declarations?.consumer_care?.email || result.declarations?.consumer_care?.evidence,
        manufacturer: result.declarations?.company_details?.manufacturer?.value,
      },
      ocr_evidence_snippet: result.ocr?.text?.slice(0, 220) || "Scanned via MetraScan AI",
      inspector_notes: inspectorRemarks || "Inspection flag dispatched under Legal Metrology Rules, 2011.",
    });

    setNoticeDispatched(newNotice);
    showToast(
      urgent
        ? `🚨 URGENT NOTICE (${newNotice.case_number}) dispatched! Flag count reached ${newCount}.`
        : `✓ Official ${severity} Notice (${newNotice.case_number}) dispatched to ${brandName}!`
    );
  };

  // Generate Official PDF with Logic Legends Watermark
  const handleGeneratePDF = async () => {
    if (!result) return;
    try {
      setIsGeneratingPdf(true);

      let fileToUse = selectedFile;
      if (!fileToUse) {
        const canvas = document.createElement("canvas");
        canvas.width = 400;
        canvas.height = 300;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#0c121e";
          ctx.fillRect(0, 0, 400, 300);
          ctx.fillStyle = "#10b981";
          ctx.font = "bold 20px sans-serif";
          ctx.fillText("Logic Legends • MetraScan AI", 30, 130);
          ctx.fillStyle = "#94a3b8";
          ctx.font = "14px sans-serif";
          ctx.fillText(result.compliance?.sampleName || "Legal Metrology Inspection Audit", 30, 170);
        }
        const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/jpeg", 0.9));
        fileToUse = new File([blob], "metrascan-scan-audit.jpg", { type: "image/jpeg" });
      }

      const reportData = {
        scan_id: `LL-MS-${new Date().toISOString().replace(/\D/g, "").slice(0, 14)}`,
        scan_mode: selectedFile ? "Live Package Scan" : "Sample Preset Inspection",
        compliance: result.compliance || {},
        ocr: result.ocr || {},
        declarations: result.declarations || {},
        inspector_remarks: inspectorRemarks,
        inspector_name: user?.name || "Inspector Rajesh Sharma",
        badge_number: user?.badgeNumber || "LM-DEL-2041",
        flag_count: currentFlagCount,
        is_urgent: isCurrentUrgent,
        download_time: new Date().toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }) + " IST",
        download_timestamp: new Date().toISOString(),
        review: {
          reviewer_name: user?.name || "Inspector Rajesh Sharma",
          decision: score >= 85 ? "Statutory Adherence Verified" : "Non-Compliance Flagged",
          comments: inspectorRemarks,
          final_note: isCurrentUrgent
            ? `URGENT REPEAT CASE: Flagged ${currentFlagCount} times across inspections. Prioritized statutory escalation.`
            : "Standard statutory compliance screening report generated by Logic Legends MetraScan AI.",
          reviewed_at: new Date().toLocaleString("en-IN"),
        },
      };

      const pdfBlob = await generatePDFReport(fileToUse, reportData);
      const downloadUrl = window.URL.createObjectURL(pdfBlob);
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = `${reportData.scan_id}_LogicLegends_Report.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(downloadUrl);

      showToast("✓ PDF Report generated with Logic Legends watermark!");
    } catch (err: any) {
      console.error("PDF generation error:", err);
      showToast(`PDF error: ${err?.message || "Failed to generate PDF"}`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const resetAll = () => {
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError("");
    setNoticeDispatched(null);
    setShowCamera(false);
    setCurrentFlagCount(1);
    setIsCurrentUrgent(false);
  };

  const score = Number(result?.compliance?.compliance_score ?? 0);
  const isNonPackaging =
    result?.compliance?.status === "NON_PACKAGING" ||
    (score === 0 &&
      !result?.declarations?.mrp?.value &&
      !result?.declarations?.net_quantity?.value &&
      !result?.declarations?.company_details?.manufacturer?.value);
  const isCompliant = score >= 85 && !isNonPackaging;

  return (
    <div className="flex h-screen overflow-hidden bg-[#06090e] text-slate-100">
      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-emerald-500/50 bg-[#0c121e] px-5 py-3 shadow-2xl backdrop-blur-xl">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-black">
            ✓
          </span>
          <p className="text-xs font-bold text-emerald-200">{toastMessage}</p>
        </div>
      )}

      {/* Modern Sidebar (Green & Orange Minimalist Theme) */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setMobileMenuOpen(false);
        }}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Workspace Column */}
      <div className="flex flex-1 flex-col overflow-y-auto bg-slate-50">
        {/* Top Navbar */}
        <Header
          onOpenInbox={() => {
            setActiveTab(user?.role === "company" ? "company-inbox" : "inbox");
            setMobileMenuOpen(false);
          }}
          onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
        />

        {/* Content Area */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 pb-24 md:pb-8">
          {/* TAB: INSPECTOR INBOX */}
          {activeTab === "inbox" && (
            <InspectorInbox onNavigateScan={() => setActiveTab("scan")} />
          )}

          {/* TAB: COMPANY INBOX */}
          {activeTab === "company-inbox" && (
            <CompanyInbox onNavigateScanner={() => setActiveTab("scan")} />
          )}

          {/* TAB: ADMIN DASHBOARD */}
          {activeTab === "admin-hub" && <AdminDashboard />}

          {/* TAB: CONSUMER PORTAL */}
          {(activeTab === "consumer-scan" || activeTab === "grievances") && (
            <ConsumerDashboard onNavigateScan={() => setActiveTab("scan")} />
          )}

          {/* TAB: RULES GUIDE */}
          {activeTab === "rules" && <RulesGuide />}

          {/* TAB: REPORT ARCHIVE */}
          {activeTab === "reports" && (
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-slate-900">Inspection Reports Archive</h2>
              <p className="text-xs text-slate-500">
                Audited packaging reports with full OCR transcripts and legal citations.
              </p>
              {result && selectedFile ? (
                <ReportReview file={selectedFile} result={result} />
              ) : (
                <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xs">
                  <p className="text-sm font-bold text-slate-700">Scan a product to generate an official PDF inspection report.</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("scan")}
                    className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs"
                  >
                    Go to Scanner →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB: LIVE SCAN STATION (Primary Workspace) */}
          {activeTab === "scan" && (
            <div className="space-y-6">
              {/* Station Header */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-black tracking-tight text-slate-900">
                      Live Legal Metrology Scan Station
                    </h2>
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                      Real-Time OCR
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Scan front, back, or side packaging to detect MRP, Net Quantity, Manufacturer details, and statutory compliance.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={resetAll}
                    className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-2xs"
                  >
                    Reset All
                  </button>
                </div>
              </div>

              {/* Input Mode Selector Bar */}
              <div className="flex rounded-2xl border border-slate-200 bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveMode("preset");
                    setShowCamera(false);
                  }}
                  className={`flex flex-1 items-center justify-center gap-1.5 sm:gap-2 rounded-xl py-2 sm:py-2.5 px-2 text-[11px] sm:text-xs font-bold transition-all ${
                    activeMode === "preset"
                      ? "bg-white text-slate-900 shadow-xs font-black border border-slate-200"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>⚡</span>
                  <span className="truncate">
                    <span className="hidden sm:inline">Instant </span>Presets
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveMode("upload");
                    setShowCamera(false);
                  }}
                  className={`flex flex-1 items-center justify-center gap-1.5 sm:gap-2 rounded-xl py-2 sm:py-2.5 px-2 text-[11px] sm:text-xs font-bold transition-all ${
                    activeMode === "upload"
                      ? "bg-white text-slate-900 shadow-xs font-black border border-slate-200"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>↥</span>
                  <span className="truncate">
                    Upload<span className="hidden sm:inline"> Image</span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveMode("camera");
                    setShowCamera(true);
                  }}
                  className={`flex flex-1 items-center justify-center gap-1.5 sm:gap-2 rounded-xl py-2 sm:py-2.5 px-2 text-[11px] sm:text-xs font-bold transition-all ${
                    activeMode === "camera"
                      ? "bg-white text-slate-900 shadow-xs font-black border border-slate-200"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>◉</span>
                  <span className="truncate">
                    <span className="hidden sm:inline">Live </span>Camera
                  </span>
                </button>
              </div>

              {/* Main Workspace Split: Left (Scanner/Preview) vs Right (Analysis Results) */}
              <div className="grid gap-6 xl:grid-cols-12">
                {/* LEFT: Capture & Viewport (5 cols) */}
                <div className="space-y-4 xl:col-span-5">
                  {/* Preset Selector */}
                  {activeMode === "preset" && !showCamera && (
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        1-Click Test Packaging (Hackathon Presets)
                      </p>
                      <div className="mt-3 space-y-2">
                        {PRESET_SAMPLES.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => handleSelectPreset(s)}
                            className="group w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-left transition-all hover:border-emerald-500 hover:bg-emerald-50/30"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-800">
                                {s.name}
                              </span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                                  s.complianceVerdict === "COMPLIANT"
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                    : s.complianceVerdict === "CRITICAL_VIOLATION"
                                    ? "bg-red-100 text-red-800 border border-red-200"
                                    : "bg-orange-100 text-orange-800 border border-orange-200"
                                }`}
                              >
                                {s.complianceVerdict.replace("_", " ")}
                              </span>
                            </div>
                            <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                              {s.description}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upload Dropzone */}
                  {activeMode === "upload" && !showCamera && (
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
                      <ImageUploader onImageSelect={handleFileUpload} />
                      {selectedFile && (
                        <button
                          type="button"
                          onClick={handleRunRealScan}
                          disabled={scanning}
                          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-xs font-black uppercase text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-50 transition"
                        >
                          {scanning ? "Processing OCR..." : "⚡ Scan Package Image"}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Live Camera Viewport */}
                  {showCamera && (
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
                      <CameraScanner onCapture={handleCameraCapture} onClose={() => setShowCamera(false)} />
                    </div>
                  )}

                  {/* Image Preview with Interactive Laser Scanning Animation */}
                  {previewUrl && (
                    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 p-2 shadow-xs">
                      <div className="relative overflow-hidden rounded-2xl bg-white">
                        <img
                          src={previewUrl}
                          alt="Package preview"
                          className="max-h-[380px] w-full object-contain"
                        />

                        {/* Real-time animated scanning laser bar */}
                        {scanning && (
                          <div className="absolute inset-0 pointer-events-none">
                            <div className="laser-line absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent shadow-[0_0_15px_#10b981]" />
                            <div className="absolute inset-0 bg-emerald-500/[0.06]" />
                          </div>
                        )}
                      </div>

                      {/* Scanning stages progress */}
                      {scanning && (
                        <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-emerald-900">AI Analysis Pipeline</span>
                            <span className="font-mono text-[10px] text-slate-500">
                              Stage {activeStage + 1}/4
                            </span>
                          </div>
                          <div className="space-y-1 text-[11px] text-slate-700">
                            {[
                              "1. Image enhancement & packaging contour calibration",
                              "2. Text extraction via OCR engine",
                              "3. Legal Metrology Rules 2011 declaration matching",
                              "4. Severity scoring & violation classification",
                            ].map((stage, i) => (
                              <div
                                key={i}
                                className={`flex items-center gap-2 ${
                                  i === activeStage
                                    ? "font-bold text-emerald-800 animate-pulse"
                                    : i < activeStage
                                    ? "text-slate-400 line-through"
                                    : "text-slate-500"
                                }`}
                              >
                                <span>{i < activeStage ? "✓" : i === activeStage ? "▶" : "○"}</span>
                                <span>{stage}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* RIGHT: Analysis Console & Declarations (7 cols) */}
                <div className="space-y-4 xl:col-span-7">
                  {!result && !scanning ? (
                    <div className="flex min-h-[480px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-xs">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-emerald-700">
                        🔍
                      </div>
                      <h3 className="mt-4 text-lg font-black text-slate-900">
                        Awaiting Package Scan
                      </h3>
                      <p className="mt-2 max-w-sm text-xs leading-relaxed text-slate-500">
                        Select a package preset or upload an image. The AI will extract mandatory declarations (MRP, Net Qty, Dates) and compute compliance under Legal Metrology Rules 2011.
                      </p>
                    </div>
                  ) : scanning ? (
                    <div className="flex min-h-[480px] flex-col items-center justify-center rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-xs">
                      <div className="h-12 w-12 rounded-full border-2 border-emerald-200 border-t-emerald-600 animate-spin mb-4" />
                      <h3 className="text-base font-black text-slate-900">
                        Scanning Packaging Declarations...
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Evaluating OCR text against Legal Metrology Rules, 2011
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Compliance Verdict Card */}
                      <div
                        className={`rounded-3xl border p-6 shadow-xs ${
                          isCompliant
                            ? "border-emerald-200 bg-emerald-50/60"
                            : isNonPackaging
                            ? "border-slate-300 bg-slate-100/80"
                            : "border-orange-200 bg-orange-50/60"
                        }`}
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              Legal Metrology Compliance Verdict
                            </span>
                            <h3 className="mt-1 text-2xl font-black text-slate-900">
                              {isCompliant
                                ? "Fully Compliant Package"
                                : isNonPackaging
                                ? "Non-Packaging Image Detected"
                                : "Non-Compliance Detected"}
                            </h3>
                            <p className="mt-1 text-xs text-slate-600">
                              {isCompliant
                                ? "All statutory declarations required under Rule 6(1) are detected and verified."
                                : isNonPackaging
                                ? "Zero packaging declarations detected. Please upload a clear photograph of product packaging or principal display panel."
                                : "Package violates mandatory declarations under Legal Metrology Rules, 2011."}
                            </p>
                          </div>

                          <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                            <div
                              className={`flex h-16 w-16 items-center justify-center rounded-2xl font-black text-2xl border shadow-2xs ${
                                isCompliant
                                  ? "border-emerald-300 bg-white text-emerald-800"
                                  : isNonPackaging
                                  ? "border-slate-300 bg-white text-slate-700"
                                  : "border-orange-300 bg-white text-orange-800"
                              }`}
                            >
                              {score}
                            </div>
                            <span className="text-[10px] font-mono text-slate-500 font-bold">
                              Score / 100
                            </span>
                          </div>
                        </div>

                        {/* Inspector Remarks, Flag Counter & Logic Legends PDF Action Box */}
                        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 space-y-3.5 shadow-2xs">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-3">
                            <div>
                              <p className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                                <span>✍️</span>
                                <span>Inspector Observations & Compliance Directives</span>
                              </p>
                              <p className="mt-0.5 text-[11px] text-slate-500">
                                Enter remarks before generating the official PDF inspection report or issuing notices.
                              </p>
                            </div>

                            {/* Flag Counter Badge */}
                            <div className="flex items-center gap-2">
                              <span
                                className={`rounded-xl border px-3 py-1 text-xs font-bold ${
                                  isCurrentUrgent
                                    ? "border-red-300 bg-red-100 text-red-800 animate-pulse"
                                    : "border-emerald-200 bg-emerald-50 text-emerald-800"
                                }`}
                              >
                                Checked: {currentFlagCount} time(s) {isCurrentUrgent ? "🚨 URGENT" : ""}
                              </span>
                            </div>
                          </div>

                          {/* Urgent Case Banner if flagged > 5 times */}
                          {isCurrentUrgent && (
                            <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-xs text-red-900">
                              <div className="flex items-center gap-2 font-black">
                                <span className="text-base">🚨</span>
                                <span>URGENT CASE: Repeat Non-Compliance (Flagged {currentFlagCount} Times)</span>
                              </div>
                              <p className="mt-1 text-[11px] text-red-800 leading-relaxed">
                                This product has failed Legal Metrology compliance checks more than 5 times. Prioritized for immediate statutory intervention and manufacturer notice under the Legal Metrology Act, 2009.
                              </p>
                            </div>
                          )}

                          {/* Inspector Remarks Input */}
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                              Inspector Remarks (Printed in Logic Legends PDF Report):
                            </label>
                            <textarea
                              rows={3}
                              value={inspectorRemarks}
                              onChange={(e) => setInspectorRemarks(e.target.value)}
                              placeholder="Enter inspector findings, packaging deficiencies, or statutory directives..."
                              className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none"
                            />
                          </div>

                          {/* Action Buttons: PDF Generation & Notice Dispatch */}
                          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 pt-1">
                            <button
                              type="button"
                              onClick={handleGeneratePDF}
                              disabled={isGeneratingPdf}
                              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black uppercase text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
                            >
                              <span>📄</span>
                              <span>
                                {isGeneratingPdf
                                  ? "Generating PDF..."
                                  : "Generate PDF Report"}
                              </span>
                            </button>

                            {!isNonPackaging && (
                              noticeDispatched ? (
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">
                                    ✓ Notice {noticeDispatched.case_number} Dispatched to {noticeDispatched.brand_name}!
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setActiveTab("inbox")}
                                    className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                                  >
                                    View in Docket Registry →
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={handleDispatchNoticeToCompany}
                                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-xs font-black uppercase text-white hover:bg-orange-700 shadow-md shadow-orange-600/20 transition"
                                >
                                  <span>⚡</span>
                                  <span>Flag & Dispatch Notice to Company</span>
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Declarations Grid */}
                      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                          Extracted Declaration Evidence (Rule 6)
                        </h4>

                        <div className="grid gap-3 sm:grid-cols-2">
                          {/* MRP */}
                          <DeclarationTile
                            title="Maximum Retail Price (MRP)"
                            value={
                              typeof result.declarations?.mrp === "object"
                                ? result.declarations?.mrp?.value
                                  ? `₹ ${result.declarations.mrp.value}`
                                  : null
                                : result.declarations?.mrp
                            }
                            status={
                              result.declarations?.mrp?.value
                                ? "DETECTED"
                                : result.declarations?.mrp?.status === "DETECTED"
                                ? "DETECTED"
                                : "NOT_DETECTED"
                            }
                            rule="Rule 6(1)(e)"
                          />


                          {/* Net Quantity */}
                          <DeclarationTile
                            title="Net Quantity / Measure"
                            value={
                              result.declarations?.net_quantity?.value
                                ? `${result.declarations.net_quantity.value}${result.declarations.net_quantity.unit ? ` ${result.declarations.net_quantity.unit}` : ""}`
                                : typeof result.declarations?.net_quantity === "string"
                                ? result.declarations.net_quantity
                                : null
                            }
                            status={
                              result.declarations?.net_quantity?.value
                                ? "DETECTED"
                                : "NOT_DETECTED"
                            }
                            rule="Rule 6(1)(c)"
                          />

                          {/* Font Size as Per Rule */}
                          <DeclarationTile
                            title="Font Size as Per Rule"
                            value={
                              result.declarations?.font_size_rule?.measured_height_mm
                                ? `${result.declarations.font_size_rule.measured_height_mm} mm (Min: ${result.declarations.font_size_rule.required_min_height_mm} mm)`
                                : null
                            }
                            status={
                              result.declarations?.font_size_rule?.status === "COMPLIANT"
                                ? "DETECTED"
                                : result.declarations?.font_size_rule?.status === "NON_COMPLIANT"
                                ? "VIOLATION"
                                : "NOT_DETECTED"
                            }
                            rule="Rule 9 & Schedule II"
                          />

                          {/* Country of Origin */}
                          <DeclarationTile
                            title="Country of Origin"
                            value={
                              result.declarations?.country_of_origin?.value ||
                              result.declarations?.country_of_origin?.country ||
                              result.declarations?.country_of_origin?.evidence ||
                              null
                            }
                            status={
                              result.declarations?.country_of_origin?.value ||
                              result.declarations?.country_of_origin?.country
                                ? "DETECTED"
                                : "NOT_DETECTED"
                            }
                            rule="Rule 6(1)(n)"
                          />

                          {/* Manufacturer / Packer */}
                          <DeclarationTile
                            title="Manufacturer / Packer"
                            value={
                              result.declarations?.company_details?.manufacturer?.value ||
                              result.declarations?.company_details?.packer?.value ||
                              (typeof result.declarations?.company_details?.manufacturer === "string"
                                ? result.declarations.company_details.manufacturer
                                : null)
                            }
                            status={
                              result.declarations?.company_details?.manufacturer?.value ||
                              result.declarations?.company_details?.packer?.value ||
                              (typeof result.declarations?.company_details?.manufacturer === "string" &&
                                result.declarations.company_details.manufacturer)
                                ? "DETECTED"
                                : "NOT_DETECTED"
                            }
                            rule="Rule 6(1)(a)"
                          />

                          {/* Manufacturing / Packing Date */}
                          <DeclarationTile
                            title="Date of Manufacture / Packing (MFD / PKD)"
                            value={
                              result.declarations?.dates?.manufacturing_date?.value
                                ? `MFD: ${result.declarations.dates.manufacturing_date.value}`
                                : result.declarations?.dates?.packing_date?.value
                                ? `PKD: ${result.declarations.dates.packing_date.value}`
                                : (typeof result.declarations?.dates?.manufacturing_date === "string" &&
                                  result.declarations.dates.manufacturing_date) ||
                                  (typeof result.declarations?.dates?.packing_date === "string" &&
                                  result.declarations.dates.packing_date) ||
                                  null
                            }
                            status={
                              result.declarations?.dates?.manufacturing_date?.value ||
                              result.declarations?.dates?.packing_date?.value ||
                              (typeof result.declarations?.dates?.manufacturing_date === "string" &&
                                result.declarations.dates.manufacturing_date) ||
                              (typeof result.declarations?.dates?.packing_date === "string" &&
                                result.declarations.dates.packing_date)
                                ? "DETECTED"
                                : "NOT_DETECTED"
                            }
                            rule="Rule 6(1)(d)"
                          />

                          {/* Use By / Expiry Date */}
                          <DeclarationTile
                            title="Use By / Expiry Date / Best Before"
                            value={
                              result.declarations?.dates?.expiry_date?.value
                                ? `Use By: ${result.declarations.dates.expiry_date.value}`
                                : result.declarations?.dates?.best_before?.value
                                ? `Best Before: ${result.declarations.dates.best_before.value}`
                                : (typeof result.declarations?.dates?.expiry_date === "string" &&
                                  result.declarations.dates.expiry_date) ||
                                  (typeof result.declarations?.dates?.best_before === "string" &&
                                  result.declarations.dates.best_before) ||
                                  null
                            }
                            status={
                              result.declarations?.dates?.expiry_date?.value ||
                              result.declarations?.dates?.best_before?.value ||
                              (typeof result.declarations?.dates?.expiry_date === "string" &&
                                result.declarations.dates.expiry_date) ||
                              (typeof result.declarations?.dates?.best_before === "string" &&
                                result.declarations.dates.best_before)
                                ? "DETECTED"
                                : "NOT_DETECTED"
                            }
                            rule="Rule 6(1)(d)"
                          />

                          {/* Consumer Care */}
                          <DeclarationTile
                            title="Consumer Care Helpline & Contact"
                            value={
                              result.declarations?.consumer_care?.evidence ||
                              ([
                                result.declarations?.consumer_care?.cell_name,
                                result.declarations?.consumer_care?.phone ? `Helpline: ${result.declarations.consumer_care.phone}` : null,
                                result.declarations?.consumer_care?.email ? `Email: ${result.declarations.consumer_care.email}` : null,
                                result.declarations?.consumer_care?.address ? `Address: ${result.declarations.consumer_care.address}` : null,
                                result.declarations?.consumer_care?.website ? `Web: ${result.declarations.consumer_care.website}` : null,
                              ].filter(Boolean).join(" • ")) ||
                              null
                            }
                            status={
                              result.declarations?.consumer_care?.phone ||
                              result.declarations?.consumer_care?.email ||
                              result.declarations?.consumer_care?.cell_name ||
                              result.declarations?.consumer_care?.address ||
                              result.declarations?.consumer_care?.status === "DETECTED"
                                ? "DETECTED"
                                : "NOT_DETECTED"
                            }
                            rule="Rule 6(1)(f)"
                          />
                        </div>
                      </div>

                      {/* OCR Raw Text Layer */}
                      <details className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <summary className="cursor-pointer text-xs font-bold text-slate-700 hover:text-slate-900">
                          View Raw OCR Text Transcript
                        </summary>
                        <pre className="mt-3 max-h-40 overflow-y-auto whitespace-pre-wrap font-mono text-[11px] text-slate-700 bg-white border border-slate-200 p-3 rounded-xl">
                          {result.ocr?.text || JSON.stringify(result.declarations, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Mobile Bottom Navigation Bar (md:hidden) */}
        <nav
          aria-label="Mobile Navigation"
          className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-slate-200 bg-white/95 px-2 py-1.5 shadow-lg backdrop-blur-md md:hidden"
        >
          <button
            type="button"
            onClick={() => {
              setActiveTab("scan");
              setMobileMenuOpen(false);
            }}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
              activeTab === "scan"
                ? "text-emerald-700 font-bold"
                : "text-slate-500 hover:text-slate-800 font-medium"
            }`}
          >
            <span className="text-lg leading-tight">📷</span>
            <span className="text-[10px] tracking-tight">Scan</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab(user?.role === "company" ? "company-inbox" : "inbox");
              setMobileMenuOpen(false);
            }}
            className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
              activeTab === "inbox" || activeTab === "company-inbox"
                ? "text-emerald-700 font-bold"
                : "text-slate-500 hover:text-slate-800 font-medium"
            }`}
          >
            <span className="text-lg leading-tight">📥</span>
            <span className="text-[10px] tracking-tight">Notices</span>
            {notices.length > 0 && (
              <span className="absolute top-0.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-600 px-1 text-[9px] font-black text-white">
                {notices.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("reports");
              setMobileMenuOpen(false);
            }}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
              activeTab === "reports"
                ? "text-emerald-700 font-bold"
                : "text-slate-500 hover:text-slate-800 font-medium"
            }`}
          >
            <span className="text-lg leading-tight">📄</span>
            <span className="text-[10px] tracking-tight">Reports</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("rules");
              setMobileMenuOpen(false);
            }}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
              activeTab === "rules"
                ? "text-emerald-700 font-bold"
                : "text-slate-500 hover:text-slate-800 font-medium"
            }`}
          >
            <span className="text-lg leading-tight">⚖️</span>
            <span className="text-[10px] tracking-tight">Rules</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-slate-500 hover:text-slate-800 font-medium transition-all"
          >
            <span className="text-lg leading-tight">☰</span>
            <span className="text-[10px] tracking-tight">Menu</span>
          </button>
        </nav>
      </div>
    </div>
  );
}

function DeclarationTile({
  title,
  value,
  status,
  rule,
}: {
  title: string;
  value?: any;
  status?: string;
  rule: string;
}) {
  const normStatus = (status || "").toUpperCase();
  const isExplicitViolation = normStatus === "VIOLATION" || normStatus === "NON_COMPLIANT";

  // Safely resolve display value to always be a clean string and never a bare object or null text
  let displayValue: string | null = null;
  if (value !== null && value !== undefined) {
    if (typeof value === "object") {
      if (value.value !== null && value.value !== undefined) {
        displayValue = String(value.value);
        if (value.unit) displayValue += ` ${value.unit}`;
      } else if (value.evidence) {
        displayValue = String(value.evidence);
      } else if (value.status && value.status !== "NOT_DETECTED" && value.status !== "NOT_VERIFIED") {
        displayValue = String(value.status);
      }
    } else {
      const strVal = String(value).trim();
      if (
        strVal &&
        strVal !== "null" &&
        strVal !== "undefined" &&
        !strVal.startsWith("null mm") &&
        !strVal.includes("null mm")
      ) {
        displayValue = strVal;
      }
    }
  }

  // A tile is only DETECTED if it has an actual value and is marked detected/compliant
  const effectivelyDetected = (normStatus === "DETECTED" || normStatus === "COMPLIANT") && Boolean(displayValue);
  const effectivelyViolation = isExplicitViolation;

  return (
    <div
      className={`rounded-2xl border p-3.5 transition-all shadow-2xs ${
        effectivelyDetected
          ? "border-emerald-200 bg-emerald-50/40"
          : effectivelyViolation
          ? "border-red-200 bg-red-50/40"
          : "border-slate-200 bg-slate-50/50"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-slate-500 font-bold">{rule}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
            effectivelyDetected
              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
              : effectivelyViolation
              ? "bg-red-100 text-red-800 border border-red-200"
              : "bg-slate-100 text-slate-600 border border-slate-200"
          }`}
        >
          {effectivelyDetected ? "Detected" : effectivelyViolation ? "Violation" : "Not Found"}
        </span>
      </div>

      <p className="mt-1.5 text-xs font-bold text-slate-900">{title}</p>
      <p className="mt-1 text-[11px] font-medium text-slate-700">
        {displayValue || <span className="text-slate-400 italic font-normal">Not Detected</span>}
      </p>
    </div>
  );
}