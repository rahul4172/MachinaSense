"""
Data & Concept Drift Detection API Endpoints
"""

import os
import pandas as pd
from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from app.core.config import settings
from app.ml.drift_detector import drift_service
from app.models.schemas import DriftAnalysisResult

router = APIRouter(prefix="/drift", tags=["Drift Detection"])

@router.get("/status", response_model=DriftAnalysisResult)
def get_current_drift_status(
    sample_preset: Optional[str] = Query("test_heldout.csv", description="Dataset file name to test against baseline")
):
    """
    Evaluate sensor drift and distribution shift against the baseline training distribution.
    Supports evaluating test_heldout, noisy samples, or load-shifted datasets.
    """
    file_path = os.path.join(settings.DATA_DIR, sample_preset)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"Dataset file '{sample_preset}' not found in data directory.")

    try:
        df = pd.read_csv(file_path)
        report = drift_service.analyze_drift(df)
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate drift: {str(e)}")
