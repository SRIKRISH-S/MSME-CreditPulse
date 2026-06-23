"""Application configuration loaded from environment variables."""

from pydantic_settings import BaseSettings
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent


class Settings(BaseSettings):
    SECRET_KEY: str = "creditpulse-demo-secret-key-2026"
    DATABASE_URL: str = f"sqlite:///{BASE_DIR / 'creditpulse.db'}"
    MODEL_PATH: str = str(BASE_DIR / "data" / "model.joblib")
    FRONTEND_ORIGIN: str = "http://localhost:5173"
    DEMO_USER: str = "admin"
    DEMO_PASSWORD: str = "idbi2026"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
