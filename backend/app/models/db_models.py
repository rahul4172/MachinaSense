"""
SQLAlchemy Database Models for MachinaSense
Persists machine metadata, alert history, uploaded dataset records, and evaluation runs.
"""

from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class MachineModel(Base):
    __tablename__ = "machines"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    category = Column(String(64), default="CNC_MILL")
    status = Column(String(32), default="OPERATIONAL")  # OPERATIONAL, WARNING, CRITICAL, MAINTENANCE
    location = Column(String(128), default="Plant 1 - Bay A")
    health_score = Column(Float, default=98.5)
    last_seen = Column(DateTime, default=datetime.utcnow)
    latest_readings = Column(JSON, nullable=True)

    alerts = relationship("AlertModel", back_populates="machine", cascade="all, delete-orphan")

class AlertModel(Base):
    __tablename__ = "alerts"

    id = Column(String(64), primary_key=True, index=True)
    machine_id = Column(String(64), ForeignKey("machines.id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    detected_at = Column(DateTime, default=datetime.utcnow)
    fault_class = Column(String(64), nullable=False)
    severity = Column(String(32), default="WARNING")  # CRITICAL, HIGH, WARNING, ADVISORY
    confidence = Column(Float, default=0.95)
    anomaly_score = Column(Float, default=0.7)
    sensor_evidence = Column(JSON, nullable=True)
    recommendation = Column(Text, nullable=False)
    status = Column(String(32), default="NEW")  # NEW, ACKNOWLEDGED, INVESTIGATING, RESOLVED
    resolution_notes = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)

    machine = relationship("MachineModel", back_populates="alerts")

class DatasetModel(Base):
    __tablename__ = "datasets"

    id = Column(String(64), primary_key=True, index=True)
    filename = Column(String(256), nullable=False)
    file_path = Column(String(512), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    total_records = Column(Integer, default=0)
    file_size_bytes = Column(Integer, default=0)
    validation_report = Column(JSON, nullable=True)
    status = Column(String(32), default="VALIDATED")

class EvaluationRunModel(Base):
    __tablename__ = "evaluation_runs"

    id = Column(String(64), primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    dataset_path = Column(String(512), nullable=False)
    dataset_hash = Column(String(64), nullable=False)
    model_version = Column(String(32), default="1.0.0")
    metrics_json = Column(JSON, nullable=False)
    robustness_json = Column(JSON, nullable=True)

class AlertFeedbackModel(Base):
    __tablename__ = "alert_feedback"

    id = Column(String(64), primary_key=True, index=True)
    alert_id = Column(String(64), ForeignKey("alerts.id"), nullable=False, index=True)
    technician_name = Column(String(128), default="Plant Tech #1")
    is_accurate = Column(Integer, default=1)  # 1 = Confirmed True Positive, 0 = False Alarm, 2 = Modified Diagnosis
    verified_fault_class = Column(String(64), nullable=False)
    work_order_id = Column(String(64), nullable=True)
    technician_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    queued_for_retraining = Column(Integer, default=1)

