"""
Generate realistic synthetic MSME financial data for model training.

Creates correlated features that mimic real MSME financial behavior:
- Healthy businesses have high turnover, good repayment, consistent GST filing
- Struggling businesses show inverse patterns
"""

import numpy as np
import pandas as pd
from pathlib import Path

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

BUSINESS_PREFIXES = [
    "Sharma", "Patel", "Gupta", "Verma", "Singh", "Kumar", "Agarwal",
    "Mehta", "Reddy", "Joshi", "Nair", "Rao", "Pillai", "Iyer", "Das",
    "Bansal", "Chopra", "Malhotra", "Kapoor", "Saxena", "Bhat", "Hegde",
]

BUSINESS_SUFFIXES = [
    "Enterprises", "Trading Co", "Industries", "Solutions", "Exports",
    "Textiles", "Agro Products", "Electronics", "Pharma", "Steel Works",
    "Auto Parts", "Food Processing", "IT Services", "Plastics", "Ceramics",
    "Packaging", "Chemicals", "Engineering", "Garments", "Hardware",
]


def generate_business_name(idx: int) -> str:
    prefix = BUSINESS_PREFIXES[idx % len(BUSINESS_PREFIXES)]
    suffix = BUSINESS_SUFFIXES[idx % len(BUSINESS_SUFFIXES)]
    return f"{prefix} {suffix}"


def generate_dataset(n_samples: int = 500, seed: int = 42) -> pd.DataFrame:
    """Generate n_samples synthetic MSME records with realistic correlations."""
    rng = np.random.RandomState(seed)

    # Latent health factor (0 = unhealthy, 1 = healthy)
    health = rng.beta(2.5, 2.5, n_samples)

    # Generate correlated features based on health
    monthly_turnover = np.clip(health * 300 + rng.normal(0, 40, n_samples), 0.5, 500)
    cash_flow_stability = np.clip(health * 0.7 + rng.normal(0.15, 0.1, n_samples), 0, 1)
    emi_repayment_rate = np.clip(health * 60 + 30 + rng.normal(0, 8, n_samples), 0, 100)
    gst_filing_consistency = np.clip(health * 50 + 40 + rng.normal(0, 10, n_samples), 0, 100)
    invoice_delay_days = np.clip((1 - health) * 60 + rng.normal(0, 12, n_samples), 0, 90).astype(int)
    account_balance_trend = np.clip(health * 1.2 - 0.3 + rng.normal(0, 0.15, n_samples), -1, 1)
    business_age = np.clip(rng.exponential(8, n_samples) + health * 5, 0.5, 50)
    loan_burden_ratio = np.clip((1 - health) * 50 + 15 + rng.normal(0, 10, n_samples), 0, 100)

    # Target: credit score based on weighted combination + noise
    credit_score = (
        0.15 * (monthly_turnover / 500) * 100
        + 0.15 * cash_flow_stability * 100
        + 0.20 * emi_repayment_rate
        + 0.12 * gst_filing_consistency
        + 0.12 * (1 - invoice_delay_days / 90) * 100
        + 0.08 * (account_balance_trend + 1) / 2 * 100
        + 0.08 * np.minimum(business_age / 15, 1) * 100
        + 0.10 * (1 - loan_burden_ratio / 100) * 100
        + rng.normal(0, 3, n_samples)  # noise
    )
    credit_score = np.clip(credit_score, 0, 100).round(1)

    names = [generate_business_name(i) for i in range(n_samples)]

    df = pd.DataFrame({
        "business_name": names,
        "monthly_turnover": monthly_turnover.round(2),
        "cash_flow_stability": cash_flow_stability.round(3),
        "emi_repayment_rate": emi_repayment_rate.round(1),
        "gst_filing_consistency": gst_filing_consistency.round(1),
        "invoice_delay_days": invoice_delay_days,
        "account_balance_trend": account_balance_trend.round(3),
        "business_age": business_age.round(1),
        "loan_burden_ratio": loan_burden_ratio.round(1),
        "credit_score": credit_score,
    })

    return df


if __name__ == "__main__":
    output_dir = Path(__file__).resolve().parent.parent / "data"
    output_dir.mkdir(exist_ok=True)
    output_path = output_dir / "sample_msme_data.csv"

    df = generate_dataset(500)
    df.to_csv(output_path, index=False)

    print(f"✅ Generated {len(df)} synthetic MSME records → {output_path}")
    print(f"   Score range: {df['credit_score'].min():.1f} – {df['credit_score'].max():.1f}")
    print(f"   Mean score:  {df['credit_score'].mean():.1f}")
    print(df.describe().round(2))
