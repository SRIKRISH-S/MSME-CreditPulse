"""Pydantic schemas for API request/response validation."""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ── Auth ──────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str
    user: str
    message: str


# ── MSME Input ────────────────────────────────────────────────────────────

class MSMEInput(BaseModel):
    """All 8 financial indicators for an MSME entity."""
    business_name: str = Field(..., min_length=1, max_length=200, description="Name of the MSME")
    monthly_turnover: float = Field(..., ge=0.5, le=500, description="Monthly turnover in ₹ Lakhs")
    cash_flow_stability: float = Field(..., ge=0, le=1, description="Cash flow stability score (0-1)")
    emi_repayment_rate: float = Field(..., ge=0, le=100, description="EMI repayment rate percentage")
    gst_filing_consistency: float = Field(..., ge=0, le=100, description="GST filing consistency percentage")
    invoice_delay_days: int = Field(..., ge=0, le=90, description="Average invoice delay in days")
    account_balance_trend: float = Field(..., ge=-1, le=1, description="Account balance trend (-1 to 1)")
    business_age: float = Field(..., ge=0, le=50, description="Business age in years")
    loan_burden_ratio: float = Field(..., ge=0, le=100, description="Existing loan burden ratio percentage")


# ── Feature Contribution (SHAP) ──────────────────────────────────────────

class FeatureContribution(BaseModel):
    """A single SHAP feature contribution."""
    feature: str
    display_name: str
    value: float
    contribution: float
    direction: str  # "positive" or "negative"


# ── Prediction Result ────────────────────────────────────────────────────

class PredictionResult(BaseModel):
    """Complete prediction response with score, risk, explanation, and action."""
    model_config = {"protected_namespaces": ()}
    id: Optional[int] = None
    business_name: str
    credit_score: float = Field(..., ge=0, le=100)
    risk_band: str  # "Low", "Medium", "High"
    risk_color: str  # "green", "amber", "red"
    recommended_action: str  # "Approve", "Review", "Request Documents", "Reject"
    action_detail: str
    top_factors: list[FeatureContribution]
    input_data: dict
    model_type: str  # "xgboost" or "rule_based"
    timestamp: str


# ── Bulk Result ──────────────────────────────────────────────────────────

class BulkPredictionResult(BaseModel):
    """Response for CSV upload with multiple predictions."""
    total: int
    results: list[PredictionResult]
    summary: dict


# ── Dashboard Stats ──────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_assessments: int
    avg_score: float
    low_risk_count: int
    medium_risk_count: int
    high_risk_count: int
    recent_assessments: list[dict]
    score_distribution: list[dict]


# ── Assessment Record ────────────────────────────────────────────────────

class AssessmentRecord(BaseModel):
    id: int
    business_name: str
    credit_score: float
    risk_band: str
    recommended_action: str
    created_at: str

    class Config:
        from_attributes = True


# ── User Register & Out ──────────────────────────────────────────────────

class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., min_length=5, max_length=100)
    password: str = Field(..., min_length=6)


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True


# ── Policy Configurator ──────────────────────────────────────────────────

class PolicySettings(BaseModel):
    name: Optional[str] = "Custom Credit Policy"
    w_monthly_turnover: float = Field(1.0, ge=0.0, le=5.0)
    w_cash_flow_stability: float = Field(1.0, ge=0.0, le=5.0)
    w_emi_repayment_rate: float = Field(1.0, ge=0.0, le=5.0)
    w_gst_filing_consistency: float = Field(1.0, ge=0.0, le=5.0)
    w_invoice_delay_days: float = Field(1.0, ge=0.0, le=5.0)
    w_account_balance_trend: float = Field(1.0, ge=0.0, le=5.0)
    w_business_age: float = Field(1.0, ge=0.0, le=5.0)
    w_loan_burden_ratio: float = Field(1.0, ge=0.0, le=5.0)
    low_threshold: float = Field(75.0, ge=0.0, le=100.0)
    medium_threshold: float = Field(50.0, ge=0.0, le=100.0)


class PolicyResponse(PolicySettings):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ── Credit Memo Response ─────────────────────────────────────────────────

class MemoResponse(BaseModel):
    assessment_id: int
    business_name: str
    recommendation: str
    risk_band: str
    credit_score: float
    memo_text: str
    client_email: str
    remediation_plan: str

