"""
Dataset Ingestion & Validation Endpoints
"""

import os
import uuid
import pandas as pd
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.db_models import DatasetModel
from app.ml.pipeline import inference_service, FEATURE_COLUMNS
from app.services.alert_service import process_prediction_and_alert

router = APIRouter(prefix="/datasets", tags=["Datasets"])
UPLOAD_DIR = "data/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    run_inference: bool = False,
    db: Session = Depends(get_db)
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    dataset_id = f"DS-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6]}"
    save_path = os.path.join(UPLOAD_DIR, f"{dataset_id}_{file.filename}")

    # Read content safely
    content = await file.read()
    file_size = len(content)

    if file_size > 50 * 1024 * 1024:  # 50MB limit
        raise HTTPException(status_code=400, detail="File size exceeds maximum allowed limit (50 MB).")

    with open(save_path, "wb") as f:
        f.write(content)

    try:
        df = pd.read_csv(save_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV file: {str(e)}")

    total_records = len(df)
    missing_cols = [c for c in FEATURE_COLUMNS if c not in df.columns]

    # Detailed validation
    validation_report = {
        "dataset_id": dataset_id,
        "filename": file.filename,
        "total_records": total_records,
        "columns_present": list(df.columns),
        "required_columns_present": len(missing_cols) == 0,
        "missing_required_columns": missing_cols,
        "null_counts": {col: int(df[col].isna().sum()) for col in df.columns},
        "machines_detected": list(df["machine_id"].unique()) if "machine_id" in df.columns else ["MCH-UNKNOWN"],
        "has_timestamps": "timestamp" in df.columns,
        "has_labels": "fault_type" in df.columns or "failure" in df.columns
    }

    status = "VALIDATED" if len(missing_cols) == 0 else "INVALID_SCHEMA"

    # Persist dataset record
    ds_record = DatasetModel(
        id=dataset_id,
        filename=file.filename,
        file_path=save_path,
        uploaded_at=datetime.utcnow(),
        total_records=total_records,
        file_size_bytes=file_size,
        validation_report=validation_report,
        status=status
    )
    db.add(ds_record)
    db.commit()

    inference_summary = None
    if run_inference and status == "VALIDATED" and inference_service.is_loaded:
        batch_results = inference_service.predict_batch(df.head(500))
        alerts_created = 0
        for r in batch_results:
            if r.get("severity") in ["CRITICAL", "HIGH", "WARNING"]:
                a = process_prediction_and_alert(db, r, r.get("readings"))
                if a:
                    alerts_created += 1

        inference_summary = {
            "processed_records": len(batch_results),
            "alerts_created": alerts_created,
            "anomalies_detected": sum(1 for r in batch_results if r["is_anomaly"]),
            "fault_breakdown": {
                f_class: sum(1 for r in batch_results if r["fault_class"] == f_class)
                for f_class in set(r["fault_class"] for r in batch_results)
            }
        }
        ds_record.status = "PROCESSED"
        db.commit()

    # Data preview (first 10 records)
    preview = df.head(10).to_dict(orient="records")

    return {
        "dataset_id": dataset_id,
        "filename": file.filename,
        "status": ds_record.status,
        "validation_report": validation_report,
        "preview": preview,
        "inference_summary": inference_summary
    }

@router.get("/{dataset_id}")
def get_dataset_info(dataset_id: str, db: Session = Depends(get_db)):
    ds = db.query(DatasetModel).filter(DatasetModel.id == dataset_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail=f"Dataset '{dataset_id}' not found.")

    preview = []
    if os.path.exists(ds.file_path):
        try:
            df = pd.read_csv(ds.file_path)
            preview = df.head(20).to_dict(orient="records")
        except Exception:
            pass

    return {
        "id": ds.id,
        "filename": ds.filename,
        "uploaded_at": ds.uploaded_at,
        "total_records": ds.total_records,
        "file_size_bytes": ds.file_size_bytes,
        "status": ds.status,
        "validation_report": ds.validation_report,
        "preview": preview
    }
