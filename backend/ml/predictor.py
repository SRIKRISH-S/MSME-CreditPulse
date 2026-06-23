"""
Prediction engine: XGBoost + SHAP explainability with rule-based fallback.

Loads the trained model at import time and provides a unified predict() interface.
"""

import logging
from pathlib import Path
from typing import Optional

import joblib
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

# Lazy-loaded globals
_model = None
_explainer = None
_model_loaded = False

FEATURE_NAMES = [
    "monthly_turnover",
    "cash_flow_stability",
    "emi_repayment_rate",
    "gst_filing_consistency",
    "invoice_delay_days",
    "account_balance_trend",
    "business_age",
    "loan_burden_ratio",
]

FEATURE_DISPLAY_NAMES = {
    "monthly_turnover": "Monthly Turnover (₹L)",
    "cash_flow_stability": "Cash Flow Stability",
    "emi_repayment_rate": "EMI Repayment Rate (%)",
    "gst_filing_consistency": "GST Filing Consistency (%)",
    "invoice_delay_days": "Invoice Delay (days)",
    "account_balance_trend": "Account Balance Trend",
    "business_age": "Business Age (years)",
    "loan_burden_ratio": "Loan Burden Ratio (%)",
}


def load_model(model_path: str) -> bool:
    """Load the XGBoost model and create SHAP explainer."""
    global _model, _explainer, _model_loaded

    path = Path(model_path)
    if not path.exists():
        logger.warning(f"Model file not found: {path}. Using rule-based fallback.")
        return False

    try:
        _model = joblib.load(path)

        import shap
        _explainer = shap.TreeExplainer(_model)

        _model_loaded = True
        logger.info(f"✅ XGBoost model loaded from {path}")
        return True
    except Exception as e:
        logger.error(f"Failed to load model: {e}. Using rule-based fallback.")
        return False


def _get_risk_band(score: float, policy=None) -> tuple[str, str]:
    """Map credit score to risk band and color."""
    low_t = policy.low_threshold if policy else 75.0
    med_t = policy.medium_threshold if policy else 50.0
    if score >= low_t:
        return "Low", "green"
    elif score >= med_t:
        return "Medium", "amber"
    else:
        return "High", "red"


def _get_recommendation(score: float, risk_band: str, policy=None) -> tuple[str, str]:
    """Determine recommended bank action based on score."""
    low_t = policy.low_threshold if policy else 75.0
    med_t = policy.medium_threshold if policy else 50.0
    review_t = med_t + (low_t - med_t) * 0.5

    if risk_band == "Low":
        return "Approve", "Strong financial health. Recommend proceeding with credit sanction at standard terms."
    elif score >= review_t:
        return "Review", "Moderate indicators require manual review by senior credit officer before approval."
    elif score >= med_t:
        return "Request Documents", "Borderline case. Request additional financial documents, bank statements, and business proof."
    else:
        return "Reject", "High risk profile. Recommend declining or restructuring with collateral requirements."


def predict(features: dict, policy=None) -> dict:
    """
    Run prediction using XGBoost + SHAP, or fall back to rule-based scoring.

    Args:
        features: dict with all 8 MSME feature values
        policy: SQLAlchemy Policy object or None

    Returns:
        dict with credit_score, risk_band, top_factors, recommendation, etc.
    """
    if _model_loaded and _model is not None and _explainer is not None:
        return _predict_xgboost(features, policy)
    else:
        return _predict_fallback(features, policy)


def _predict_xgboost(features: dict, policy=None) -> dict:
    """XGBoost prediction with SHAP explainability and optional policy weighting."""
    feature_values = [features[f] for f in FEATURE_NAMES]
    X = pd.DataFrame([feature_values], columns=FEATURE_NAMES)

    # SHAP values
    shap_values = _explainer.shap_values(X)
    shap_array = shap_values[0] if isinstance(shap_values, list) else shap_values[0]

    # Map policy weights
    weights_map = {
        "monthly_turnover": policy.w_monthly_turnover if policy else 1.0,
        "cash_flow_stability": policy.w_cash_flow_stability if policy else 1.0,
        "emi_repayment_rate": policy.w_emi_repayment_rate if policy else 1.0,
        "gst_filing_consistency": policy.w_gst_filing_consistency if policy else 1.0,
        "invoice_delay_days": policy.w_invoice_delay_days if policy else 1.0,
        "account_balance_trend": policy.w_account_balance_trend if policy else 1.0,
        "business_age": policy.w_business_age if policy else 1.0,
        "loan_burden_ratio": policy.w_loan_burden_ratio if policy else 1.0,
    }

    # Expected value from explainer
    base_val = float(_explainer.expected_value) if hasattr(_explainer, "expected_value") else 50.0
    if isinstance(base_val, (list, np.ndarray)):
        base_val = float(base_val[0])

    # Build feature contributions and apply policy weights
    contributions = []
    weighted_shap_sum = 0.0
    for i, feat in enumerate(FEATURE_NAMES):
        shap_val = float(shap_array[i])
        weight = weights_map[feat]
        weighted_contrib = shap_val * weight
        weighted_shap_sum += weighted_contrib
        
        contributions.append({
            "feature": feat,
            "display_name": FEATURE_DISPLAY_NAMES[feat],
            "value": features[feat],
            "contribution": round(weighted_contrib, 2),
            "direction": "positive" if weighted_contrib >= 0 else "negative",
        })

    # Adjust final score based on weighted SHAP values
    adjusted_raw_score = base_val + weighted_shap_sum
    credit_score = max(0.0, min(100.0, round(adjusted_raw_score, 1)))

    # Sort by absolute contribution
    contributions.sort(key=lambda x: abs(x["contribution"]), reverse=True)

    risk_band, risk_color = _get_risk_band(credit_score, policy)
    action, action_detail = _get_recommendation(credit_score, risk_band, policy)

    return {
        "credit_score": credit_score,
        "risk_band": risk_band,
        "risk_color": risk_color,
        "recommended_action": action,
        "action_detail": action_detail,
        "top_factors": contributions,
        "model_type": "xgboost",
    }


def _predict_fallback(features: dict, policy=None) -> dict:
    """Use rule-based fallback when model is unavailable."""
    from ml.fallback import rule_based_score

    result = rule_based_score(features, policy)
    credit_score = result["credit_score"]

    risk_band, risk_color = _get_risk_band(credit_score, policy)
    action, action_detail = _get_recommendation(credit_score, risk_band, policy)

    return {
        "credit_score": credit_score,
        "risk_band": risk_band,
        "risk_color": risk_color,
        "recommended_action": action,
        "action_detail": action_detail,
        "top_factors": result["contributions"],
        "model_type": "rule_based",
    }


def is_model_loaded() -> bool:
    return _model_loaded



