"""
Train an XGBoost regressor on synthetic MSME data.

Outputs:
  - data/model.joblib  (trained XGBoost model)

Optional: logs metrics to MLflow if available.
"""

import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
from xgboost import XGBRegressor

# Add parent dir for imports when running as script
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from ml.generate_data import FEATURE_NAMES

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
MODEL_PATH = DATA_DIR / "model.joblib"


def train_model():
    """Train XGBoost on sample MSME data and save the model artifact."""
    csv_path = DATA_DIR / "sample_msme_data.csv"

    if not csv_path.exists():
        print("⚠️  Dataset not found. Generating synthetic data first...")
        from ml.generate_data import generate_dataset
        DATA_DIR.mkdir(exist_ok=True)
        df = generate_dataset(500)
        df.to_csv(csv_path, index=False)
    else:
        df = pd.read_csv(csv_path)

    X = df[FEATURE_NAMES]
    y = df["credit_score"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = XGBRegressor(
        n_estimators=150,
        max_depth=5,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        objective="reg:squarederror",
    )

    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        verbose=False,
    )

    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    print(f"📊 Model Performance:")
    print(f"   MAE:  {mae:.2f}")
    print(f"   R²:   {r2:.4f}")

    # Try logging to MLflow if available
    try:
        import mlflow
        mlflow.set_experiment("MSME-CreditPulse")
        with mlflow.start_run(run_name="xgboost-training"):
            mlflow.log_params({
                "n_estimators": 150,
                "max_depth": 5,
                "learning_rate": 0.1,
                "n_features": len(FEATURE_NAMES),
                "train_size": len(X_train),
            })
            mlflow.log_metrics({"mae": mae, "r2": r2})
            mlflow.xgboost.log_model(model, "model")
        print("📦 Metrics logged to MLflow")
    except ImportError:
        print("ℹ️  MLflow not installed, skipping experiment tracking")
    except Exception as e:
        print(f"ℹ️  MLflow logging skipped: {e}")

    # Save model artifact
    DATA_DIR.mkdir(exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    print(f"✅ Model saved → {MODEL_PATH}")

    return model


if __name__ == "__main__":
    train_model()
