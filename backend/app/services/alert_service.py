"""
Alert Management & Machine Health Tracking Service
"""

import uuid
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.db_models import AlertModel, MachineModel

def process_prediction_and_alert(
    db: Session,
    pred: Dict[str, Any],
    raw_readings: Optional[Dict[str, float]] = None
) -> Optional[AlertModel]:
    """
    Evaluate prediction results, generate persistent alerts if threshold or fault is detected,
    and update the corresponding machine's live health score and latest telemetry.
    """
    machine_id = pred.get("machine_id", "UNKNOWN")
    severity = pred.get("severity", "NORMAL")
    fault_class = pred.get("fault_class", "NORMAL")
    anomaly_score = pred.get("anomaly_score", 0.0)

    # 1. Update machine state
    machine = db.query(MachineModel).filter(MachineModel.id == machine_id).first()
    if machine:
        machine.last_seen = datetime.utcnow()
        if raw_readings:
            machine.latest_readings = raw_readings

        # Dynamic health score update: 100 - (anomaly_score * 40 + fault penalty)
        penalty = 0.0
        if severity == "CRITICAL":
            penalty = 35.0
            machine.status = "CRITICAL"
        elif severity == "HIGH":
            penalty = 20.0
            machine.status = "WARNING"
        elif severity == "WARNING":
            penalty = 10.0
            machine.status = "WARNING"
        else:
            machine.status = "OPERATIONAL"

        machine.health_score = max(5.0, min(100.0, 100.0 - (anomaly_score * 30.0 + penalty)))

    # 2. Alert creation rule: only create alert if not NORMAL and severity is high enough
    if severity in ["CRITICAL", "HIGH", "WARNING"]:
        alert_id = f"ALT-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}"
        
        # Avoid flood: check if identical unresolved alert was created in last 2 minutes for this machine
        existing = db.query(AlertModel).filter(
            AlertModel.machine_id == machine_id,
            AlertModel.fault_class == fault_class,
            AlertModel.status.in_(["NEW", "ACKNOWLEDGED", "INVESTIGATING"])
        ).order_by(AlertModel.timestamp.desc()).first()

        if existing and (datetime.utcnow() - existing.timestamp).total_seconds() < 90:
            # Update existing alert severity & score instead of spamming duplicates
            existing.anomaly_score = anomaly_score
            existing.severity = severity
            existing.sensor_evidence = pred.get("sensor_evidence", [])
            db.commit()
            return existing

        new_alert = AlertModel(
            id=alert_id,
            machine_id=machine_id,
            timestamp=datetime.utcnow(),
            detected_at=datetime.utcnow(),
            fault_class=fault_class,
            severity=severity,
            confidence=pred.get("confidence", 0.95),
            anomaly_score=anomaly_score,
            sensor_evidence=pred.get("sensor_evidence", []),
            recommendation=pred.get("recommendation", "Inspect asset immediately."),
            status="NEW"
        )
        db.add(new_alert)
        db.commit()
        db.refresh(new_alert)
        return new_alert

    db.commit()
    return None
