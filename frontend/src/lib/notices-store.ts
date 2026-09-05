"use client";

import { useState, useEffect } from "react";
import {
  fetchAllNotices,
  dispatchNoticeAPI,
  respondToNoticeAPI,
  updateNoticeStatusAPI,
} from "./api";

export type ViolationSeverity = "CRITICAL" | "MAJOR" | "MINOR";

export type NoticeStatus =
  | "PENDING_INSPECTION"
  | "NOTICE_ISSUED"
  | "COMPANY_RESPONDED"
  | "UNDER_REVIEW"
  | "RESOLVED"
  | "ESCALATED_URGENT";

export interface ComplianceNotice {
  id: string;
  case_number: string;
  product_name: string;
  brand_name: string;
  company_id: string; // matches company user_id e.g. "amul_india" or company name
  inspector_id: string;
  inspector_name: string;
  jurisdiction: string;
  created_at: string;
  deadline_date?: string;
  severity: ViolationSeverity;
  status: NoticeStatus;
  flag_count: number; // Counter of how many times checked/flagged
  is_urgent: boolean; // True if flag_count > 5
  rule_citations: string[];
  violations_summary: string[];
  detected_declarations: {
    mrp?: string;
    net_quantity?: string;
    mfg_date?: string;
    consumer_care?: string;
    manufacturer?: string;
  };
  ocr_evidence_snippet: string;
  image_preview?: string;
  company_response?: {
    responded_at: string;
    response_text: string;
    proof_submitted?: string;
  };
  inspector_notes?: string;
}

const STORAGE_KEY = "metrascan_compliance_notices_v2";
const FLAG_COUNTERS_KEY = "metrascan_flag_counters_v2";

// Initial seed cases showcasing normal and Urgent (>5 flags) cases
export const INITIAL_NOTICES: ComplianceNotice[] = [
  {
    id: "notif-000",
    case_number: "LMN-2026-DEL-0999",
    product_name: "Royal Spices Garam Masala 100g",
    brand_name: "Royal Spices",
    company_id: "royal_spices",
    inspector_id: "insp_rajesh",
    inspector_name: "Rajesh Sharma",
    jurisdiction: "North Zone (Delhi NCR)",
    created_at: "2026-09-03T10:15:00Z",
    deadline_date: "2026-09-10T23:59:59Z", // 7 days
    severity: "CRITICAL",
    status: "ESCALATED_URGENT",
    flag_count: 6, // > 5 -> URGENT CASE
    is_urgent: true,
    rule_citations: [
      "Rule 6(1)(e) - Complete absence of Maximum Retail Price (MRP) declaration",
      "Rule 9(3) - Net Quantity font height below statutory 4.0mm limit",
    ],
    violations_summary: [
      "URGENT: Flagged 6 times across regional inspections for obscured price and sub-standard net quantity font.",
      "Repeat violation requires immediate statutory intervention under Section 36.",
    ],
    detected_declarations: {
      mrp: "Not Detected / Missing",
      net_quantity: "100g (Font: 1.8mm - VIOLATION)",
      mfg_date: "06/2026",
      consumer_care: "Not Detected",
      manufacturer: "Royal Spice Mills, Delhi",
    },
    ocr_evidence_snippet: "ROYAL SPICES SPECIAL GARAM MASALA Net Wt: 100g [Font 1.8mm VIOLATION] MRP: [MISSING / ILLEGIBLE]",
    inspector_notes: "REPEAT NON-COMPLIANCE: Product flagged 6 times. Classified as URGENT CASE for immediate statutory notice.",
  },
  {
    id: "notif-001",
    case_number: "LMN-2026-DEL-0412",
    product_name: "Choco Crunch Cookies 250g",
    brand_name: "Britannia Industries",
    company_id: "britannia_foods",
    inspector_id: "insp_rajesh",
    inspector_name: "Rajesh Sharma",
    jurisdiction: "North Zone (Delhi NCR)",
    created_at: "2026-09-02T11:20:00Z",
    deadline_date: "2026-09-17T23:59:59Z",
    severity: "CRITICAL",
    status: "NOTICE_ISSUED",
    flag_count: 3,
    is_urgent: false,
    rule_citations: [
      "Rule 6(1)(e) - Absence of Maximum Retail Price (MRP) declaration",
      "Rule 9(3) - Font height below statutory limit for 250g pack",
    ],
    violations_summary: [
      "MRP text is completely obscured / altered on the crimp seal.",
      "Net Quantity declaration numerals are smaller than mandatory 4mm height.",
    ],
    detected_declarations: {
      mrp: "Not Detected",
      net_quantity: "250g (Font: 1.8mm - VIOLATION)",
      mfg_date: "08/2026",
      consumer_care: "feedback@britannia.com",
      manufacturer: "Britannia Industries Ltd, Delhi",
    },
    ocr_evidence_snippet: "LOT B-291 PKG 08/2026 ... NET QTY 250g (ILLEGIBLE PRICE STAMP)",
    inspector_notes: "Routine retail surveillance at Connaught Place Market. Notice dispatched.",
  },
  {
    id: "notif-002",
    case_number: "LMN-2026-DEL-0388",
    product_name: "Amul Pure Ghee 1L Tin",
    brand_name: "Amul",
    company_id: "amul_india",
    inspector_id: "insp_rajesh",
    inspector_name: "Rajesh Sharma",
    jurisdiction: "North Zone (Delhi NCR)",
    created_at: "2026-09-01T15:40:00Z",
    deadline_date: "2026-09-16T23:59:59Z",
    severity: "MAJOR",
    status: "NOTICE_ISSUED",
    flag_count: 2,
    is_urgent: false,
    rule_citations: [
      "Rule 6(1)(a) - Consumer Care Telephone Number illegible on lower seam",
    ],
    violations_summary: [
      "Toll-free customer care contact phone number partially smudged during thermal printing.",
    ],
    detected_declarations: {
      mrp: "₹ 620.00 (Incl. of all taxes)",
      net_quantity: "1 L / 905 g",
      mfg_date: "JUL 2026",
      consumer_care: "1800-258-XXXX (Smudged)",
      manufacturer: "GCMMF Ltd, Anand, Gujarat",
    },
    ocr_evidence_snippet: "MRP Rs 620.00 INCL ALL TAXES ... CARE 1800-258-***3",
    inspector_notes: "Secondary notice issued to Amul packaging cell. Response requested.",
  },
  {
    id: "notif-003",
    case_number: "LMN-2026-MUM-0195",
    product_name: "Golden Harvest Toor Dal 1kg",
    brand_name: "Golden Harvest",
    company_id: "golden_harvest",
    inspector_id: "insp_kulkarni",
    inspector_name: "S. Kulkarni",
    jurisdiction: "West Zone (Mumbai)",
    created_at: "2026-08-28T09:15:00Z",
    deadline_date: "2026-09-12T23:59:59Z",
    severity: "MINOR",
    status: "COMPANY_RESPONDED",
    flag_count: 1,
    is_urgent: false,
    rule_citations: [
      "Rule 6(1)(g) - Unit Sale Price format omission",
    ],
    violations_summary: [
      "Unit sale price ₹148/kg was missing the ₹/g standard representation.",
    ],
    detected_declarations: {
      mrp: "₹ 148.00",
      net_quantity: "1 kg",
      mfg_date: "AUG 2026",
      consumer_care: "customercare@ghpulse.in",
      manufacturer: "Harvest Agro Packaging Pvt Ltd",
    },
    ocr_evidence_snippet: "NET WT 1KG MRP 148 INCL TAXES",
    company_response: {
      responded_at: "2026-08-30T14:22:00Z",
      response_text:
        "Updated packaging cylinder plate approved. Next batch #H-401 will include USP in bold standard format.",
    },
    inspector_notes: "Response under verification by West Zone team.",
  },
];

export function getStoredNotices(): ComplianceNotice[] {
  if (typeof window === "undefined") return INITIAL_NOTICES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_NOTICES));
      return INITIAL_NOTICES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_NOTICES;
  }
}

export function saveStoredNotices(notices: ComplianceNotice[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notices));
    window.dispatchEvent(new Event("metrascan_notices_updated"));
  } catch {}
}

export function getProductFlagCounters(): Record<string, number> {
  if (typeof window === "undefined") {
    return { "royal spices garam masala 100g": 6, "amul pure ghee 1l tin": 2, "choco crunch cookies 250g": 3 };
  }
  try {
    const raw = localStorage.getItem(FLAG_COUNTERS_KEY);
    if (!raw) {
      const defaults = { "royal spices garam masala 100g": 6, "amul pure ghee 1l tin": 2, "choco crunch cookies 250g": 3 };
      localStorage.setItem(FLAG_COUNTERS_KEY, JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(raw);
  } catch {
    return { "royal spices garam masala 100g": 6 };
  }
}

export function incrementProductFlagCounter(productName: string): number {
  if (typeof window === "undefined") return 1;
  try {
    const counters = getProductFlagCounters();
    const key = productName.toLowerCase().trim();
    const current = (counters[key] || 0) + 1;
    counters[key] = current;
    localStorage.setItem(FLAG_COUNTERS_KEY, JSON.stringify(counters));
    return current;
  } catch {
    return 1;
  }
}

export function useNoticesStore() {
  const [notices, setNotices] = useState<ComplianceNotice[]>(INITIAL_NOTICES);

  const syncWithBackend = async () => {
    try {
      const backendNotices = await fetchAllNotices();
      if (backendNotices && Array.isArray(backendNotices) && backendNotices.length > 0) {
        const local = getStoredNotices();
        const localMap = new Map(local.map((n) => [n.id, n]));
        backendNotices.forEach((bn: any) => {
          const existing = localMap.get(bn.id);
          localMap.set(bn.id, { ...existing, ...bn });
        });
        const merged = Array.from(localMap.values()).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        saveStoredNotices(merged);
        setNotices(merged);
      }
    } catch {
      // Offline / fallback to local storage
    }
  };

  useEffect(() => {
    setNotices(getStoredNotices());
    syncWithBackend();

    const handleUpdate = () => {
      setNotices(getStoredNotices());
    };

    window.addEventListener("metrascan_notices_updated", handleUpdate);
    const interval = setInterval(syncWithBackend, 3000);

    return () => {
      window.removeEventListener("metrascan_notices_updated", handleUpdate);
      clearInterval(interval);
    };
  }, []);

  const dispatchNotice = (
    noticeData: Omit<ComplianceNotice, "id" | "case_number" | "created_at" | "deadline_date" | "status" | "flag_count" | "is_urgent">
  ): ComplianceNotice => {
    const now = new Date();
    const daysToAdd = noticeData.severity === "CRITICAL" ? 7 : noticeData.severity === "MAJOR" ? 15 : 30;
    const deadline = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

    // Track flag counter for this product
    const newFlagCount = incrementProductFlagCounter(noticeData.product_name);
    const isUrgent = newFlagCount > 5;

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newNotice: ComplianceNotice = {
      ...noticeData,
      id: `notif-${Date.now()}`,
      case_number: `LMN-2026-ACT-${randomNum}`,
      created_at: now.toISOString(),
      deadline_date: deadline.toISOString(),
      status: isUrgent ? "ESCALATED_URGENT" : "NOTICE_ISSUED",
      flag_count: newFlagCount,
      is_urgent: isUrgent,
      violations_summary: isUrgent
        ? [
            `URGENT CASE: Product flagged ${newFlagCount} times across inspections.`,
            ...noticeData.violations_summary,
          ]
        : noticeData.violations_summary,
    };

    const updated = [newNotice, ...notices];
    setNotices(updated);
    saveStoredNotices(updated);

    // Asynchronously sync to backend REST API
    dispatchNoticeAPI(newNotice).catch(() => {});

    return newNotice;
  };

  const respondToNotice = (noticeId: string, responseText: string, proofUrl?: string) => {
    const now = new Date().toISOString();
    const updated = notices.map((n) => {
      if (n.id === noticeId) {
        return {
          ...n,
          status: "COMPANY_RESPONDED" as NoticeStatus,
          company_response: {
            responded_at: now,
            response_text: responseText,
            proof_submitted: proofUrl,
          },
        };
      }
      return n;
    });
    setNotices(updated);
    saveStoredNotices(updated);

    // Asynchronously sync to backend REST API
    respondToNoticeAPI(noticeId, responseText, proofUrl).catch(() => {});
  };

  const updateStatus = (noticeId: string, status: NoticeStatus, notes?: string) => {
    const updated = notices.map((n) => {
      if (n.id === noticeId) {
        return {
          ...n,
          status,
          inspector_notes: notes || n.inspector_notes,
        };
      }
      return n;
    });
    setNotices(updated);
    saveStoredNotices(updated);

    // Asynchronously sync to backend REST API
    updateNoticeStatusAPI(noticeId, status, notes).catch(() => {});
  };

  return {
    notices,
    dispatchNotice,
    respondToNotice,
    updateStatus,
  };
}
