"""
MSME CreditPulse — FastAPI Application Entry Point

AI-powered MSME financial health scoring and credit decision assistant.
Built for IDBI Innovate 2026.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import engine, Base
from ml.predictor import load_model

# Import ORM models so tables are created
from models.db_models import Assessment  # noqa: F401

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create DB tables and load ML model."""
    logger.info("🚀 Starting MSME CreditPulse...")

    # Create database tables
    Base.metadata.create_all(bind=engine)
    logger.info("📦 Database tables ready")

    # Seed default credit policy if empty
    from database import SessionLocal
    from models.db_models import Policy
    db = SessionLocal()
    try:
        active_policy = db.query(Policy).filter(Policy.is_active == True).first()
        if not active_policy:
            default_policy = Policy(
                name="Default Credit Policy",
                w_monthly_turnover=1.0,
                w_cash_flow_stability=1.0,
                w_emi_repayment_rate=1.0,
                w_gst_filing_consistency=1.0,
                w_invoice_delay_days=1.0,
                w_account_balance_trend=1.0,
                w_business_age=1.0,
                w_loan_burden_ratio=1.0,
                low_threshold=75.0,
                medium_threshold=50.0,
                is_active=True,
            )
            db.add(default_policy)
            db.commit()
            logger.info("🌱 Default scoring policy seeded successfully")
    except Exception as e:
        logger.error(f"❌ Failed to seed default policy: {e}")
    finally:
        db.close()

    # Load ML model (falls back to rule-based if not found)
    loaded = load_model(settings.MODEL_PATH)
    if loaded:
        logger.info("🤖 XGBoost model loaded successfully")
    else:
        logger.info("⚠️ Using rule-based fallback scorer")

    yield

    logger.info("👋 Shutting down CreditPulse")


app = FastAPI(
    title="MSME CreditPulse API",
    description="AI-powered MSME financial health scoring and credit decision assistant for IDBI Bank.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_ORIGIN,
        "http://localhost:5173",
        "http://localhost:3000",
        "https://msme-credit-pulse.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
from routers.auth import router as auth_router
from routers.predict import router as predict_router
from routers.reports import router as reports_router
from routers.policy import router as policy_router

app.include_router(auth_router)
app.include_router(predict_router)
app.include_router(reports_router)
app.include_router(policy_router)


@app.get("/", tags=["Health"])
async def root():
    return {
        "app": "MSME CreditPulse",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health():
    from ml.predictor import is_model_loaded
    return {
        "status": "healthy",
        "model_loaded": is_model_loaded(),
    }
