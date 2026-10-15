"""
Inference API Endpoints
"""

from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.ml.pipeline import inference_service
from app.models.schemas import TelemetryInput, PredictionResult, BatchInferenceRequest
from app.services.alert_service import process_prediction_and_alert
from app.services.simulation_engine import sim_engine

router = APIRouter(prefix="/inference", tags=["Inference"])

@router.post("/predict", response_model=PredictionResult)
def predict_single_sample(
    payload: TelemetryInput,
    db: Session = Depends(get_db)
):
    if not inference_service.is_loaded:
        raise HTTPException(
            status_code=503,
            detail=f"ML models are not loaded. {inference_service.last_load_error}"
        )

    reading = payload.dict()
    pred = inference_service.predict_single(reading)
    
    # Process persistent alert and update machine status in DB
    process_prediction_and_alert(db, pred, reading)
    
    return pred

@router.post("/batch")
def predict_batch_samples(
    payload: BatchInferenceRequest,
    db: Session = Depends(get_db)
):
    if not inference_service.is_loaded:
        raise HTTPException(
            status_code=503,
            detail=f"ML models are not loaded. {inference_service.last_load_error}"
        )

    if not payload.records:
        raise HTTPException(status_code=400, detail="Empty batch submitted.")

    import pandas as pd
    records_dicts = [r.dict() for r in payload.records]
    df = pd.DataFrame(records_dicts)

    results = inference_service.predict_batch(df)

    # Persist qualifying alerts
    alerts_created = 0
    for r in results:
        if r.get("severity") in ["CRITICAL", "HIGH", "WARNING"]:
            alert_obj = process_prediction_and_alert(db, r, r.get("readings"))
            if alert_obj:
                alerts_created += 1

    return {
        "total_records": len(results),
        "alerts_generated": alerts_created,
        "results": results[:50],  # Return first 50 preview
        "summary": {
            "critical_count": sum(1 for r in results if r["severity"] == "CRITICAL"),
            "high_count": sum(1 for r in results if r["severity"] == "HIGH"),
            "warning_count": sum(1 for r in results if r["severity"] == "WARNING"),
            "normal_count": sum(1 for r in results if r["severity"] == "NORMAL")
        }
    }

@router.get("/history")
def get_inference_history():
    """Retrieve recent sliding window of predictions from the simulation engine."""
    return {
        "total_buffered": len(sim_engine.history_buffer),
        "history": list(reversed(sim_engine.history_buffer[-30:]))
    }
