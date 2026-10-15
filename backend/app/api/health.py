"""
Health & Model Metadata Endpoints
"""

import time
from fastapi import APIRouter
from app.ml.pipeline import inference_service

router = APIRouter()
START_TIME = time.time()

@router.get("/health")
def get_health():
    uptime_seconds = round(time.time() - START_TIME, 1)
    return {
        "status": "HEALTHY",
        "service": "MachinaSense Industrial Telemetry & Inference Platform",
        "uptime_seconds": uptime_seconds,
        "model_loaded": inference_service.is_loaded,
        "model_load_error": inference_service.last_load_error,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }

@router.get("/model/info")
def get_model_info():
    if not inference_service.is_loaded:
        return {
            "status": "NOT_LOADED",
            "error": inference_service.last_load_error,
            "instructions": "Place trained model artifacts in models/ directory."
        }
    
    return {
        "status": "ACTIVE",
        "metadata": inference_service.metadata,
        "capabilities": [
            "Multi-Class Fault Classification (TWF, HDF, PWF, OSF, BEARING_FAULT)",
            "Unsupervised Zero-Shot Anomaly Detection (Isolation Forest)",
            "Remaining Useful Life (RUL) Degradation Regression",
            "Explainable Sensor Deviation Attribution (Z-score Analysis)"
        ],
        "operational_limitations": [
            "Model is calibrated for rotational industrial equipment (milling machines, pumps, turbomachinery).",
            "Requires standard telemetry sampling (1s to 60s intervals).",
            "Sensor measurements outside physical limits (>15 mm/s RMS vibration, >120 dB acoustic) are flagged as severe out-of-range sensor saturation."
        ]
    }
