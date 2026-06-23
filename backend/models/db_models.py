"""SQLAlchemy ORM models for persistent storage."""

from sqlalchemy import Column, Integer, Float, String, DateTime, Text, Boolean
from datetime import datetime, timezone
from database import Base


class User(Base):
    """Relationship Manager users."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(150), unique=True, nullable=False)
    password_hash = Column(String(200), nullable=False)
    salt = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Policy(Base):
    """Credit scoring policy settings (custom weights and thresholds)."""
    __tablename__ = "policies"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False, default="Default Credit Policy")
    
    # Feature weights (multiplier for baseline feature contribution)
    w_monthly_turnover = Column(Float, nullable=False, default=1.0)
    w_cash_flow_stability = Column(Float, nullable=False, default=1.0)
    w_emi_repayment_rate = Column(Float, nullable=False, default=1.0)
    w_gst_filing_consistency = Column(Float, nullable=False, default=1.0)
    w_invoice_delay_days = Column(Float, nullable=False, default=1.0)
    w_account_balance_trend = Column(Float, nullable=False, default=1.0)
    w_business_age = Column(Float, nullable=False, default=1.0)
    w_loan_burden_ratio = Column(Float, nullable=False, default=1.0)

    # Risk thresholds
    low_threshold = Column(Float, nullable=False, default=75.0)     # Score >= low_threshold is Low Risk
    medium_threshold = Column(Float, nullable=False, default=50.0)  # Score >= medium_threshold is Medium Risk
    
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Assessment(Base):
    """Stores every credit assessment for history and dashboard."""
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    business_name = Column(String(200), nullable=False, index=True)
    monthly_turnover = Column(Float, nullable=False)
    cash_flow_stability = Column(Float, nullable=False)
    emi_repayment_rate = Column(Float, nullable=False)
    gst_filing_consistency = Column(Float, nullable=False)
    invoice_delay_days = Column(Integer, nullable=False)
    account_balance_trend = Column(Float, nullable=False)
    business_age = Column(Float, nullable=False)
    loan_burden_ratio = Column(Float, nullable=False)
    credit_score = Column(Float, nullable=False)
    risk_band = Column(String(20), nullable=False)
    recommended_action = Column(String(50), nullable=False)
    model_type = Column(String(20), nullable=False, default="xgboost")
    top_factors_json = Column(Text, nullable=True)  # JSON serialized SHAP factors
    user_id = Column(Integer, nullable=True)  # Link to User
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
