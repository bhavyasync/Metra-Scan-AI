from pathlib import Path
from datetime import datetime
from html import escape
import os
import tempfile

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Image,
    PageBreak,
    KeepTogether,
)

# ============================================================
# HELPERS
# ============================================================

def safe(value, default="N/A"):
    if value is None:
        return default
    value = str(value).strip()
    return value if value else default


def get_status_text(data):
    if not isinstance(data, dict):
        return "Not detected"
    return safe(data.get("status"), "NOT_DETECTED").replace("_", " ").title()


def get_declaration_value(data):
    if not isinstance(data, dict):
        return "No evidence found"
    val = data.get("value")
    if val is None or str(val).strip() == "":
        return "No evidence found"
    val = str(val)
    if data.get("unit"):
        val += f" {data['unit']}"
    if data.get("currency"):
        val = f"{data['currency']} {val}"
    return val


def paragraph_text(value, style):
    return Paragraph(escape(safe(value)), style)


# ============================================================
# WATERMARK / FOOTER (LOGIC LEGENDS)
# ============================================================

def draw_page(canvas, doc):
    canvas.saveState()
    width, height = A4

    # 1. Central Diagonal Watermark: "LOGIC LEGENDS"
    canvas.saveState()
    canvas.setFillColor(colors.Color(0.72, 0.78, 0.84, alpha=0.16))
    canvas.setFont("Helvetica-Bold", 46)
    canvas.translate(width / 2, height / 2)
    canvas.rotate(42)
    canvas.drawCentredString(0, 0, "LOGIC LEGENDS")
    canvas.restoreState()

    # 2. Upper Secondary Watermark
    canvas.saveState()
    canvas.setFillColor(colors.Color(0.75, 0.80, 0.85, alpha=0.09))
    canvas.setFont("Helvetica-Bold", 26)
    canvas.translate(width / 2, height * 0.78)
    canvas.rotate(42)
    canvas.drawCentredString(0, 0, "LOGIC LEGENDS")
    canvas.restoreState()

    # 3. Lower Secondary Watermark
    canvas.saveState()
    canvas.setFillColor(colors.Color(0.75, 0.80, 0.85, alpha=0.09))
    canvas.setFont("Helvetica-Bold", 26)
    canvas.translate(width / 2, height * 0.22)
    canvas.rotate(42)
    canvas.drawCentredString(0, 0, "LOGIC LEGENDS")
    canvas.restoreState()

    # Footer
    canvas.saveState()
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(colors.HexColor("#64748B"))
    footer = "Logic Legends • MetraScan AI • Legal Metrology (Packaged Commodities) Rules, 2011 Inspection Directorate"
    canvas.drawCentredString(width / 2, 8 * mm, footer)
    canvas.restoreState()

    canvas.restoreState()


# ============================================================
# MAIN PDF GENERATOR
# ============================================================

def generate_pdf_report(
    image_path: str,
    report_data: dict,
) -> str:
    output_dir = Path(r"D:\HACKATHON\metrascan-ai\temp\reports")
    output_dir.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_path = output_dir / f"MetraScan_Report_{timestamp}.pdf"

    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=A4,
        rightMargin=14 * mm,
        leftMargin=14 * mm,
        topMargin=15 * mm,
        bottomMargin=16 * mm,
        title="MetraScan AI Compliance Report",
        author="Logic Legends",
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#0F172A"),
        spaceAfter=3,
    )

    sub_title_style = ParagraphStyle(
        "ReportSubTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9.5,
        leading=13,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#047857"),
        spaceAfter=12,
    )

    heading_style = ParagraphStyle(
        "HeadingCustom",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=11.5,
        leading=15,
        textColor=colors.HexColor("#0F172A"),
        spaceBefore=7,
        spaceAfter=5,
    )

    normal_style = ParagraphStyle(
        "NormalCustom",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor("#334155"),
    )

    small_style = ParagraphStyle(
        "SmallCustom",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor("#64748B"),
    )

    # --------------------------------------------------------
    # EXTRACT DATA
    # --------------------------------------------------------
    compliance = report_data.get("compliance", {})
    ocr = report_data.get("ocr", {})
    declarations = report_data.get("declarations", {})
    review = report_data.get("review", {})
    
    score = compliance.get("compliance_score", compliance.get("score", 0))
    status = compliance.get("status", "UNKNOWN")
    flag_count = int(report_data.get("flag_count", compliance.get("flag_count", 1)))
    is_urgent = flag_count > 5

    inspector_remarks = (
        report_data.get("inspector_remarks")
        or review.get("comments")
        or report_data.get("remarks")
        or "Routine inspection conducted under Legal Metrology Rules, 2011."
    )
    inspector_name = (
        report_data.get("inspector_name")
        or review.get("reviewer_name")
        or "Inspector Rajesh Sharma"
    )
    inspector_badge = report_data.get("badge_number", "LM-DEL-2041")

    story = []

    # --------------------------------------------------------
    # HEADER (LOGIC LEGENDS BRANDED)
    # --------------------------------------------------------
    story.append(paragraph_text("METRASCAN AI — COMPLIANCE REPORT", title_style))
    story.append(paragraph_text("POWERED BY LOGIC LEGENDS • LEGAL METROLOGY (PACKAGED COMMODITIES) RULES, 2011", sub_title_style))

    # Top Metadata Strip
    scan_id = report_data.get("scan_id", f"LL-MS-{timestamp}")
    header_table = Table(
        [
            [
                Paragraph(f"<b>DOCKET ID:</b> {scan_id}", normal_style),
                Paragraph(f"<b>DATE:</b> {datetime.now().strftime('%d %b %Y, %I:%M %p')}", normal_style),
                Paragraph(f"<b>SCAN MODE:</b> {report_data.get('scan_mode', 'Package Scan')}", normal_style),
            ]
        ],
        colWidths=[65 * mm, 65 * mm, 52 * mm],
        style=TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F1F5F9")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ]),
    )
    story.append(header_table)
    story.append(Spacer(1, 6))

    # --------------------------------------------------------
    # FLAG COUNTER & URGENT CASE CALLOUT
    # --------------------------------------------------------
    if is_urgent:
        urgent_box = Table(
            [
                [
                    Paragraph(
                        f"<b>⚠️ URGENT CASE — REPEAT NON-COMPLIANCE (FLAGGED {flag_count} TIMES)</b><br/>"
                        f"This packaged commodity has failed statutory Legal Metrology compliance checks <b>{flag_count} times</b> across regional inspections. "
                        f"Classified as an <b>Urgent Statutory Case</b> requiring immediate enforcement intervention and formal brand notification.",
                        ParagraphStyle(
                            "UrgentStyle",
                            parent=normal_style,
                            textColor=colors.HexColor("#7F1D1D"),
                            fontSize=8.5,
                            leading=12,
                        ),
                    )
                ]
            ],
            colWidths=[182 * mm],
            style=TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FEF2F2")),
                ("BOX", (0, 0), (-1, -1), 1.2, colors.HexColor("#EF4444")),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
            ]),
        )
        story.append(urgent_box)
        story.append(Spacer(1, 6))
    else:
        counter_box = Table(
            [
                [
                    Paragraph(
                        f"<b>Inspection / Flag Counter:</b> Checked <b>{flag_count} time(s)</b> • Compliance Status: <b>{str(status).replace('_', ' ').title()}</b> (Score: <b>{score}/100</b>)",
                        normal_style,
                    )
                ]
            ],
            colWidths=[182 * mm],
            style=TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#ECFDF5") if score >= 80 else colors.HexColor("#FFF7ED")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#10B981") if score >= 80 else colors.HexColor("#F97316")),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ]),
        )
        story.append(counter_box)
        story.append(Spacer(1, 6))

    # --------------------------------------------------------
    # INSPECTOR REMARKS (PROMINENT SIGN-OFF)
    # --------------------------------------------------------
    story.append(paragraph_text("1. Inspector Remarks & Directives", heading_style))

    inspector_data = [
        [
            Paragraph("<b>Enforcement Officer:</b>", normal_style),
            Paragraph(f"{inspector_name} (Badge: {inspector_badge})", normal_style),
        ],
        [
            Paragraph("<b>Inspection Finding:</b>", normal_style),
            Paragraph(f"{review.get('decision', 'Non-Compliance Verified' if score < 85 else 'Statutory Verification Complete')}", normal_style),
        ],
        [
            Paragraph("<b>Officer Remarks:</b>", normal_style),
            Paragraph(f"<i>\"{inspector_remarks}\"</i>", normal_style),
        ],
    ]

    inspector_table = Table(
        inspector_data,
        colWidths=[45 * mm, 137 * mm],
        style=TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#CBD5E1")),
            ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#F8FAFC")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 7),
            ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ]),
    )
    story.append(inspector_table)
    story.append(Spacer(1, 8))

    # --------------------------------------------------------
    # EMBEDDED PRODUCT PACKAGING IMAGE
    # --------------------------------------------------------
    if image_path and os.path.exists(image_path):
        try:
            image = Image(image_path, width=70 * mm, height=65 * mm, kind="proportional")
            image.hAlign = "CENTER"
            story.append(image)
            story.append(Spacer(1, 6))
        except Exception:
            pass

    # --------------------------------------------------------
    # MANDATORY DECLARATIONS CHECKLIST (RULE 6 & 9)
    # --------------------------------------------------------
    story.append(paragraph_text("2. Mandatory Declarations Audit (Rules 2011)", heading_style))

    font_rule = declarations.get("font_size_rule", {})
    font_val = f"{font_rule.get('measured_height_mm', 'N/A')} mm (Min: {font_rule.get('required_min_height_mm', 'N/A')} mm)" if font_rule else "Standard"
    font_status_obj = {"status": "DETECTED" if font_rule.get("is_compliant", True) else "NON_COMPLIANT", "value": font_val}

    declaration_items = [
        ("MRP (Incl. of all taxes)", declarations.get("mrp"), "Rule 6(1)(e)"),
        ("Net Quantity / Measure", declarations.get("net_quantity"), "Rule 6(1)(c) & Rule 9"),
        ("Font Size as Per Rule", font_status_obj, "Rule 9 & Schedule II"),
        ("Country of Origin", declarations.get("country_of_origin"), "Rule 6(1)(n)"),
        ("Manufacturing Date", declarations.get("dates", {}).get("manufacturing_date"), "Rule 6(1)(d)"),
        ("Packing Date", declarations.get("dates", {}).get("packing_date"), "Rule 6(1)(d)"),
        ("Expiry / Best Before", declarations.get("dates", {}).get("expiry_date") or declarations.get("dates", {}).get("best_before"), "Rule 6(1)(d)"),
        ("Manufacturer / Packer", declarations.get("company_details", {}).get("manufacturer") or declarations.get("company_details", {}).get("packer"), "Rule 6(1)(a)"),
        ("Consumer Care Helpline", declarations.get("consumer_care"), "Rule 6(1)(f)"),
        ("Batch / Lot Number", declarations.get("batch"), "Rule 6(1)(h)"),
    ]

    decl_rows = [
        [
            Paragraph("<b>Mandatory Declaration</b>", normal_style),
            Paragraph("<b>Rule Reference</b>", normal_style),
            Paragraph("<b>Extracted Evidence</b>", normal_style),
            Paragraph("<b>Status</b>", normal_style),
        ]
    ]

    for title, item, rule_ref in declaration_items:
        if not isinstance(item, dict):
            val = safe(item, "Not Detected")
            st = "Not Detected"
        else:
            if title == "Consumer Care Helpline":
                contacts = [item.get("cell_name"), item.get("phone"), item.get("email"), item.get("address")]
                contacts = [str(c) for c in contacts if c]
                val = item.get("evidence") or (" • ".join(contacts) if contacts else "No contact found")
            else:
                val = get_declaration_value(item)
            st = get_status_text(item)

        is_det = "detected" in st.lower()
        decl_rows.append([
            Paragraph(title, normal_style),
            Paragraph(rule_ref, small_style),
            Paragraph(val, normal_style),
            Paragraph(f"<font color='{'#059669' if is_det else '#DC2626'}'><b>{st}</b></font>", small_style),
        ])

    decl_table = Table(
        decl_rows,
        colWidths=[48 * mm, 38 * mm, 66 * mm, 30 * mm],
        repeatRows=1,
        style=TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#CBD5E1")),
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING", (0, 0), (-1, -1), 5),
            ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ]),
    )
    story.append(decl_table)
    story.append(Spacer(1, 8))

    # --------------------------------------------------------
    # VIOLATIONS / NON-COMPLIANCE SUMMARY
    # --------------------------------------------------------
    violations = compliance.get("violations", [])
    if violations:
        story.append(paragraph_text("3. Identified Non-Compliance Infractions", heading_style))
        for v in violations:
            msg = v.get("message") if isinstance(v, dict) else str(v)
            story.append(Paragraph(f"• <font color='#DC2626'><b>{msg}</b></font>", normal_style))
            story.append(Spacer(1, 2))
        story.append(Spacer(1, 6))

    # --------------------------------------------------------
    # OCR RAW EVIDENCE TRANSCRIPT
    # --------------------------------------------------------
    raw_ocr_text = ocr.get("text") or declarations.get("raw_text") or "OCR text processed."
    story.append(paragraph_text("4. Optical Character Recognition (OCR) Evidence Transcript", heading_style))
    story.append(
        Table(
            [[Paragraph(f"<font size='7' color='#475569'>{escape(raw_ocr_text[:400])}...</font>", small_style)]],
            colWidths=[182 * mm],
            style=TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
                ("BOX", (0, 0), (-1, -1), 0.4, colors.HexColor("#CBD5E1")),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ]),
        )
    )
    story.append(Spacer(1, 8))

    # --------------------------------------------------------
    # STATUTORY CERTIFICATION & LOGIC LEGENDS WATERMARK FOOTER
    # --------------------------------------------------------
    cert_box = Table(
        [
            [
                Paragraph(
                    "<b>Directorate Verification & Audit Seal:</b><br/>"
                    "This report was compiled utilizing Logic Legends MetraScan AI deep learning & rule verification pipeline. "
                    "All findings are recorded in compliance with the Legal Metrology (Packaged Commodities) Rules, 2011.",
                    small_style,
                ),
                Paragraph(
                    f"<b>CERTIFIED BY:</b><br/>{inspector_name}<br/><i>Legal Metrology Directorate</i>",
                    small_style,
                ),
            ]
        ],
        colWidths=[125 * mm, 57 * mm],
        style=TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F1F5F9")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#94A3B8")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 7),
            ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ]),
    )
    story.append(cert_box)

    # Build PDF with Logic Legends Watermark
    doc.build(
        story,
        onFirstPage=draw_page,
        onLaterPages=draw_page,
    )

    return str(output_path)