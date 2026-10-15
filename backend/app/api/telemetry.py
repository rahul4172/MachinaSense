"""
Microcontroller & Edge Gateway Push Ingestion Endpoint
Allows physical microcontrollers (ESP32, Arduino, Raspberry Pi) or field agents
to POST real-time telemetry bursts and receive immediate sub-millisecond diagnostic responses.
"""

import uuid
from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.db_models import MachineModel, AlertModel
from app.models.schemas import TelemetryInput, MicrocontrollerPushResponse
from app.ml.pipeline import inference_service

router = APIRouter(prefix="/telemetry", tags=["Telemetry Push"])

@router.post("/push", response_model=MicrocontrollerPushResponse)
def push_microcontroller_telemetry(
    payload: TelemetryInput,
    db: Session = Depends(get_db)
):
    """
    Ingest single operational telemetry reading pushed directly from a field microcontroller.
    Performs instantaneous physics feature engineering, multi-task ML diagnosis,
    updates machine status, and automatically dispatches an alert if a fault condition is detected.
    """
    telemetry_dict = payload.model_dump()
    result = inference_service.predict_single(telemetry_dict)

    machine_id = payload.machine_id
    alert_created = False
    alert_id = None

    # Check or upsert machine record
    machine = db.query(MachineModel).filter(MachineModel.id == machine_id).first()
    if not machine:
        machine = MachineModel(
            id=machine_id,
            name=f"Industrial Machine {machine_id}",
            category="EDGE_CONNECTED_NODE",
            location="Plant 1 - Edge Cell",
            health_score=100.0,
            status="OPERATIONAL"
        )
        db.add(machine)

    # Update machine state
    machine.last_seen = datetime.utcnow()
    machine.latest_readings = {
        "air_temperature_k": payload.air_temperature_k,
        "process_temperature_k": payload.process_temperature_k,
        "rotational_speed_rpm": payload.rotational_speed_rpm,
        "torque_nm": payload.torque_nm,
        "tool_wear_min": payload.tool_wear_min,
        "vibration_rms": payload.vibration_rms,
        "acoustic_emission_db": payload.acoustic_emission_db
    }

    # Adjust health score
    anomaly_penalty = result["anomaly_score"] * 40.0
    fault_penalty = 0.0 if result["fault_class"] == "NORMAL" else 50.0
    machine.health_score = max(5.0, round(100.0 - (anomaly_penalty + fault_penalty), 1))

    if result["severity"] in ["CRITICAL", "HIGH"]:
        machine.status = "CRITICAL"
    elif result["severity"] == "WARNING":
        machine.status = "WARNING"
    else:
        machine.status = "OPERATIONAL"

    # Auto-dispatch alert on actionable anomalies
    if result["is_anomaly"] or result["fault_class"] != "NORMAL":
        alert_id = f"ALT-EDGE-{uuid.uuid4().hex[:6].upper()}"
        alert_rec = AlertModel(
            id=alert_id,
            machine_id=machine_id,
            timestamp=datetime.utcnow(),
            detected_at=datetime.utcnow(),
            fault_class=result["fault_class"],
            severity=result["severity"],
            confidence=result["confidence"],
            anomaly_score=result["anomaly_score"],
            sensor_evidence=result["sensor_evidence"],
            recommendation=result["recommendation"],
            status="NEW"
        )
        db.add(alert_rec)
        alert_created = True

    db.commit()

    return {
        "status": "PROCESSED",
        "timestamp": str(result.get("timestamp") or (datetime.utcnow().isoformat() + "Z")),
        "machine_id": machine_id,
        "fault_class": result["fault_class"],
        "anomaly_score": result["anomaly_score"],
        "is_anomaly": result["is_anomaly"],
        "severity": result["severity"],
        "predicted_rul_cycles": result["predicted_rul_cycles"],
        "calibrated_time_to_inspection_hours": result.get("calibrated_time_to_inspection_hours", 24.0),
        "alert_created": alert_created,
        "alert_id": alert_id,
        "action_recommendation": result["recommendation"]
    }
