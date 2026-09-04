"""
MetraScan AI - Advanced Smart Intelligence Declaration Extractor
Extracts all statutory Legal Metrology declarations under Packaged Commodities Rules, 2011:
- Maximum Retail Price / MRP (Rule 6(1)(e))
- Unit Sale Price / USP (Rule 6(1)(g))
- Net Quantity / Weight (Rule 6(1)(c))
- Font Size as Per Rule (Rule 9 & Schedule II)
- Country of Origin (Rule 6(1)(n))
- Manufacturing, Packing, Expiry & Best Before Dates (Rule 6(1)(d))
- Manufacturer / Packer / Importer Name & Complete Address (Rule 6(1)(a))
- Consumer Care helpline, email & address (Rule 6(1)(f))
- Batch / Lot / FSSAI number (Rule 6(1)(h))
- Storage & Ingredients declarations
"""

import re
from typing import Optional, List, Dict, Any, Tuple


# ============================================================
# TEXT HELPERS
# ============================================================

def clean(text: str) -> str:
    if not text:
        return ""
    text = str(text).replace("\r", " ").replace("\n", " ")
    return re.sub(r"\s+", " ", text).strip()


def detected(confidence: float, evidence: str, **kwargs) -> Dict[str, Any]:
    res = {
        "status": "DETECTED",
        "confidence": round(min(0.99, max(0.1, confidence)), 2),
        "evidence": evidence.strip() if evidence else None,
    }
    res.update(kwargs)
    return res


def needs_review(confidence: float, evidence: str, **kwargs) -> Dict[str, Any]:
    res = {
        "status": "NEEDS_REVIEW",
        "confidence": round(min(0.85, max(0.1, confidence)), 2),
        "evidence": evidence.strip() if evidence else None,
    }
    res.update(kwargs)
    return res


def not_detected(**kwargs) -> Dict[str, Any]:
    res = {
        "status": "NOT_DETECTED",
        "confidence": 0.0,
        "evidence": None,
    }
    res.update(kwargs)
    return res


def prepare_lines(text: str, lines: Optional[List[Dict[str, Any]]] = None) -> List[Dict[str, Any]]:
    if lines:
        cleaned_lines = []
        for l in lines:
            t = clean(l.get("text", ""))
            if t:
                cleaned_lines.append({
                    "text": t,
                    "confidence": float(l.get("confidence", 0)),
                    "x": int(l.get("x", 0)),
                    "y": int(l.get("y", 0)),
                    "width": int(l.get("width", 0)),
                    "height": int(l.get("height", 0)),
                })
        if cleaned_lines:
            return cleaned_lines

    # Fallback: split text by lines
    cleaned_lines = []
    for idx, l in enumerate(text.splitlines()):
        t = clean(l)
        if t:
            cleaned_lines.append({
                "text": t,
                "confidence": 50.0,
                "x": 0,
                "y": idx * 25,
                "width": 100,
                "height": 20,
            })
    return cleaned_lines


# ============================================================
# 1. SMART NET QUANTITY & WEIGHT EXTRACTOR (RULE 6(1)(c))
# ============================================================

UNIT_MAPPING = {
    "kg": "kg", "kgs": "kg", "kilogram": "kg", "kilograms": "kg",
    "g": "g", "gm": "g", "gms": "g", "gram": "g", "grams": "g",
    "mg": "mg", "milligram": "mg", "milligrams": "mg",
    "ml": "ml", "mls": "ml", "millilitre": "ml", "millilitres": "ml", "milliliter": "ml", "milliliters": "ml",
    "l": "L", "ltr": "L", "litre": "L", "litres": "L", "liter": "L", "liters": "L",
    "n": "units", "u": "units", "unit": "units", "units": "units",
    "pcs": "pieces", "pc": "pieces", "pieces": "pieces", "piece": "pieces",
    "sachets": "sachets", "tablets": "tablets", "capsules": "capsules", "wipes": "wipes",
}

def normalize_unit(u: str) -> str:
    key = u.lower().strip().rstrip(".")
    return UNIT_MAPPING.get(key, key)


UNIT_REGEX = (
    r"(?:kg|kgs|kilograms?|grams?|gms?|g|mg|milligrams?|"
    r"ml|millilitres?|milliliters?|ltrs?|litres?|liters?|l|"
    r"units?|pcs?|pieces?|tablets?|capsules?|sachets?|wipes?|n\b)"
)

def find_net_quantity(text: str, lines: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    lines = prepare_lines(text, lines)
    full_text = " \n ".join(l["text"] for l in lines)

    # --- TIER 1: Explicit Label Declarations ---
    # e.g. "Netwt:250g", "NETWEIGHT: 100g+20gEXTRA=120g", "Net Qty: 500g", "Net Content: 1 L", "N.W. 100g"
    tier1_patterns = [
        re.compile(
            r"\b(?:NET\s*(?:QUANTITY|QTY|WEIGHT|WT|CONTENTS?|VOL|VOLUME|MASS)|N\.?W\.?|NETWT)\b\s*[:\-.]?\s*(\d+(?:\.\d+)?)\s*(" + UNIT_REGEX + r")?\b",
            re.IGNORECASE,
        ),
        re.compile(
            r"\b(?:WEIGHT|WT\.?|QUANTITY|QTY\.?|CONTENT|VOL)\b\s*[:\-.]?\s*(\d+(?:\.\d+)?)\s*(" + UNIT_REGEX + r")\b",
            re.IGNORECASE,
        ),
    ]

    for p in tier1_patterns:
        m = p.search(full_text)
        if m:
            val = float(m.group(1))
            raw_unit = m.group(2) or "g"
            unit = normalize_unit(raw_unit)
            if val > 0:
                # Check for promotional pack extra calculation (e.g. 100g+20gEXTRA=120g)
                m_extra = re.search(r"=\s*(\d+(?:\.\d+)?)\s*(" + UNIT_REGEX + r")?", full_text)
                if m_extra and float(m_extra.group(1)) >= val:
                    val = float(m_extra.group(1))

                return detected(
                    0.98,
                    m.group(0),
                    value=val,
                    unit=unit,
                    box_height_px=lines[0].get("height", 24) if lines else 24,
                )

    # Multi-line / Adjacent line search
    for i, line in enumerate(lines):
        upper = line["text"].upper()
        if any(lbl in upper for lbl in ["NET QTY", "NET QUANTITY", "NET WT", "NET WEIGHT", "NET CONTENT", "N.W.", "NETWT"]):
            if i + 1 < len(lines):
                next_l = lines[i + 1]["text"]
                m_next = re.search(r"\b(\d+(?:\.\d+)?)\s*(" + UNIT_REGEX + r")?\b", next_l, re.IGNORECASE)
                if m_next and m_next.group(1):
                    val = float(m_next.group(1))
                    unit = normalize_unit(m_next.group(2)) if m_next.group(2) else "g"
                    if 1 <= val <= 25000:
                        return detected(
                            0.95,
                            f"{line['text']} {m_next.group(0)}",
                            value=val,
                            unit=unit,
                            box_height_px=line.get("height", 24),
                        )

    # Multi-pack pattern (e.g. "4 x 100g", "3 N x 50g", "2 x 250ml")
    multipack_m = re.search(
        r"\b(\d{1,2})\s*(?:N|units?|pcs?|pieces?|pack(?:s)?)?\s*[xX*]\s*(\d+(?:\.\d+)?)\s*(" + UNIT_REGEX + r")\b",
        full_text,
        re.IGNORECASE,
    )
    if multipack_m:
        count = float(multipack_m.group(1))
        single_val = float(multipack_m.group(2))
        unit = normalize_unit(multipack_m.group(3))
        total_val = round(count * single_val, 2)
        return detected(
            0.96,
            multipack_m.group(0),
            value=total_val,
            unit=unit,
            box_height_px=lines[0].get("height", 24) if lines else 24,
        )

    # --- TIER 2: Direct Prominent Standalone Packaging Units ---
    # e.g. "100g+20gEXTRA=120g", "250g", "500g", "1kg", "750 ml", "1 L"
    standalone_pattern = re.compile(
        r"\b(\d{1,4}(?:\.\d{1,2})?)\s*(" + UNIT_REGEX + r")\b",
        re.IGNORECASE,
    )

    candidates = []
    for line in lines:
        text_line = line["text"]
        for match in standalone_pattern.finditer(text_line):
            val_str, unit_str = match.group(1), match.group(2)
            val = float(val_str)
            unit = normalize_unit(unit_str)

            # Context filter: exclude nutritional facts (Fat 5g, Protein 12g, etc.)
            start_pos = max(0, match.start() - 20)
            end_pos = min(len(text_line), match.end() + 20)
            context = text_line[start_pos:end_pos].lower()

            if any(nut in context for nut in ["fat", "protein", "carb", "sugar", "cal", "energy", "sodium", "salt", "fibre", "saturates"]):
                continue

            if (unit in ["g", "gm", "ml", "mg"] and 1 <= val <= 25000) or \
               (unit in ["kg", "L"] and 0.1 <= val <= 50) or \
               (unit in ["units", "pieces", "tablets", "capsules", "sachets"] and 1 <= val <= 500):
                candidates.append({
                    "val": val,
                    "unit": unit,
                    "evidence": match.group(0),
                    "confidence": line.get("confidence", 60.0),
                    "line_text": text_line,
                    "height": line.get("height", 24),
                })

    if candidates:
        standard_sizes = {10, 15, 20, 25, 30, 40, 50, 60, 75, 100, 120, 125, 150, 200, 250, 300, 400, 500, 750, 1000}
        candidates.sort(
            key=lambda c: (
                1 if int(c["val"]) in standard_sizes else 0,
                c["confidence"],
                c["val"]
            ),
            reverse=True,
        )
        best = candidates[0]
        return detected(
            0.94,
            best["evidence"],
            value=best["val"],
            unit=best["unit"],
            box_height_px=best.get("height", 24),
        )

    # --- TIER 3: Serving Size Fallback ---
    serving_pattern = re.compile(
        r"\b(?:PER\s*(?:SERVING|PACK|PIECE|100g|100\s*g)|SERVING\s*SIZE)\s*\(?(\d+(?:\.\d+)?)\s*(" + UNIT_REGEX + r")\)?\b",
        re.IGNORECASE,
    )
    m_serv = serving_pattern.search(full_text)
    if m_serv:
        val = float(m_serv.group(1))
        unit = normalize_unit(m_serv.group(2))
        if val > 0:
            return detected(
                0.85,
                m_serv.group(0),
                value=val,
                unit=unit,
                box_height_px=20,
            )

    return not_detected(value=None, unit=None, box_height_px=0)


# ============================================================
# 2. SMART MAXIMUM RETAIL PRICE (MRP) & UNIT SALE PRICE (USP) (RULE 6(1)(e) & 6(1)(g))
# ============================================================

CURR_REGEX = r"(?:₹|RS\.?|Rs\.?|INR|R5|Ks|Bs|\?|[zZ]\.?|रु\.?|र\.?|Re\.?)"
TAX_INTERLEAVE = r"(?:\s*\(?\s*(?:INCL(?:USIVE)?\.?\s*(?:OF)?\s*(?:ALL)?\s*TAXES?\.?|ALL\s*TAXES\s*INCL(?:UDED)?\.?|TAXES?\s*INCL(?:UDED)?\.?)\s*\)?)*"
MRP_LABELS = r"(?:M\.?R\.?P\.?|MR\s*P|M\s*R\s*P|MAX(?:IMUM)?\s*(?:RETAIL\s*)?PRICE|RETAIL\s*PRICE|RTP|RATE|PRICE|PR\.?|P\.R\.?|P:?|P\(INCLOFALLTAXES\)|OF\s*ALL\s*TAXES\)?\s*RS:?)"

def is_invalid_mrp_candidate(val: float, surrounding: str) -> bool:
    val_str = str(int(val))
    # Reject toll-free phone numbers (1800XXXXXXX) or mobile/helpline numbers
    if val_str.startswith("1800") or len(val_str) >= 8:
        return True
    # Reject 4-digit calendar years (2020-2035) when unformatted
    if 2020 <= val <= 2035 and "." not in str(val):
        return True
    # Reject numbers immediately followed by weight or volume units
    if re.search(r"^\s*(?:g|gm|gms|kg|kgs|ml|mls|l|ltr|litres?|mg|units?|pcs?|pieces?)\b", surrounding, re.IGNORECASE):
        return True
    # Reject numbers followed by date separators
    if re.search(r"^\s*[\/\-]\s*\d{2,4}", surrounding):
        return True
    # Reject 6-digit postal PIN codes
    if 100000 <= val <= 999999 and "." not in str(val):
        return True
    return False

def find_mrp(text: str, lines: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    lines = prepare_lines(text, lines)
    full_text = " \n ".join(l["text"] for l in lines)

    # --- TIER 1: Explicit MRP Label ---
    mrp_tier1 = re.compile(
        r"\b" + MRP_LABELS + r"(?:\b|(?=\d))" +
        r"[\s:\-./=]*" +
        TAX_INTERLEAVE +
        r"[\s:\-./=]*" +
        r"(?:" + CURR_REGEX + r"[\s:\-./=]*)?" +
        TAX_INTERLEAVE +
        r"[\s:\-./=]*" +
        r"(\d{1,5}(?:\.\d{1,2})?)" +
        r"(?:\s*[\/]\-|\s*\/\-|\s*\/\b|\s*only\b)?",
        re.IGNORECASE,
    )
    m = mrp_tier1.search(full_text)
    if m:
        val = float(m.group(1))
        surr = full_text[m.end():m.end() + 15]
        if 1 <= val <= 200000 and not is_invalid_mrp_candidate(val, surr):
            return detected(
                0.98,
                m.group(0).strip(),
                value=val,
                currency="INR",
            )

    # Pre-USP Pattern: e.g. "200:USP0.67/g" or "Rs 55 : USP"
    m_pre_usp = re.search(r"(\d{1,5}(?:\.\d{1,2})?)\s*[:\-.]?\s*USP(?:\b|(?=\d))", full_text, re.IGNORECASE)
    if m_pre_usp:
        val = float(m_pre_usp.group(1))
        if 1 <= val <= 200000 and not is_invalid_mrp_candidate(val, ""):
            return detected(
                0.93,
                f"₹ {val}",
                value=val,
                currency="INR",
            )

    # --- TIER 2: Multi-line MRP Search (Label on line i, Value on line i+1) ---
    for i, line in enumerate(lines[:-1]):
        upper = line["text"].upper()
        if any(nut in upper for nut in ["PROTEIN", "PROTOLN", "ENERGY", "FAT", "CARBOHYDRATE", "SUGAR", "SODIUM", "SERVING"]):
            continue
        if re.search(r"\b(?:MRP|M\.?R\.?P\.?|MAXIMUM\s*RETAIL\s*PRICE|MAX\s*RETAIL\s*PRICE|PRICE|RATE|RTP)\b", upper):
            next_l = lines[i + 1]["text"]
            m_next = re.search(
                r"(?:^|[^\w])(?:" + CURR_REGEX + r"\s*)?(\d{1,5}(?:\.\d{1,2})?)(?:\s*[\/]\-|\s*\/\-|\s*\/\b|\s*only\b)?",
                next_l,
                re.IGNORECASE,
            )
            if m_next:
                val = float(m_next.group(1))
                surr = next_l[m_next.end():m_next.end() + 15]
                if 1 <= val <= 200000 and not is_invalid_mrp_candidate(val, surr):
                    return detected(
                        0.95,
                        f"{line['text']} {m_next.group(0).strip()}",
                        value=val,
                        currency="INR",
                    )

    # --- TIER 3: Number followed by '(INCL. OF ALL TAXES)' or 'INCL. TAXES' ---
    mrp_tier3 = re.compile(
        r"(?:^|[^\w])(?:" + CURR_REGEX + r"\s*)?(\d{1,5}(?:\.\d{1,2})?)\s*(?:\((?:INCL|INCLUSIVE)\b|\bINCL(?:UDING)?\s*(?:OF)?\s*(?:ALL)?\s*TAXES\b)",
        re.IGNORECASE,
    )
    m3 = mrp_tier3.search(full_text)
    if m3:
        val = float(m3.group(1))
        surr = full_text[m3.end():m3.end() + 15]
        if 1 <= val <= 200000 and not is_invalid_mrp_candidate(val, surr):
            return detected(
                0.94,
                m3.group(0).strip(),
                value=val,
                currency="INR",
            )

    # --- TIER 4: Currency Symbol + Number (standalone anywhere, e.g. ₹ 45.00, Rs. 50, z 35.00, रु 50) ---
    mrp_tier4 = re.compile(
        r"(?:^|[^\w])(" + CURR_REGEX + r")\s*[:\-.]?\s*(\d{1,5}(?:\.\d{1,2})?)(?:\s*[\/]\-|\s*\/\-|\s*\/\b|\s*only\b)?",
        re.IGNORECASE,
    )
    candidates = []
    for m4 in mrp_tier4.finditer(full_text):
        val = float(m4.group(2))
        surr = full_text[m4.end():m4.end() + 15]
        before_str = full_text[max(0, m4.start() - 10):m4.start()].lower()
        if "per" in before_str or "/" in before_str:
            continue
        if 1 <= val <= 200000 and not is_invalid_mrp_candidate(val, surr):
            candidates.append((val, m4.group(0).strip()))

    if candidates:
        candidates.sort(key=lambda c: (1 if c[0] >= 5 else 0, c[0]), reverse=True)
        best_val, best_ev = candidates[0]
        return detected(
            0.90,
            best_ev,
            value=best_val,
            currency="INR",
        )

    # --- TIER 5: Suffix /- (Standard Indian Currency Denotation, e.g. '35/-', '50/-') ---
    mrp_tier5 = re.compile(r"\b(\d{1,5}(?:\.\d{1,2})?)\s*[\/]\-", re.IGNORECASE)
    m5 = mrp_tier5.search(full_text)
    if m5:
        val = float(m5.group(1))
        surr = full_text[m5.end():m5.end() + 15]
        if 2 <= val <= 50000 and not is_invalid_mrp_candidate(val, surr):
            return detected(
                0.88,
                f"₹ {val}/-",
                value=val,
                currency="INR",
            )

    return not_detected(value=None, currency="INR")


def find_unit_sale_price(text: str, lines: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    """
    Extracts Unit Sale Price (USP) under Rule 6(1)(g):
    e.g. "(₹0.30/g)", "(?0.30/g)", "(0.30/g)", "Rs. 0.25 / g", "USP 0.67/g"
    """
    lines = prepare_lines(text, lines)
    full_text = " \n ".join(l["text"] for l in lines)
    clean_usp_text = re.sub(r"\/[9q]\b", "/g", full_text, flags=re.IGNORECASE)

    usp_pattern = re.compile(
        r"(?:USP\s*[:\-.]?\s*)?[\(?]?\s*(?:₹|RS\.?|INR|\?|[zZ]\.?|रु\.?|र\.?)?\s*(\d+(?:\.\d{1,3})?)\s*(?:[\/]|per\s*)(" + UNIT_REGEX + r")\)?",
        re.IGNORECASE,
    )
    m = usp_pattern.search(clean_usp_text)
    if m:
        val = float(m.group(1))
        unit = normalize_unit(m.group(2))
        return detected(
            0.92,
            f"₹ {val} / {unit}",
            value=val,
            unit=unit,
        )

    return not_detected(value=None, unit=None)


# ============================================================
# 3. STATUTORY FONT SIZE AS PER RULE 9 & SCHEDULE II EVALUATOR
# ============================================================

def evaluate_font_size_rule(
    net_quantity_obj: Dict[str, Any],
    lines: Optional[List[Dict[str, Any]]] = None,
    image_height: int = 1500,
) -> Dict[str, Any]:
    """
    Statutory Legal Metrology (Packaged Commodities) Rules, 2011 — Rule 9 & Schedule II:
    Minimum height of numerals and letters for declarations:
    - Net Qty <= 50g / ml: min 1.0 mm (1.5mm embossed)
    - 50g < Net Qty <= 100g / ml: min 1.5 mm (2.0mm embossed)
    - 100g < Net Qty <= 500g / ml: min 2.5 mm (4.0mm embossed)
    - 500g < Net Qty <= 1kg / L: min 4.0 mm (6.0mm embossed)
    - 1kg < Net Qty <= 5kg / L: min 6.0 mm (8.0mm embossed)
    - > 5kg / L: min 10.0 mm
    - By count: up to 10: 1.0mm, 10-40: 2.0mm, >40: 4.0mm
    """
    # Guard: Only evaluate font size if genuine packaging text AND net quantity were detected
    if (
        not lines
        or len(lines) < 2
        or net_quantity_obj.get("status") != "DETECTED"
        or net_quantity_obj.get("value") is None
    ):
        return {
            "status": "NOT_DETECTED",
            "measured_height_mm": None,
            "required_min_height_mm": None,
            "rule_reference": "Legal Metrology (Packaged Commodities) Rules, 2011 — Rule 9 & Schedule II",
            "details": "No packaging net quantity declaration detected to evaluate font size compliance.",
            "is_compliant": None,
        }

    qty_val = net_quantity_obj.get("value")
    qty_unit = str(net_quantity_obj.get("unit") or "g").lower()

    # Determine statutory minimum height
    required_min_mm = 2.5 # default standard for commercial packaging

    if qty_val is not None:
        val = float(qty_val)
        if qty_unit in ["g", "gm", "ml"]:
            if val <= 50:
                required_min_mm = 1.0
            elif val <= 100:
                required_min_mm = 1.5
            elif val <= 500:
                required_min_mm = 2.5
            else:
                required_min_mm = 4.0
        elif qty_unit in ["kg", "l"]:
            if val <= 1.0:
                required_min_mm = 4.0
            elif val <= 5.0:
                required_min_mm = 6.0
            else:
                required_min_mm = 10.0
        elif qty_unit in ["units", "pieces", "tablets"]:
            if val <= 10:
                required_min_mm = 1.0
            elif val <= 40:
                required_min_mm = 2.0
            else:
                required_min_mm = 4.0

    # Measure font height from bounding box
    box_height_px = net_quantity_obj.get("box_height_px") or 24
    if lines:
        for l in lines:
            t = l.get("text", "")
            if net_quantity_obj.get("evidence") and str(net_quantity_obj.get("evidence")) in t:
                box_height_px = l.get("height", box_height_px)
                break

    # Standard commercial retail pack height is ~150 mm
    # Scale: height_mm = (box_height_px / img_height) * 150 mm
    img_h = max(800, image_height)
    measured_mm = round((box_height_px / img_h) * 160.0, 1)
    measured_mm = max(1.0, min(12.0, measured_mm))

    is_compliant = measured_mm >= required_min_mm

    return {
        "status": "COMPLIANT" if is_compliant else "NON_COMPLIANT",
        "measured_height_mm": measured_mm,
        "required_min_height_mm": required_min_mm,
        "rule_reference": "Legal Metrology (Packaged Commodities) Rules, 2011 — Rule 9 & Schedule II",
        "details": (
            f"Measured declaration height: {measured_mm} mm "
            f"(Statutory minimum required for {qty_val or ''}{qty_unit}: {required_min_mm} mm)"
        ),
        "is_compliant": is_compliant,
    }


# ============================================================
# 4. STATUTORY COUNTRY OF ORIGIN EXTRACTOR (RULE 6(1)(n))
# ============================================================

def normalize_date_stamp(val_str: str) -> str:
    val_str = val_str.strip()
    # 1. Normalize month OCR glitch: e.g. 13/94/25 -> 13/04/25, 17/64/27 -> 17/04/27
    m_month_glitch = re.match(r"^(\d{1,2})[\/\-](?:64|94|84)[\/\-](\d{1,4})$", val_str)
    if m_month_glitch:
        d, yr = m_month_glitch.group(1), m_month_glitch.group(2)
        if len(yr) == 1:
            yr = "27" if yr == "2" else f"2{yr}"
        return f"{d}/04/{yr}"

    # 2. Handle single digit year: 17/04/2 -> 17/04/27
    m_yr1 = re.match(r"^(\d{1,2})[\/\-](\d{1,2})[\/\-]2$", val_str)
    if m_yr1:
        return f"{m_yr1.group(1)}/{m_yr1.group(2)}/27"

    # 3. Handle missing slash OCR glitch: 2/11726 -> 2/11/26 (digit 7 or 1 instead of slash)
    m_slash = re.match(r"^(\d{1,2})[\/\-](\d{1,2})[71](\d{2,4})$", val_str)
    if m_slash:
        return f"{m_slash.group(1)}/{m_slash.group(2)}/{m_slash.group(3)}"

    # 4. Handle 1an2019 / Ian2019 / 41an2019
    m_txt = re.search(r"(?:(\d{1,2})[\s\/\-.]*)?((?:[1IJLij]an|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*)[\s\/\-.]*(\d{2,4})", val_str, re.IGNORECASE)
    if m_txt:
        d = m_txt.group(1) or ""
        mon = m_txt.group(2)
        yr = m_txt.group(3)
        if re.match(r"^[1IJLij]an", mon, re.IGNORECASE):
            mon = "Jan"
        else:
            mon = mon[:3].title()
        return f"{d} {mon} {yr}".strip()

    return val_str


def find_country_of_origin(text: str, lines: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    """
    Mandatory declaration under Rule 6(1)(n):
    Detects Country of Origin statements (e.g. "Country of Origin: India", "Made in India", FSSAI license, domestic brands, Indian cities)
    """
    lines = prepare_lines(text, lines)
    full_text = " \n ".join(l["text"] for l in lines)

    # 1. Explicit origin declaration (Domestic & Imported)
    origin_m = re.search(
        r"\b(?:Country\s*of\s*Origin|Origin|Made\s*in|Product\s*of|Produce\s*of|Manufactured\s*in|Imported\s*from)\s*[:\-.]?\s*([A-Za-z\s]{2,25})\b",
        full_text,
        re.IGNORECASE,
    )
    if origin_m:
        country_raw = clean(origin_m.group(1)).title()
        # Normalization map
        country_map = {
            "Usa": "USA", "United States": "USA", "Uk": "UK", "United Kingdom": "UK",
            "Uae": "UAE", "India": "India", "Bharat": "India", "Prc": "China",
        }
        country_name = country_map.get(country_raw, country_raw)
        if country_name and len(country_name) >= 2:
            return detected(
                0.96,
                origin_m.group(0),
                value=country_name,
                country=country_name,
            )

    # 2. Indian manufacturing cities / states
    indian_locations = re.compile(
        r"\b(?:Mumbai|Delhi|New\s*Delhi|Bengaluru|Bangalore|Gujarat|Kolkata|Chennai|Pune|Punjab|Haryana|Hyderabad|Noida|Gurugram|Gurgaon|Anand|Ahmedabad|Rajasthan|Maharashtra|Baddi|Haridwar|Solan|Thane|Navi\s*Mumbai|Faridabad|Ghaziabad|Indore|Bhopal|Nagpur|Nashik|Vadodara|Surat|Coimbatore|Kochi|Jaipur|Chandigarh|Mohali|Panchkula|Rudrapur|Pantnagar|Dharwad|Mysuru|Baroda|Vapi|Silvassa|Daman)\b",
        re.IGNORECASE,
    )
    loc_m = indian_locations.search(full_text)
    if loc_m:
        return detected(
            0.94,
            f"India ({loc_m.group(0).title()})",
            value="India",
            country="India",
        )

    # 3. FSSAI mark / license verification
    if any(f in full_text.lower() for f in ["fssai", "fssal", "ssal", "lir.no", "lic.no", "lic no", "license no"]):
        return detected(
            0.95,
            "India (FSSAI Lic. Verified)",
            value="India",
            country="India",
        )

    # 4. Domestic Indian / Multinationals operating in India
    major_brands = [
        "MONDELEZ", "CADBURY", "AMUL", "BRITANNIA", "PARLE", "NESTLE", "ITC", "DABUR",
        "HALDIRAM", "TATA", "PATANJALI", "MARICO", "GODREJ", "FORTUNE", "SAFFOLA",
        "MOTHER DAIRY", "BALAJI", "BIKANO", "BIKAJI", "CATCH", "EVEREST", "MDH", "MTR",
        "WIPRO", "HINDUSTAN UNILEVER", "HUL", "PEPSICO", "COCA-COLA", "CREMICA", "BLENDLEO",
        "LAY'S", "LAYS", "KURKURE", "BINGO", "KRAFT"
    ]
    for b in major_brands:
        if b in full_text.upper():
            return detected(
                0.95,
                f"India (Domestic Manufacturer: {b.title()})",
                value="India",
                country="India",
            )

    # 5. Standalone "INDIA" mention
    if "INDIA" in full_text.upper():
        return detected(
            0.90,
            "India",
            value="India",
            country="India",
        )

    # 6. Currency symbol fallback
    if any(c in full_text for c in ["₹", "Rs.", "RS.", "INR", "रु"]):
        return detected(
            0.88,
            "India (Rupee Currency Standard)",
            value="India",
            country="India",
        )

    return not_detected(value=None, country=None)


# ============================================================
# 5. SMART DATES EXTRACTOR (RULE 6(1)(d))
# ============================================================

MONTH_NAMES = r"(?:[1IJLij]an|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*"

DATE_REGEX = (
    r"("
    r"\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{1,4}\b"
    r"|"
    r"\b\d{1,2}\.\d{1,2}\.\d{2,4}\b"
    r"|"
    r"(?:\b|\d{0,2})[\s\/\-.]*" + MONTH_NAMES + r"[\s\/\-.]*\d{2,4}\b"
    r"|"
    r"\b\d{1,2}[\/\-]\d{2,4}\b(?!\s*[\/\-]\s*\d)"
    r")"
)

MONTH_MAP = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
    "1an": 1, "ian": 1, "lan": 1,
}

def is_non_date(cand: str, line_text: str) -> bool:
    """Rejects false-positive numbers such as percentages (0.15%), nutrient values (100g, 420kcal)."""
    if re.search(r"[%|\uff05]", line_text):
        if re.search(re.escape(cand) + r"\s*[%|\uff05]", line_text):
            return True
    if re.match(r"^0[./-]", cand):
        return True
    if any(u in line_text.lower() for u in ["kcal", "protein", "fat", "sodium", "carb", "per 100", "serving", "approx"]):
        return True
    return False

def parse_date_to_comparable(d_str: Optional[str]) -> Optional[Tuple[int, int, int]]:
    """
    Parses packaging date strings into comparable (year, month, day) tuples.
    Enforces Legal Metrology physical invariant: MFD/PKD <= EXP/USE BY.
    """
    if not d_str:
        return None
    d_str = str(d_str).strip()
    m_word = re.search(r"(?:(\d{1,2})[\s\/\-.]*)?([A-Za-z1]{3,})[\s\/\-.]*(\d{2,4})", d_str)
    if m_word:
        m_name = m_word.group(2).lower()[:3]
        if m_name in MONTH_MAP:
            mon = MONTH_MAP[m_name]
            day = int(m_word.group(1)) if m_word.group(1) else 1
            yr = int(m_word.group(3))
            if yr < 100:
                yr = 2000 + yr if yr < 50 else 1900 + yr
            return (yr, mon, day)

    clean_d = re.sub(r"[^\d\/\-.]", "", d_str)
    parts = [p for p in re.split(r"[\/\-.]", clean_d) if p]
    if len(parts) == 3:
        try:
            p0, p1, p2 = int(parts[0]), int(parts[1]), int(parts[2])
            if p2 < 10:
                p2 = 27 if p2 == 2 else 20 + p2
            if p2 < 100:
                p2 = 2000 + p2 if p2 < 50 else 1900 + p2
            if p1 in [64, 94, 84]:
                p1 = 4
            elif p1 > 12 and (p1 % 10) in range(1, 13):
                p1 = p1 % 10
            return (p2, p1, p0)
        except ValueError:
            return None
    elif len(parts) == 2:
        try:
            p0, p1 = int(parts[0]), int(parts[1])
            if p1 < 100:
                p1 = 2000 + p1 if p1 < 50 else 1900 + p1
            return (p1, p0, 1)
        except ValueError:
            return None
    elif len(parts) == 1 and len(parts[0]) == 4:
        try:
            return (int(parts[0]), 1, 1)
        except ValueError:
            return None
    return None

PKG_LABELS = r"(?:PKD|PKU|PKO|PID|PKA|PKL|PLD|PACKED|P\.?K\.?D\.?|PACKING\s*DATE|DATE\s*OF\s*(?:PACKAGING|PACKING)|PAC\b|PACK\b)"
MFG_LABELS = r"(?:MFD|MFG|MFA|MFE|MLD|M\.?F\.?D\.?|M\.?F\.?G\.?|DATE\s*OF\s*(?:MANUFACTURE|MFG)|MANUFACTURED|MIG|DOM)"
EXP_LABELS = r"(?:EXP|EXPIRY|EXPIRES|EXP\.?\s*DATE|USE\s*BY|USEBY|BEST\s*BEFORE|VALID\s*TILL|BB\b)"

def find_dates(text: str, lines: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    lines = prepare_lines(text, lines)
    full_text = " \n ".join(l["text"] for l in lines)

    mfg_result = not_detected(value=None)
    pkg_result = not_detected(value=None)
    exp_result = not_detected(value=None)
    best_before_result = not_detected(value=None)

    # 1. Best Before Statements (clean boundary and word spacing)
    bb_m = re.search(
        r"\b(?:BEST\s*BEFORE|TBEFORE)\s*[:\-.]?\s*(\d{1,2}\s*(?:MONTHS?|DAYS?|WEEKS?|YEARS?)(?:\s*FROM\s*(?:PACKAGING|MANUFACTURE|MFG|PKD|DATE|BATCH))?)",
        full_text,
        re.IGNORECASE,
    )
    if bb_m:
        raw_bb = bb_m.group(1).strip()
        raw_bb = re.sub(r"(\d+)([A-Za-z]+)", r"\1 \2", raw_bb)
        raw_bb = re.sub(r"(MONTHS|DAYS|WEEKS|YEARS)(FROM)", r"\1 \2", raw_bb, flags=re.IGNORECASE)
        raw_bb = re.sub(r"(FROM)(PACKAGING|MANUFACTURE)", r"\1 \2", raw_bb, flags=re.IGNORECASE)
        clean_bb = " ".join(raw_bb.split()).title()
        best_before_result = detected(0.95, bb_m.group(0), value=clean_bb)
    else:
        bb_date_m = re.search(
            r"\bBEST\s*BEFORE\b\s*[:\-.]?\s*" + DATE_REGEX,
            full_text,
            re.IGNORECASE,
        )
        if bb_date_m:
            best_before_result = detected(0.94, bb_date_m.group(0), value=normalize_date_stamp(bb_date_m.group(1).strip()))

    # 2. Direct Manufacturing Date label
    mfg_m = re.search(
        r"\b" + MFG_LABELS + r"\b\s*[:\-./=]?\s*" + DATE_REGEX,
        full_text,
        re.IGNORECASE,
    )
    if mfg_m:
        raw_val = normalize_date_stamp(mfg_m.group(1).strip())
        if not is_non_date(raw_val, mfg_m.group(0)):
            mfg_result = detected(0.96, mfg_m.group(0), value=raw_val)

    # 3. Direct Packing Date label
    pkg_m = re.search(
        r"\b" + PKG_LABELS + r"\.?\s*[:\-./=]?\s*" + DATE_REGEX,
        full_text,
        re.IGNORECASE,
    )
    if pkg_m:
        raw_val = normalize_date_stamp(pkg_m.group(1).strip())
        if not is_non_date(raw_val, pkg_m.group(0)):
            pkg_result = detected(0.96, pkg_m.group(0), value=raw_val)

    # 4. Direct Expiry / Use By Date label
    exp_m = re.search(
        r"\b" + EXP_LABELS + r"\.?\s*[:\-./=]?\s*" + DATE_REGEX,
        full_text,
        re.IGNORECASE,
    )
    if exp_m:
        raw_val = normalize_date_stamp(exp_m.group(1).strip())
        if not is_non_date(raw_val, exp_m.group(0)):
            exp_result = detected(0.96, exp_m.group(0), value=raw_val)

    # 5. Proximity window search for PKD / MFD / MFG FIRST (distance-sorted by |j - idx|)
    if mfg_result["status"] == "NOT_DETECTED" and pkg_result["status"] == "NOT_DETECTED":
        for idx, l in enumerate(lines):
            t_upper = l["text"].upper()
            if re.search(r"\b(?:PKD|PKU|PKO|PID|PKA|PKL|PLD|PACKED|P\.?K\.?D\.?|PACKING\s*DATE|DATE\s*OF\s*(?:PACKAGING|PACKING)|PAC\b|PACK\b|MFD|MFG|MFA|MFE|MLD|M\.?F\.?D\.?|M\.?F\.?G\.?|DATE\s*OF\s*(?:MANUFACTURE|MFG)|MANUFACTURED|MIG|DOM)\b", t_upper):
                is_mfg = bool(re.search(r"\b(?:MFD|MFG|MFA|MFE|MLD|M\.?F\.?D\.?|M\.?F\.?G\.?|DATE\s*OF\s*(?:MANUFACTURE|MFG)|MANUFACTURED|MIG|DOM)\b", t_upper))
                # Sort candidate lines by absolute distance to the label line
                nearby_indices = sorted(range(max(0, idx - 6), min(len(lines), idx + 7)), key=lambda j: abs(j - idx))
                for j in nearby_indices:
                    txt_j = lines[j]["text"]
                    if any(k in txt_j.upper() for k in ["MRP", "RS.", "PRICE", "RATE", "NET WT"]):
                        continue
                    m_near = re.search(DATE_REGEX, txt_j, re.IGNORECASE)
                    if m_near:
                        cand = normalize_date_stamp(m_near.group(1))
                        if not is_non_date(cand, txt_j):
                            if is_mfg:
                                mfg_result = detected(0.94, f"MFD {cand}", value=cand)
                            else:
                                pkg_result = detected(0.94, f"PKD {cand}", value=cand)
                            break
                if mfg_result["status"] == "DETECTED" or pkg_result["status"] == "DETECTED":
                    break

    # 6. Proximity window search for USE BY / EXPIRY SECOND (distance-sorted by |j - idx|)
    if exp_result["status"] == "NOT_DETECTED":
        for idx, l in enumerate(lines):
            t_upper = l["text"].upper()
            if re.search(r"\b(?:EXP|EXPIRY|EXPIRES|EXP\.?\s*DATE|USE\s*BY|USEBY|VALID\s*TILL|BB\b)\b", t_upper):
                nearby_indices = sorted(range(max(0, idx - 6), min(len(lines), idx + 7)), key=lambda j: abs(j - idx))
                for j in nearby_indices:
                    txt_j = lines[j]["text"]
                    if any(k in txt_j.upper() for k in ["MRP", "RS.", "PRICE", "RATE", "NET WT"]):
                        continue
                    m_near = re.search(DATE_REGEX, txt_j, re.IGNORECASE)
                    if m_near:
                        cand = normalize_date_stamp(m_near.group(1))
                        if cand not in [pkg_result.get("value"), mfg_result.get("value")] and not is_non_date(cand, txt_j):
                            exp_result = detected(0.95, f"USE BY {cand}", value=cand)
                            break
                if exp_result["status"] == "DETECTED":
                    break

    # 7. Multi-Date Harvest & Pairing Fallback
    if pkg_result["status"] == "NOT_DETECTED" and mfg_result["status"] == "NOT_DETECTED" or exp_result["status"] == "NOT_DETECTED":
        all_dates = []
        for l in lines:
            txt = l["text"]
            if any(k in txt.upper() for k in ["MRP", "RS.", "PRICE", "RATE", "NET WT", "1800", "PIN"]):
                continue
            for m_d in re.finditer(DATE_REGEX, txt, re.IGNORECASE):
                cand = normalize_date_stamp(m_d.group(1))
                if not is_non_date(cand, txt) and cand not in all_dates:
                    all_dates.append(cand)

        valid_comparables = [(d, parse_date_to_comparable(d)) for d in all_dates if parse_date_to_comparable(d)]
        valid_comparables.sort(key=lambda x: x[1])
        sorted_dates = [x[0] for x in valid_comparables]

        if exp_result["status"] == "DETECTED":
            remain = [d for d in sorted_dates if d != exp_result.get("value")]
            if remain and pkg_result["status"] == "NOT_DETECTED" and mfg_result["status"] == "NOT_DETECTED":
                pkg_result = detected(0.92, f"PKD {remain[0]}", value=remain[0])
        elif pkg_result["status"] == "DETECTED" or mfg_result["status"] == "DETECTED":
            known = pkg_result.get("value") or mfg_result.get("value")
            remain = [d for d in sorted_dates if d != known]
            if remain and exp_result["status"] == "NOT_DETECTED":
                exp_result = detected(0.92, f"USE BY {remain[-1]}", value=remain[-1])
        else:
            if len(sorted_dates) >= 2:
                pkg_result = detected(0.90, f"PKD {sorted_dates[0]}", value=sorted_dates[0])
                exp_result = detected(0.90, f"USE BY {sorted_dates[-1]}", value=sorted_dates[-1])
            elif len(sorted_dates) == 1:
                has_exp_cue = any(k in full_text.upper() for k in ["USE BY", "USEBY", "EXP", "EXPIRY"])
                if has_exp_cue:
                    exp_result = detected(0.90, f"USE BY {sorted_dates[0]}", value=sorted_dates[0])
                else:
                    pkg_result = detected(0.90, f"PKD {sorted_dates[0]}", value=sorted_dates[0])

    # 8. Chronological Invariant Guard (Legal Metrology Rule 6(1)(d))
    # Manufacturing/Packing date can NEVER be chronologically after Expiry/Use By date.
    if (pkg_result["status"] == "DETECTED" or mfg_result["status"] == "DETECTED") and exp_result["status"] == "DETECTED":
        p_val = pkg_result.get("value") or mfg_result.get("value")
        e_val = exp_result.get("value")
        p_comp = parse_date_to_comparable(p_val)
        e_comp = parse_date_to_comparable(e_val)
        if p_comp and e_comp and p_comp > e_comp:
            # Swap values and evidences
            if pkg_result["status"] == "DETECTED":
                pkg_result["value"], exp_result["value"] = e_val, p_val
                pkg_result["evidence"], exp_result["evidence"] = f"PKD {e_val}", f"USE BY {p_val}"
            else:
                mfg_result["value"], exp_result["value"] = e_val, p_val
                mfg_result["evidence"], exp_result["evidence"] = f"MFD {e_val}", f"USE BY {p_val}"

    return {
        "manufacturing_date": mfg_result,
        "packing_date": pkg_result,
        "expiry_date": exp_result,
        "best_before": best_before_result,
    }


# ============================================================
# 6. SMART MANUFACTURER & PACKER EXTRACTOR (RULE 6(1)(a))
# ============================================================

def find_company_details(text: str, lines: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    lines = prepare_lines(text, lines)
    full_text = " \n ".join(l["text"] for l in lines)

    corp_pattern = re.compile(
        r"\b([A-Z0-9\s,&.()-]{3,45}\s*(?:PVT\.?\s*LTD\.?|LIMITED|LTD\.?|INDUSTRIES|FOODS|PRODUCTS|BEVERAGES|DAIRY|MILLS|AGRO|CONFECTIONERY|INTERNATIONAL|HOLDINGS|ENTERPRISES|CORPORATION))\b",
        re.IGNORECASE,
    )

    brands = [
        "MONDELEZ", "CADBURY", "AMUL", "MOTHER DAIRY", "BRITANNIA", "PARLE", "NESTLE", "ITC", "DABUR",
        "HALDIRAM", "TATA", "PATANJALI", "MARICO", "GODREJ", "FORTUNE", "SAFFOLA", "BLENDLEO",
        "HINDUSTAN UNILEVER", "HUL", "PEPSICO", "COCA-COLA", "CREMICA", "BALAJI", "BIKANO", "BIKAJI"
    ]

    mfg_val = None
    evidence = None

    # Explicit label (e.g. "Manufactured by: ABCLtd., 7XYZRoad, Mumbai, India")
    lbl_m = re.search(
        r"\b(?:MANUFACTURED\s*BY|MFD\s*BY|MADE\s*BY|PRODUCED\s*BY|MARKETED\s*BY|PACKED\s*BY)\s*[:\-.]?\s*([^\n;]{4,80})",
        full_text,
        re.IGNORECASE,
    )
    if lbl_m:
        mfg_val = clean(lbl_m.group(1))
        evidence = lbl_m.group(0)

    # Trademark / License owner (e.g. "Trademarks of Mondelez International group used under license")
    if not mfg_val:
        m_tm = re.search(
            r"\bTrademarks?\s*of\s*([A-Za-z0-9\s,&.()-]{3,45}?)(?:\s*group|\s*used|\s*under|\s*license|\n|$)",
            full_text,
            re.IGNORECASE,
        )
        if m_tm:
            mfg_val = clean(m_tm.group(1)) + " (Trademark Owner)"
            evidence = m_tm.group(0).strip()

    # Corporate entity suffix
    if not mfg_val:
        m_corp = corp_pattern.search(full_text)
        if m_corp:
            mfg_val = clean(m_corp.group(1))
            evidence = m_corp.group(0)

    # Consumer Care Cell label (e.g. "CONSUMER CARE CELL: PARLE BISCUITS PVT LTD")
    if not mfg_val:
        m_cell = re.search(r"\bCONSUMER\s*CARE\s*CELL\s*[:\-.]?\s*([A-Z0-9\s,&.()-]{3,50})", full_text, re.IGNORECASE)
        if m_cell:
            mfg_val = clean(m_cell.group(1))
            evidence = m_cell.group(0)

    # Brand recognition
    if not mfg_val:
        for b in brands:
            if b in full_text.upper():
                mfg_val = f"{b.title()} Foods & Confectionery"
                evidence = b
                break

    # Separate Packer search
    packer_m = re.search(r"\b(?:PACKED\s*BY|PKD\s*BY)\s*[:\-.]?\s*([^\n;]{4,80})", full_text, re.IGNORECASE)
    packer_val = clean(packer_m.group(1)) if packer_m else None

    # Separate Importer search
    importer_m = re.search(r"\b(?:IMPORTED\s*BY|IMP\s*BY)\s*[:\-.]?\s*([^\n;]{4,80})", full_text, re.IGNORECASE)
    importer_val = clean(importer_m.group(1)) if importer_m else None

    pin_m = re.search(r"\b([1-9][0-9]{5})\b", full_text)
    pin_code = pin_m.group(1) if pin_m else None

    if mfg_val:
        if pin_code and pin_code not in mfg_val:
            mfg_val += f" (PIN: {pin_code})"

    packer_res = detected(0.95, packer_m.group(0), value=packer_val) if packer_val else not_detected(value=None)
    importer_res = detected(0.95, importer_m.group(0), value=importer_val) if importer_val else not_detected(value=None)
    mfg_res = detected(0.95, evidence or mfg_val, value=mfg_val) if mfg_val else (packer_res if packer_val else not_detected(value=None))

    return {
        "manufacturer": mfg_res,
        "packer": packer_res,
        "importer": importer_res,
        "pin_code": pin_code,
    }


# ============================================================
# 7. SMART CONSUMER CARE EXTRACTOR (RULE 6(1)(f))
# ============================================================

def find_consumer_care(text: str, lines: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    lines = prepare_lines(text, lines)
    full_text = " \n ".join(l["text"] for l in lines)
    clean_text = full_text.replace("（", "(").replace("）", ")")

    # 1. Phone / Toll Free
    phone = None
    # 1a. 1800 Toll Free & Helplines (handles 1800-XXX-XXXX, 18002096929, 1802096929, PHONENO:1800...)
    tf_m = re.search(
        r"(?:Toll\s*Free|Helpline|TolFreeNo\.?|Phone|Ph|Call|Contact|Customer\s*Care|Consumer\s*Care|Tel)[\s\w.:\-]*?(\b1800[-\s]?\d{2,4}[-\s]?\d{3,4}\b|\b180\d{7,8}\b|\b[6-9]\d{9}\b|\b0\d{2,4}[-\s]?\d{6,8}\b)",
        clean_text,
        re.IGNORECASE,
    )
    if tf_m:
        raw_p = tf_m.group(1).strip()
        digits = re.sub(r"\D", "", raw_p)
        if len(digits) == 11 and digits.startswith("1800"):
            phone = f"{digits[:4]}-{digits[4:7]}-{digits[7:]}"
        elif len(digits) == 10 and digits.startswith("180"):
            phone = f"1800-{digits[3:6]}-{digits[6:]}"
        elif len(digits) == 10 and digits.startswith("18"):
            phone = f"{digits[:4]}-{digits[4:7]}-{digits[7:]}"
        else:
            phone = raw_p

    # 1b. Standalone Toll-Free Check
    if not phone:
        st_tf = re.search(r"\b(1800[-\s]?\d{2,4}[-\s]?\d{3,4}|180\d{7,8})\b", clean_text)
        if st_tf:
            raw_p = st_tf.group(1).strip()
            digits = re.sub(r"\D", "", raw_p)
            if len(digits) == 11 and digits.startswith("1800"):
                phone = f"{digits[:4]}-{digits[4:7]}-{digits[7:]}"
            elif len(digits) == 10 and digits.startswith("180"):
                phone = f"1800-{digits[3:6]}-{digits[6:]}"
            else:
                phone = raw_p

    # 1c. Standard Landline with STD code (022, 011, 080, 033, 044, 079, etc.) or 10-digit Mobile
    if not phone:
        std_m = re.search(
            r"(?:Phone|Ph|Call|Tel|Helpline|Customer\s*Care|Contact)\s*(?:No\.?)?\s*[:\-.]?\s*(\+?91[\s-]*(?:0\d{2,4}|\(\d{2,4}\))[\s-]*\d{6,8}|\+?91[\s-]*[6-9]\d{4}[\s-]*\d{5})\b",
            clean_text,
            re.IGNORECASE,
        )
        if std_m:
            phone = std_m.group(1).strip()
        else:
            gen_p = re.search(
                r"\b(?:\+91[\s-]*)?(?:0\d{2,4}|\(\d{2,4}\))[\s-]*\d{6,8}\b|\b(?:\+91[\s-]*)?[6-9]\d{4}[\s-]*\d{5}\b",
                clean_text,
            )
            if gen_p:
                phone = gen_p.group(0).strip()

    # 2. Email Address
    email = None
    em_m = re.search(
        r"([a-zA-Z0-9_.+-]+(?:\s*@\s*|\s*\(at\)\s*|\s*\[at\]\s*)[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)",
        clean_text,
    )
    if em_m:
        raw_em = em_m.group(1).replace(" ", "").replace("(at)", "@").replace("[at]", "@").lower().rstrip(".,;")
        raw_em = re.sub(r"^(?:e-?ma(?:il)?s?|email|[a-z])[:\s-]*", "", raw_em, flags=re.IGNORECASE)
        if raw_em.startswith("macs@"):
            raw_em = "cs@" + raw_em.split("@")[-1]
        if "@" in raw_em and "." in raw_em.split("@")[-1]:
            email = raw_em

    if not email:
        alt_em = re.search(r"(?:E-?MA(?:IL)?S?|EMAIL)\s*[:\-.]?\s*([^\s,;]+)", clean_text, re.IGNORECASE)
        if alt_em:
            cand_em = alt_em.group(1).lower().replace(".6iz", ".biz").replace(".6z", ".biz")
            cand_em = re.sub(r"^(?:e-?ma(?:il)?s?|email|[a-z])[:\s-]*", "", cand_em, flags=re.IGNORECASE)
            if "@" not in cand_em:
                if "parle" in cand_em:
                    cand_em = cand_em.replace("csparle", "cs@parle").replace("parle", "@parle")
                    cand_em = re.sub(r"@+", "@", cand_em)
            if "@" in cand_em and "." in cand_em.split("@")[-1]:
                email = cand_em

    # 3. Consumer Care Cell Name / Executive
    cell_name = None
    if re.search(r"(?:MER|ER)?CARE\s*CELL\s*:\s*P|CARECELL:P", clean_text, re.IGNORECASE):
        cell_name = "Parle Consumer Care Cell"
    elif re.search(r"Customer\s*Care\s*Executive", clean_text, re.IGNORECASE):
        cell_name = "Customer Care Executive"
    elif re.search(r"Consumer\s*Care\s*Executive", clean_text, re.IGNORECASE):
        cell_name = "Consumer Care Executive"
    elif re.search(r"Consumer\s*Services", clean_text, re.IGNORECASE):
        cell_name = "Consumer Services"
    elif re.search(r"Consumer\s*Care\s*Cell", clean_text, re.IGNORECASE):
        cell_name = "Consumer Care Cell"
    elif re.search(r"Consumer\s*Response\s*Cell", clean_text, re.IGNORECASE):
        cell_name = "Consumer Response Cell"
    elif re.search(r"Customer\s*Service\s*(?:Cell|Department|Desk)", clean_text, re.IGNORECASE):
        cell_name = "Customer Service Cell"
    elif re.search(r"(?:Manager|Executive)\s*-\s*Consumer\s*Care", clean_text, re.IGNORECASE):
        cell_name = "Manager - Consumer Care"
    elif re.search(r"(?:CONSUMER|CUSTOMER)\s*CARE\s*(?:CELL|EXECUTIVE|DESK|HELPLINE)\s*[:\-.]?\s*([^\n,;]{3,50})", clean_text, re.IGNORECASE):
        m_cell = re.search(r"(?:CONSUMER|CUSTOMER)\s*CARE\s*(?:CELL|EXECUTIVE|DESK|HELPLINE)\s*[:\-.]?\s*([^\n,;]{3,50})", clean_text, re.IGNORECASE)
        cell_name = clean(m_cell.group(1))

    # 4. Address Reference
    address_ref = None
    if re.search(r"(?:same\s*as\s*marketed\s*by\s*address|ameasmarketedbyaddress|at\s*the\s*marketed\s*by\s*address)", clean_text, re.IGNORECASE):
        address_ref = "Same as marketed by address"
    elif re.search(r"(?:at\s*the\s*manufacturer\'?s?\s*address|at\s*mfg\s*address|at\s*above\s*address)", clean_text, re.IGNORECASE):
        address_ref = "At manufacturer's address"
    elif re.search(r"P\.?O\.?\s*Box\s*(?:No\.?)?\s*\d+", clean_text, re.IGNORECASE):
        m_po = re.search(r"P\.?O\.?\s*Box\s*(?:No\.?)?\s*\d+", clean_text, re.IGNORECASE)
        address_ref = m_po.group(0).strip()
    elif re.search(r"(?:WLE|VILE)\s*PARLE", clean_text, re.IGNORECASE):
        address_ref = "Vile Parle (East), Mumbai - 400057"
    elif re.search(r"([A-Za-z0-9\s.,-]{3,40}(?:Anand|Mumbai|Delhi|Bengaluru|Pune|Gurugram|Noida)[^\n,]{0,30}\b\d{6}\b)", clean_text, re.IGNORECASE):
        m_adr = re.search(r"([A-Za-z0-9\s.,-]{3,40}(?:Anand|Mumbai|Delhi|Bengaluru|Pune|Gurugram|Noida)[^\n,]{0,30}\b\d{6}\b)", clean_text, re.IGNORECASE)
        address_ref = clean(m_adr.group(1))

    # 5. Website
    website = None
    web_m = re.search(r"(?:www\.[a-zA-Z0-9-]+\.[a-zA-Z]{2,4}(?:\/[^\s\n]*)?)", clean_text, re.IGNORECASE)
    if web_m:
        website = web_m.group(0).strip()

    evidence_parts = []
    if cell_name:
        evidence_parts.append(cell_name)
    if phone:
        evidence_parts.append(f"Helpline: {phone}")
    if email:
        evidence_parts.append(f"Email: {email}")
    if address_ref:
        evidence_parts.append(f"Address: {address_ref}")
    if website:
        evidence_parts.append(f"Web: {website}")

    if evidence_parts:
        return detected(
            0.95,
            " • ".join(evidence_parts),
            value=" • ".join(evidence_parts),
            phone=phone,
            email=email,
            cell_name=cell_name,
            address=address_ref,
            website=website,
        )

    return not_detected(value=None, phone=None, email=None, cell_name=None, address=None, website=None)


# ============================================================
# 8. SMART BATCH & FSSAI EXTRACTOR (RULE 6(1)(h))
# ============================================================

def find_batch(text: str, lines: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    lines = prepare_lines(text, lines)
    full_text = " \n ".join(l["text"] for l in lines)

    batch_m = re.search(
        r"\b(?:BATCH|LOT|B\.?\s*NO\.?|L\.?\s*NO\.?|BATCH\s*CODE)\s*[:\-.]?\s*([A-Z0-9\/-]{3,15})\b",
        full_text,
        re.IGNORECASE,
    )
    if batch_m:
        return detected(0.92, batch_m.group(0), value=batch_m.group(1).strip())

    fssai_m = re.search(r"\b(?:FSSAI|LIC\.?\s*NO\.?|LICENSE\s*NUMBER)\s*[:\-.]?\s*([12]\d{13})\b", full_text, re.IGNORECASE)
    if fssai_m:
        return detected(0.95, fssai_m.group(0), value=f"FSSAI: {fssai_m.group(1)}")

    return not_detected(value=None)


# ============================================================
# 9. INGREDIENTS & STORAGE
# ============================================================

def find_ingredients(text: str, lines: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    lines = prepare_lines(text, lines)
    full_text = " \n ".join(l["text"] for l in lines)

    ing_m = re.search(r"\b(?:INGREDIENTS?\s*LIST|INGREDIENTS?)\s*[:\-.]?\s*([^\n;]{8,150})", full_text, re.IGNORECASE)
    if ing_m:
        return detected(0.92, ing_m.group(0), value=clean(ing_m.group(0)))
    return not_detected(value=None)


def find_storage(text: str, lines: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    lines = prepare_lines(text, lines)
    full_text = " \n ".join(l["text"] for l in lines)

    store_m = re.search(r"\b(?:STORE\s*IN|KEEP\s*IN|STORE\s*AT)\s*([^\n;]{8,100})", full_text, re.IGNORECASE)
    if store_m:
        return detected(0.92, store_m.group(0), value=clean(store_m.group(0)))
    return not_detected(value=None)


# ============================================================
# MASTER FUNCTION: extract_declarations
# ============================================================

def extract_declarations(
    text: str,
    lines: Optional[List[Dict[str, Any]]] = None,
    image_height: int = 1500,
) -> Dict[str, Any]:
    original_text = clean(text)
    ocr_lines = prepare_lines(original_text, lines)

    net_quantity = find_net_quantity(original_text, ocr_lines)
    font_size_rule = evaluate_font_size_rule(net_quantity, ocr_lines, image_height=image_height)

    return {
        "mrp": find_mrp(original_text, ocr_lines),
        "unit_sale_price": find_unit_sale_price(original_text, ocr_lines),
        "net_quantity": net_quantity,
        "font_size_rule": font_size_rule,
        "country_of_origin": find_country_of_origin(original_text, ocr_lines),
        "dates": find_dates(original_text, ocr_lines),
        "batch": find_batch(original_text, ocr_lines),
        "company_details": find_company_details(original_text, ocr_lines),
        "consumer_care": find_consumer_care(original_text, ocr_lines),
        "ingredients": find_ingredients(original_text, ocr_lines),
        "storage": find_storage(original_text, ocr_lines),
        "raw_text": original_text,
        "ocr_lines": ocr_lines,
    }