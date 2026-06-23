"""Router for customizing credit scoring policies and weights."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models.db_models import Policy
from models.schemas import PolicySettings, PolicyResponse

router = APIRouter(prefix="/api/policy", tags=["Scoring Policy"])


@router.get("", response_model=PolicyResponse)
async def get_active_policy(db: Session = Depends(get_db)):
    """Retrieve the currently active credit policy parameters."""
    policy = db.query(Policy).filter(Policy.is_active == True).first()
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active policy configuration not found."
        )
    return policy


@router.post("", response_model=PolicyResponse)
async def update_policy(settings: PolicySettings, db: Session = Depends(get_db)):
    """Update active credit policy weights and thresholds."""
    try:
        # Deactivate all current policies
        db.query(Policy).filter(Policy.is_active == True).update({"is_active": False})
        
        # Create and active new policy settings
        new_policy = Policy(
            name=settings.name,
            w_monthly_turnover=settings.w_monthly_turnover,
            w_cash_flow_stability=settings.w_cash_flow_stability,
            w_emi_repayment_rate=settings.w_emi_repayment_rate,
            w_gst_filing_consistency=settings.w_gst_filing_consistency,
            w_invoice_delay_days=settings.w_invoice_delay_days,
            w_account_balance_trend=settings.w_account_balance_trend,
            w_business_age=settings.w_business_age,
            w_loan_burden_ratio=settings.w_loan_burden_ratio,
            low_threshold=settings.low_threshold,
            medium_threshold=settings.medium_threshold,
            is_active=True
        )
        db.add(new_policy)
        db.commit()
        db.refresh(new_policy)
        return new_policy
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update policy: {str(e)}"
        )
