"""
MetraScan AI - Compliance Engine
Evaluates statutory compliance against the Legal Metrology (Packaged Commodities) Rules, 2011:
- Rule 6(1)(a): Manufacturer, Packer or Importer Details
- Rule 6(1)(c): Net Quantity / Net Weight
- Rule 6(1)(d): Month & Year of Manufacture, Packing or Import
- Rule 6(1)(e): Maximum Retail Price (MRP) incl. of all taxes
- Rule 6(1)(f): Consumer Care Contact Details (Phone, Email, Address)
- Rule 6(1)(g): Unit Sale Price (USP)
- Rule 6(1)(n): Country of Origin
- Rule 9 & Schedule II: Minimum Font Size of Declarations
"""

from typing import Dict, Any, List


def create_violation(
    field: str,
    title: str,
    severity: str,
    message: str,
    recommendation: str,
) -> Dict[str, str]:
    return {
        "field": field,
        "title": title,
        "severity": severity,
        "message": message,
        "recommendation": recommendation,
    }


def evaluate_compliance(
    declarations: Dict[str, Any],
    ocr_confidence: float = 0.0,
) -> Dict[str, Any]:
    violations: List[Dict[str, str]] = []
    checks: List[Dict[str, Any]] = []

    # -------------------------------------------------------------
    # 1. MRP Check (Rule 6(1)(e)) - MANDATORY
    # -------------------------------------------------------------
    mrp = declarations.get("mrp", {})
    mrp_val = mrp.get("value")
    mrp_detected = (mrp.get("status") in ["DETECTED", "NEEDS_REVIEW"] or mrp_val is not None) and mrp_val is not None

    if mrp_detected and mrp_val is not None:
        checks.append({
            "field": "MRP",
            "status": "detected",
            "value": f"₹ {mrp_val}",
            "rule": "Rule 6(1)(e)",
            "score_impact": 0,
        })
    else:
        violations.append(
            create_violation(
                field="mrp",
                title="MRP Missing (Rule 6(1)(e))",
                severity="critical",
                message="Maximum Retail Price (inclusive of all taxes) was not detected on the packaging.",
                recommendation="Ensure the panel containing the MRP inclusive of all taxes declaration is captured.",
            )
        )
        checks.append({
            "field": "MRP",
            "status": "non_compliant",
            "value": None,
            "rule": "Rule 6(1)(e)",
            "score_impact": -30,
        })

    # -------------------------------------------------------------
    # 2. Net Quantity Check (Rule 6(1)(c)) - MANDATORY
    # -------------------------------------------------------------
    quantity = declarations.get("net_quantity", {})
    qty_val = quantity.get("value")
    qty_unit = quantity.get("unit", "")
    qty_detected = (quantity.get("status") in ["DETECTED", "NEEDS_REVIEW"] or qty_val is not None) and qty_val is not None

    if qty_detected and qty_val is not None:
        checks.append({
            "field": "Net Quantity",
            "status": "detected",
            "value": f"{qty_val} {qty_unit}".strip(),
            "rule": "Rule 6(1)(c)",
            "score_impact": 0,
        })
    else:
        violations.append(
            create_violation(
                field="net_quantity",
                title="Net Quantity Missing (Rule 6(1)(c))",
                severity="critical",
                message="Net quantity / weight declaration could not be verified from the packaging image.",
                recommendation="Capture the principal display panel containing Net Qty or Net Weight.",
            )
        )
        checks.append({
            "field": "Net Quantity",
            "status": "non_compliant",
            "value": None,
            "rule": "Rule 6(1)(c)",
            "score_impact": -30,
        })

    # -------------------------------------------------------------
    # 3. Country of Origin Check (Rule 6(1)(n))
    # -------------------------------------------------------------
    origin = declarations.get("country_of_origin", {})
    origin_val = origin.get("value") or origin.get("country")
    origin_detected = (origin.get("status") in ["DETECTED", "NEEDS_REVIEW"] or origin_val is not None) and origin_val is not None

    if origin_detected and origin_val is not None:
        checks.append({
            "field": "Country of Origin",
            "status": "detected",
            "value": str(origin_val),
            "rule": "Rule 6(1)(n)",
            "score_impact": 0,
        })
    else:
        violations.append(
            create_violation(
                field="country_of_origin",
                title="Country of Origin Not Declared (Rule 6(1)(n))",
                severity="warning",
                message="Mandatory Country of Origin declaration was not detected.",
                recommendation="Include 'Country of Origin: India' or 'Made in India' prominently on packaging.",
            )
        )
        checks.append({
            "field": "Country of Origin",
            "status": "not_verified",
            "value": None,
            "rule": "Rule 6(1)(n)",
            "score_impact": -10,
        })

    # -------------------------------------------------------------
    # 4. Font Size as Per Rule (Rule 9 & Schedule II)
    # -------------------------------------------------------------
    font_rule = declarations.get("font_size_rule", {})
    is_font_compliant = font_rule.get("is_compliant")
    measured_h = font_rule.get("measured_height_mm")
    required_h = font_rule.get("required_min_height_mm")

    if font_rule.get("status") == "NOT_DETECTED" or measured_h is None:
        checks.append({
            "field": "Font Size as Per Rule",
            "status": "not_verified",
            "value": None,
            "rule": "Rule 9 & Schedule II",
            "score_impact": 0,
        })
    elif is_font_compliant:
        checks.append({
            "field": "Font Size as Per Rule",
            "status": "detected",
            "value": f"{measured_h} mm (Min: {required_h} mm)",
            "rule": "Rule 9 & Schedule II",
            "score_impact": 0,
        })
    else:
        violations.append(
            create_violation(
                field="font_size",
                title="Font Size Below Mandatory Minimum (Rule 9)",
                severity="warning",
                message=f"Measured declaration height ({measured_h} mm) is below statutory minimum ({required_h} mm).",
                recommendation="Increase letter & numeral font height on Principal Display Panel to comply with Schedule II.",
            )
        )
        checks.append({
            "field": "Font Size as Per Rule",
            "status": "non_compliant",
            "value": f"{measured_h} mm (Min required: {required_h} mm)",
            "rule": "Rule 9 & Schedule II",
            "score_impact": -10,
        })

    # -------------------------------------------------------------
    # 5. Manufacturer / Packer Details Check (Rule 6(1)(a)) - MANDATORY
    # -------------------------------------------------------------
    company_details = declarations.get("company_details", {})
    mfg_obj = company_details.get("manufacturer", {})
    packer_obj = company_details.get("packer", {})
    importer_obj = company_details.get("importer", {})

    mfg_val = mfg_obj.get("value") if isinstance(mfg_obj, dict) else mfg_obj
    packer_val = packer_obj.get("value") if isinstance(packer_obj, dict) else packer_obj
    importer_val = importer_obj.get("value") if isinstance(importer_obj, dict) else importer_obj

    company_val = mfg_val or packer_val or importer_val
    company_detected = bool(company_val)

    if company_detected:
        checks.append({
            "field": "Manufacturer / Packer",
            "status": "detected",
            "value": str(company_val),
            "rule": "Rule 6(1)(a)",
            "score_impact": 0,
        })
    else:
        violations.append(
            create_violation(
                field="manufacturer",
                title="Manufactured By Details Missing (Rule 6(1)(a))",
                severity="critical",
                message="Manufacturer, packer or importer name & address were not detected.",
                recommendation="Scan the back or side panel displaying the complete manufacturer name and address.",
            )
        )
        checks.append({
            "field": "Manufacturer / Packer",
            "status": "non_compliant",
            "value": None,
            "rule": "Rule 6(1)(a)",
            "score_impact": -30,
        })

    # -------------------------------------------------------------
    # 6. Manufacturing Date (MFD / PKD) and Expiry / Use By Date (Rule 6(1)(d)) - MANDATORY
    # -------------------------------------------------------------
    dates = declarations.get("dates", {})
    mfg_date_obj = dates.get("manufacturing_date", {})
    pkg_date_obj = dates.get("packing_date", {})
    exp_date_obj = dates.get("expiry_date", {})
    bb_date_obj = dates.get("best_before", {})

    mfg_date = mfg_date_obj.get("value") if isinstance(mfg_date_obj, dict) else mfg_date_obj
    pkg_date = pkg_date_obj.get("value") if isinstance(pkg_date_obj, dict) else pkg_date_obj
    exp_date = exp_date_obj.get("value") if isinstance(exp_date_obj, dict) else exp_date_obj
    bb_date = bb_date_obj.get("value") if isinstance(bb_date_obj, dict) else bb_date_obj

    mfg_or_pkg = mfg_date or pkg_date
    exp_or_bb = exp_date or bb_date

    mfd_detected = bool(mfg_or_pkg)
    expiry_detected = bool(exp_or_bb)

    # 6a. Manufacturing / Packing Date (MFD) - MANDATORY
    if mfd_detected:
        checks.append({
            "field": "Manufacturing / Packing Date (MFD/PKD)",
            "status": "detected",
            "value": str(mfg_or_pkg),
            "rule": "Rule 6(1)(d)",
            "score_impact": 0,
        })
    else:
        violations.append(
            create_violation(
                field="mfd_date",
                title="Manufacturing Date (MFD/PKD) Missing (Rule 6(1)(d))",
                severity="critical",
                message="Mandatory Date of Manufacture or Packing (MFD/PKD) was not detected on the packaging.",
                recommendation="Capture the panel or dot-matrix imprint displaying the MFD/PKD declaration.",
            )
        )
        checks.append({
            "field": "Manufacturing / Packing Date (MFD/PKD)",
            "status": "non_compliant",
            "value": None,
            "rule": "Rule 6(1)(d)",
            "score_impact": -30,
        })

    # 6b. Use By / Expiry Date / Best Before (Expiry) - MANDATORY
    if expiry_detected:
        checks.append({
            "field": "Use By / Expiry Date",
            "status": "detected",
            "value": str(exp_or_bb),
            "rule": "Rule 6(1)(d)",
            "score_impact": 0,
        })
    else:
        violations.append(
            create_violation(
                field="expiry_date",
                title="Date of Expiry / Use By Missing (Rule 6(1)(d))",
                severity="critical",
                message="Mandatory Date of Expiry, Use By, or Best Before period declaration was not detected.",
                recommendation="Capture the panel or stamp declaring the Expiry Date, Use By, or Best Before period.",
            )
        )
        checks.append({
            "field": "Use By / Expiry Date",
            "status": "non_compliant",
            "value": None,
            "rule": "Rule 6(1)(d)",
            "score_impact": -30,
        })

    # -------------------------------------------------------------
    # 7. Consumer Care Check (Rule 6(1)(f))
    # -------------------------------------------------------------
    consumer_care = declarations.get("consumer_care", {})
    phone = consumer_care.get("phone")
    email = consumer_care.get("email")
    cell_name = consumer_care.get("cell_name")
    address_ref = consumer_care.get("address")
    website = consumer_care.get("website")
    care_parts = [p for p in [cell_name, phone, email, address_ref, website] if p]

    if care_parts or consumer_care.get("evidence"):
        checks.append({
            "field": "Consumer Care",
            "status": "detected",
            "value": consumer_care.get("evidence") or " • ".join(care_parts),
            "rule": "Rule 6(1)(f)",
            "score_impact": 0,
        })
    else:
        violations.append(
            create_violation(
                field="consumer_care",
                title="Consumer Care Helpline Missing (Rule 6(1)(f))",
                severity="warning",
                message="Customer care telephone number or email address was not detected.",
                recommendation="Ensure toll-free helpline number and consumer care email are printed.",
            )
        )
        checks.append({
            "field": "Consumer Care",
            "status": "not_verified",
            "value": None,
            "rule": "Rule 6(1)(f)",
            "score_impact": -5,
        })

    # -------------------------------------------------------------
    # 8. Check for Non-Packaging or Zero-Declaration Image
    # -------------------------------------------------------------
    has_mrp = mrp_detected and mrp_val is not None
    has_qty = qty_detected and qty_val is not None
    has_origin = origin_detected and origin_val is not None
    has_company = company_detected
    has_mfd = mfd_detected
    has_expiry = expiry_detected
    has_care = bool(care_parts or consumer_care.get("evidence"))

    packaging_declarations_count = sum([
        1 if has_mrp else 0,
        1 if has_qty else 0,
        1 if has_origin else 0,
        1 if has_company else 0,
        1 if has_mfd else 0,
        1 if has_expiry else 0,
        1 if has_care else 0,
    ])

    # If completely zero packaging declarations were found (e.g. personal picture, selfie, landscape, random room)
    if packaging_declarations_count == 0:
        return {
            "score": 0,
            "compliance_score": 0,
            "status": "NON_PACKAGING",
            "ocr_confidence": round(ocr_confidence, 1),
            "image_quality": "unrecognized" if ocr_confidence < 30 else "non_packaging",
            "checks": checks,
            "violations": [
                create_violation(
                    field="packaging",
                    title="Non-Packaging Image Detected (Score: 0/100)",
                    severity="critical",
                    message="No mandatory Legal Metrology packaging declarations (MRP, Net Quantity, Dates, Manufacturer) were identified on this image.",
                    recommendation="Please upload a clear photograph of a packaged commodity or its Principal Display Panel (PDP).",
                )
            ],
            "violation_count": 1,
            "is_packaging": False,
            "is_compliant": False,
            "missing_mandatory_fields": [
                "Manufacturing / Packing Date (MFD / PKD)",
                "Date of Expiry / Use By",
                "Manufactured By (Name & Address)",
                "Maximum Retail Price (MRP)",
                "Net Quantity / Weight",
            ],
            "missing_mandatory_count": 5,
        }

    # -------------------------------------------------------------
    # Mandatory Core Declarations Tracking
    # Required Fields:
    # 1. MFD (Manufacturing / Packing Date)
    # 2. Date of Expiry or Use By
    # 3. Manufactured By (Manufacturer / Packer / Importer)
    # 4. MRP (Maximum Retail Price)
    # 5. Net Quantity (Net Weight / Net Volume)
    # -------------------------------------------------------------
    missing_mandatory_declarations: List[str] = []
    if not has_mfd:
        missing_mandatory_declarations.append("Manufacturing / Packing Date (MFD / PKD)")
    if not has_expiry:
        missing_mandatory_declarations.append("Date of Expiry / Use By")
    if not has_company:
        missing_mandatory_declarations.append("Manufactured By (Name & Address)")
    if not has_mrp:
        missing_mandatory_declarations.append("Maximum Retail Price (MRP)")
    if not has_qty:
        missing_mandatory_declarations.append("Net Quantity / Weight")

    missing_mandatory_count = len(missing_mandatory_declarations)

    # Secondary penalties (font size, origin, consumer care, poor OCR)
    secondary_penalties = 0
    if not is_font_compliant and measured_h is not None:
        secondary_penalties += 10
    if not has_origin:
        secondary_penalties += 10
    if not has_care:
        secondary_penalties += 5
    if ocr_confidence < 35:
        secondary_penalties += 10
        image_quality = "poor"
    elif ocr_confidence < 60:
        image_quality = "moderate"
    else:
        image_quality = "good"

    # -------------------------------------------------------------
    # Mandatory Fields Decision & Successive Deduction Rule:
    # "if MFD , date of expiry or use by , manufactured by , mrp and net quantity 
    #  if any of the 1 is missing then non compliant also score should not be 
    #  above 70 and if more required fields are missing successive deduction 
    #  in compliance score"
    # -------------------------------------------------------------
    if missing_mandatory_count > 0:
        overall_status = "NON_COMPLIANT"

        # Successive score caps:
        # 1 missing: score <= 70
        # 2 missing: successive deduction of 20 points -> score <= 50
        # 3 missing: successive deduction of 20 points -> score <= 30
        # 4 missing: successive deduction of 15 points -> score <= 15
        # 5 missing: score = 0
        MANDATORY_SCORE_CAPS = {
            1: 70,
            2: 50,
            3: 30,
            4: 15,
            5: 0,
        }
        max_allowed_score = MANDATORY_SCORE_CAPS.get(missing_mandatory_count, 0)
        score = max(0, max_allowed_score - secondary_penalties)
        score = min(score, max_allowed_score)

        violations.insert(
            0,
            create_violation(
                field="mandatory_declarations",
                title=f"Statutory Non-Compliance: {missing_mandatory_count} Core Declaration(s) Missing",
                severity="critical",
                message=(
                    f"Mandatory Legal Metrology declaration(s) missing: {', '.join(missing_mandatory_declarations)}. "
                    f"Under Rule 6(1) of PCR 2011, pre-packaged commodities missing any of the 5 core declarations "
                    f"(MFD, Expiry/Use By, Manufactured By, MRP, Net Quantity) are strictly Non-Compliant."
                ),
                recommendation="All 5 core statutory declarations must be present on packaged commodities for retail distribution.",
            ),
        )
    else:
        # All 5 mandatory fields are present
        score = max(0, min(100, 100 - secondary_penalties))
        if score >= 80:
            overall_status = "COMPLIANT"
        elif score >= 50:
            overall_status = "NEEDS_REVIEW"
        else:
            overall_status = "NON_COMPLIANT"

    score = max(0, min(100, score))

    return {
        "score": score,
        "compliance_score": score,
        "status": overall_status,
        "missing_mandatory_fields": missing_mandatory_declarations,
        "missing_mandatory_count": missing_mandatory_count,
        "ocr_confidence": round(ocr_confidence, 1),
        "image_quality": image_quality,
        "checks": checks,
        "violations": violations,
        "violation_count": len(violations),
        "is_packaging": True,
        "is_compliant": (overall_status == "COMPLIANT"),
    }
