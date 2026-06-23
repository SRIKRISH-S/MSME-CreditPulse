"""Report download endpoints: JSON and PDF."""

import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from database import get_db
from models.db_models import Assessment
from models.schemas import MemoResponse
from utils.report_generator import generate_pdf_report, generate_json_report
from datetime import datetime

router = APIRouter(prefix="/api/reports", tags=["Reports"])


def _get_assessment_dict(assessment_id: int, db: Session) -> dict:
    """Fetch assessment and convert to dict for report generation."""
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found.")

    top_factors = json.loads(assessment.top_factors_json) if assessment.top_factors_json else []

    return {
        "id": assessment.id,
        "business_name": assessment.business_name,
        "credit_score": assessment.credit_score,
        "risk_band": assessment.risk_band,
        "recommended_action": assessment.recommended_action,
        "action_detail": "",  # Regenerate from score
        "model_type": assessment.model_type,
        "top_factors": top_factors,
        "input_data": {
            "monthly_turnover": assessment.monthly_turnover,
            "cash_flow_stability": assessment.cash_flow_stability,
            "emi_repayment_rate": assessment.emi_repayment_rate,
            "gst_filing_consistency": assessment.gst_filing_consistency,
            "invoice_delay_days": assessment.invoice_delay_days,
            "account_balance_trend": assessment.account_balance_trend,
            "business_age": assessment.business_age,
            "loan_burden_ratio": assessment.loan_burden_ratio,
        },
        "created_at": assessment.created_at.isoformat() if assessment.created_at else None,
    }


@router.get("/{assessment_id}/json")
async def download_json_report(assessment_id: int, db: Session = Depends(get_db)):
    """Download a credit assessment report as JSON."""
    data = _get_assessment_dict(assessment_id, db)
    json_content = generate_json_report(data)
    return Response(
        content=json_content,
        media_type="application/json",
        headers={
            "Content-Disposition": f'attachment; filename="creditpulse_report_{assessment_id}.json"'
        },
    )


@router.get("/{assessment_id}/pdf")
async def download_pdf_report(assessment_id: int, db: Session = Depends(get_db)):
    """Download a credit assessment report as PDF."""
    data = _get_assessment_dict(assessment_id, db)
    pdf_bytes = generate_pdf_report(data)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="creditpulse_report_{assessment_id}.pdf"'
        },
    )


@router.get("/{assessment_id}/memo", response_model=MemoResponse)
async def generate_credit_memo(assessment_id: int, db: Session = Depends(get_db)):
    """Generate an AI-powered credit assessment memo and client communication templates."""
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found.")

    factors = json.loads(assessment.top_factors_json) if assessment.top_factors_json else []
    
    # Identify positive and negative factors
    positives = [f for f in factors if f.get("direction") == "positive"]
    negatives = [f for f in factors if f.get("direction") == "negative"]

    # Generate custom Memo Text
    memo_lines = [
        f"CREDIT ASSESSMENT MEMORANDUM - IDBI INNOVATE 2026",
        f"----------------------------------------------------------------",
        f"Applicant MSME: {assessment.business_name}",
        f"Assessment ID:  #{assessment.id}",
        f"Credit Score:  {assessment.credit_score} / 100",
        f"Risk Rating:    {assessment.risk_band} Risk",
        f"Recommendation: {assessment.recommended_action}",
        f"Date:           {datetime.now().strftime('%Y-%m-%d')}",
        f"",
        f"1. Executive Financial Summary:",
        f"{assessment.business_name} demonstrates a monthly turnover of ₹{assessment.monthly_turnover} Lakhs with a business vintage of {assessment.business_age} years. The scoring engine has determined a risk profile of {assessment.risk_band} Risk.",
        f""
    ]

    # Add Strengths section
    memo_lines.append("2. Core Credit Strengths:")
    if positives:
        for p in positives[:3]:
            memo_lines.append(f"  - Strong {p['display_name']}: Measured at {p['value']}. This contributed +{p['contribution']} points to the credit rating.")
    else:
        memo_lines.append("  - No significant financial strengths identified based on standard indicators.")

    memo_lines.append("")

    # Add Risks section
    memo_lines.append("3. Key Risk Factors:")
    if negatives:
        for n in negatives[:3]:
            memo_lines.append(f"  - Weak {n['display_name']}: Measured at {n['value']}. This dragged the credit rating down by {n['contribution']} points.")
    else:
        memo_lines.append("  - No severe risk factors identified.")

    memo_lines.append("")

    # Add Mitigating Factors & Terms
    memo_lines.append("4. Mitigating Conditions & Term Requirements:")
    if assessment.risk_band == "Low":
        memo_lines.append("  - Approve facility up to ₹50 Lakhs with standard interest terms.")
        memo_lines.append("  - Secure general hypothecation of business inventories.")
    elif assessment.risk_band == "Medium":
        memo_lines.append("  - Proceed with facility under a dual-signoff credit review.")
        memo_lines.append("  - Require a personal guarantee from the primary directors/owners.")
        memo_lines.append("  - Mitigate cash flow volatility by setting up an escrow account for invoice collections.")
    else:
        memo_lines.append("  - Decline credit expansion. High probability of default indicated by repayment trends.")
        memo_lines.append("  - Require 100% liquid collateral or bank guarantee for any specialized trade credit facilities.")

    memo_text = "\n".join(memo_lines)

    # Generate draft client email
    email_subject = f"IDBI Bank Credit Assessment Update - {assessment.business_name}"
    email_body = []
    if assessment.recommended_action == "Approve":
        email_body = [
            f"Dear Team at {assessment.business_name},",
            f"",
            f"We are pleased to inform you that the preliminary credit assessment for your loan application has been approved under our low-risk tier.",
            f"Our Relationship Manager will connect with you shortly to proceed with the sanction letter and documentation.",
            f"",
            f"Best regards,",
            f"IDBI Credit Services Team"
        ]
    elif assessment.recommended_action == "Review" or assessment.recommended_action == "Request Documents":
        email_body = [
            f"Dear Team at {assessment.business_name},",
            f"",
            f"Thank you for submitting your credit facility application. Your application is currently undergoing a secondary credit review.",
            f"To expedite the approval, please send us: (1) Last 12 months' GST filing returns, and (2) Bank account statement for the past 6 months.",
            f"",
            f"Best regards,",
            f"IDBI Credit Services Team"
        ]
    else:
        email_body = [
            f"Dear Team at {assessment.business_name},",
            f"",
            f"Thank you for applying for a business credit facility with IDBI Bank. After reviewing the financial parameters, we regret to inform you that we are unable to sanction your credit request at this time.",
            f"Our Relationship Manager can assist in discussing collateral-backed alternatives.",
            f"",
            f"Best regards,",
            f"IDBI Credit Services Team"
        ]

    client_email = f"Subject: {email_subject}\n\n" + "\n".join(email_body)

    # Generate business remediation plan
    plan_lines = [
        f"To improve the credit rating score from {assessment.credit_score} to 75+ (Low Risk):",
    ]
    if assessment.emi_repayment_rate < 95.0:
        plan_lines.append(f"  - EMI Repayment Rate: Currently {assessment.emi_repayment_rate}%. Pay all monthly dues on or before due date to hit 100% consistency.")
    if assessment.invoice_delay_days > 15:
        plan_lines.append(f"  - Invoice Delay: Reduce delay from {assessment.invoice_delay_days} days to under 10 days by refining credit collection cycles with customers.")
    if assessment.gst_filing_consistency < 90.0:
        plan_lines.append(f"  - GST Filing: Improve filing consistency from {assessment.gst_filing_consistency}% to 100% to reflect positive regulatory alignment.")
    if assessment.loan_burden_ratio > 30:
        plan_lines.append(f"  - Debt Consolidation: Pay down existing short-term overdrafts to bring your loan burden below 25% of turnover.")
    if len(plan_lines) == 1:
        plan_lines.append("  - Maintain the strong cash-flow stability and turnover ratios to support future facility renewals.")

    remediation_plan = "\n".join(plan_lines)

    return MemoResponse(
        assessment_id=assessment.id,
        business_name=assessment.business_name,
        recommendation=assessment.recommended_action,
        risk_band=assessment.risk_band,
        credit_score=assessment.credit_score,
        memo_text=memo_text,
        client_email=client_email,
        remediation_plan=remediation_plan
    )

