from fastapi import APIRouter, HTTPException, Body
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import uuid

router = APIRouter(
    prefix="/notices",
    tags=["Legal Metrology Notices"],
)

# Product check / flag tracking counter
PRODUCT_FLAG_COUNTERS: Dict[str, int] = {
    "royal spices garam masala 100g": 6,
    "choco crunch cookies 250g": 3,
    "amul pure ghee 1l tin": 2,
    "golden harvest toor dal 1kg": 1,
}

# In-memory store with seed data for the hackathon
COMPLIANCE_NOTICES: List[Dict[str, Any]] = [
    {
        "id": "notif-000",
        "case_number": "LMN-2026-DEL-0999",
        "product_name": "Royal Spices Garam Masala 100g",
        "brand_name": "Royal Spices",
        "company_id": "royal_spices",
        "inspector_id": "insp_rajesh",
        "inspector_name": "Rajesh Sharma",
        "jurisdiction": "North Zone (Delhi NCR)",
        "created_at": "2026-09-03T10:15:00Z",
        "deadline_date": "2026-09-10T23:59:59Z",
        "severity": "CRITICAL",
        "status": "ESCALATED_URGENT",
        "flag_count": 6,
        "is_urgent": True,
        "rule_citations": [
            "Rule 6(1)(e) - Complete absence of Maximum Retail Price (MRP) declaration",
            "Rule 9(3) - Net Quantity font height below statutory 4.0mm limit",
        ],
        "violations_summary": [
            "URGENT: Flagged 6 times across regional inspections. Immediate statutory notice dispatched.",
        ],
        "detected_declarations": {
            "mrp": "Not Detected / Missing",
            "net_quantity": "100g (Font: 1.8mm - VIOLATION)",
            "mfg_date": "06/2026",
            "consumer_care": "Not Detected",
            "manufacturer": "Royal Spice Mills, Delhi",
        },
        "ocr_evidence_snippet": "ROYAL SPICES SPECIAL GARAM MASALA Net Wt: 100g [Font 1.8mm VIOLATION] MRP: [MISSING / ILLEGIBLE]",
        "inspector_notes": "REPEAT NON-COMPLIANCE: Product flagged 6 times. Classified as URGENT CASE for statutory escalation.",
    },
    {
        "id": "notif-001",
        "case_number": "LMN-2026-DEL-0412",
        "product_name": "Choco Crunch Cookies 250g",
        "brand_name": "Britannia Industries",
        "company_id": "britannia_foods",
        "inspector_id": "insp_rajesh",
        "inspector_name": "Rajesh Sharma",
        "jurisdiction": "North Zone (Delhi NCR)",
        "created_at": "2026-09-02T11:20:00Z",
        "deadline_date": "2026-09-17T23:59:59Z",
        "severity": "CRITICAL",
        "status": "NOTICE_ISSUED",
        "flag_count": 3,
        "is_urgent": False,
        "rule_citations": [
            "Rule 6(1)(e) - Absence of Maximum Retail Price (MRP) declaration",
            "Rule 9(3) - Font height below statutory limit for 250g pack",
        ],
        "violations_summary": [
            "MRP text is completely obscured / altered on the crimp seal.",
            "Net Quantity declaration numerals are smaller than mandatory 4mm height.",
        ],
        "detected_declarations": {
            "mrp": "Not Detected",
            "net_quantity": "250g (Font: 1.8mm - VIOLATION)",
            "mfg_date": "08/2026",
            "consumer_care": "feedback@britannia.com",
            "manufacturer": "Britannia Industries Ltd, Delhi",
        },
        "ocr_evidence_snippet": "LOT B-291 PKG 08/2026 ... NET QTY 250g (ILLEGIBLE PRICE STAMP)",
        "inspector_notes": "Routine retail surveillance at Connaught Place Market. Notice dispatched.",
    },
    {
        "id": "notif-002",
        "case_number": "LMN-2026-DEL-0388",
        "product_name": "Amul Pure Ghee 1L Tin",
        "brand_name": "Amul",
        "company_id": "amul_india",
        "inspector_id": "insp_rajesh",
        "inspector_name": "Rajesh Sharma",
        "jurisdiction": "North Zone (Delhi NCR)",
        "created_at": "2026-09-01T15:40:00Z",
        "deadline_date": "2026-09-16T23:59:59Z",
        "severity": "MAJOR",
        "status": "NOTICE_ISSUED",
        "flag_count": 2,
        "is_urgent": False,
        "rule_citations": [
            "Rule 6(1)(a) - Consumer Care Telephone Number illegible on lower seam",
        ],
        "violations_summary": [
            "Toll-free customer care contact phone number partially smudged during thermal printing.",
        ],
        "detected_declarations": {
            "mrp": "₹ 620.00 (Incl. of all taxes)",
            "net_quantity": "1 L / 905 g",
            "mfg_date": "JUL 2026",
            "consumer_care": "1800-258-XXXX (Smudged)",
            "manufacturer": "GCMMF Ltd, Anand, Gujarat",
        },
        "ocr_evidence_snippet": "MRP Rs 620.00 INCL ALL TAXES ... CARE 1800-258-***3",
        "inspector_notes": "Secondary notice issued to Amul packaging cell. Response requested.",
    },
    {
        "id": "notif-003",
        "case_number": "LMN-2026-MUM-0195",
        "product_name": "Golden Harvest Toor Dal 1kg",
        "brand_name": "Golden Harvest",
        "company_id": "golden_harvest",
        "inspector_id": "insp_kulkarni",
        "inspector_name": "S. Kulkarni",
        "jurisdiction": "West Zone (Mumbai)",
        "created_at": "2026-08-28T09:15:00Z",
        "deadline_date": "2026-09-12T23:59:59Z",
        "severity": "MINOR",
        "status": "COMPANY_RESPONDED",
        "flag_count": 1,
        "is_urgent": False,
        "rule_citations": [
            "Rule 6(1)(g) - Unit Sale Price format omission",
        ],
        "violations_summary": [
            "Unit sale price ₹148/kg was missing the ₹/g standard representation.",
        ],
        "detected_declarations": {
            "mrp": "₹ 148.00",
            "net_quantity": "1 kg",
            "mfg_date": "AUG 2026",
            "consumer_care": "customercare@ghpulse.in",
            "manufacturer": "Harvest Agro Packaging Pvt Ltd",
        },
        "ocr_evidence_snippet": "NET WT 1KG MRP 148 INCL TAXES",
        "company_response": {
            "responded_at": "2026-08-30T14:22:00Z",
            "response_text": "Updated packaging cylinder plate approved. Next batch #H-401 will include USP in bold standard format.",
        },
        "inspector_notes": "Response under verification by West Zone team.",
    },
]


@router.get("/all")
def get_all_notices():
    """Retrieve all Legal Metrology notices."""
    return COMPLIANCE_NOTICES


@router.get("/inspector/{inspector_id}")
def get_inspector_notices(inspector_id: str):
    """Get all inspection cases filed by or assigned to an inspector."""
    return [n for n in COMPLIANCE_NOTICES if n.get("inspector_id") == inspector_id or inspector_id == "all"]


@router.get("/company/{company_id}")
def get_company_notices(company_id: str):
    """Get all violation notices issued to a specific company."""
    target = company_id.lower().replace("_", "").replace(" ", "")
    results = [
        n for n in COMPLIANCE_NOTICES 
        if target in n.get("company_id", "").lower().replace("_", "") 
        or target in n.get("brand_name", "").lower().replace(" ", "")
    ]
    if not results and "amul" in target:
        results = [n for n in COMPLIANCE_NOTICES if "amul" in n.get("company_id", "").lower()]
    return results or COMPLIANCE_NOTICES


@router.post("/dispatch")
def dispatch_notice(payload: Dict[str, Any] = Body(...)):
    """Inspector issues an automated compliance notice to a company with flag counter tracking."""
    now = datetime.utcnow()
    severity = payload.get("severity", "MAJOR")
    days = 7 if severity == "CRITICAL" else (15 if severity == "MAJOR" else 30)
    deadline = now + timedelta(days=days)
    case_num = f"LMN-2026-ACT-{uuid.uuid4().hex[:4].upper()}"

    product_name = payload.get("product_name", "Packaged Commodity")
    key = product_name.lower().strip()
    current_count = PRODUCT_FLAG_COUNTERS.get(key, 0) + 1
    PRODUCT_FLAG_COUNTERS[key] = current_count
    is_urgent = current_count > 5

    notice = {
        "id": f"notif-{uuid.uuid4().hex[:8]}",
        "case_number": case_num,
        "product_name": product_name,
        "brand_name": payload.get("brand_name", "Unknown Brand"),
        "company_id": payload.get("company_id", "amul_india"),
        "inspector_id": payload.get("inspector_id", "insp_rajesh"),
        "inspector_name": payload.get("inspector_name", "Rajesh Sharma"),
        "jurisdiction": payload.get("jurisdiction", "Delhi NCR Zone"),
        "created_at": now.isoformat() + "Z",
        "deadline_date": deadline.isoformat() + "Z",
        "severity": severity,
        "status": "ESCALATED_URGENT" if is_urgent else "NOTICE_ISSUED",
        "flag_count": current_count,
        "is_urgent": is_urgent,
        "rule_citations": payload.get("rule_citations", ["Legal Metrology (Packaged Commodities) Rules 2011"]),
        "violations_summary": payload.get("violations_summary", ["Statutory declaration non-compliance detected"]),
        "detected_declarations": payload.get("detected_declarations", {}),
        "ocr_evidence_snippet": payload.get("ocr_evidence_snippet", "Automated MetraScan OCR scan evidence"),
        "inspector_notes": payload.get("inspector_notes", "Automated violation notice issued via MetraScan AI."),
    }

    COMPLIANCE_NOTICES.insert(0, notice)
    return {"status": "success", "notice": notice}


@router.post("/{notice_id}/respond")
def respond_to_notice(notice_id: str, payload: Dict[str, Any] = Body(...)):
    """Company acknowledges and submits corrective response/proof."""
    for n in COMPLIANCE_NOTICES:
        if n["id"] == notice_id:
            n["status"] = "COMPANY_RESPONDED"
            n["company_response"] = {
                "responded_at": datetime.utcnow().isoformat() + "Z",
                "response_text": payload.get("response_text", "Correction submitted."),
                "proof_submitted": payload.get("proof_submitted"),
            }
            return {"status": "success", "notice": n}
    raise HTTPException(status_code=404, detail="Notice not found")


@router.get("/stats")
def get_notice_stats():
    """National overview statistics for Admin & Inspector hubs."""
    total = len(COMPLIANCE_NOTICES)
    critical = sum(1 for n in COMPLIANCE_NOTICES if n["severity"] == "CRITICAL")
    major = sum(1 for n in COMPLIANCE_NOTICES if n["severity"] == "MAJOR")
    minor = sum(1 for n in COMPLIANCE_NOTICES if n["severity"] == "MINOR")
    urgent_cases = sum(1 for n in COMPLIANCE_NOTICES if n.get("is_urgent"))
    resolved = sum(1 for n in COMPLIANCE_NOTICES if n["status"] == "RESOLVED")
    pending = sum(1 for n in COMPLIANCE_NOTICES if n["status"] in ["NOTICE_ISSUED", "COMPANY_RESPONDED", "ESCALATED_URGENT"])

    return {
        "total_notices": total,
        "critical_count": critical,
        "major_count": major,
        "minor_count": minor,
        "urgent_cases": urgent_cases,
        "resolved_count": resolved,
        "pending_count": pending,
        "national_compliance_rate": 78.4,
    }
