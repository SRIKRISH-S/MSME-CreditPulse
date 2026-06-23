"""PDF and JSON report generation for credit assessments."""

import io
import json
from datetime import datetime, timezone

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)

# IDBI-inspired color palette
NAVY = colors.HexColor("#1a365d")
BLUE = colors.HexColor("#2b6cb0")
GOLD = colors.HexColor("#d4a843")
GREEN = colors.HexColor("#38a169")
AMBER = colors.HexColor("#d69e2e")
RED = colors.HexColor("#e53e3e")
LIGHT_GRAY = colors.HexColor("#f7fafc")
WHITE = colors.white


def _risk_color(band: str) -> colors.Color:
    return {"Low": GREEN, "Medium": AMBER, "High": RED}.get(band, BLUE)


def generate_pdf_report(assessment: dict) -> bytes:
    """Generate a professional PDF credit assessment report."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        topMargin=20 * mm, bottomMargin=20 * mm,
        leftMargin=20 * mm, rightMargin=20 * mm,
    )

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        "BrandTitle", parent=styles["Title"],
        textColor=NAVY, fontSize=22, spaceAfter=4,
    ))
    styles.add(ParagraphStyle(
        "SubBrand", parent=styles["Normal"],
        textColor=BLUE, fontSize=11, spaceAfter=12,
    ))
    styles.add(ParagraphStyle(
        "SectionHead", parent=styles["Heading2"],
        textColor=NAVY, fontSize=14, spaceBefore=16, spaceAfter=8,
    ))
    styles.add(ParagraphStyle(
        "BodyText2", parent=styles["Normal"],
        fontSize=10, spaceAfter=6, leading=14,
    ))

    elements = []

    # Header
    elements.append(Paragraph("MSME CreditPulse", styles["BrandTitle"]))
    elements.append(Paragraph("AI-Powered Credit Assessment Report — IDBI Bank", styles["SubBrand"]))
    elements.append(HRFlowable(width="100%", thickness=2, color=GOLD, spaceAfter=12))

    # Business info
    elements.append(Paragraph("Business Details", styles["SectionHead"]))
    biz_name = assessment.get("business_name", "N/A")
    timestamp = assessment.get("created_at") or assessment.get("timestamp") or datetime.now(timezone.utc).isoformat()
    elements.append(Paragraph(f"<b>Business Name:</b> {biz_name}", styles["BodyText2"]))
    elements.append(Paragraph(f"<b>Assessment Date:</b> {timestamp[:19]}", styles["BodyText2"]))
    elements.append(Spacer(1, 8))

    # Score summary
    elements.append(Paragraph("Credit Score Summary", styles["SectionHead"]))
    score = assessment.get("credit_score", 0)
    risk = assessment.get("risk_band", "N/A")
    action = assessment.get("recommended_action", "N/A")
    detail = assessment.get("action_detail", "")

    score_data = [
        ["Credit Score", "Risk Band", "Recommendation"],
        [f"{score}/100", risk, action],
    ]
    score_table = Table(score_data, colWidths=[60 * mm, 50 * mm, 60 * mm])
    score_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTSIZE", (0, 0), (-1, -1), 11),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("BACKGROUND", (0, 1), (-1, 1), LIGHT_GRAY),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [LIGHT_GRAY, WHITE]),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    elements.append(score_table)
    elements.append(Spacer(1, 6))
    elements.append(Paragraph(f"<b>Action Detail:</b> {detail}", styles["BodyText2"]))
    elements.append(Spacer(1, 8))

    # Input data
    elements.append(Paragraph("Input Financial Indicators", styles["SectionHead"]))
    input_data = assessment.get("input_data", {})
    display_names = {
        "monthly_turnover": "Monthly Turnover (₹ Lakhs)",
        "cash_flow_stability": "Cash Flow Stability",
        "emi_repayment_rate": "EMI Repayment Rate (%)",
        "gst_filing_consistency": "GST Filing Consistency (%)",
        "invoice_delay_days": "Invoice Delay (days)",
        "account_balance_trend": "Account Balance Trend",
        "business_age": "Business Age (years)",
        "loan_burden_ratio": "Loan Burden Ratio (%)",
    }

    input_table_data = [["Indicator", "Value"]]
    for key, display in display_names.items():
        val = input_data.get(key, "N/A")
        input_table_data.append([display, str(val)])

    input_table = Table(input_table_data, colWidths=[100 * mm, 60 * mm])
    input_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("ALIGN", (1, 0), (1, -1), "CENTER"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_GRAY]),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    elements.append(input_table)
    elements.append(Spacer(1, 8))

    # SHAP / Explainability
    elements.append(Paragraph("Top Contributing Factors (AI Explainability)", styles["SectionHead"]))
    top_factors = assessment.get("top_factors", [])
    if top_factors:
        factor_data = [["Factor", "Value", "Impact", "Direction"]]
        for f in top_factors[:6]:
            factor_data.append([
                f.get("display_name", f.get("feature", "")),
                str(f.get("value", "")),
                str(f.get("contribution", "")),
                f.get("direction", "").capitalize(),
            ])

        factor_table = Table(factor_data, colWidths=[65 * mm, 35 * mm, 30 * mm, 30 * mm])
        factor_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("ALIGN", (1, 0), (-1, -1), "CENTER"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_GRAY]),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
        elements.append(factor_table)
    else:
        elements.append(Paragraph("No factor data available.", styles["BodyText2"]))

    elements.append(Spacer(1, 16))

    # Footer
    elements.append(HRFlowable(width="100%", thickness=1, color=GOLD, spaceAfter=8))
    elements.append(Paragraph(
        "<i>This report is generated by MSME CreditPulse AI System. "
        "For internal bank use only. Subject to manual review.</i>",
        ParagraphStyle("Footer", parent=styles["Normal"], fontSize=8, textColor=colors.grey),
    ))

    doc.build(elements)
    return buffer.getvalue()


def generate_json_report(assessment: dict) -> str:
    """Generate a structured JSON report."""
    report = {
        "report_type": "MSME Credit Assessment",
        "generated_by": "CreditPulse AI",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "business_name": assessment.get("business_name"),
        "credit_score": assessment.get("credit_score"),
        "risk_band": assessment.get("risk_band"),
        "recommended_action": assessment.get("recommended_action"),
        "action_detail": assessment.get("action_detail", ""),
        "input_data": assessment.get("input_data", {}),
        "top_factors": assessment.get("top_factors", []),
        "model_type": assessment.get("model_type", "unknown"),
        "disclaimer": "Auto-generated report. Subject to manual review by credit officer.",
    }
    return json.dumps(report, indent=2, ensure_ascii=False)
