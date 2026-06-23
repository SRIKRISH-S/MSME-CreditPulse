"""Prediction endpoints: single assessment, CSV bulk upload, history, and dashboard stats."""

import io
import json
from datetime import datetime, timezone

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models.schemas import MSMEInput, PredictionResult, BulkPredictionResult, DashboardStats
from models.db_models import Assessment, Policy
from ml.predictor import predict, FEATURE_NAMES

router = APIRouter(prefix="/api", tags=["Predictions"])


def _build_result(input_data: MSMEInput, db: Session) -> PredictionResult:
    """Run prediction, store in DB, and return structured result."""
    features = {
        "monthly_turnover": input_data.monthly_turnover,
        "cash_flow_stability": input_data.cash_flow_stability,
        "emi_repayment_rate": input_data.emi_repayment_rate,
        "gst_filing_consistency": input_data.gst_filing_consistency,
        "invoice_delay_days": input_data.invoice_delay_days,
        "account_balance_trend": input_data.account_balance_trend,
        "business_age": input_data.business_age,
        "loan_burden_ratio": input_data.loan_burden_ratio,
    }

    # Fetch currently active scoring policy
    active_policy = db.query(Policy).filter(Policy.is_active == True).first()
    result = predict(features, policy=active_policy)

    # Persist to database
    assessment = Assessment(
        business_name=input_data.business_name,
        **features,
        credit_score=result["credit_score"],
        risk_band=result["risk_band"],
        recommended_action=result["recommended_action"],
        model_type=result["model_type"],
        top_factors_json=json.dumps(result["top_factors"]),
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    now = datetime.now(timezone.utc).isoformat()

    return PredictionResult(
        id=assessment.id,
        business_name=input_data.business_name,
        credit_score=result["credit_score"],
        risk_band=result["risk_band"],
        risk_color=result["risk_color"],
        recommended_action=result["recommended_action"],
        action_detail=result["action_detail"],
        top_factors=result["top_factors"],
        input_data=features,
        model_type=result["model_type"],
        timestamp=now,
    )


@router.post("/predict", response_model=PredictionResult)
async def predict_single(input_data: MSMEInput, db: Session = Depends(get_db)):
    """Run a single MSME credit assessment."""
    try:
        return _build_result(input_data, db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@router.post("/predict/csv", response_model=BulkPredictionResult)
async def predict_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload a CSV file for bulk MSME credit assessments."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted.")

    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {str(e)}")

    # Validate required columns
    required = ["business_name"] + FEATURE_NAMES
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Missing columns: {', '.join(missing)}. Required: {', '.join(required)}",
        )

    results = []
    for _, row in df.iterrows():
        try:
            input_data = MSMEInput(
                business_name=str(row["business_name"]),
                monthly_turnover=float(row["monthly_turnover"]),
                cash_flow_stability=float(row["cash_flow_stability"]),
                emi_repayment_rate=float(row["emi_repayment_rate"]),
                gst_filing_consistency=float(row["gst_filing_consistency"]),
                invoice_delay_days=int(row["invoice_delay_days"]),
                account_balance_trend=float(row["account_balance_trend"]),
                business_age=float(row["business_age"]),
                loan_burden_ratio=float(row["loan_burden_ratio"]),
            )
            result = _build_result(input_data, db)
            results.append(result)
        except Exception:
            continue  # Skip invalid rows silently

    if not results:
        raise HTTPException(status_code=400, detail="No valid rows found in CSV.")

    scores = [r.credit_score for r in results]
    risk_counts = {"Low": 0, "Medium": 0, "High": 0}
    for r in results:
        risk_counts[r.risk_band] += 1

    return BulkPredictionResult(
        total=len(results),
        results=results,
        summary={
            "avg_score": round(sum(scores) / len(scores), 1),
            "min_score": min(scores),
            "max_score": max(scores),
            "risk_distribution": risk_counts,
        },
    )


@router.get("/assessments")
async def get_assessments(limit: int = 20, db: Session = Depends(get_db)):
    """Get recent assessment history."""
    assessments = (
        db.query(Assessment)
        .order_by(Assessment.created_at.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "id": a.id,
            "business_name": a.business_name,
            "credit_score": a.credit_score,
            "risk_band": a.risk_band,
            "recommended_action": a.recommended_action,
            "model_type": a.model_type,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
        for a in assessments
    ]


@router.get("/assessments/{assessment_id}")
async def get_assessment_detail(assessment_id: int, db: Session = Depends(get_db)):
    """Get full details of a specific assessment including peer benchmarking."""
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found.")

    top_factors = json.loads(assessment.top_factors_json) if assessment.top_factors_json else []

    # Calculate peer averages (excluding the current business itself)
    peer_stats = db.query(
        func.avg(Assessment.monthly_turnover).label("monthly_turnover"),
        func.avg(Assessment.cash_flow_stability).label("cash_flow_stability"),
        func.avg(Assessment.emi_repayment_rate).label("emi_repayment_rate"),
        func.avg(Assessment.gst_filing_consistency).label("gst_filing_consistency"),
        func.avg(Assessment.invoice_delay_days).label("invoice_delay_days"),
        func.avg(Assessment.account_balance_trend).label("account_balance_trend"),
        func.avg(Assessment.business_age).label("business_age"),
        func.avg(Assessment.loan_burden_ratio).label("loan_burden_ratio")
    ).filter(Assessment.id != assessment_id).first()

    if peer_stats and peer_stats.monthly_turnover is not None:
        peers_data = {
            "monthly_turnover": round(float(peer_stats.monthly_turnover), 1),
            "cash_flow_stability": round(float(peer_stats.cash_flow_stability), 2),
            "emi_repayment_rate": round(float(peer_stats.emi_repayment_rate), 1),
            "gst_filing_consistency": round(float(peer_stats.gst_filing_consistency), 1),
            "invoice_delay_days": round(float(peer_stats.invoice_delay_days), 1),
            "account_balance_trend": round(float(peer_stats.account_balance_trend), 2),
            "business_age": round(float(peer_stats.business_age), 1),
            "loan_burden_ratio": round(float(peer_stats.loan_burden_ratio), 1)
        }
    else:
        # Default fallback values if no other peers are in the database yet
        peers_data = {
            "monthly_turnover": 85.5,
            "cash_flow_stability": 0.72,
            "emi_repayment_rate": 92.5,
            "gst_filing_consistency": 88.0,
            "invoice_delay_days": 12.0,
            "account_balance_trend": 0.35,
            "business_age": 8.5,
            "loan_burden_ratio": 28.0
        }

    return {
        "id": assessment.id,
        "business_name": assessment.business_name,
        "credit_score": assessment.credit_score,
        "risk_band": assessment.risk_band,
        "recommended_action": assessment.recommended_action,
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
        "peers": peers_data,
        "created_at": assessment.created_at.isoformat() if assessment.created_at else None,
    }


@router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(db: Session = Depends(get_db)):
    """Aggregate statistics for the dashboard."""
    total = db.query(func.count(Assessment.id)).scalar() or 0
    avg = db.query(func.avg(Assessment.credit_score)).scalar() or 0

    low = db.query(func.count(Assessment.id)).filter(Assessment.risk_band == "Low").scalar() or 0
    med = db.query(func.count(Assessment.id)).filter(Assessment.risk_band == "Medium").scalar() or 0
    high = db.query(func.count(Assessment.id)).filter(Assessment.risk_band == "High").scalar() or 0

    recent = (
        db.query(Assessment)
        .order_by(Assessment.created_at.desc())
        .limit(10)
        .all()
    )

    recent_list = [
        {
            "id": a.id,
            "business_name": a.business_name,
            "credit_score": a.credit_score,
            "risk_band": a.risk_band,
            "recommended_action": a.recommended_action,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
        for a in recent
    ]

    # Score distribution buckets
    distribution = []
    for label, lo, hi in [("0-20", 0, 20), ("21-40", 21, 40), ("41-60", 41, 60), ("61-80", 61, 80), ("81-100", 81, 100)]:
        count = (
            db.query(func.count(Assessment.id))
            .filter(Assessment.credit_score >= lo, Assessment.credit_score <= hi)
            .scalar() or 0
        )
        distribution.append({"range": label, "count": count})

    return DashboardStats(
        total_assessments=total,
        avg_score=round(float(avg), 1),
        low_risk_count=low,
        medium_risk_count=med,
        high_risk_count=high,
        recent_assessments=recent_list,
        score_distribution=distribution,
    )


@router.get("/predict/sample-template")
async def get_csv_template():
    """Download the empty CSV template for bulk upload."""
    headers = "business_name,monthly_turnover,cash_flow_stability,emi_repayment_rate,gst_filing_consistency,invoice_delay_days,account_balance_trend,business_age,loan_burden_ratio\n"
    sample_row = "Sharma Enterprises,120.5,0.85,98.2,95.0,8,0.45,6.2,15.5\n"
    csv_content = headers + sample_row
    
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": 'attachment; filename="creditpulse_bulk_template.csv"'
        }
    )

