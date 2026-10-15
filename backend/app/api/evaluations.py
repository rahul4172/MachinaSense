"""
Evaluation & Robustness Stress Testing Endpoints
"""

import os
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.db_models import EvaluationRunModel
from app.models.schemas import EvaluationRequest
from app.ml.evaluator import evaluate_held_out_dataset
from app.ml.robustness import run_robustness_suite

router = APIRouter(prefix="/evaluations", tags=["Evaluations"])

@router.post("/run")
def run_evaluation(
    payload: EvaluationRequest,
    db: Session = Depends(get_db)
):
    target_path = payload.dataset_path or os.path.join(settings.DATA_DIR, "test_heldout.csv")
    if not os.path.isabs(target_path):
        target_path = os.path.join(settings.BACKEND_ROOT, target_path)
    if not os.path.exists(target_path):
        raise HTTPException(
            status_code=404,
            detail=f"Test dataset '{target_path}' not found on server."
        )

    try:
        metrics = evaluate_held_out_dataset(test_csv_path=target_path, sample_limit=payload.sample_limit)
        
        # Run robustness suite
        robustness_results = run_robustness_suite(test_csv_path=target_path)
        
        eval_record = EvaluationRunModel(
            id=metrics["evaluation_id"],
            timestamp=datetime.utcnow(),
            dataset_path=target_path,
            dataset_hash=metrics["dataset_hash"],
            model_version="1.0.0",
            metrics_json=metrics,
            robustness_json=robustness_results
        )
        db.add(eval_record)
        db.commit()

        return {
            "evaluation_id": eval_record.id,
            "metrics": metrics,
            "robustness": robustness_results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")

@router.get("")
def list_evaluations(db: Session = Depends(get_db)):
    runs = db.query(EvaluationRunModel).order_by(EvaluationRunModel.timestamp.desc()).limit(20).all()
    return [
        {
            "id": r.id,
            "timestamp": r.timestamp,
            "dataset_path": r.dataset_path,
            "dataset_hash": r.dataset_hash,
            "model_version": r.model_version,
            "summary_metrics": {
                "accuracy": r.metrics_json.get("classification", {}).get("accuracy"),
                "f1_score": r.metrics_json.get("classification", {}).get("weighted_f1"),
                "roc_auc": r.metrics_json.get("anomaly_detection", {}).get("roc_auc"),
                "total_samples": r.metrics_json.get("total_samples")
            }
        }
        for r in runs
    ]

@router.get("/{evaluation_id}")
def get_evaluation_detail(evaluation_id: str, db: Session = Depends(get_db)):
    r = db.query(EvaluationRunModel).filter(EvaluationRunModel.id == evaluation_id).first()
    if not r:
        raise HTTPException(status_code=404, detail=f"Evaluation run '{evaluation_id}' not found.")
    return {
        "id": r.id,
        "timestamp": r.timestamp,
        "dataset_path": r.dataset_path,
        "dataset_hash": r.dataset_hash,
        "model_version": r.model_version,
        "metrics": r.metrics_json,
        "robustness": r.robustness_json
    }

@router.get("/{evaluation_id}/robustness")
def get_robustness_results(evaluation_id: str, db: Session = Depends(get_db)):
    r = db.query(EvaluationRunModel).filter(EvaluationRunModel.id == evaluation_id).first()
    if not r:
        # Fallback: run on demand
        try:
            return run_robustness_suite()
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    return r.robustness_json or run_robustness_suite(r.dataset_path)
