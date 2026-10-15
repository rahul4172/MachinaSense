"""
Alerts & Maintenance Center Endpoints
"""

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

import uuid
from app.core.database import get_db
from app.models.db_models import AlertModel, AlertFeedbackModel
from app.models.schemas import (
    AlertSchema,
    AlertStatusUpdate,
    AlertSummary,
    AlertFeedbackRequest,
    AlertFeedbackSchema
)

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("", response_model=List[AlertSchema])
def list_alerts(
    severity: Optional[str] = Query(None, description="Filter by severity (CRITICAL, HIGH, WARNING, ADVISORY)"),
    status: Optional[str] = Query(None, description="Filter by status (NEW, ACKNOWLEDGED, INVESTIGATING, RESOLVED)"),
    machine_id: Optional[str] = Query(None, description="Filter by machine ID"),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(AlertModel)
    if severity:
        query = query.filter(AlertModel.severity == severity.upper())
    if status:
        query = query.filter(AlertModel.status == status.upper())
    if machine_id:
        query = query.filter(AlertModel.machine_id == machine_id)
        
    return query.order_by(AlertModel.timestamp.desc()).limit(limit).all()

@router.get("/summary", response_model=AlertSummary)
def get_alerts_summary(db: Session = Depends(get_db)):
    total = db.query(AlertModel).count()
    crit = db.query(AlertModel).filter(AlertModel.severity == "CRITICAL").count()
    high = db.query(AlertModel).filter(AlertModel.severity == "HIGH").count()
    warn = db.query(AlertModel).filter(AlertModel.severity == "WARNING").count()
    adv = db.query(AlertModel).filter(AlertModel.severity == "ADVISORY").count()

    status_counts = dict(
        db.query(AlertModel.status, func.count(AlertModel.id)).group_by(AlertModel.status).all()
    )
    class_counts = dict(
        db.query(AlertModel.fault_class, func.count(AlertModel.id)).group_by(AlertModel.fault_class).all()
    )

    return AlertSummary(
        total_alerts=total,
        critical_alerts=crit,
        high_alerts=high,
        warning_alerts=warn,
        advisory_alerts=adv,
        by_status=status_counts,
        by_fault_class=class_counts
    )

@router.get("/{alert_id}", response_model=AlertSchema)
def get_alert_detail(alert_id: str, db: Session = Depends(get_db)):
    alert = db.query(AlertModel).filter(AlertModel.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert '{alert_id}' not found.")
    return alert

@router.patch("/{alert_id}/status", response_model=AlertSchema)
def update_alert_status(
    alert_id: str,
    payload: AlertStatusUpdate,
    db: Session = Depends(get_db)
):
    alert = db.query(AlertModel).filter(AlertModel.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert '{alert_id}' not found.")

    valid_statuses = ["NEW", "ACKNOWLEDGED", "INVESTIGATING", "RESOLVED"]
    new_status = payload.status.upper()
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")

    alert.status = new_status
    if payload.resolution_notes:
        alert.resolution_notes = payload.resolution_notes
    if new_status == "RESOLVED":
        alert.resolved_at = datetime.utcnow()

    db.commit()
    db.refresh(alert)
    return alert

@router.post("/{alert_id}/feedback", response_model=AlertFeedbackSchema)
def submit_alert_feedback(
    alert_id: str,
    payload: AlertFeedbackRequest,
    db: Session = Depends(get_db)
):
    """
    Human-in-the-Loop Feedback: Record technician verification of diagnosis,
    marking true positives, false alarms, or corrected fault labels for active retraining.
    """
    alert = db.query(AlertModel).filter(AlertModel.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert '{alert_id}' not found.")

    feedback_id = f"FB-{uuid.uuid4().hex[:8].upper()}"
    feedback = AlertFeedbackModel(
        id=feedback_id,
        alert_id=alert_id,
        technician_name=payload.technician_name,
        is_accurate=payload.is_accurate,
        verified_fault_class=payload.verified_fault_class,
        work_order_id=payload.work_order_id,
        technician_notes=payload.technician_notes,
        created_at=datetime.utcnow(),
        queued_for_retraining=1 if payload.queue_for_retraining else 0
    )
    db.add(feedback)

    # If technician confirmed or resolved, update alert status as well
    if payload.is_accurate == 1 and alert.status in ["NEW", "ACKNOWLEDGED"]:
        alert.status = "INVESTIGATING"
    if payload.technician_notes:
        alert.resolution_notes = f"[Tech: {payload.technician_name}] {payload.technician_notes}"

    db.commit()
    db.refresh(feedback)
    return feedback

@router.get("/feedback/log", response_model=List[AlertFeedbackSchema])
def list_feedback_log(
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """List recent human feedback and active learning verification records."""
    return db.query(AlertFeedbackModel).order_by(AlertFeedbackModel.created_at.desc()).limit(limit).all()

