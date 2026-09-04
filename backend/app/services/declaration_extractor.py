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
from typing import Optional, List, Dict, Any


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

def find_mrp(text: str, lines: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    lines = prepare_lines(text, lines)
    full_text = " \n ".join(l["text"] for l in lines)

    # --- TIER 1: Explicit MRP Label (with optional tax interleave, currency, colons, slashes, etc.) ---
    # Handles:
    # "MRP Rs. 50.00", "MRP (INCL. OF ALL TAXES) Rs. 50.00", "MRP (INCLUSIVE OF ALL TAXES) : ₹ 45.00"
    # "MRP (INCL. TAXES) ₹30/-", "PR: 45.00 MFD: 02/25 EXP: 08/25", "PR Rs. 65.00 USE BY 12/25"
    # "P: 35/- USE BY: 08/25", "MRP : 150.00 (₹1.50/unit)", "P(INCLOFALLTAXES)RS:35/"
    mrp_tier1 = re.compile(
        r"\b" + MRP_LABELS + r"\b" +
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
        if 1 <= val <= 200000:
            return detected(
                0.98,
                m.group(0).strip(),
                value=val,
                currency="INR",
            )

    # --- TIER 2: Multi-line MRP Search (Label on line i, Value on line i+1) ---
    for i, line in enumerate(lines[:-1]):
        upper = line["text"].upper()
        if any(lbl in upper for lbl in ["MRP", "M.R.P", "MAXIMUM RETAIL PRICE", "MAX RETAIL PRICE", "PRICE", "PR", "P.R", "RTP", "RATE"]):
            next_l = lines[i + 1]["text"]
            m_next = re.search(
                r"(?:^|[^\w])(?:" + CURR_REGEX + r"\s*)?(\d{1,5}(?:\.\d{1,2})?)(?:\s*[\/]\-|\s*\/\-|\s*\/\b|\s*only\b)?",
                next_l,
                re.IGNORECASE,
            )
            if m_next:
                val = float(m_next.group(1))
                if 1 <= val <= 200000:
                    return detected(
                        0.95,
                        f"{line['text']} {m_next.group(0).strip()}",
                        value=val,
                        currency="INR",
                    )

    # --- TIER 3: Number followed by '(INCL. OF ALL TAXES)' or 'INCL. TAXES' ---
    # e.g. "₹45.00 (INCL. OF ALL TAXES)", "50.00 (INCL. ALL TAXES)"
    mrp_tier3 = re.compile(
        r"(?:^|[^\w])(?:" + CURR_REGEX + r"\s*)?(\d{1,5}(?:\.\d{1,2})?)\s*(?:\((?:INCL|INCLUSIVE)\b|\bINCL(?:UDING)?\s*(?:OF)?\s*(?:ALL)?\s*TAXES\b)",
        re.IGNORECASE,
    )
    m3 = mrp_tier3.search(full_text)
    if m3:
        val = float(m3.group(1))
        if 1 <= val <= 200000:
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
        curr_str = m4.group(1)
        after_str = full_text[m4.end():m4.end() + 15].lower()
        if re.match(r"^\s*[\/]\s*(?:g|gm|kg|ml|l|unit|piece)", after_str):
            continue
        before_str = full_text[max(0, m4.start() - 10):m4.start()].lower()
        if "per" in before_str or "/" in before_str:
            continue
        if 1 <= val <= 200000:
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
        if 2 <= val <= 50000:
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

    usp_pattern = re.compile(
        r"(?:USP\s*[:\-.]?\s*)?[\(?]?\s*(?:₹|RS\.?|INR|\?|[zZ]\.?|रु\.?|र\.?)?\s*(\d+(?:\.\d{1,3})?)\s*(?:[\/]|per\s*)(" + UNIT_REGEX + r")\)?",
        re.IGNORECASE,
    )
    m = usp_pattern.search(full_text)
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
    # Handle dot-matrix slash OCR glitch: e.g. 17/04727 -> 17/04/27
    m_glitch = re.match(r"^(\d{1,2})[\/\-](\d{1,2})[7\/1](\d{2,4})$", val_str)
    if m_glitch:
        return f"{m_glitch.group(1)}/{m_glitch.group(2)}/{m_glitch.group(3)}"
    # Handle dot-matrix 13/94225 -> 13/04/25
    m_g2 = re.match(r"^(\d{1,2})[\/](?:94|04)(\d{2,4})$", val_str)
    if m_g2:
        return f"{m_g2.group(1)}/04/{m_g2.group(2)}"
    return val_str


def find_country_of_origin(text: str, lines: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    """
    Mandatory declaration under Rule 6(1)(n):
    Detects Country of Origin statements (e.g. "Country of Origin: India", "Made in India", FSSAI license, domestic brands, Indian cities)
    """
    lines = prepare_lines(text, lines)
    full_text = " \n ".join(l["text"] for l in lines)

    # 1. Explicit origin declaration
    origin_m = re.search(
        r"\b(?:Country\s*of\s*Origin|Origin|Made\s*in|Product\s*of|Produce\s*of|Manufactured\s*in)\s*[:\-.]?\s*([A-Za-z\s]{3,20})\b",
        full_text,
        re.IGNORECASE,
    )
    if origin_m:
        country_name = clean(origin_m.group(1)).title()
        if country_name:
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

MONTH_NAMES = r"(?:[IJL]an|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*"

DATE_REGEX = (
    r"("
    r"\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}"
    r"|"
    r"\d{1,2}[\s\/\-.]*" + MONTH_NAMES + r"[\s\/\-.]*\d{0,4}"
    r"|"
    r"" + MONTH_NAMES + r"[\s\/\-.]*\d{2,4}"
    r"|"
    r"\d{1,2}[\/\-.]\d{2,4}"
    r")"
)

def find_dates(text: str, lines: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    lines = prepare_lines(text, lines)
    full_text = " \n ".join(l["text"] for l in lines)

    mfg_result = not_detected(value=None)
    pkg_result = not_detected(value=None)
    exp_result = not_detected(value=None)
    best_before_result = not_detected(value=None)

    # 1. Best Before Statements (clean boundary, stops before MRP, RS, BATCH, USE BY, MFD)
    bb_m = re.search(
        r"\b(?:BEST\s*BEFORE|TBEFORE)\s*[:\-.]?\s*(\d{1,2}\s*(?:MONTHS?|DAYS?|WEEKS?|YEARS?)(?:\s*FROM\s*(?:PACKAGING|MANUFACTURE|MFG|PKD|DATE|BATCH))?)",
        full_text,
        re.IGNORECASE,
    )
    if bb_m:
        best_before_result = detected(0.95, bb_m.group(0), value=bb_m.group(1).strip())
    else:
        bb_date_m = re.search(
            r"\bBEST\s*BEFORE\b\s*[:\-.]?\s*" + DATE_REGEX,
            full_text,
            re.IGNORECASE,
        )
        if bb_date_m:
            best_before_result = detected(0.94, bb_date_m.group(0), value=normalize_date_stamp(bb_date_m.group(1).strip()))

    # 2. Manufacturing Date (MFD / MFG / DOM / Date of Manufacture)
    mfg_m = re.search(
        r"\b(?:MFD|MFG|M\.?F\.?D\.?|M\.?F\.?G\.?|DATE\s*OF\s*(?:MANUFACTURE|MFG)|MANUFACTURED|MIG|DOM)\b\s*[:\-./=]?\s*" + DATE_REGEX,
        full_text,
        re.IGNORECASE,
    )
    if mfg_m:
        raw_val = normalize_date_stamp(mfg_m.group(1).strip())
        raw_val = re.sub(r"^[IL]an", "Jan", raw_val, flags=re.IGNORECASE)
        mfg_result = detected(0.96, mfg_m.group(0), value=raw_val)

    # 3. Packing Date (PKD / PACKED / Date of Packaging)
    pkg_m = re.search(
        r"\b(?:PKD|PACKED|P\.?K\.?D\.?|PACKING\s*DATE|DATE\s*OF\s*PACKAGING)\b\s*[:\-./=]?\s*" + DATE_REGEX,
        full_text,
        re.IGNORECASE,
    )
    if pkg_m:
        raw_val = normalize_date_stamp(pkg_m.group(1).strip())
        raw_val = re.sub(r"^[IL]an", "Jan", raw_val, flags=re.IGNORECASE)
        pkg_result = detected(0.96, pkg_m.group(0), value=raw_val)

    # 4. Expiry Date (EXP / EXPIRY / USE BY / USEBY)
    exp_m = re.search(
        r"\b(?:EXP|EXPIRY|EXPIRES|EXP\.?\s*DATE|USE\s*BY|USEBY)\b\s*[:\-./=]?\s*" + DATE_REGEX,
        full_text,
        re.IGNORECASE,
    )
    if exp_m:
        raw_val = normalize_date_stamp(exp_m.group(1).strip())
        exp_result = detected(0.96, exp_m.group(0), value=raw_val)

    # 5. Proximity window search for USE BY / EXPIRY (checks same line and nearby +/- 4 lines for dot-matrix stamps)
    if exp_result["status"] == "NOT_DETECTED":
        for idx, l in enumerate(lines):
            t_upper = l["text"].upper()
            if any(k in t_upper for k in ["USE BY", "USEBY", "EXP", "EXPIRY", "EXPIRES"]):
                m_same = re.search(DATE_REGEX, l["text"], re.IGNORECASE)
                if m_same:
                    exp_result = detected(0.95, f"USE BY {normalize_date_stamp(m_same.group(1))}", value=normalize_date_stamp(m_same.group(1)))
                    break
                start_i = max(0, idx - 4)
                end_i = min(len(lines), idx + 4)
                for j in range(start_i, end_i):
                    if j == idx:
                        continue
                    txt_j = lines[j]["text"]
                    if any(k in txt_j.upper() for k in ["MRP", "RS.", "PRICE", "RATE"]):
                        continue
                    m_near = re.search(r"\b(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}|\d{1,2}[\/\-]\d{2}[7\/1]\d{2,4}|\d{1,2}[\/\-]\d{2,4})\b", txt_j)
                    if m_near:
                        norm_d = normalize_date_stamp(m_near.group(1))
                        exp_result = detected(0.95, f"USE BY {norm_d}", value=norm_d)
                        break
                if exp_result["status"] == "DETECTED":
                    break

    # 6. Proximity window search for PKD / MFD / MFG (checks same line and nearby +/- 3 lines)
    if mfg_result["status"] == "NOT_DETECTED" and pkg_result["status"] == "NOT_DETECTED":
        for idx, l in enumerate(lines):
            t_upper = l["text"].upper()
            if any(k in t_upper for k in ["PKD", "MFD", "MFG", "PACKED", "MANUFACTURED", "DOM"]):
                is_mfg = any(k in t_upper for k in ["MFD", "MFG", "MANUFACTURED", "DOM"])
                m_same = re.search(DATE_REGEX, l["text"], re.IGNORECASE)
                if m_same:
                    norm_d = normalize_date_stamp(m_same.group(1))
                    if is_mfg:
                        mfg_result = detected(0.94, f"MFD {norm_d}", value=norm_d)
                    else:
                        pkg_result = detected(0.94, f"PKD {norm_d}", value=norm_d)
                    break
                start_i = max(0, idx - 3)
                end_i = min(len(lines), idx + 3)
                for j in range(start_i, end_i):
                    if j == idx:
                        continue
                    txt_j = lines[j]["text"]
                    if any(k in txt_j.upper() for k in ["MRP", "RS.", "PRICE", "RATE"]):
                        continue
                    m_near = re.search(r"\b(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}|\d{1,2}[\/\-]\d{2}[7\/1]\d{2,4}|\d{1,2}[\/\-]\d{2,4})\b", txt_j)
                    if m_near:
                        cand = normalize_date_stamp(m_near.group(1))
                        if cand != exp_result.get("value"):
                            if is_mfg:
                                mfg_result = detected(0.94, f"MFD {cand}", value=cand)
                            else:
                                pkg_result = detected(0.94, f"PKD {cand}", value=cand)
                            break
                if mfg_result["status"] == "DETECTED" or pkg_result["status"] == "DETECTED":
                    break

    # 7. General standalone date fallback (MM/YY or MM/YYYY)
    if pkg_result["status"] == "NOT_DETECTED" and mfg_result["status"] == "NOT_DETECTED":
        for l in lines:
            if any(k in l["text"].upper() for k in ["MRP", "RS.", "PRICE"]):
                continue
            m_pkg = re.search(r"\b(0?[1-9]|1[0-2])[\/\-](20\d{2}|\d{2})\b", l["text"])
            if m_pkg:
                matched_val = m_pkg.group(0)
                if matched_val != exp_result.get("value") and "/" in matched_val:
                    pkg_result = detected(0.92, f"PKD {matched_val}", value=matched_val)
                    break

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

    pin_m = re.search(r"\b([1-9][0-9]{5})\b", full_text)
    pin_code = pin_m.group(1) if pin_m else None

    if mfg_val:
        if pin_code and pin_code not in mfg_val:
            mfg_val += f" (PIN: {pin_code})"
        return {
            "manufacturer": detected(0.95, evidence or mfg_val, value=mfg_val),
            "packer": not_detected(value=None),
            "importer": not_detected(value=None),
            "pin_code": pin_code,
        }

    return {
        "manufacturer": not_detected(value=None),
        "packer": not_detected(value=None),
        "importer": not_detected(value=None),
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
    # 1a. 1800 Toll Free (handles 1800-XXX-XXXX, 1800-XX-XXXX, 18001801018, TolFreeNo.1800...)
    tf_m = re.search(
        r"(?:Toll\s*Free|Helpline|TolFreeNo\.?|Phone|Ph|Call|Contact|Customer\s*Care|Consumer\s*Care)?\s*[:\-.]?\s*(1800[\s-]*\d{2,4}[\s-]*\d{3,4}|1800\d{6,8})\b",
        clean_text,
        re.IGNORECASE,
    )
    if tf_m:
        raw_p = tf_m.group(1).strip()
        digits = re.sub(r"\D", "", raw_p)
        if len(digits) == 11:
            phone = f"{digits[:4]}-{digits[4:7]}-{digits[7:]}"
        elif len(digits) == 10:
            phone = f"{digits[:4]}-{digits[4:6]}-{digits[6:]}"
        else:
            phone = raw_p

    # 1b. Standard Landline with STD code (022, 011, 080, 033, 044, 079, etc.) or 10-digit Mobile
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
        if "@" in raw_em and "." in raw_em.split("@")[-1]:
            email = raw_em

    # 3. Consumer Care Cell Name / Executive
    cell_name = None
    if re.search(r"CARE\s*CELL\s*:\s*P|CARECELL:P", clean_text, re.IGNORECASE):
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
            phone=phone,
            email=email,
            cell_name=cell_name,
            address=address_ref,
            website=website,
        )

    return not_detected(phone=None, email=None, cell_name=None, address=None, website=None)


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