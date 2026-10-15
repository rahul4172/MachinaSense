"""
Application Configuration for MachinaSense
"""

import os
from pydantic_settings import BaseSettings

# Absolute directory anchors
BACKEND_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

class Settings(BaseSettings):
    PROJECT_NAME: str = "MachinaSense Industrial Predictive Maintenance"
    API_V1_STR: str = "/api"
    BACKEND_ROOT: str = BACKEND_ROOT
    MODELS_DIR: str = os.path.join(BACKEND_ROOT, "models")
    DATA_DIR: str = os.path.join(BACKEND_ROOT, "data")
    DATABASE_URL: str = f"sqlite:///{os.path.join(BACKEND_ROOT, 'machinasense.db')}"
    CORS_ORIGINS: list = ["*"]
    ANOMALY_THRESHOLD: float = 0.65

    class Config:
        case_sensitive = True

settings = Settings()
