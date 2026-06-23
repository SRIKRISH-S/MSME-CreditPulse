"""
Rule-based fallback scorer for when the ML model is unavailable.

Uses weighted business rules to compute a deterministic credit score.
Provides transparent, interpretable scoring as a backup.
"""

FEATURE_DISPLAY_NAMES = {
    "monthly_turnover": "Monthly Turnover",
    "cash_flow_stability": "Cash Flow Stability",
    "emi_repayment_rate": "EMI Repayment Rate",
    "gst_filing_consistency": "GST Filing Consistency",
    "invoice_delay_days": "Invoice Delay",
    "account_balance_trend": "Balance Trend",
    "business_age": "Business Age",
    "loan_burden_ratio": "Loan Burden Ratio",
}

# Weights mirror the data generation logic for consistency
WEIGHTS = {
    "monthly_turnover": 0.15,
    "cash_flow_stability": 0.15,
    "emi_repayment_rate": 0.20,
    "gst_filing_consistency": 0.12,
    "invoice_delay_days": 0.12,
    "account_balance_trend": 0.08,
    "business_age": 0.08,
    "loan_burden_ratio": 0.10,
}


def _normalize(feature: str, value: float) -> float:
    """Normalize a raw feature value to 0-1 scale (higher = better)."""
    normalizers = {
        "monthly_turnover": lambda v: min(v / 300, 1.0),
        "cash_flow_stability": lambda v: v,
        "emi_repayment_rate": lambda v: v / 100,
        "gst_filing_consistency": lambda v: v / 100,
        "invoice_delay_days": lambda v: 1 - min(v / 90, 1.0),
        "account_balance_trend": lambda v: (v + 1) / 2,
        "business_age": lambda v: min(v / 15, 1.0),
        "loan_burden_ratio": lambda v: 1 - v / 100,
    }
    return normalizers[feature](value)


def rule_based_score(features: dict, policy=None) -> dict:
    """
    Compute a credit score using weighted business rules.

    Args:
        features: dict with all 8 MSME feature values
        policy: SQLAlchemy Policy object or None

    Returns:
        dict with credit_score and feature contributions
    """
    # Use weights from policy if available
    weights = {
        "monthly_turnover": WEIGHTS["monthly_turnover"] * (policy.w_monthly_turnover if policy else 1.0),
        "cash_flow_stability": WEIGHTS["cash_flow_stability"] * (policy.w_cash_flow_stability if policy else 1.0),
        "emi_repayment_rate": WEIGHTS["emi_repayment_rate"] * (policy.w_emi_repayment_rate if policy else 1.0),
        "gst_filing_consistency": WEIGHTS["gst_filing_consistency"] * (policy.w_gst_filing_consistency if policy else 1.0),
        "invoice_delay_days": WEIGHTS["invoice_delay_days"] * (policy.w_invoice_delay_days if policy else 1.0),
        "account_balance_trend": WEIGHTS["account_balance_trend"] * (policy.w_account_balance_trend if policy else 1.0),
        "business_age": WEIGHTS["business_age"] * (policy.w_business_age if policy else 1.0),
        "loan_burden_ratio": WEIGHTS["loan_burden_ratio"] * (policy.w_loan_burden_ratio if policy else 1.0),
    }

    # Normalize weights so they sum to 1.0
    sum_w = sum(weights.values())
    if sum_w > 0:
        weights = {k: v / sum_w for k, v in weights.items()}
    else:
        weights = WEIGHTS

    contributions = {}
    total_score = 0.0

    for feat, weight in weights.items():
        raw_value = features[feat]
        normalized = _normalize(feat, raw_value)
        contribution = normalized * weight * 100
        total_score += contribution

        contributions[feat] = {
            "feature": feat,
            "display_name": FEATURE_DISPLAY_NAMES[feat],
            "value": raw_value,
            "contribution": round(contribution - (weight * 50), 2),  # centered around neutral
            "direction": "positive" if normalized >= 0.5 else "negative",
        }

    credit_score = max(0, min(100, round(total_score, 1)))

    # Sort by absolute contribution magnitude
    sorted_contributions = sorted(
        contributions.values(),
        key=lambda x: abs(x["contribution"]),
        reverse=True,
    )

    return {
        "credit_score": credit_score,
        "contributions": sorted_contributions,
        "model_type": "rule_based",
    }
